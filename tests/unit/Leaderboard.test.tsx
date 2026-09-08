import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Leaderboard } from '@/components/manage/Leaderboard'

describe('Leaderboard', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('announces copy success', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { clipboard: { writeText } })
    render(<Leaderboard creatorNickname="阿钙" challengeCount={0} averageScore={0} entries={[]} shareUrl="https://example.invalid/t/share" />)
    fireEvent.click(screen.getByRole('button', { name: '复制朋友链接' }))
    expect(await screen.findByRole('status')).toHaveTextContent('已复制朋友链接')
    expect(writeText).toHaveBeenCalledWith('https://example.invalid/t/share')
  })

  it('shows only the public share link when clipboard access fails', async () => {
    vi.stubGlobal('navigator', { clipboard: { writeText: vi.fn().mockRejectedValue(new Error('denied')) } })
    render(<Leaderboard creatorNickname="阿钙" challengeCount={0} averageScore={0} entries={[]} shareUrl="https://example.invalid/t/share" />)
    fireEvent.click(screen.getByRole('button', { name: '复制朋友链接' }))
    expect(await screen.findByRole('status')).toHaveTextContent('复制失败')
    expect(screen.getByText('https://example.invalid/t/share')).toBeInTheDocument()
  })

  it('shows ranking, score and empty-state copy', () => {
    render(<Leaderboard creatorNickname="阿钙" challengeCount={0} averageScore={0} entries={[]} shareUrl="https://me.ly0688.online/t/share" />)
    expect(screen.getByRole('heading', { name: '阿钙的排行榜' })).toBeInTheDocument()
    expect(screen.getByText('还没有朋友来挑战，分享链接试试看。')).toBeInTheDocument()
  })

  it('shows entries in the supplied score order', () => {
    render(<Leaderboard creatorNickname="阿钙" challengeCount={2} averageScore={76} entries={[{ attemptId: 'a', nickname: '小明', score: 100, createdAt: '2026-09-06T08:00:00Z' }, { attemptId: 'b', nickname: '小红', score: 76, createdAt: '2026-09-06T09:00:00Z' }]} shareUrl="https://me.ly0688.online/t/share" />)
    expect(screen.getByText('昵称：小明')).toBeInTheDocument()
    expect(screen.getByText('100 分')).toBeInTheDocument()
    expect(screen.getByText('答对 25 / 25 题')).toBeInTheDocument()
    expect(screen.getByText('答对 19 / 25 题')).toBeInTheDocument()
    expect(screen.getByText('第 1 名')).toBeInTheDocument()
    expect(screen.getByText('平均 76 分')).toBeInTheDocument()
  })
})
