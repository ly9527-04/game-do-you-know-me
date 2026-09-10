import { render, screen, fireEvent } from '@testing-library/react'
import { MismatchList } from '@/components/results/MismatchList'
import { QUESTION_POOL } from '@/lib/questions'
import { scoreAnswers, selectMismatches } from '@/lib/scoring'
it('expands every difference without changing the initial three', () => {
  const questions = QUESTION_POOL.slice(0,25)
  const own = Object.fromEntries(questions.map(q => [q.id, 'A' as const]))
  const friend = Object.fromEntries(questions.map(q => [q.id, 'B' as const]))
  const result = scoreAnswers(own, friend, questions)
  const all = selectMismatches(result, 'attempt', questions, Infinity)
  expect(all).toHaveLength(25)
  expect(all.slice(0,3)).toEqual(selectMismatches(result, 'attempt', questions))
  render(<MismatchList mismatches={all} />)
  expect(screen.getAllByRole('article')).toHaveLength(3)
  fireEvent.click(screen.getByRole('button', { name: /查看更多/ }))
  expect(screen.getAllByRole('article')).toHaveLength(25)
  fireEvent.click(screen.getByRole('button', { name: '收起' }))
  expect(screen.getAllByRole('article')).toHaveLength(3)
})
it('does not show expansion for a perfect score', () => {
  render(<MismatchList mismatches={[]} />)
  expect(screen.getByText(/25 道题全部猜中/)).toBeInTheDocument()
  expect(screen.queryByRole('button')).not.toBeInTheDocument()
})
