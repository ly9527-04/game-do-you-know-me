import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { FIXED_QUESTION_IDS, type QuizAnswers } from '@/types/domain'
import { getDraftKey, loadDraft, saveDraft } from '@/lib/drafts'
import { QuizSession } from '@/components/quiz/QuizSession'

const subjectNickname = '阿钙'

afterEach(() => {
  localStorage.clear()
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

function answersThrough(questionCount: number): QuizAnswers {
  return Object.fromEntries(FIXED_QUESTION_IDS.slice(0, questionCount).map((id) => [id, 'A']))
}

describe('QuizSession', () => {
  it('saves immediately and advances exactly after 200ms', () => {
    vi.useFakeTimers()
    render(<QuizSession mode="creator" subjectNickname={subjectNickname} initialAnswers={{}} onComplete={vi.fn()} />)

    fireEvent.click(screen.getByRole('button', { name: /A.*一张很大的床/ }))
    const saved = loadDraft(getDraftKey('creator', subjectNickname))
    expect(saved?.answers).toMatchObject({ q01: 'A' })
    expect(screen.getByText('01 / 25')).toBeInTheDocument()

    act(() => vi.advanceTimersByTime(199))
    expect(screen.getByText('01 / 25')).toBeInTheDocument()
    act(() => vi.advanceTimersByTime(1))
    expect(screen.getByText('02 / 25')).toBeInTheDocument()
    expect(loadDraft(getDraftKey('creator', subjectNickname))?.currentIndex).toBe(1)
  })

  it('advances immediately when reduced motion is requested', () => {
    vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: true }))
    render(<QuizSession mode="creator" subjectNickname={subjectNickname} initialAnswers={{}} onComplete={vi.fn()} />)

    fireEvent.click(screen.getByRole('button', { name: /A.*一张很大的床/ }))
    expect(screen.getByText('02 / 25')).toBeInTheDocument()
  })

  it('allows going back but does not allow skipping an unanswered question', () => {
    render(<QuizSession mode="creator" subjectNickname={subjectNickname} initialAnswers={{}} onComplete={vi.fn()} />)
    expect(screen.getByRole('button', { name: '下一题' })).toBeDisabled()

    fireEvent.click(screen.getByRole('button', { name: /A.*一张很大的床/ }))
    fireEvent.click(screen.getByRole('button', { name: '上一题' }))
    expect(screen.getByText('01 / 25')).toBeInTheDocument()
  })

  it('clamps a recovered current index and completes only once after the final complete answer', () => {
    vi.useFakeTimers()
    const onComplete = vi.fn()
    const initialAnswers = answersThrough(24)
    saveDraft(getDraftKey('creator', subjectNickname), {
      version: 1,
      nickname: subjectNickname,
      answers: {},
      currentIndex: 999,
      updatedAt: new Date().toISOString(),
    })

    render(<QuizSession mode="creator" subjectNickname={subjectNickname} initialAnswers={initialAnswers} onComplete={onComplete} />)
    expect(screen.getByText('25 / 25')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /A.*马上找人出去玩/ }))
    act(() => vi.advanceTimersByTime(200))
    expect(onComplete).toHaveBeenCalledTimes(1)
    expect(onComplete).toHaveBeenCalledWith({ ...initialAnswers, q25: 'A' })
    expect(loadDraft(getDraftKey('creator', subjectNickname))?.answers).toMatchObject({ q25: 'A' })

    const alternateAnswer = screen.getByRole('button', { name: /B.*躺一天/ })
    expect(alternateAnswer).toBeDisabled()
    fireEvent.click(alternateAnswer)
    act(() => vi.advanceTimersByTime(200))
    expect(onComplete).toHaveBeenCalledTimes(1)
  })

  it('cancels a pending advance when unmounted', () => {
    vi.useFakeTimers()
    const { unmount } = render(<QuizSession mode="creator" subjectNickname={subjectNickname} initialAnswers={{}} onComplete={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: /A.*一张很大的床/ }))
    unmount()

    expect(() => act(() => vi.runAllTimers())).not.toThrow()
  })
})
