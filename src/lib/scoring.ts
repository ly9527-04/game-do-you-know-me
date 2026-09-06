import { QUESTIONS } from '@/lib/questions'
import type { Mismatch, QuizAnswers, ScoreResult } from '@/types/domain'

const verdicts = [
  [90, '离谱，你是真的懂 TA。'],
  [80, '基本属于 TA 一个眼神你就知道什么意思。'],
  [70, '很熟，但还是藏了一些你不知道的东西。'],
  [60, '认识不少，但你对 TA 的理解有点停留在表面。'],
  [40, '你认识的是 TA，还是你想象中的 TA？'],
  [0, '建议重新认识一下。'],
] as const

export function scoreAnswers(creator: QuizAnswers, friend: QuizAnswers): ScoreResult {
  if (Object.keys(creator).length !== 25 || Object.keys(friend).length !== 25) {
    throw new Error('A complete 25-answer set is required')
  }

  const comparisons = QUESTIONS.map((question) => ({
    questionId: question.id,
    friendAnswer: friend[question.id],
    creatorAnswer: creator[question.id],
    isCorrect: friend[question.id] === creator[question.id],
  }))

  return {
    score: comparisons.filter((item) => item.isCorrect).length * 4,
    comparisons,
  }
}

export function getVerdict(score: number): string {
  return verdicts.find(([minimum]) => score >= minimum)?.[1] ?? verdicts.at(-1)![1]
}

function stableHash(value: string): number {
  let hash = 2166136261
  for (const character of value) {
    hash ^= character.charCodeAt(0)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

export function selectMismatches(result: ScoreResult, attemptId: string): Mismatch[] {
  return result.comparisons
    .filter((comparison) => !comparison.isCorrect)
    .map((comparison) => {
      const question = QUESTIONS.find((item) => item.id === comparison.questionId)
      if (!question) {
        throw new Error(`Unknown question: ${comparison.questionId}`)
      }

      return { comparison, question, tieBreaker: stableHash(`${attemptId}:${question.id}`) }
    })
    .sort((left, right) =>
      right.question.mismatchPriority - left.question.mismatchPriority || left.tieBreaker - right.tieBreaker,
    )
    .slice(0, 3)
    .map(({ comparison, question }) => ({
      questionId: question.id,
      prompt: question.prompt,
      creatorAnswer: comparison.creatorAnswer,
      creatorAnswerText: question.options.find((option) => option.value === comparison.creatorAnswer)!.text,
      friendAnswer: comparison.friendAnswer,
      friendAnswerText: question.options.find((option) => option.value === comparison.friendAnswer)!.text,
    }))
}
