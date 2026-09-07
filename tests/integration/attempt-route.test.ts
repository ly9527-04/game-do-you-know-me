import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  getPublicTest: vi.fn(),
  getCreatorAnswers: vi.fn(),
  createAttemptRecord: vi.fn(),
  assertRateLimit: vi.fn(),
  recordEvent: vi.fn(),
  scoreAnswers: vi.fn(),
}))
vi.mock('@/lib/repositories/tests', () => ({ getPublicTest: mocks.getPublicTest, getCreatorAnswers: mocks.getCreatorAnswers }))
vi.mock('@/lib/repositories/attempts', () => ({ createAttemptRecord: mocks.createAttemptRecord }))
vi.mock('@/lib/rate-limit', () => ({ assertRateLimit: mocks.assertRateLimit }))
vi.mock('@/lib/analytics', () => ({ recordEvent: mocks.recordEvent }))
vi.mock('@/lib/scoring', async (importOriginal) => ({ ...(await importOriginal()), scoreAnswers: mocks.scoreAnswers }))
vi.mock('server-only', () => ({}))

import { QUESTION_POOL } from '@/lib/questions'
import { POST } from '@/app/api/tests/[shareCode]/attempts/route'

const testId = '10000000-0000-4000-8000-000000000001'
const idempotencyKey = '20000000-0000-4000-8000-000000000001'
const anonymousSessionId = '40000000-0000-4000-8000-000000000001'
const selectedQuestions = [
  ...QUESTION_POOL.filter((question) => question.poolGroup === 'classic').slice(-5),
  ...QUESTION_POOL.filter((question) => question.poolGroup === 'daily').slice(-4),
  ...QUESTION_POOL.filter((question) => question.poolGroup === 'personality').slice(-4),
  ...QUESTION_POOL.filter((question) => question.poolGroup === 'scenario').slice(-4),
  ...QUESTION_POOL.filter((question) => question.poolGroup === 'relationship').slice(-4),
  ...QUESTION_POOL.filter((question) => question.poolGroup === 'roast').slice(-4),
].map((question, index) => ({ ...question, order: index + 1 }))
const answers = Object.fromEntries(selectedQuestions.map((question) => [question.id, 'B']))

function request(body: unknown) {
  return new Request('https://me.ly0688.online/api/tests/share/attempts', {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body),
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  process.env.NEXT_PUBLIC_SITE_URL = 'https://me.ly0688.online'
  mocks.getPublicTest.mockResolvedValue({ testId, creatorNickname: '阿钙', questionSetVersion: 2, questions: selectedQuestions })
  mocks.getCreatorAnswers.mockResolvedValue(Object.fromEntries(selectedQuestions.map((question) => [question.id, 'A'])))
  mocks.assertRateLimit.mockResolvedValue(undefined)
  mocks.recordEvent.mockResolvedValue(undefined)
  mocks.scoreAnswers.mockReturnValue({ score: 76, comparisons: [] })
  mocks.createAttemptRecord.mockResolvedValue('30000000-0000-4000-8000-000000000001')
})

describe('POST /api/tests/:shareCode/attempts', () => {
  it('scores on the server and ignores a client supplied score', async () => {
    const response = await POST(request({ nickname: '小明', answers, idempotencyKey, anonymousSessionId, score: 100 }), { params: Promise.resolve({ shareCode: 'share' }) })
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body).toEqual({ attemptId: '30000000-0000-4000-8000-000000000001', resultUrl: 'https://me.ly0688.online/r/30000000-0000-4000-8000-000000000001' })
    expect(mocks.scoreAnswers).toHaveBeenCalledWith(expect.anything(), answers, selectedQuestions)
    expect(mocks.createAttemptRecord).toHaveBeenCalledWith(expect.objectContaining({ testId, nickname: '小明', idempotencyKey, answers, scoreResult: expect.objectContaining({ score: 76 }) }))
    expect(mocks.recordEvent).toHaveBeenCalledWith(expect.objectContaining({
      eventName: 'friend_quiz_complete',
      anonymousSessionId,
    }))
  })

  it('returns 429 before reading answers when rate limited', async () => {
    mocks.assertRateLimit.mockRejectedValueOnce({ reason: 'exceeded' })

    const response = await POST(request({ nickname: '小明', answers, idempotencyKey }), { params: Promise.resolve({ shareCode: 'share' }) })

    expect(response.status).toBe(429)
    expect(mocks.getCreatorAnswers).not.toHaveBeenCalled()
  })

  it('maps persistence errors to a safe response', async () => {
    mocks.createAttemptRecord.mockRejectedValueOnce(new Error('private db details'))

    const response = await POST(request({ nickname: '小明', answers, idempotencyKey }), { params: Promise.resolve({ shareCode: 'share' }) })

    expect(response.status).toBe(500)
    await expect(response.json()).resolves.toEqual({ error: { code: 'ATTEMPT_FAILED', message: '暂时没能记下这次挑战，请稍后重试。' } })
  })

  it('rejects before persistence when the canonical site URL is missing', async () => {
    delete process.env.NEXT_PUBLIC_SITE_URL

    const response = await POST(request({ nickname: '小明', answers, idempotencyKey }), { params: Promise.resolve({ shareCode: 'share' }) })

    expect(response.status).toBe(500)
    expect(mocks.createAttemptRecord).not.toHaveBeenCalled()
  })

  it('rejects an answer set that does not match the saved 25 test questions', async () => {
    const unrelatedAnswers = Object.fromEntries(Array.from({ length: 25 }, (_, index) => [`other-${index}`, 'A']))
    const response = await POST(request({ nickname: '小明', answers: unrelatedAnswers, idempotencyKey }), { params: Promise.resolve({ shareCode: 'share' }) })

    expect(response.status).toBe(400)
    expect(mocks.getCreatorAnswers).not.toHaveBeenCalled()
    expect(mocks.createAttemptRecord).not.toHaveBeenCalled()
  })
})
