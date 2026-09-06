import type { QuizAnswers } from '@/types/domain'
import { FIXED_QUESTION_IDS } from '@/types/domain'

export type DraftMode = 'creator' | 'friend'

export type QuizDraft = {
  version: 1
  nickname: string
  answers: QuizAnswers
  currentIndex: number
  updatedAt: string
}

const DRAFT_VERSION = 1
const DRAFT_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000
const DRAFT_PREFIX = 'know-me:quiz-draft:v1'
const MAX_DRAFT_INDEX = FIXED_QUESTION_IDS.length - 1
const QUESTION_IDS = new Set<string>(FIXED_QUESTION_IDS)

export function getDraftKey(mode: DraftMode, identity: string): string {
  return `${DRAFT_PREFIX}:${mode}:${encodeURIComponent(identity)}`
}

export function loadDraft(key: string, now = new Date()): QuizDraft | null {
  if (typeof window === 'undefined') return null

  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return null

    const candidate: unknown = JSON.parse(raw)
    if (!isQuizDraft(candidate)) return null

    const updatedAt = Date.parse(candidate.updatedAt)
    if (Number.isNaN(updatedAt) || now.getTime() - updatedAt >= DRAFT_MAX_AGE_MS) return null

    return candidate
  } catch {
    return null
  }
}

export function saveDraft(key: string, draft: QuizDraft): void {
  if (typeof window === 'undefined') return

  try {
    window.localStorage.setItem(key, JSON.stringify(draft))
  } catch {
    // Draft persistence is a convenience; unavailable storage must not block answering.
  }
}

export function clearDraft(key: string): void {
  if (typeof window === 'undefined') return

  try {
    window.localStorage.removeItem(key)
  } catch {
    // A blocked storage implementation should not affect completion.
  }
}

function isQuizDraft(value: unknown): value is QuizDraft {
  if (!value || typeof value !== 'object') return false

  const draft = value as Record<string, unknown>
  return (
    draft.version === DRAFT_VERSION
    && typeof draft.nickname === 'string'
    && isQuizAnswers(draft.answers)
    && typeof draft.currentIndex === 'number'
    && Number.isInteger(draft.currentIndex)
    && draft.currentIndex >= 0
    && draft.currentIndex <= MAX_DRAFT_INDEX
    && typeof draft.updatedAt === 'string'
  )
}

function isQuizAnswers(value: unknown): value is QuizAnswers {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false

  return Object.entries(value).every(([questionId, answer]) => (
    QUESTION_IDS.has(questionId)
    && (answer === 'A' || answer === 'B' || answer === 'C' || answer === 'D')
  ))
}
