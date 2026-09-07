import type { QuizAnswers } from '@/types/domain'
import { QUESTION_POOL } from '@/lib/questions'

export type DraftMode = 'creator' | 'friend'

export type QuizDraft = {
  version: 2
  questionSetVersion: number
  questionIds: string[]
  nickname: string
  answers: QuizAnswers
  currentIndex: number
  updatedAt: string
}

const DRAFT_VERSION = 2
const DRAFT_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000
export const DRAFT_STORAGE_PREFIX = 'know-me:quiz-draft:v2'
const DEFAULT_QUESTION_IDS = QUESTION_POOL.map((question) => question.id)

export function getDraftKey(mode: DraftMode, identity: string): string {
  return `${DRAFT_STORAGE_PREFIX}:${mode}:${encodeURIComponent(identity)}`
}

export function loadDraft(
  key: string,
  allowedQuestionIds: readonly string[] = DEFAULT_QUESTION_IDS,
  now = new Date(),
): QuizDraft | null {
  if (typeof window === 'undefined') return null

  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return null

    const candidate: unknown = JSON.parse(raw)
    if (!isQuizDraft(candidate, new Set(allowedQuestionIds))) return null

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

function isQuizDraft(value: unknown, allowedQuestionIds: ReadonlySet<string>): value is QuizDraft {
  if (!value || typeof value !== 'object') return false

  const draft = value as Record<string, unknown>
  return (
    draft.version === DRAFT_VERSION
    && typeof draft.questionSetVersion === 'number'
    && Number.isInteger(draft.questionSetVersion)
    && draft.questionSetVersion > 0
    && isQuestionSelection(draft.questionIds, allowedQuestionIds)
    && typeof draft.nickname === 'string'
    && isQuizAnswers(draft.answers, new Set(draft.questionIds as string[]))
    && typeof draft.currentIndex === 'number'
    && Number.isInteger(draft.currentIndex)
    && draft.currentIndex >= 0
    && draft.currentIndex < (draft.questionIds as string[]).length
    && typeof draft.updatedAt === 'string'
  )
}

function isQuestionSelection(value: unknown, allowedQuestionIds: ReadonlySet<string>): value is string[] {
  if (!Array.isArray(value) || value.length !== 25 || !value.every((id) => typeof id === 'string')) return false
  return new Set(value).size === value.length && value.every((id) => allowedQuestionIds.has(id))
}

function isQuizAnswers(value: unknown, selectedQuestionIds: ReadonlySet<string>): value is QuizAnswers {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false

  return Object.entries(value).every(([questionId, answer]) => (
    selectedQuestionIds.has(questionId)
    && (answer === 'A' || answer === 'B' || answer === 'C' || answer === 'D')
  ))
}
