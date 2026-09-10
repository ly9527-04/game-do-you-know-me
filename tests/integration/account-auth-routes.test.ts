import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
const mocks = vi.hoisted(() => ({ from: vi.fn(), rpc: vi.fn(), get: vi.fn(), set: vi.fn(), hash: vi.fn(), verify: vi.fn() }))
vi.mock('server-only', () => ({}))
vi.mock('@/lib/supabase/server', () => ({ createServerDb: () => ({ from: mocks.from, rpc: mocks.rpc }) }))
vi.mock('next/headers', () => ({ cookies: async () => ({ get: mocks.get, set: mocks.set }) }))
vi.mock('@/lib/passwords', () => ({ hashPassword: mocks.hash, verifyPassword: mocks.verify, DUMMY_PASSWORD_HASH: 'dummy-hash' }))
import { POST as register } from '@/app/api/auth/register/route'
import { POST as login } from '@/app/api/auth/login/route'
import { POST as logout } from '@/app/api/auth/logout/route'
const user = { id: 'user-id', account: '00123456', nickname: '钙' }
const body = { account: user.account, nickname: ' 钙 ', password: 'password', confirmPassword: 'password' }
function request(data: unknown = body, origin = 'https://example.com') {
  return new Request('https://example.com/api/auth', { method: 'POST', headers: { origin, 'x-forwarded-for': '127.0.0.1', 'content-type': 'application/json' }, body: JSON.stringify(data) })
}
let query: { select: ReturnType<typeof vi.fn>; eq: ReturnType<typeof vi.fn>; insert: ReturnType<typeof vi.fn>; single: ReturnType<typeof vi.fn>; maybeSingle: ReturnType<typeof vi.fn>; delete: ReturnType<typeof vi.fn> }
beforeEach(() => {
  vi.resetAllMocks()
  vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://example.com')
  vi.stubEnv('RATE_LIMIT_SECRET', 'test-only-secret')
  mocks.rpc.mockResolvedValue({ data: true, error: null })
  mocks.hash.mockResolvedValue('salted-hash')
  mocks.verify.mockResolvedValue(true)
  query = { select: vi.fn().mockReturnThis(), eq: vi.fn().mockResolvedValue({ error: null }), insert: vi.fn().mockReturnThis(), single: vi.fn().mockResolvedValue({ data: user, error: null }), maybeSingle: vi.fn().mockResolvedValue({ data: { ...user, password_hash: 'salted-hash' }, error: null }), delete: vi.fn().mockReturnThis() }
  query.eq.mockReturnValue(query)
  mocks.from.mockImplementation((table) => table === 'user_sessions' ? { insert: vi.fn().mockResolvedValue({ error: null }), delete: () => ({ eq: vi.fn().mockResolvedValue({ error: null }) }) } : query)
})
afterEach(() => vi.unstubAllEnvs())
describe('authentication routes', () => {
  it('fails closed without rate-limit configuration or trusted IP', async () => {
    vi.stubEnv('RATE_LIMIT_SECRET', '')
    expect((await login(request())).status).toBe(503)
    vi.stubEnv('RATE_LIMIT_SECRET', 'test-only-secret')
    const req = request()
    req.headers.delete('x-forwarded-for')
    expect((await login(req)).status).toBe(400)
    expect(mocks.verify).not.toHaveBeenCalled()
  })
  it('rejects oversized bodies before database access', async () => {
    expect((await register(request({ ...body, nickname: 'x'.repeat(9000) }))).status).toBe(400)
    expect(mocks.from).not.toHaveBeenCalled()
  })
  it('does not issue a cookie when session creation fails after valid login', async () => {
    mocks.from.mockImplementation((table) => table === 'user_sessions' ? { insert: vi.fn().mockResolvedValue({ error: { message: 'private error' } }) } : query)
    const response = await login(request())
    expect(response.status).toBe(500)
    expect(mocks.set).not.toHaveBeenCalled()
    expect(JSON.stringify(await response.json())).not.toContain('private error')
  })
  it('registers with trimmed nickname and returns only public fields', async () => {
    const response = await register(request())
    expect(response.status).toBe(201)
    expect(await response.json()).toEqual({ user })
    expect(query.insert).toHaveBeenCalledWith(expect.objectContaining({ account: '00123456', nickname: '钙', password_hash: 'salted-hash' }))
    expect(mocks.set).toHaveBeenCalled()
    expect(mocks.rpc).toHaveBeenCalledTimes(2)
    expect(JSON.stringify(mocks.rpc.mock.calls)).not.toContain('127.0.0.1')
    expect(JSON.stringify(mocks.rpc.mock.calls)).not.toContain('00123456')
  })
  it('maps duplicate accounts to 409 without session creation', async () => {
    query.single.mockResolvedValue({ data: null, error: { code: '23505' } })
    expect((await register(request())).status).toBe(409)
    expect(mocks.set).not.toHaveBeenCalled()
  })
  it('requires confirmation and rejects malformed JSON', async () => {
    expect((await register(request({ ...body, confirmPassword: undefined }))).status).toBe(400)
    expect((await login(new Request('https://example.com', { method: 'POST', headers: { origin: 'https://example.com' }, body: '{' }))).status).toBe(400)
    expect(mocks.hash).not.toHaveBeenCalled()
  })
  it.each([register, login, logout])('rejects cross-origin and missing-origin writes', async (handler) => {
    expect((await handler(request(body, 'https://evil.example'))).status).toBe(403)
    expect((await handler(new Request('https://example.com', { method: 'POST' }))).status).toBe(403)
    expect(mocks.from).not.toHaveBeenCalled()
  })
  it('returns the same invalid credentials error for missing accounts and wrong passwords', async () => {
    query.maybeSingle.mockResolvedValueOnce({ data: null, error: null })
    const missing = await login(request())
    expect(mocks.verify).toHaveBeenCalledWith('password', 'dummy-hash')
    mocks.verify.mockResolvedValue(false)
    const wrong = await login(request())
    expect(missing.status).toBe(401)
    expect(wrong.status).toBe(401)
    expect(await missing.json()).toEqual(await wrong.json())
    expect(mocks.set).not.toHaveBeenCalled()
  })
  it('logs in with no password hash in response', async () => {
    const response = await login(request())
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ user })
  })
  it('fails closed on IP or account limits and RPC failure', async () => {
    mocks.rpc.mockResolvedValueOnce({ data: false, error: null })
    expect((await login(request())).status).toBe(429)
    mocks.rpc.mockResolvedValueOnce({ data: true, error: null }).mockResolvedValueOnce({ data: false, error: null })
    expect((await register(request())).status).toBe(429)
    mocks.rpc.mockResolvedValueOnce({ data: null, error: { message: 'private' } })
    expect((await login(request())).status).toBe(503)
    expect(mocks.verify).not.toHaveBeenCalled()
  })
  it('hides database errors and does not create a cookie on failed persistence', async () => {
    query.maybeSingle.mockResolvedValue({ data: null, error: { message: 'private' } })
    const response = await login(request())
    expect(response.status).toBe(500)
    expect(JSON.stringify(await response.json())).not.toContain('private')
    expect(mocks.set).not.toHaveBeenCalled()
  })
  it('logs out idempotently and clears the cookie', async () => {
    expect((await logout(request())).status).toBe(200)
    expect(mocks.set).toHaveBeenCalledWith('account_session', '', expect.objectContaining({ maxAge: 0 }))
  })
})
