import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { getDraftKey, saveDraft, type QuizDraft } from '@/lib/drafts'
import { ResumeDraft } from '@/components/system/ResumeDraft'

const draft: QuizDraft = {
  version: 1,
  nickname: '阿钙',
  answers: { q01: 'A', q02: 'B' },
  currentIndex: 2,
  updatedAt: '2026-09-06T08:00:00.000Z',
}

afterEach(() => localStorage.clear())

describe('ResumeDraft', () => {
  it('shows continue and restart actions for the latest valid creator draft', async () => {
    const key = getDraftKey('creator', draft.nickname)
    saveDraft(key, draft)
    const onContinue = vi.fn()
    const onRestart = vi.fn()

    render(<ResumeDraft onContinue={onContinue} onRestart={onRestart} />)

    await waitFor(() => expect(screen.getByText('继续上次进度')).toBeInTheDocument())
    expect(screen.getByText('重新开始')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '继续上次进度' }))
    expect(onContinue).toHaveBeenCalledWith(draft)
    fireEvent.click(screen.getByRole('button', { name: '重新开始' }))
    expect(onRestart).toHaveBeenCalledWith(draft)
    expect(localStorage.getItem(key)).toBeNull()
  })

  it('renders nothing when no valid draft is available', async () => {
    const { container } = render(<ResumeDraft onContinue={vi.fn()} onRestart={vi.fn()} />)

    await waitFor(() => expect(container).toBeEmptyDOMElement())
  })

  it('only offers the friend draft belonging to the current share code', async () => {
    saveDraft(getDraftKey('friend', 'other-share'), { ...draft, nickname: '别人', updatedAt: '2026-09-06T09:00:00.000Z' })
    saveDraft(getDraftKey('friend', 'current-share'), { ...draft, nickname: '小明' })

    render(<ResumeDraft mode="friend" draftIdentity="current-share" onContinue={vi.fn()} />)

    await waitFor(() => expect(screen.getByText('要继续回答 小明 的测试吗？')).toBeInTheDocument())
    expect(screen.queryByText('要继续回答 别人 的测试吗？')).not.toBeInTheDocument()
  })
})
