import { questionGroup, QUESTION_GROUPS } from '@/lib/question-groups'
import { QUESTION_POOL, QUESTIONS } from '@/lib/questions'

it('preserves the exact classic 25-question set', () => {
  expect(QUESTIONS).toHaveLength(25)
  expect(QUESTIONS.map((item) => item.order)).toEqual(
    Array.from({ length: 25 }, (_, index) => index + 1),
  )
  expect(QUESTIONS.every((item) => item.options.length === 4)).toBe(true)
  expect(QUESTIONS[0].prompt).toBe('如果你是一间房，里面最可能有什么？')
  expect(QUESTIONS[24].options[3].text).toBe('做一直拖着没做的事')
})

it('contains all 120 questions with stable ids and complete choices', () => {
  expect(QUESTION_POOL).toHaveLength(120)
  expect(QUESTION_POOL.map((item) => item.id)).toEqual(
    Array.from({ length: 120 }, (_, index) => `q${String(index + 1).padStart(2, '0')}`),
  )
  expect(new Set(QUESTION_POOL.map((item) => item.id)).size).toBe(120)
  expect(QUESTION_POOL.every((item) => item.options.map((option) => option.value).join('') === 'ABCD')).toBe(true)
  expect(QUESTION_POOL.slice(75).every((item) => [2, 3].includes(item.mismatchPriority))).toBe(true)
})

it('assigns the required number of questions to each visible category', () => {
  const groupCounts = Object.fromEntries(
    QUESTION_GROUPS.map((group) => [
      group.id,
      QUESTION_POOL.filter((question) => questionGroup(question) === group.id).length,
    ]),
  )

  expect(groupCounts).toEqual({
    abstract: 20,
    inner: 18,
    daily: 13,
    personality: 17,
    scenario: 12,
    relationship: 17,
    roast: 15,
    values: 8,
  })
})
