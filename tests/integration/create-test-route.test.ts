import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  getActiveQuestionSet: vi.fn(),
  createTestRecord: vi.fn(),
  createShareCode: vi.fn(),
  createManageToken: vi.fn(),
  hashToken: vi.fn(),
  assertRateLimit: vi.fn(),
  recordEvent: vi.fn(),
}))

vi.mock('@/lib/repositories/tests', () => ({
  getActiveQuestionSet: mocks.getActiveQuestionSet,
  createTestRecord: mocks.createTestRecord,
}))
vi.mock('@/lib/security', () => ({
  createShareCode: mocks.createShareCode,
  createManageToken: mocks.createManageToken,
  hashToken: mocks.hashToken,
}))
vi.mock('@/lib/rate-limit', () => ({ assertRateLimit: mocks.assertRateLimit }))
vi.mock('@/lib/analytics', () => ({ recordEvent: mocks.recordEvent }))
vi.mock('server-only', () => ({}))

import { QUESTION_POOL } from '@/lib/questions'
import { POST } from '@/app/api/tests/route'

const questionIds = [
  ...QUESTION_POOL.filter((question) => question.poolGroup === 'classic').slice(0, 5),
  ...QUESTION_POOL.filter((question) => question.poolGroup === 'daily').slice(0, 4),
  ...QUESTION_POOL.filter((question) => question.poolGroup === 'personality').slice(0, 4),
  ...QUESTION_POOL.filter((question) => question.poolGroup === 'scenario').slice(0, 4),
  ...QUESTION_POOL.filter((question) => question.poolGroup === 'relationship').slice(0, 4),
  ...QUESTION_POOL.filter((question) => question.poolGroup === 'roast').slice(0, 4),
].map((question) => question.id)
const answers = Object.fromEntries(questionIds.map((id) => [id, 'A']))
const anonymousSessionId = '40000000-0000-4000-8000-000000000001'
const questionSet = {
  id: '10000000-0000-4000-8000-000000000001',
  version: 2,
  questions: QUESTION_POOL,
}

function request(body: unknown, headers: Record<string, string> = {}) {
  return new Request('https://me.ly0688.online/api/tests', {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body: JSON.stringify(body),
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  process.env.NEXT_PUBLIC_SITE_URL = 'https://me.ly0688.online'
  mocks.getActiveQuestionSet.mockResolvedValue(questionSet)
  mocks.createShareCode.mockReturnValue('share-code')
  mocks.createManageToken.mockReturnValue('manage-token')
  mocks.hashToken.mockReturnValue('hash'.repeat(16))
  mocks.createTestRecord.mockResolvedValue('20000000-0000-4000-8000-000000000001')
  mocks.assertRateLimit.mockResolvedValue(undefined)
  mocks.recordEvent.mockResolvedValue(undefined)
})

afterEach(() => {
  delete process.env.NEXT_PUBLIC_SITE_URL
})

describe('POST /api/tests', () => {
  it('rejects a 24-answer payload before rate limiting or persistence', async () => {
    const shortIds = questionIds.slice(0, 24)
    const response = await POST(request({ nickname: '阿钙', questionIds: shortIds, answers: Object.fromEntries(shortIds.map((id) => [id, 'A'])) }))

    expect(response.status).toBe(400)
    expect(mocks.assertRateLimit).not.toHaveBeenCalled()
    expect(mocks.createTestRecord).not.toHaveBeenCalled()
  })

  it('returns 429 when the anonymous create limit is exceeded', async () => {
    mocks.assertRateLimit.mockRejectedValueOnce({ reason: 'exceeded' })

    const response = await POST(request({ nickname: '阿钙', questionIds, answers }))

    expect(response.status).toBe(429)
    expect(mocks.createTestRecord).not.toHaveBeenCalled()
  })

  it('hashes the management token and returns separated absolute URLs', async () => {
    const response = await POST(request({ nickname: ' 阿钙 ', questionIds, answers, anonymousSessionId }))
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(mocks.createTestRecord).toHaveBeenCalledWith(expect.objectContaining({
      nickname: '阿钙',
      shareCode: 'share-code',
      manageTokenHash: 'hash'.repeat(16),
      questionIds,
      answers,
    }))
    expect(body).toEqual({
      testId: expect.stringMatching(/^[0-9a-f-]{36}$/),
      shareUrl: 'https://me.ly0688.online/t/share-code',
      manageUrl: 'https://me.ly0688.online/m/manage-token',
    })
    expect(JSON.stringify(body)).not.toContain('creator')
    expect(mocks.recordEvent).toHaveBeenCalledWith(expect.objectContaining({
      eventName: 'creator_quiz_complete',
      anonymousSessionId,
    }))
  })

  it('maps persistence failures to the safe create error contract', async () => {
    mocks.createTestRecord.mockRejectedValueOnce(new Error('secret sql details'))

    const response = await POST(request({ nickname: '阿钙', questionIds, answers }))

    expect(response.status).toBe(500)
    await expect(response.json()).resolves.toEqual({ error: { code: 'CREATE_FAILED', message: '暂时没能封存档案，请稍后重试。' } })
  })

  it('rejects creation when the canonical site URL is not configured', async () => {
    delete process.env.NEXT_PUBLIC_SITE_URL

    const response = await POST(request({ nickname: '阿钙', questionIds, answers }))

    expect(response.status).toBe(500)
    expect(mocks.createTestRecord).not.toHaveBeenCalled()
  })

  it('rejects ids that exist but do not satisfy the balanced group quotas', async () => {
    const unbalancedIds = QUESTION_POOL.slice(0, 25).map((question) => question.id)
    const response = await POST(request({
      nickname: '阿钙',
      questionIds: unbalancedIds,
      answers: Object.fromEntries(unbalancedIds.map((id) => [id, 'A'])),
    }))

    expect(response.status).toBe(400)
    expect(mocks.createTestRecord).not.toHaveBeenCalled()
  })
})
