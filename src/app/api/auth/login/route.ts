import { NextResponse } from 'next/server'
import { AuthError, assertSameOrigin, assertAuthRateLimit, authFailure, createSession, readAuthBody } from '@/lib/auth'
import { loginSchema } from '@/lib/auth-validation'
import { DUMMY_PASSWORD_HASH, verifyPassword } from '@/lib/passwords'
import { createServerDb } from '@/lib/supabase/server'
export const runtime = 'nodejs'
export async function POST(request: Request) {
  try {
    assertSameOrigin(request)
    const parsed = loginSchema.safeParse(await readAuthBody(request))
    if (!parsed.success) throw new AuthError(400, parsed.error.issues[0].message)
    const { account, password } = parsed.data
    await assertAuthRateLimit(request, 'login', account)
    const { data, error } = await createServerDb().from('user_accounts').select('id, account, nickname, password_hash').eq('account', account).maybeSingle()
    if (error) throw new Error('Login lookup failed')
    const matches = await verifyPassword(password, data?.password_hash ?? DUMMY_PASSWORD_HASH)
    if (!data || !matches) throw new AuthError(401, '账号或密码不正确。')
    await createSession(data.id)
    return NextResponse.json({ user: { id: data.id, account: data.account, nickname: data.nickname } }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) { return authFailure(error) }
}
