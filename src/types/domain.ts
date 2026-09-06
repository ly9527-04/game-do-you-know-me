export type AnswerChoice = 'A' | 'B' | 'C' | 'D'

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
