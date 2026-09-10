import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
const mocks = vi.hoisted(() => ({ from: vi.fn(), get: vi.fn(), set: vi.fn(), redirect: vi.fn() }))
vi.mock('server-only', () => ({}))
vi.mock('@/lib/supabase/server', () => ({ createServerDb: () => ({ from: mocks.from }) }))
vi.mock('next/headers', () => ({ cookies: async () => ({ get: mocks.get, set: mocks.set }) }))
vi.mock('next/navigation', () => ({ redirect: mocks.redirect }))
import { hashPassword, verifyPassword } from '@/lib/passwords'
import { loginSchema, registerSchema } from '@/lib/auth-validation'
import { assertSameOrigin, createSession, getCurrentUser, requireUser, revokeSession } from '@/lib/auth'
import { createHash } from 'node:crypto'
const user = { id: 'user-id', account: '00123456', nickname: '钙' }
beforeEach(() => { vi.resetAllMocks(); vi.stubEnv('NODE_ENV', 'test'); vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://example.com') })
afterEach(() => vi.unstubAllEnvs())
describe('passwords and schemas', () => {
  it('salts independently and verifies exact Unicode passwords', async () => {
    const password = ' 密码🙂 abc '
    const a = await hashPassword(password), b = await hashPassword(password)
    expect(a).not.toBe(b)
    expect(a).not.toContain(password)
    expect(await verifyPassword(password, a)).toBe(true)
    expect(await verifyPassword(password.trim(), a)).toBe(false)
    expect(await verifyPassword(password, 'scrypt$broken')).toBe(false)
  })
  it('preserves leading zero accounts and trims Unicode nicknames', () => {
    expect(registerSchema.parse({ account: '00123456', nickname: ' 🙂 ', password: '        ', confirmPassword: '        ' }).nickname).toBe('🙂')
    expect(loginSchema.parse({ account: '00123456', password: '🙂'.repeat(128) }).account).toBe('00123456')
  })
  it.each([
    { account: 12345678 }, { account: '１２３４５６７８' }, { password: 'short' },
    { password: 'a'.repeat(129) }, { nickname: ' ' }, { nickname: '🙂'.repeat(21) },
    { confirmPassword: undefined }, { confirmPassword: 'different' },
  ])('rejects invalid registration %j', (override) => {
    expect(registerSchema.safeParse({ account: '00123456', nickname: '钙', password: 'password', confirmPassword: 'password', ...override }).success).toBe(false)
  })
})
describe('sessions and origins', () => {
  it('does not set a cookie when session persistence fails', async () => {
    mocks.from.mockReturnValue({ insert: vi.fn().mockResolvedValue({ error: { message: 'db failed' } }) })
    await expect(createSession(user.id)).rejects.toThrow()
    expect(mocks.set).not.toHaveBeenCalled()
  })
  it('does not claim logout succeeded when revocation fails', async () => {
    mocks.get.mockReturnValue({ value: 'ab'.repeat(32) })
    mocks.from.mockReturnValue({ delete: () => ({ eq: vi.fn().mockResolvedValue({ error: { message: 'db failed' } }) }) })
    await expect(revokeSession()).rejects.toThrow()
    expect(mocks.set).not.toHaveBeenCalled()
  })
  it('uses the request origin in development when canonical URL is unset', () => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', '')
    expect(() => assertSameOrigin(new Request('http://localhost:3000/api', { method: 'POST', headers: { origin: 'http://localhost:3000' } }))).not.toThrow()
  })
  it('rotates existing sessions on authentication', async () => {
    mocks.get.mockReturnValue({ value: 'cd'.repeat(32) })
    const eq = vi.fn().mockResolvedValue({ error: null })
    mocks.from.mockReturnValue({ insert: vi.fn().mockResolvedValue({ error: null }), delete: () => ({ eq }) })
    await createSession(user.id)
    expect(eq).toHaveBeenCalledWith('token_hash', createHash('sha256').update('cd'.repeat(32)).digest('hex'))
    expect(mocks.set.mock.calls[0][1]).not.toBe('cd'.repeat(32))
  })
  it('rejects missing or foreign origins and allows canonical proxy origin', () => {
    for (const origin of [undefined, 'null', 'https://evil.example']) {
      expect(() => assertSameOrigin(new Request('https://internal/api', { method: 'POST', headers: origin ? { origin } : {} }))).toThrow()
    }
    expect(() => assertSameOrigin(new Request('https://internal/api', { method: 'POST', headers: { origin: 'https://example.com' } }))).not.toThrow()
  })
  it('returns null without querying for missing or malformed tokens', async () => {
    expect(await getCurrentUser()).toBeNull()
    mocks.get.mockReturnValue({ value: 'invalid' })
    expect(await getCurrentUser()).toBeNull()
    expect(mocks.from).not.toHaveBeenCalled()
  })
  it('persists only a token digest and sets a 30-day production cookie', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    const insert = vi.fn().mockResolvedValue({ error: null })
    mocks.from.mockReturnValue({ insert })
    await createSession(user.id)
    const [name, token, options] = mocks.set.mock.calls[0]
    expect(name).toBe('__Host-account_session')
    expect(Buffer.from(token, 'hex')).toHaveLength(32)
    expect(options).toMatchObject({ httpOnly: true, secure: true, sameSite: 'lax', path: '/', maxAge: 2592000 })
    expect(insert.mock.calls[0][0]).toMatchObject({ user_id: user.id, token_hash: createHash('sha256').update(token).digest('hex') })
    expect(JSON.stringify(insert.mock.calls)).not.toContain(token)
  })
  it('resolves a valid session to public user fields and checks database expiry', async () => {
    mocks.get.mockReturnValue({ value: 'ab'.repeat(32) })
    const session = { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), gt: vi.fn().mockReturnThis(), maybeSingle: vi.fn().mockResolvedValue({ data: { user_id: user.id }, error: null }) }
    const account = { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), maybeSingle: vi.fn().mockResolvedValue({ data: user, error: null }) }
    mocks.from.mockImplementation((table) => table === 'user_sessions' ? session : account)
    expect(await getCurrentUser()).toEqual(user)
    expect(session.gt).toHaveBeenCalledWith('expires_at', expect.any(String))
    session.maybeSingle.mockResolvedValue({ data: null, error: null })
    expect(await getCurrentUser()).toBeNull()
  })
  it('redirects anonymous users and revokes sessions before clearing cookies', async () => {
    await requireUser()
    expect(mocks.redirect).toHaveBeenCalledWith('/')
    mocks.get.mockReturnValue({ value: 'ab'.repeat(32) })
    const eq = vi.fn().mockResolvedValue({ error: null })
    mocks.from.mockReturnValue({ delete: () => ({ eq }) })
    await revokeSession()
    expect(eq).toHaveBeenCalledWith('token_hash', createHash('sha256').update('ab'.repeat(32)).digest('hex'))
    expect(mocks.set).toHaveBeenCalledWith('account_session', '', expect.objectContaining({ maxAge: 0 }))
  })
})
