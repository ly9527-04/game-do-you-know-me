import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { useId } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

const fetchMock = vi.fn()
vi.stubGlobal('fetch', fetchMock)

vi.mock('@/components/quiz/QuizSession', () => ({
  QuizSession: ({ onComplete }: { onComplete: (answers: Record<string, 'A'>) => void }) => {
    const sessionId = useId()
    return <button data-session-id={sessionId} type="button" onClick={() => onComplete({ q01: 'A' })}>模拟完成</button>
  },
}))
vi.mock('@/lib/drafts', () => ({
  clearDraft: vi.fn(),
  getDraftKey: vi.fn(() => 'draft-key'),
}))
vi.mock('@/lib/anonymous-session', () => ({ getAnonymousSessionId: () => '40000000-0000-4000-8000-000000000001' }))

import { CreatorQuiz } from '@/components/create/CreatorQuiz'

afterEach(() => {
  fetchMock.mockReset()
})

describe('CreatorQuiz', () => {
  it('remounts the quiz session so a failed archive can be retried', async () => {
    fetchMock.mockRejectedValueOnce(new Error('network down')).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ shareUrl: 'https://me.ly0688.online/t/share', manageUrl: 'https://me.ly0688.online/m/manage' }),
    })
    render(<CreatorQuiz nickname="阿钙" />)

    const firstSessionId = screen.getByRole('button', { name: '模拟完成' }).getAttribute('data-session-id')
    fireEvent.click(screen.getByRole('button', { name: '模拟完成' }))
    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument())

    fireEvent.click(screen.getByRole('button', { name: '重新提交' }))
    const secondSessionId = screen.getByRole('button', { name: '模拟完成' }).getAttribute('data-session-id')
    expect(secondSessionId).not.toBe(firstSessionId)
    expect(JSON.parse(fetchMock.mock.calls[0][1].body as string)).toMatchObject({
      anonymousSessionId: '40000000-0000-4000-8000-000000000001',
    })
  })
})
