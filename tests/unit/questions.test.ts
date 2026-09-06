import { QUESTIONS } from '@/lib/questions'

it('contains the exact fixed 25-question set', () => {
  expect(QUESTIONS).toHaveLength(25)
  expect(QUESTIONS.map((item) => item.order)).toEqual(
    Array.from({ length: 25 }, (_, index) => index + 1),
  )
  expect(QUESTIONS.every((item) => item.options.length === 4)).toBe(true)
  expect(QUESTIONS[0].prompt).toBe('如果你是一间房，里面最可能有什么？')
  expect(QUESTIONS[24].options[3].text).toBe('做一直拖着没做的事')
})
