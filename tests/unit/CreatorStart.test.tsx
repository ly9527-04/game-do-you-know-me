import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { CreatorStart } from '@/components/create/CreatorStart'

describe('CreatorStart', () => {
  it('does not continue with a blank nickname', () => {
    const onContinue = vi.fn()
    render(<CreatorStart onContinue={onContinue} />)

    fireEvent.click(screen.getByRole('button', { name: '开始答题' }))

    expect(onContinue).not.toHaveBeenCalled()
    expect(screen.getByText('先写下一个昵称吧。')).toBeInTheDocument()
  })

  it('trims a valid nickname, saves it to the creator draft, and continues', () => {
    const onContinue = vi.fn()
    render(<CreatorStart onContinue={onContinue} />)

    fireEvent.change(screen.getByRole('textbox', { name: '你的昵称' }), { target: { value: ' 阿钙 ' } })
    fireEvent.click(screen.getByRole('button', { name: '开始答题' }))

    expect(onContinue).toHaveBeenCalledWith('阿钙')
  })
})
