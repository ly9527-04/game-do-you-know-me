import { describe, expect, it } from 'vitest'

import { createAttemptSchema, createTestSchema, eventSchema, validateSelectedAnswers } from '@/lib/validation'
import { QUESTION_POOL } from '@/lib/questions'

const answers = {
  q01: 'A', q02: 'A', q03: 'A', q04: 'A', q05: 'A',
  q06: 'A', q07: 'A', q08: 'A', q09: 'A', q10: 'A',
  q11: 'A', q12: 'A', q13: 'A', q14: 'A', q15: 'A',
  q16: 'A', q17: 'A', q18: 'A', q19: 'A', q20: 'A',
  q21: 'A', q22: 'A', q23: 'A', q24: 'A', q25: 'A',
} as const
const idempotencyKey = '10000000-0000-4000-8000-000000000001'
const questionIds = [
  ...QUESTION_POOL.filter((question) => question.poolGroup === 'classic').slice(0, 5),
  ...QUESTION_POOL.filter((question) => question.poolGroup === 'daily').slice(0, 4),
  ...QUESTION_POOL.filter((question) => question.poolGroup === 'personality').slice(0, 4),
  ...QUESTION_POOL.filter((question) => question.poolGroup === 'scenario').slice(0, 4),
  ...QUESTION_POOL.filter((question) => question.poolGroup === 'relationship').slice(0, 4),
  ...QUESTION_POOL.filter((question) => question.poolGroup === 'roast').slice(0, 4),
].map((question) => question.id)
const selectedAnswers = Object.fromEntries(questionIds.map((id) => [id, 'A']))

describe('request validation', () => {
  it('trims nicknames and counts astral Unicode characters without UTF-16 overcounting', () => {
    const twentyEmoji = '😀'.repeat(20)

    expect(createTestSchema.safeParse({ nickname: `  ${twentyEmoji}  `, questionIds, answers: selectedAnswers }).success).toBe(true)
    expect(createTestSchema.safeParse({ nickname: '   ', questionIds, answers: selectedAnswers }).success).toBe(false)
    expect(createTestSchema.safeParse({ nickname: '😀'.repeat(21), questionIds, answers: selectedAnswers }).success).toBe(false)
  })

  it('accepts an arbitrary exact set of 25 selected ids and matching answers', () => {
    expect(createTestSchema.safeParse({ nickname: 'AD钙', questionIds, answers: selectedAnswers }).success).toBe(true)
    expect(validateSelectedAnswers(questionIds, selectedAnswers)).toBe(true)
  })

  it('rejects duplicate, short, long, missing, extra and illegal selected answers', () => {
    const shortIds = questionIds.slice(0, 24)
    const longIds = [...questionIds, 'q75']
    const duplicateIds = [...questionIds.slice(0, 24), questionIds[0]]
    const missingAnswers = Object.fromEntries(questionIds.slice(0, 24).map((id) => [id, 'A']))

    expect(createTestSchema.safeParse({ nickname: 'AD钙', questionIds: shortIds, answers: missingAnswers }).success).toBe(false)
    expect(createTestSchema.safeParse({ nickname: 'AD钙', questionIds: longIds, answers: { ...selectedAnswers, q75: 'A' } }).success).toBe(false)
    expect(createTestSchema.safeParse({ nickname: 'AD钙', questionIds: duplicateIds, answers: selectedAnswers }).success).toBe(false)
    expect(createTestSchema.safeParse({ nickname: 'AD钙', questionIds, answers: missingAnswers }).success).toBe(false)
    expect(createTestSchema.safeParse({ nickname: 'AD钙', questionIds, answers: { ...selectedAnswers, extra: 'A' } }).success).toBe(false)
    expect(createTestSchema.safeParse({ nickname: 'AD钙', questionIds, answers: { ...selectedAnswers, [questionIds[0]]: 'E' } }).success).toBe(false)
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
