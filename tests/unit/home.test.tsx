import { render, screen } from '@testing-library/react'
import HomePage from '@/app/page'

it('shows the product promise and primary action', () => {
  render(<HomePage />)
  expect(screen.getByRole('heading', { name: '你朋友真的懂你吗？' })).toBeInTheDocument()
  expect(screen.getByRole('link', { name: '创建我的测试' })).toHaveAttribute('href', '/create')
})
