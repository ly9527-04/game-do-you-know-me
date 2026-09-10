import { render, screen } from '@testing-library/react'
import { vi, beforeEach, it, expect } from 'vitest'
import { QUESTION_POOL } from '@/lib/questions'
const mocks = vi.hoisted(() => ({ user: vi.fn(), active: vi.fn(), owned: vi.fn(), redirect: vi.fn() }))
vi.mock('@/lib/auth', () => ({ requireUser: mocks.user }))
vi.mock('@/lib/repositories/tests', () => ({ getActiveQuestionSet: mocks.active }))
vi.mock('@/lib/repositories/accounts', () => ({ getOwnedTest: mocks.owned }))
vi.mock('next/navigation', () => ({ redirect: mocks.redirect }))
vi.mock('@/components/account/TestBuilder', () => ({ TestBuilder: ({ nickname, questions }: { nickname: string; questions: unknown[] }) => <div>{nickname} · {questions.length}题</div> }))
import CreatePage from '@/app/create/page'
import CreatorQuizPage from '@/app/create/quiz/page'
beforeEach(() => {
  mocks.user.mockResolvedValue({ id: 'u', nickname: '小明', account: '00123456' })
  mocks.active.mockResolvedValue({ id: 's', version: 2, questions: QUESTION_POOL })
  mocks.owned.mockResolvedValue(null)
})
it('uses signed-in identity and offers the entire pool', async () => {
  render(await CreatePage())
  expect(screen.getByText('小明 · 75题')).toBeInTheDocument()
})
it('redirects old quiz entry to the selection flow', () => {
  CreatorQuizPage()
  expect(mocks.redirect).toHaveBeenCalledWith('/create')
})
