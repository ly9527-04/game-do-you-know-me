import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ResultScore } from '@/components/results/ResultScore'

describe('ResultScore', () => {
  it('shows the score and verdict for a regular result', () => {
    render(<ResultScore score={76} verdict="很熟，但还是藏了一些你不知道的东西。" />)
    expect(screen.getByRole('heading', { name: '76 分' })).toBeInTheDocument()
    expect(screen.getByText('答对 19 / 25 题 · 默契得分 76 分')).toBeInTheDocument()
    expect(screen.getByText('很熟，但还是藏了一些你不知道的东西。')).toBeInTheDocument()
  })

  it('shows the perfect-score easter egg', () => {
    render(<ResultScore score={100} verdict="离谱，你是真的懂 TA。" />)
    expect(screen.getByText(/满分彩蛋/)).toBeInTheDocument()
  })
})
