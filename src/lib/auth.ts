import 'server-only'
import { createHash, createHmac, randomBytes } from 'node:crypto'
import { isIP } from 'node:net'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { NextResponse } from 'next/server'
import { createServerDb } from '@/lib/supabase/server'

export type AccountUser = { id: string; account: string; nickname: string }
const SESSION_SECONDS = 30 * 24 * 60 * 60
const validToken = (token: string | undefined): token is string => !!token && /^[0-9a-f]{64}$/.test(token)
const digest = (token: string) => createHash('sha256').update(token).digest('hex')
const cookieName = () => process.env.NODE_ENV === 'production' ? '__Host-account_session' : 'account_session'
const cookieOptions = () => ({ httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax' as const, path: '/' })

export class AuthError extends Error {
  constructor(readonly status: number, message: string) { super(message) }
}
export function assertSameOrigin(request: Request): void {
  if (['GET', 'HEAD', 'OPTIONS'].includes(request.method.toUpperCase())) return
  const origin = request.headers.get('origin')
  const expected = new URL(process.env.NEXT_PUBLIC_SITE_URL || request.url).origin
  if (!origin || origin === 'null' || origin !== expected) throw new AuthError(403, '请求来源不受信任。')
}
export async function getCurrentUser(): Promise<AccountUser | null> {
  const token = (await cookies()).get(cookieName())?.value
  if (!validToken(token)) return null
  const db = createServerDb()
  const { data: session, error } = await db.from('user_sessions')
    .select('user_id').eq('token_hash', digest(token)).gt('expires_at', new Date().toISOString()).maybeSingle()
  if (error) throw new Error('Session lookup failed')
  if (!session) return null
  const { data: user, error: userError } = await db.from('user_accounts').select('id, account, nickname').eq('id', session.user_id).maybeSingle()
  if (userError) throw new Error('Account lookup failed')
  return user ? { id: user.id, account: user.account, nickname: user.nickname } : null
}
export async function requireUser(): Promise<AccountUser> {
  const user = await getCurrentUser()
  if (!user) redirect('/')
  return user
}
export const requireApiUser = getCurrentUser

export async function createSession(userId: string): Promise<void> {
  const jar = await cookies()
  const token = randomBytes(32).toString('hex')
  const expires = new Date(Date.now() + SESSION_SECONDS * 1000)
  const db = createServerDb()
  const { error } = await db.from('user_sessions').insert({ token_hash: digest(token), user_id: userId, expires_at: expires.toISOString() })
  if (error) throw new Error('Session creation failed')
  // Revoke the previous browser session on authentication to avoid leaving it usable.
  const previous = jar.get(cookieName())?.value
  if (validToken(previous)) {
    const { error: revokeError } = await db.from('user_sessions').delete().eq('token_hash', digest(previous))
    if (revokeError) throw new Error('Session rotation failed')
  }
  jar.set(cookieName(), token, { ...cookieOptions(), maxAge: SESSION_SECONDS, expires })
}
export async function revokeSession(): Promise<void> {
  const jar = await cookies()
  const token = jar.get(cookieName())?.value
  if (validToken(token)) {
    const { error } = await createServerDb().from('user_sessions').delete().eq('token_hash', digest(token))
    if (error) throw new Error('Session revocation failed')
  }
  jar.set(cookieName(), '', { ...cookieOptions(), maxAge: 0, expires: new Date(0) })
}

export async function assertAuthRateLimit(request: Request, action: 'login' | 'register', account: string): Promise<void> {
  const secret = process.env.RATE_LIMIT_SECRET
  if (!secret) throw new AuthError(503, '服务暂时不可用，请稍后重试。')
  // Same trusted reverse-proxy convention as the existing rate-limit module.
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
  if (!ip || !isIP(ip)) throw new AuthError(400, '请求信息不完整。')
  const db = createServerDb()
  const limits = action === 'login' ? { ip: 30, account: 10 } : { ip: 5, account: 3 }
  for (const [dimension, value] of [['ip', ip], ['account', account]] as const) {
    const key = createHmac('sha256', secret).update(`auth:${dimension}:${value}`).digest('hex')
    let result
    try {
      result = await db.rpc('check_rate_limit', { p_key_hash: key, p_action: `auth_${action}_${dimension}`, p_limit: limits[dimension], p_window_seconds: 15 * 60 })
    } catch { throw new AuthError(503, '服务暂时不可用，请稍后重试。') }
    if (result.error) throw new AuthError(503, '服务暂时不可用，请稍后重试。')
    if (result.data !== true) throw new AuthError(429, '尝试次数过多，请稍后重试。')
  }
}
export async function readAuthBody(request: Request): Promise<unknown> {
  const raw = await request.text()
  if (Buffer.byteLength(raw, 'utf8') > 8192) throw new AuthError(400, '请求太大了。')
  try { return JSON.parse(raw) } catch { throw new AuthError(400, '请求格式不正确。') }
}
export function authFailure(error: unknown): NextResponse {
  return NextResponse.json({ error: { message: error instanceof AuthError ? error.message : '暂时无法完成操作，请稍后重试。' } }, { status: error instanceof AuthError ? error.status : 500, headers: { 'Cache-Control': 'no-store' } })
}
