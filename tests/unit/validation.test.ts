import { describe, expect, it, vi } from 'vitest'

import { createAttemptSchema, createTestSchema, eventSchema } from '@/lib/validation'

const answers = {
  q01: 'A', q02: 'A', q03: 'A', q04: 'A', q05: 'A',
  q06: 'A', q07: 'A', q08: 'A', q09: 'A', q10: 'A',
  q11: 'A', q12: 'A', q13: 'A', q14: 'A', q15: 'A',
  q16: 'A', q17: 'A', q18: 'A', q19: 'A', q20: 'A',
  q21: 'A', q22: 'A', q23: 'A', q24: 'A', q25: 'A',
} as const
const idempotencyKey = '10000000-0000-4000-8000-000000000001'

const shortenedQuestionBank = Array.from({ length: 24 }, (_, index) => ({
  id: `q${String(index + 1).padStart(2, '0')}`,
  order: index + 1,
  prompt: `Question ${index + 1}`,
  options: [
    { value: 'A', text: 'A' }, { value: 'B', text: 'B' },
    { value: 'C', text: 'C' }, { value: 'D', text: 'D' },
  ],
  category: 'abstract',
  mismatchPriority: 1,
}))

describe('request validation', () => {
  it('trims nicknames and counts astral Unicode characters without UTF-16 overcounting', () => {
    const twentyEmoji = '😀'.repeat(20)

    expect(createTestSchema.safeParse({ nickname: `  ${twentyEmoji}  `, answers }).success).toBe(true)
    expect(createTestSchema.safeParse({ nickname: '   ', answers }).success).toBe(false)
    expect(createTestSchema.safeParse({ nickname: '😀'.repeat(21), answers }).success).toBe(false)
  })

  it('requires precisely the fixed q01 through q25 answer keys and valid choices', () => {
    const { q25: _q25, ...missingAnswer } = answers
    const tooManyAnswers = { ...answers, extra: 'A' }
    const invalidChoice = { ...answers, q01: 'E' }

    expect(createTestSchema.safeParse({ nickname: 'AD钙', answers: missingAnswer }).success).toBe(false)
    expect(createTestSchema.safeParse({ nickname: 'AD钙', answers: tooManyAnswers }).success).toBe(false)
    expect(createTestSchema.safeParse({ nickname: 'AD钙', answers: invalidChoice }).success).toBe(false)
  })

  it('keeps the q01 through q25 contract even if the question module is shortened', async () => {
    vi.resetModules()
    vi.doMock('@/lib/questions', () => ({
      QUESTION_SET_VERSION: 1,
      QUESTIONS: shortenedQuestionBank,
    }))

    try {
      const { createTestSchema: schemaWithShortenedQuestionBank } = await import('@/lib/validation')
      const { q25: _q25, ...missingQ25 } = answers

      expect(schemaWithShortenedQuestionBank.safeParse({ nickname: 'AD钙', answers }).success).toBe(true)
      expect(schemaWithShortenedQuestionBank.safeParse({ nickname: 'AD钙', answers: missingQ25 }).success).toBe(false)
    } finally {
      vi.doUnmock('@/lib/questions')
      vi.resetModules()
    }
  })

  it('requires a UUID idempotency key for friend attempts', () => {
    expect(createAttemptSchema.safeParse({ nickname: '0011', answers, idempotencyKey }).success).toBe(true)
    expect(createAttemptSchema.safeParse({ nickname: '0011', answers, idempotencyKey: 'retry-me' }).success).toBe(false)
  })

  it('allows only the eight funnel event names and rejects sensitive metadata keys', () => {
    const event = { anonymousSessionId: idempotencyKey }

    expect(eventSchema.safeParse({ ...event, eventName: 'friend_quiz_complete', metadata: { source: 'quiz', ignored: 'discard-me' } }).success).toBe(true)
    expect(eventSchema.safeParse({ ...event, eventName: 'unlisted_event' }).success).toBe(false)
    expect(eventSchema.safeParse({ ...event, eventName: 'homepage_view', metadata: { answer: 'A' } }).success).toBe(false)
    expect(eventSchema.safeParse({ ...event, eventName: 'homepage_view', metadata: { manageToken: 'secret' } }).success).toBe(false)
    expect(eventSchema.safeParse({ ...event, eventName: 'homepage_view', metadata: { ip: '203.0.113.1' } }).success).toBe(false)
  })
})
