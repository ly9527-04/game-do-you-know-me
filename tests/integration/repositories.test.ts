import { beforeEach, describe, expect, it, vi } from 'vitest'

const { createServerDb, from, rpc } = vi.hoisted(() => ({
  createServerDb: vi.fn(),
  from: vi.fn(),
  rpc: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({ createServerDb }))
vi.mock('server-only', () => ({}))

import { createAttemptRecord, getResultSource } from '@/lib/repositories/attempts'
import { getManageSummary } from '@/lib/repositories/manage'
import {
  createTestRecord,
  findTestByManageTokenHash,
  getActiveQuestionSet,
  getCreatorAnswers,
  getPublicTest,
} from '@/lib/repositories/tests'
import { QUESTIONS } from '@/lib/questions'
import type { QuizAnswers, ScoreResult } from '@/types/domain'

const answers = Object.fromEntries(QUESTIONS.map((question) => [question.id, 'A'])) as QuizAnswers
const validTestInput = {
  testId: '10000000-0000-4000-8000-000000000001',
  questionSetId: '10000000-0000-4000-8000-000000000002',
  nickname: 'AD钙',
  shareCode: 'share123',
  manageTokenHash: 'a'.repeat(64),
  answers,
}

function queryResult(data: unknown, error: unknown = null) {
  const builder = {
    select: vi.fn(),
    eq: vi.fn(),
    order: vi.fn(),
    single: vi.fn(),
    maybeSingle: vi.fn(),
    then: (onFulfilled: (value: { data: unknown; error: unknown }) => unknown) =>
      Promise.resolve({ data, error }).then(onFulfilled),
  }
  builder.select.mockReturnValue(builder)
  builder.eq.mockReturnValue(builder)
  builder.order.mockReturnValue(builder)
  builder.single.mockResolvedValue({ data, error })
  builder.maybeSingle.mockResolvedValue({ data, error })
  return builder
}

beforeEach(() => {
  vi.clearAllMocks()
  createServerDb.mockReturnValue({ from, rpc })
})

describe('test repository', () => {
  it('loads the active versioned question set as camelCase domain questions', async () => {
    const query = queryResult({
      id: validTestInput.questionSetId,
      version: 1,
      questions: QUESTIONS.map((question) => ({
        id: question.id,
        sort_order: question.order,
        prompt: question.prompt,
        options: question.options,
        category: question.category,
        mismatch_priority: question.mismatchPriority,
      })),
    })
    from.mockReturnValue(query)

    const result = await getActiveQuestionSet()

    expect(from).toHaveBeenCalledWith('question_sets')
    expect(query.eq).toHaveBeenCalledWith('is_active', true)
    expect(result?.questions).toHaveLength(25)
    expect(result?.questions[0]).toMatchObject({ id: 'q01', order: 1, mismatchPriority: 1 })
  })

  it('creates a test through the transactional RPC', async () => {
    rpc.mockResolvedValue({ data: validTestInput.testId, error: null })

    await expect(createTestRecord(validTestInput)).resolves.toBe(validTestInput.testId)

    expect(rpc).toHaveBeenCalledWith('create_test', expect.objectContaining({
      p_test_id: validTestInput.testId,
      p_share_code: validTestInput.shareCode,
      p_manage_token_hash: validTestInput.manageTokenHash,
      p_answers: validTestInput.answers,
    }))
  })

  it('returns public test data without selecting or exposing creator answers', async () => {
    const query = queryResult({
      id: validTestInput.testId,
      nickname: 'AD钙',
      question_sets: {
        version: 1,
        questions: QUESTIONS.map((question) => ({
          id: question.id,
          sort_order: question.order,
          prompt: question.prompt,
          options: question.options,
          category: question.category,
          mismatch_priority: question.mismatchPriority,
        })),
      },
    })
    from.mockReturnValue(query)

    const result = await getPublicTest('share123')

    expect(query.select.mock.calls[0][0]).not.toContain('creator_answers')
    expect(JSON.stringify(result)).not.toContain('creator_answers')
    expect(JSON.stringify(result)).not.toContain('creatorAnswer')
    expect(result).toMatchObject({ testId: validTestInput.testId, creatorNickname: 'AD钙', questionSetVersion: 1 })
    expect(result?.questions).toHaveLength(25)
  })

  it('maps creator answers and management token lookup', async () => {
    const answerQuery = queryResult(QUESTIONS.map((question) => ({ question_id: question.id, answer: 'A' })))
    const tokenQuery = queryResult({ id: validTestInput.testId, nickname: 'AD钙', share_code: 'share123' })
    from.mockReturnValueOnce(answerQuery).mockReturnValueOnce(tokenQuery)

    await expect(getCreatorAnswers(validTestInput.testId)).resolves.toEqual(answers)
    await expect(findTestByManageTokenHash('a'.repeat(64))).resolves.toEqual({
      testId: validTestInput.testId,
      creatorNickname: 'AD钙',
      shareCode: 'share123',
    })
  })
})

describe('attempt repository', () => {
  it('creates an attempt through the transactional RPC and returns its idempotent id', async () => {
    const scoreResult: ScoreResult = {
      score: 100,
      comparisons: QUESTIONS.map((question) => ({
        questionId: question.id,
        creatorAnswer: 'A',
        friendAnswer: 'A',
        isCorrect: true,
      })),
    }
    rpc.mockResolvedValue({ data: 'attempt-existing', error: null })

    const result = await createAttemptRecord({
      attemptId: '20000000-0000-4000-8000-000000000001',
      testId: validTestInput.testId,
      nickname: '0011',
      idempotencyKey: '20000000-0000-4000-8000-000000000002',
      answers,
      scoreResult,
    })

    expect(result).toBe('attempt-existing')
    expect(rpc).toHaveBeenCalledWith('create_attempt', expect.objectContaining({
      p_score: 100,
      p_answers: expect.objectContaining({ q01: { answer: 'A', isCorrect: true } }),
    }))
  })

  it('maps the server-only result source including comparisons', async () => {
    const query = queryResult({
      id: 'attempt-1',
      nickname: '0011',
      score: 96,
      attempt_answers: [{ question_id: 'q01', answer: 'B', is_correct: false }],
      tests: { nickname: 'AD钙', creator_answers: [{ question_id: 'q01', answer: 'A' }] },
    })
    from.mockReturnValue(query)

    await expect(getResultSource('attempt-1')).resolves.toEqual({
      attemptId: 'attempt-1',
      creatorNickname: 'AD钙',
      friendNickname: '0011',
      score: 96,
      comparisons: [{ questionId: 'q01', creatorAnswer: 'A', friendAnswer: 'B', isCorrect: false }],
    })
  })
})

describe('manage repository', () => {
  it('returns challengeCount, averageScore and sorted camelCase entries', async () => {
    const testQuery = queryResult({ nickname: 'AD钙', share_code: 'share123' })
    const attemptsQuery = queryResult([
      { id: 'attempt-1', nickname: '0011', score: 76, created_at: '2026-09-06T08:00:00Z' },
      { id: 'attempt-2', nickname: '小明', score: 100, created_at: '2026-09-06T09:00:00Z' },
    ])
    from.mockReturnValueOnce(testQuery).mockReturnValueOnce(attemptsQuery)

    await expect(getManageSummary(validTestInput.testId)).resolves.toEqual({
      creatorNickname: 'AD钙',
      shareCode: 'share123',
      challengeCount: 2,
      averageScore: 88,
      entries: [
        { attemptId: 'attempt-1', nickname: '0011', score: 76, createdAt: '2026-09-06T08:00:00Z' },
        { attemptId: 'attempt-2', nickname: '小明', score: 100, createdAt: '2026-09-06T09:00:00Z' },
      ],
    })
  })
})
