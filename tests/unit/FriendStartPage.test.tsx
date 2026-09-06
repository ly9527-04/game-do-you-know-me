import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { getDraftKey, saveDraft } from '@/lib/drafts'
import { FriendStartPage } from '@/components/friend/FriendStartPage'

const push = vi.fn()
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }))

afterEach(() => {
  localStorage.clear()
  push.mockClear()
})

describe('FriendStartPage', () => {
  it('offers to continue the draft for this test without mixing another test draft', async () => {
    saveDraft(getDraftKey('friend', 'other'), { version: 1, nickname: '别人', answers: { q01: 'A' }, currentIndex: 1, updatedAt: '2026-09-06T09:00:00.000Z' })
    saveDraft(getDraftKey('friend', 'current'), { version: 1, nickname: '小明', answers: { q01: 'A', q02: 'B' }, currentIndex: 2, updatedAt: '2026-09-06T08:00:00.000Z' })

    render(<FriendStartPage shareCode="current" creatorNickname="阿钙" />)

    await waitFor(() => expect(screen.getByText('要继续回答 小明 的测试吗？')).toBeInTheDocument())
    fireEvent.click(screen.getByRole('button', { name: '继续上次进度' }))
    expect(push).toHaveBeenCalledWith('/t/current/quiz?nickname=%E5%B0%8F%E6%98%8E')
  })
})
