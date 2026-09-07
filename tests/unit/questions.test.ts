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

it('contains all 75 questions with stable ids and complete choices', () => {
  expect(QUESTION_POOL).toHaveLength(75)
  expect(QUESTION_POOL.map((item) => item.id)).toEqual(
    Array.from({ length: 75 }, (_, index) => `q${String(index + 1).padStart(2, '0')}`),
  )
  expect(QUESTION_POOL.every((item) => item.options.map((option) => option.value).join('') === 'ABCD')).toBe(true)
})

it('assigns the required number of questions to each pool group', () => {
  const groupCounts = Object.fromEntries(
    ['classic', 'daily', 'personality', 'scenario', 'relationship', 'roast'].map((group) => [
      group,
      QUESTION_POOL.filter((question) => question.poolGroup === group).length,
    ]),
  )

  expect(groupCounts).toEqual({
    classic: 25,
    daily: 10,
    personality: 10,
    scenario: 10,
    relationship: 10,
    roast: 10,
  })
})
