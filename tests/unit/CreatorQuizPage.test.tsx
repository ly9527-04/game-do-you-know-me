import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { QUESTION_POOL } from '@/lib/questions'

const { getActiveQuestionSet } = vi.hoisted(() => ({ getActiveQuestionSet: vi.fn() }))

vi.mock('@/lib/repositories/tests', () => ({ getActiveQuestionSet }))
vi.mock('@/components/create/CreatorQuiz', () => ({
  CreatorQuiz: ({ nickname, questionSetVersion, questions }: { nickname: string; questionSetVersion: number; questions: unknown[] }) => (
    <div>{nickname} · v{questionSetVersion} · {questions.length}题</div>
  ),
}))
vi.mock('server-only', () => ({}))

import CreatorQuizPage from '@/app/create/quiz/page'

beforeEach(() => {
  getActiveQuestionSet.mockResolvedValue({ id: 'set-v2', version: 2, questions: QUESTION_POOL })
})

describe('CreatorQuizPage', () => {
  it('loads and passes the active complete question pool to the creator quiz', async () => {
    render(await CreatorQuizPage({ searchParams: Promise.resolve({ nickname: '阿钙' }) }))

    expect(screen.getByText('阿钙 · v2 · 75题')).toBeInTheDocument()
  })

  it('shows a friendly state when the active question pool is unavailable', async () => {
    getActiveQuestionSet.mockResolvedValueOnce(null)
    render(await CreatorQuizPage({ searchParams: Promise.resolve({ nickname: '阿钙' }) }))

    expect(screen.getByRole('heading', { name: '题目还没准备好' })).toBeInTheDocument()
  })
})
