import { render, screen, within } from '@testing-library/react'
import HomePage from '@/app/page'

it('shows the product promise and primary action', () => {
  render(<HomePage />)
  expect(screen.getByRole('heading', { name: '你朋友真的懂你吗？' })).toBeInTheDocument()
  expect(screen.getByRole('link', { name: '创建我的测试' })).toHaveAttribute('href', '/create')
})

it('explains the effort before the primary action', () => {
  render(<HomePage />)
  const facts = screen.getByRole('list', { name: '测试说明' })
  expect(within(facts).getByText('无需注册')).toBeInTheDocument()
  expect(within(facts).getByText('25 道题')).toBeInTheDocument()
  expect(within(facts).getByText('约 3 分钟')).toBeInTheDocument()
})
