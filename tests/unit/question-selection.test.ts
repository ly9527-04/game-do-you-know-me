import { describe, expect, it } from 'vitest'
import { drawBalancedQuestions } from '@/lib/question-selection'
import { QUESTION_POOL } from '@/lib/questions'

const sequenceRandom = (values: readonly number[]) => {
  let index = 0
  return () => values[index++ % values.length]
}

describe('drawBalancedQuestions', () => {
  it('draws 25 unique questions using the required group quotas', () => {
    const selected = drawBalancedQuestions(QUESTION_POOL, sequenceRandom([0.13, 0.79, 0.42, 0.91]))

    expect(selected).toHaveLength(25)
    expect(new Set(selected.map((question) => question.id))).toHaveLength(25)
    expect(selected.map((question) => question.order)).toEqual(Array.from({ length: 25 }, (_, index) => index + 1))
    expect(Object.fromEntries(
      ['classic', 'daily', 'personality', 'scenario', 'relationship', 'roast'].map((group) => [
        group,
        selected.filter((question) => question.poolGroup === group).length,
      ]),
    )).toEqual({ classic: 5, daily: 4, personality: 4, scenario: 4, relationship: 4, roast: 4 })
  })

  it('can produce a different selection from a different random source', () => {
    const first = drawBalancedQuestions(QUESTION_POOL, () => 0)
    const second = drawBalancedQuestions(QUESTION_POOL, () => 0.999999)

    expect(first.map((question) => question.id)).not.toEqual(second.map((question) => question.id))
  })

  it('throws instead of returning an incomplete selection when a group is undersized', () => {
    const incompletePool = QUESTION_POOL.filter((question) => question.poolGroup !== 'roast')

    expect(() => drawBalancedQuestions(incompletePool, () => 0.5)).toThrow('roast')
  })
})
