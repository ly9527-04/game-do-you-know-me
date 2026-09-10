import { NextResponse } from 'next/server'
import { AuthError, assertSameOrigin, assertAuthRateLimit, authFailure, createSession, readAuthBody } from '@/lib/auth'
import { registerSchema } from '@/lib/auth-validation'
import { hashPassword } from '@/lib/passwords'
import { createServerDb } from '@/lib/supabase/server'
export const runtime = 'nodejs'
export async function POST(request: Request) {
  try {
    assertSameOrigin(request)
    const parsed = registerSchema.safeParse(await readAuthBody(request))
    if (!parsed.success) throw new AuthError(400, parsed.error.issues[0].message)
    const { account, nickname, password } = parsed.data
    await assertAuthRateLimit(request, 'register', account)
    const password_hash = await hashPassword(password)
    const { data, error } = await createServerDb().from('user_accounts').insert({ account, nickname, password_hash }).select('id, account, nickname').single()
    if (error?.code === '23505') throw new AuthError(409, '这个账号已被注册。')
    if (error || !data) throw new Error('Registration failed')
    await createSession(data.id)
    return NextResponse.json({ user: { id: data.id, account: data.account, nickname: data.nickname } }, { status: 201, headers: { 'Cache-Control': 'no-store' } })
  } catch (error) { return authFailure(error) }
}
