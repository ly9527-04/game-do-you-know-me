import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { FriendStart } from '@/components/friend/FriendStart'

describe('FriendStart', () => {
  it('requires a nickname before starting', () => {
    const onContinue = vi.fn()
    render(<FriendStart creatorNickname="阿钙" onContinue={onContinue} />)

    fireEvent.click(screen.getByRole('button', { name: '开始猜' }))

    expect(onContinue).not.toHaveBeenCalled()
    expect(screen.getByText('留个昵称，让 TA 知道是谁猜的。')).toBeInTheDocument()
  })

  it('passes a trimmed nickname to the challenge', () => {
    const onContinue = vi.fn()
    render(<FriendStart creatorNickname="阿钙" onContinue={onContinue} />)

    fireEvent.change(screen.getByRole('textbox', { name: '你的昵称' }), { target: { value: ' 小明 ' } })
    fireEvent.click(screen.getByRole('button', { name: '开始猜' }))

    expect(onContinue).toHaveBeenCalledWith('小明')
  })
})
