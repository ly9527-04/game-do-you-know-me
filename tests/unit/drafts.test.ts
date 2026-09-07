import { afterEach, describe, expect, it } from 'vitest'
import { clearDraft, getDraftKey, loadDraft, saveDraft, type QuizDraft } from '@/lib/drafts'
import { FIXED_QUESTION_IDS } from '@/types/domain'

const questionIds = [...FIXED_QUESTION_IDS]

const draft: QuizDraft = {
  version: 2,
  questionSetVersion: 2,
  questionIds,
  nickname: '阿钙',
  answers: { q01: 'A' },
  currentIndex: 0,
  updatedAt: '2026-09-06T00:00:00.000Z',
}

afterEach(() => localStorage.clear())

describe('quiz drafts', () => {
  it('isolates creator drafts from each concrete share code', () => {
    const creatorKey = getDraftKey('creator', '阿钙')
    const firstFriendKey = getDraftKey('friend', 'ABC123')
    const secondFriendKey = getDraftKey('friend', 'XYZ789')

    expect(creatorKey).not.toBe(firstFriendKey)
    expect(firstFriendKey).not.toBe(secondFriendKey)
  })

  it('round-trips a valid draft and clears only that draft', () => {
    const key = getDraftKey('friend', 'ABC123')
    saveDraft(key, draft)

    expect(loadDraft(key, questionIds, new Date('2026-09-07T00:00:00.000Z'))).toEqual(draft)
    clearDraft(key)
    expect(loadDraft(key)).toBeNull()
  })

  it.each([
    ['damaged JSON', '{not-json'],
    ['old version', JSON.stringify({ ...draft, version: 1 })],
    ['expired draft', JSON.stringify({ ...draft, updatedAt: '2026-08-06T00:00:00.000Z' })],
    ['an answers array', JSON.stringify({ ...draft, answers: ['A'] })],
    ['an unknown answer key', JSON.stringify({ ...draft, answers: { unknown: 'A' } })],
    ['an illegal answer choice', JSON.stringify({ ...draft, answers: { q01: 'E' } })],
    ['only 24 questions', JSON.stringify({ ...draft, questionIds: questionIds.slice(0, 24) })],
    ['a duplicate question', JSON.stringify({ ...draft, questionIds: [...questionIds.slice(0, 24), 'q01'] })],
    ['an unknown question', JSON.stringify({ ...draft, questionIds: [...questionIds.slice(0, 24), 'q75'] })],
    ['a negative current index', JSON.stringify({ ...draft, currentIndex: -1 })],
    ['a current index after question 25', JSON.stringify({ ...draft, currentIndex: 25 })],
  ])('returns null for %s', (_label, rawDraft) => {
    const key = getDraftKey('creator', '阿钙')
    localStorage.setItem(key, rawDraft)

    expect(loadDraft(key, questionIds, new Date('2026-09-06T00:00:00.000Z'))).toBeNull()
  })
})
