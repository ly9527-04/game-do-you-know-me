import 'server-only'

import { createServerDb } from '@/lib/supabase/server'
import type { AnswerChoice, Question, QuestionCategory, QuestionOption, QuizAnswers } from '@/types/domain'

interface QuestionRow {
  id: string
  sort_order: number
  prompt: string
  options: readonly QuestionOption[]
  category: QuestionCategory
  mismatch_priority: number
}

interface QuestionSetRow {
  id: string
  version: number
  questions: QuestionRow[]
}

export interface ActiveQuestionSet {
  id: string
  version: number
  questions: Question[]
}

export interface CreateTestRecordInput {
  testId: string
  questionSetId: string
  nickname: string
  shareCode: string
  manageTokenHash: string
  answers: QuizAnswers
}

export interface PublicTest {
  testId: string
  creatorNickname: string
  questionSetVersion: number
  questions: Question[]
}

export interface ManagedTestIdentity {
  testId: string
  creatorNickname: string
  shareCode: string
}

export class RepositoryError extends Error {
  constructor(operation: string) {
    super(`Database operation failed: ${operation}`)
    this.name = 'RepositoryError'
  }
}

function mapQuestion(row: QuestionRow): Question {
  return {
    id: row.id,
    order: row.sort_order,
    prompt: row.prompt,
    options: row.options,
    category: row.category,
    mismatchPriority: row.mismatch_priority,
  }
}

function mapQuestions(rows: QuestionRow[]): Question[] {
  return rows.map(mapQuestion).sort((left, right) => left.order - right.order)
}

export async function getActiveQuestionSet(): Promise<ActiveQuestionSet | null> {
  const db = createServerDb()
  const { data, error } = await db
    .from('question_sets')
    .select('id, version, questions(id, sort_order, prompt, options, category, mismatch_priority)')
    .eq('is_active', true)
    .order('sort_order', { referencedTable: 'questions' })
    .maybeSingle()

  if (error) throw new RepositoryError('get active question set')
  if (!data) return null
  const row = data as unknown as QuestionSetRow
  return { id: row.id, version: row.version, questions: mapQuestions(row.questions) }
}

export async function createTestRecord(input: CreateTestRecordInput): Promise<string> {
  const { data, error } = await createServerDb().rpc('create_test', {
    p_test_id: input.testId,
    p_question_set_id: input.questionSetId,
    p_nickname: input.nickname,
    p_share_code: input.shareCode,
    p_manage_token_hash: input.manageTokenHash,
    p_answers: input.answers,
  })
  if (error || typeof data !== 'string') throw new RepositoryError('create test')
  return data
}

export async function getPublicTest(shareCode: string): Promise<PublicTest | null> {
  const { data, error } = await createServerDb()
    .from('tests')
    .select('id, nickname, question_sets(version, questions(id, sort_order, prompt, options, category, mismatch_priority))')
    .eq('share_code', shareCode)
    .order('sort_order', { referencedTable: 'question_sets.questions' })
    .maybeSingle()

  if (error) throw new RepositoryError('get public test')
  if (!data) return null
  const row = data as unknown as {
    id: string
    nickname: string
    question_sets: { version: number; questions: QuestionRow[] }
  }
  return {
    testId: row.id,
    creatorNickname: row.nickname,
    questionSetVersion: row.question_sets.version,
    questions: mapQuestions(row.question_sets.questions),
  }
}

export async function getCreatorAnswers(testId: string): Promise<QuizAnswers> {
  const { data, error } = await createServerDb()
    .from('creator_answers')
    .select('question_id, answer')
    .eq('test_id', testId)
    .order('question_id')

  if (error) throw new RepositoryError('get creator answers')
  return Object.fromEntries(
    ((data ?? []) as unknown as { question_id: string; answer: AnswerChoice }[]).map((row) => [row.question_id, row.answer]),
  )
}

export async function findTestByManageTokenHash(hash: string): Promise<ManagedTestIdentity | null> {
  const { data, error } = await createServerDb()
    .from('tests')
    .select('id, nickname, share_code')
    .eq('manage_token_hash', hash)
    .maybeSingle()

  if (error) throw new RepositoryError('find managed test')
  if (!data) return null
  const row = data as unknown as { id: string; nickname: string; share_code: string }
  return { testId: row.id, creatorNickname: row.nickname, shareCode: row.share_code }
}
