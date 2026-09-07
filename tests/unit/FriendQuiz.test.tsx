import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { useId } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { QUESTIONS } from '@/lib/questions'

const selectedQuestions = [...QUESTIONS].reverse().map((question, index) => ({ ...question, order: index + 1 }))

const fetchMock = vi.fn()
vi.stubGlobal('fetch', fetchMock)
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }))
vi.mock('@/components/analytics/EventBeacon', () => ({ EventBeacon: () => null }))
vi.mock('@/components/quiz/QuizSession', () => ({
  QuizSession: ({ questions, questionSetVersion, onComplete }: { questions?: typeof selectedQuestions; questionSetVersion?: number; onComplete: (answers: Record<string, 'A'>) => void }) => {
    const id = useId()
    return <button data-session-id={id} data-question-ids={questions?.map((question) => question.id).join(',') ?? ''} data-question-version={questionSetVersion} type="button" onClick={() => onComplete({ q01: 'A' })}>模拟完成</button>
  },
}))
vi.mock('@/lib/drafts', () => ({ clearDraft: vi.fn(), getDraftKey: vi.fn(() => 'friend-draft') }))
vi.mock('@/lib/anonymous-session', () => ({ getAnonymousSessionId: () => '40000000-0000-4000-8000-000000000001' }))

import { FriendQuiz } from '@/components/friend/FriendQuiz'

afterEach(() => fetchMock.mockReset())

describe('FriendQuiz', () => {
  it('reuses one idempotency key after a failed network response', async () => {
    fetchMock
      .mockRejectedValueOnce(new Error('network down'))
      .mockResolvedValueOnce({ ok: true, json: async () => ({ resultUrl: 'https://me.ly0688.online/r/attempt' }) })
    render(<FriendQuiz shareCode="share" creatorNickname="阿钙" friendNickname="小明" questionSetVersion={2} questions={selectedQuestions} />)

    expect(screen.getByRole('button', { name: '模拟完成' })).toHaveAttribute('data-question-ids', selectedQuestions.map((question) => question.id).join(','))
    expect(screen.getByRole('button', { name: '模拟完成' })).toHaveAttribute('data-question-version', '2')

    fireEvent.click(screen.getByRole('button', { name: '模拟完成' }))
    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument())
    fireEvent.click(screen.getByRole('button', { name: '重新提交' }))
    fireEvent.click(screen.getByRole('button', { name: '模拟完成' }))

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2))
    const first = JSON.parse(fetchMock.mock.calls[0][1].body as string)
    const second = JSON.parse(fetchMock.mock.calls[1][1].body as string)
    expect(second.idempotencyKey).toBe(first.idempotencyKey)
    expect(second.anonymousSessionId).toBe('40000000-0000-4000-8000-000000000001')
  })
})
