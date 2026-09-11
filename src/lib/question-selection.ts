import type { Question, QuestionPoolGroup } from '@/types/domain'

export type RandomSource = () => number

const QUOTAS = {
  classic: 5,
  daily: 4,
  personality: 4,
  scenario: 4,
  relationship: 4,
  roast: 4,
} as const satisfies Readonly<Partial<Record<QuestionPoolGroup, number>>>

const cryptoRandom: RandomSource = () => {
  const value = new Uint32Array(1)
  globalThis.crypto.getRandomValues(value)
  return value[0] / 0x1_0000_0000
}

const shuffle = <T>(items: readonly T[], random: RandomSource): T[] => {
  const shuffled = [...items]
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const target = Math.floor(random() * (index + 1))
    ;[shuffled[index], shuffled[target]] = [shuffled[target], shuffled[index]]
  }
  return shuffled
}

export function drawBalancedQuestions(
  questions: readonly Question[],
  random: RandomSource = cryptoRandom,
): Question[] {
  const selected = (Object.entries(QUOTAS) as [QuestionPoolGroup, number][]).flatMap(([group, count]) => {
    const candidates = questions.filter((question) => question.poolGroup === group)
    if (candidates.length < count) {
      throw new Error(`题库分组 ${group} 数量不足`)
    }
    return shuffle(candidates, random).slice(0, count)
  })

  return shuffle(selected, random).map((question, index) => ({
    ...question,
    order: index + 1,
  }))
}

export function isBalancedQuestionSelection(
  questionIds: readonly string[],
  questions: readonly Question[],
): boolean {
  if (questionIds.length !== 25 || new Set(questionIds).size !== 25) return false
  const questionById = new Map(questions.map((question) => [question.id, question]))
  const counts = Object.fromEntries(Object.keys(QUOTAS).map((group) => [group, 0])) as Record<QuestionPoolGroup, number>

  for (const id of questionIds) {
    const question = questionById.get(id)
    if (!question) return false
    counts[question.poolGroup] += 1
  }

  return (Object.entries(QUOTAS) as [QuestionPoolGroup, number][]).every(([group, quota]) => counts[group] === quota)
}
