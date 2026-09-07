import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { useId } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { QUESTION_POOL, QUESTIONS } from '@/lib/questions'

const { fetchMock, loadDraftMock, saveDraftMock, clearDraftMock, drawBalancedQuestionsMock } = vi.hoisted(() => ({
  fetchMock: vi.fn(),
  loadDraftMock: vi.fn(),
  saveDraftMock: vi.fn(),
  clearDraftMock: vi.fn(),
  drawBalancedQuestionsMock: vi.fn(),
}))
vi.stubGlobal('fetch', fetchMock)

vi.mock('@/components/quiz/QuizSession', () => ({
  QuizSession: ({ questions, onComplete }: { questions?: typeof QUESTIONS; onComplete: (answers: Record<string, 'A'>) => void }) => {
    const sessionId = useId()
    return (
      <button
        data-session-id={sessionId}
        data-question-ids={questions?.map((question) => question.id).join(',') ?? ''}
        type="button"
        onClick={() => onComplete(Object.fromEntries((questions ?? []).map((question) => [question.id, 'A'])))}
      >
        模拟完成
      </button>
    )
  },
}))
vi.mock('@/lib/drafts', () => ({
  clearDraft: clearDraftMock,
  getDraftKey: vi.fn(() => 'draft-key'),
  loadDraft: loadDraftMock,
  saveDraft: saveDraftMock,
}))
vi.mock('@/lib/question-selection', () => ({ drawBalancedQuestions: drawBalancedQuestionsMock }))
vi.mock('@/lib/anonymous-session', () => ({ getAnonymousSessionId: () => '40000000-0000-4000-8000-000000000001' }))

import { CreatorQuiz } from '@/components/create/CreatorQuiz'

beforeEach(() => {
  drawBalancedQuestionsMock.mockImplementation(() => [...QUESTIONS])
})

afterEach(() => {
  fetchMock.mockReset()
  loadDraftMock.mockReset()
  saveDraftMock.mockReset()
  clearDraftMock.mockReset()
  drawBalancedQuestionsMock.mockClear()
})

describe('CreatorQuiz', () => {
  it('draws once without a draft and submits the fixed selected question ids', async () => {
    loadDraftMock.mockReturnValue(null)
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ shareUrl: 'https://me.ly0688.online/t/share', manageUrl: 'https://me.ly0688.online/m/manage' }),
    })

    render(<CreatorQuiz nickname="阿钙" questionSetVersion={2} questions={QUESTION_POOL} />)
    const completeButton = await screen.findByRole('button', { name: '模拟完成' })
    expect(drawBalancedQuestionsMock).toHaveBeenCalledTimes(1)
    expect(saveDraftMock).toHaveBeenCalledWith('draft-key', expect.objectContaining({
      version: 2,
      questionSetVersion: 2,
      questionIds: QUESTIONS.map((question) => question.id),
    }))

    fireEvent.click(completeButton)
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1))
    expect(JSON.parse(fetchMock.mock.calls[0][1].body as string)).toMatchObject({
      questionIds: QUESTIONS.map((question) => question.id),
      anonymousSessionId: '40000000-0000-4000-8000-000000000001',
    })
  })

  it('restores the same question order instead of drawing again', async () => {
    const restored = [...QUESTIONS].reverse()
    loadDraftMock.mockReturnValue({
      version: 2,
      questionSetVersion: 2,
      questionIds: restored.map((question) => question.id),
      nickname: '阿钙',
      answers: {},
      currentIndex: 0,
      updatedAt: new Date().toISOString(),
    })

    render(<CreatorQuiz nickname="阿钙" questionSetVersion={2} questions={QUESTION_POOL} />)

    expect(await screen.findByRole('button', { name: '模拟完成' })).toHaveAttribute(
      'data-question-ids',
      restored.map((question) => question.id).join(','),
    )
    expect(drawBalancedQuestionsMock).not.toHaveBeenCalled()
  })

  it('remounts the same quiz selection so a failed archive can be retried', async () => {
    loadDraftMock.mockReturnValue(null)
    fetchMock.mockRejectedValueOnce(new Error('network down')).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ shareUrl: 'https://me.ly0688.online/t/share', manageUrl: 'https://me.ly0688.online/m/manage' }),
    })
    render(<CreatorQuiz nickname="阿钙" questionSetVersion={2} questions={QUESTION_POOL} />)

    const firstButton = await screen.findByRole('button', { name: '模拟完成' })
    const firstSessionId = firstButton.getAttribute('data-session-id')
    const firstQuestionIds = firstButton.getAttribute('data-question-ids')
    fireEvent.click(firstButton)
    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument())

    fireEvent.click(screen.getByRole('button', { name: '重新提交' }))
    const secondButton = screen.getByRole('button', { name: '模拟完成' })
    expect(secondButton.getAttribute('data-session-id')).not.toBe(firstSessionId)
    expect(secondButton.getAttribute('data-question-ids')).toBe(firstQuestionIds)
    expect(drawBalancedQuestionsMock).toHaveBeenCalledTimes(1)
  })
})
