import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { QUESTIONS } from '@/lib/questions'
import { QuestionCard } from '@/components/quiz/QuestionCard'
import { QuizProgress } from '@/components/quiz/QuizProgress'

describe('QuestionCard', () => {
  it('exposes each option as a button and sends only its choice value', async () => {
    const onSelect = vi.fn()
    const user = userEvent.setup()

    render(<QuestionCard question={QUESTIONS[7]} value={undefined} onSelect={onSelect} disabled={false} />)

    const options = screen.getAllByRole('button')
    expect(options).toHaveLength(4)
    expect(options.map((option) => option.getAttribute('aria-pressed'))).toEqual(['false', 'false', 'false', 'false'])

    await user.click(screen.getByRole('button', { name: /C.*很贵/ }))
    expect(onSelect).toHaveBeenCalledWith('C')
  })

  it('labels the question group, announces selection without color alone, and keeps internal category private', () => {
    render(<QuestionCard question={QUESTIONS[7]} value="B" onSelect={vi.fn()} disabled={false} />)

    expect(screen.getByRole('group', { name: QUESTIONS[7].prompt })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /B.*正常票价.*已选/ })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.queryByText('abstract')).not.toBeInTheDocument()
  })
})

describe('QuizProgress', () => {
  it('shows a zero-padded current position out of all 25 questions', () => {
    render(<QuizProgress current={8} total={25} />)

    expect(screen.getByText('08 / 25')).toBeInTheDocument()
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '8')
  })
})
