export type AnswerChoice = 'A' | 'B' | 'C' | 'D'

// This is the immutable v1 request contract, independent from question-bank loading.
export const FIXED_QUESTION_IDS = [
  'q01', 'q02', 'q03', 'q04', 'q05',
  'q06', 'q07', 'q08', 'q09', 'q10',
  'q11', 'q12', 'q13', 'q14', 'q15',
  'q16', 'q17', 'q18', 'q19', 'q20',
  'q21', 'q22', 'q23', 'q24', 'q25',
] as const

export type FixedQuestionId = typeof FIXED_QUESTION_IDS[number]

export type QuestionCategory = 'abstract' | 'semi_abstract' | 'real_anchor'

export interface QuestionOption {
  readonly value: AnswerChoice
  readonly text: string
}

export interface Question {
  readonly id: string
  readonly order: number
  readonly prompt: string
  readonly options: readonly QuestionOption[]
  readonly category: QuestionCategory
  readonly mismatchPriority: number
}

export type QuizAnswers = Record<string, AnswerChoice>

export interface AnswerComparison {
  readonly questionId: string
  readonly creatorAnswer: AnswerChoice
  readonly friendAnswer: AnswerChoice
  readonly isCorrect: boolean
}

export interface ScoreResult {
  readonly score: number
  readonly comparisons: readonly AnswerComparison[]
}

export interface Mismatch {
  readonly questionId: string
  readonly prompt: string
  readonly creatorAnswer: AnswerChoice
  readonly creatorAnswerText: string
  readonly friendAnswer: AnswerChoice
  readonly friendAnswerText: string
}
