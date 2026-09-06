import { QUESTIONS } from '@/lib/questions'
import { getVerdict, scoreAnswers, selectMismatches } from '@/lib/scoring'
import type { QuizAnswers } from '@/types/domain'

const allA = Object.fromEntries(QUESTIONS.map((question) => [question.id, 'A'])) as QuizAnswers
const allB = Object.fromEntries(QUESTIONS.map((question) => [question.id, 'B'])) as QuizAnswers

it('awards four points for every exact answer match', () => {
  expect(scoreAnswers(allA, allA).score).toBe(100)
  expect(scoreAnswers(allA, allB).score).toBe(0)
})

it('requires complete 25-answer sets', () => {
  expect(() => scoreAnswers({}, allA)).toThrow('A complete 25-answer set is required')
})

it('rejects 25 unrelated answer keys', () => {
  const unrelatedAnswers = Object.fromEntries(
    Array.from({ length: 25 }, (_, index) => [`other-${index}`, 'A']),
  ) as QuizAnswers

  expect(() => scoreAnswers(unrelatedAnswers, unrelatedAnswers)).toThrow(
    'A complete 25-answer set is required',
  )
})

it('rejects a missing expected key replaced with an extra key', () => {
  const { q25: _, ...answersWithoutQ25 } = allA
  const malformedAnswers = { ...answersWithoutQ25, extra: 'A' } as QuizAnswers

  expect(() => scoreAnswers(malformedAnswers, allA)).toThrow('A complete 25-answer set is required')
})

it('rejects an invalid runtime answer choice', () => {
  const malformedAnswers = { ...allA, q01: 'Z' } as unknown as QuizAnswers

  expect(() => scoreAnswers(malformedAnswers, allA)).toThrow('A complete 25-answer set is required')
})

it.each([
  [0, '建议重新认识一下。'],
  [39, '建议重新认识一下。'],
  [40, '你认识的是 TA，还是你想象中的 TA？'],
  [60, '认识不少，但你对 TA 的理解有点停留在表面。'],
  [70, '很熟，但还是藏了一些你不知道的东西。'],
  [80, '基本属于 TA 一个眼神你就知道什么意思。'],
  [88, '基本属于 TA 一个眼神你就知道什么意思。'],
  [90, '离谱，你是真的懂 TA。'],
  [100, '离谱，你是真的懂 TA。'],
])('returns the fixed verdict for %i points', (score, verdict) => {
  expect(getVerdict(score)).toBe(verdict)
})

it('selects at most three high-priority mismatches in a stable order', () => {
  const result = scoreAnswers(allA, allB)
  const mismatches = selectMismatches(result, 'attempt-1')

  expect(mismatches).toHaveLength(3)
  expect(mismatches).toEqual(selectMismatches(result, 'attempt-1'))
  expect(mismatches.every((item) => item.friendAnswer === 'B')).toBe(true)
})

it('does not select mismatches for a perfect score', () => {
  expect(selectMismatches(scoreAnswers(allA, allA), 'attempt-1')).toEqual([])
})
