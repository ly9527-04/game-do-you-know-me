import { describe, expect, it } from 'vitest'

import { createAttemptSchema, createTestSchema, eventSchema } from '@/lib/validation'
import { QUESTIONS } from '@/lib/questions'

const answers = Object.fromEntries(QUESTIONS.map((question) => [question.id, 'A']))
const idempotencyKey = '10000000-0000-4000-8000-000000000001'

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
