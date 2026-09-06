import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ getManageSummary: vi.fn(), cookies: vi.fn(), verifyManageSession: vi.fn() }))
vi.mock('@/lib/repositories/manage', () => ({ getManageSummary: mocks.getManageSummary }))
vi.mock('@/lib/manage-session', () => ({ manageCookieName: () => 'manage_session', verifyManageSession: mocks.verifyManageSession }))
vi.mock('next/headers', () => ({ cookies: mocks.cookies }))
vi.mock('server-only', () => ({}))

import { GET } from '@/app/api/manage/tests/[testId]/route'

const testA = '10000000-0000-4000-8000-000000000001'
const testB = '10000000-0000-4000-8000-000000000002'

beforeEach(() => {
  vi.clearAllMocks()
  process.env.NEXT_PUBLIC_SITE_URL = 'https://me.ly0688.online'
  mocks.cookies.mockResolvedValue({ get: vi.fn(() => ({ value: 'signed-session' })) })
  mocks.verifyManageSession.mockReturnValue({ testId: testA, expires: 2000000000 })
  mocks.getManageSummary.mockResolvedValue({ creatorNickname: '阿钙', shareCode: 'share', challengeCount: 2, averageScore: 76, entries: [] })
})

describe('GET /api/manage/tests/:testId', () => {
  it('rejects a missing cookie and a cookie belonging to another test', async () => {
    mocks.cookies.mockResolvedValueOnce({ get: vi.fn(() => undefined) })
    const missing = await GET(new Request('https://me.ly0688.online/api/manage/tests/x'), { params: Promise.resolve({ testId: testA }) })
    const crossTest = await GET(new Request('https://me.ly0688.online/api/manage/tests/x'), { params: Promise.resolve({ testId: testB }) })

    expect(missing.status).toBe(401)
    expect(crossTest.status).toBe(403)
    expect(mocks.getManageSummary).not.toHaveBeenCalled()
  })

  it('returns summary only for the test bound to the signed cookie', async () => {
    const response = await GET(new Request('https://me.ly0688.online/api/manage/tests/x'), { params: Promise.resolve({ testId: testA }) })
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body).toMatchObject({ creatorNickname: '阿钙', challengeCount: 2, averageScore: 76, shareUrl: 'https://me.ly0688.online/t/share' })
    expect(mocks.getManageSummary).toHaveBeenCalledWith(testA)
  })
})
