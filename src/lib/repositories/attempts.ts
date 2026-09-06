import 'server-only'

import { RepositoryError } from '@/lib/repositories/tests'
import { createServerDb } from '@/lib/supabase/server'
import type { AnswerChoice, AnswerComparison, QuizAnswers, ScoreResult } from '@/types/domain'

export interface CreateAttemptRecordInput {
  attemptId: string
  testId: string
  nickname: string
  idempotencyKey: string
  answers: QuizAnswers
  scoreResult: ScoreResult
}

export interface ResultSource {
  attemptId: string
  creatorNickname: string
  friendNickname: string
  score: number
  comparisons: AnswerComparison[]
}

export async function createAttemptRecord(input: CreateAttemptRecordInput): Promise<string> {
  const comparisons = new Map(input.scoreResult.comparisons.map((item) => [item.questionId, item]))
  const persistedAnswers = Object.fromEntries(Object.entries(input.answers).map(([questionId, answer]) => [
    questionId,
    { answer, isCorrect: comparisons.get(questionId)?.isCorrect ?? false },
  ]))
  const { data, error } = await createServerDb().rpc('create_attempt', {
    p_attempt_id: input.attemptId,
    p_test_id: input.testId,
    p_nickname: input.nickname,
    p_score: input.scoreResult.score,
    p_idempotency_key: input.idempotencyKey,
    p_answers: persistedAnswers,
  })
  if (error || typeof data !== 'string') throw new RepositoryError('create attempt')
  return data
}

export async function getResultSource(attemptId: string): Promise<ResultSource | null> {
  const { data, error } = await createServerDb()
    .from('attempts')
    .select('id, nickname, score, attempt_answers(question_id, answer, is_correct), tests(nickname, creator_answers(question_id, answer))')
    .eq('id', attemptId)
    .order('question_id', { referencedTable: 'attempt_answers' })
    .maybeSingle()

  if (error) throw new RepositoryError('get result source')
  if (!data) return null
  const row = data as unknown as {
    id: string
    nickname: string
    score: number
    attempt_answers: { question_id: string; answer: AnswerChoice; is_correct: boolean }[]
    tests: { nickname: string; creator_answers: { question_id: string; answer: AnswerChoice }[] }
  }
  const creatorAnswers = new Map(row.tests.creator_answers.map((answer) => [answer.question_id, answer.answer]))
  return {
    attemptId: row.id,
    creatorNickname: row.tests.nickname,
    friendNickname: row.nickname,
    score: row.score,
    comparisons: row.attempt_answers.map((answer) => ({
      questionId: answer.question_id,
      creatorAnswer: creatorAnswers.get(answer.question_id)!,
      friendAnswer: answer.answer,
      isCorrect: answer.is_correct,
    })),
  }
}
