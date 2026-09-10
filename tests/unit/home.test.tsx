import { render, screen } from '@testing-library/react'
import { vi, beforeEach, it, expect } from 'vitest'
const mocks = vi.hoisted(() => ({ user: vi.fn(), test: vi.fn() }))
vi.mock('@/lib/auth', () => ({ getCurrentUser: mocks.user }))
vi.mock('@/lib/repositories/accounts', () => ({ getOwnedTest: mocks.test }))
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: vi.fn() }) }))
import HomePage from '@/app/page'
beforeEach(() => { vi.clearAllMocks(); mocks.test.mockResolvedValue(null) })
it('requires login at the official entry', async () => {
  mocks.user.mockResolvedValue(null)
  render(await HomePage())
  expect(screen.getByLabelText('8位数字账号')).toBeInTheDocument()
  expect(screen.queryByRole('link', { name: '创建自己的测试' })).not.toBeInTheDocument()
})
it('shows exactly the three account lobby entries', async () => {
  mocks.user.mockResolvedValue({ id: 'u', nickname: '小明', account: '00123456' })
  render(await HomePage())
  expect(screen.getByText('00123456')).toBeInTheDocument()
  expect(screen.getByRole('link', { name: '做朋友的测试' })).toHaveAttribute('href','/friend')
  expect(screen.getByRole('link', { name: '创建自己的测试' })).toHaveAttribute('href','/create')
  expect(screen.getByRole('link', { name: '我的排行榜' })).toHaveAttribute('href','/leaderboard')
})
