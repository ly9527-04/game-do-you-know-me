import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  findTestByManageTokenHash: vi.fn(),
}))
vi.mock('@/lib/repositories/tests', () => ({ findTestByManageTokenHash: mocks.findTestByManageTokenHash }))
vi.mock('server-only', () => ({}))

import { GET } from '@/app/m/[manageToken]/route'

const testId = '10000000-0000-4000-8000-000000000001'

beforeEach(() => {
  vi.clearAllMocks()
  process.env.MANAGEMENT_SESSION_SECRET = 'test-secret'
  process.env.NEXT_PUBLIC_SITE_URL = 'https://me.ly0688.online'
  mocks.findTestByManageTokenHash.mockResolvedValue({ testId, creatorNickname: '阿钙', shareCode: 'share' })
})

describe('GET /m/:manageToken', () => {
  it('exchanges a valid token for a production HttpOnly host cookie', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    try {
      const response = await GET(new Request('https://me.ly0688.online/m/manage-token'), { params: Promise.resolve({ manageToken: 'a'.repeat(43) }) })
      const cookie = response.headers.get('set-cookie') ?? ''

      expect(response.status).toBe(303)
      expect(response.headers.get('location')).toBe(`https://me.ly0688.online/manage/${testId}`)
      expect(cookie).toContain('__Host-manage_session=')
      expect(cookie).toContain('HttpOnly')
      expect(cookie).toContain('Secure')
      expect(cookie).toMatch(/SameSite=Lax/i)
      expect(cookie).toContain('Path=/')
      expect(cookie).not.toContain('a'.repeat(43))
    } finally {
      vi.unstubAllEnvs()
    }
  })

  it('uses the same generic unauthorized response for malformed and unknown tokens', async () => {
    mocks.findTestByManageTokenHash.mockResolvedValue(null)
    const malformed = await GET(new Request('https://me.ly0688.online/m/nope'), { params: Promise.resolve({ manageToken: 'nope' }) })
    const unknown = await GET(new Request('https://me.ly0688.online/m/unknown'), { params: Promise.resolve({ manageToken: 'b'.repeat(43) }) })

    expect(malformed.status).toBe(403)
    expect(unknown.status).toBe(403)
    await expect(malformed.json()).resolves.toEqual(await unknown.json())
  })
})
