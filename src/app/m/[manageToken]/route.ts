import { NextResponse } from 'next/server'
import { findTestByManageTokenHash } from '@/lib/repositories/tests'
import { signManageSession, hashToken } from '@/lib/security'
import { manageCookieName, MANAGE_SESSION_MAX_AGE } from '@/lib/manage-session'
import { getCanonicalOrigin } from '@/lib/site-url'

export const dynamic = 'force-dynamic'

export async function GET(_request: Request, { params }: { params: Promise<{ manageToken: string }> }) {
  const { manageToken } = await params
  if (!isTokenShapeValid(manageToken)) return unauthorized()

  try {
    const identity = await findTestByManageTokenHash(hashToken(manageToken))
    if (!identity) return unauthorized()
    const origin = getCanonicalOrigin()
    const expires = Math.floor(Date.now() / 1000) + MANAGE_SESSION_MAX_AGE
    const session = signManageSession(identity.testId, expires)
    const response = NextResponse.redirect(new URL(`/manage/${identity.testId}`, origin), 303)
    response.headers.set('Cache-Control', 'private, no-store')
    response.cookies.set({
      name: manageCookieName(),
      value: session,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: MANAGE_SESSION_MAX_AGE,
    })
    return response
  } catch {
    return unauthorized()
  }
}

function isTokenShapeValid(token: string): boolean {
  return token.length >= 40 && token.length <= 64 && /^[A-Za-z0-9_-]+$/.test(token)
}

function unauthorized() {
  return NextResponse.json({ error: { code: 'MANAGE_UNAUTHORIZED', message: '这个管理链接无效或已失效。' } }, { status: 403, headers: { 'Cache-Control': 'private, no-store' } })
}
