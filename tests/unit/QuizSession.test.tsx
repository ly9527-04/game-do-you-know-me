import { act, fireEvent, render, screen } from '@testing-library/react'
import { hydrateRoot } from 'react-dom/client'
import { renderToString } from 'react-dom/server'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { FIXED_QUESTION_IDS, type QuizAnswers } from '@/types/domain'
import { clearDraft, getDraftKey, loadDraft, saveDraft } from '@/lib/drafts'
import { QuizSession } from '@/components/quiz/QuizSession'

const subjectNickname = '阿钙'

afterEach(() => {
  localStorage.clear()
  vi.useRealTimers()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

function answersThrough(questionCount: number): QuizAnswers {
  return Object.fromEntries(FIXED_QUESTION_IDS.slice(0, questionCount).map((id) => [id, 'A']))
}

async function finishDraftRecovery() {
  await act(async () => {
    await Promise.resolve()
    await Promise.resolve()
  })
}

describe('QuizSession', () => {
  it('saves immediately and advances exactly after 200ms', async () => {
    vi.useFakeTimers()
    render(<QuizSession mode="creator" subjectNickname={subjectNickname} initialAnswers={{}} onComplete={vi.fn()} />)
    await finishDraftRecovery()

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

  it('advances immediately when reduced motion is requested', async () => {
    vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: true }))
    render(<QuizSession mode="creator" subjectNickname={subjectNickname} initialAnswers={{}} onComplete={vi.fn()} />)
    await finishDraftRecovery()

    fireEvent.click(screen.getByRole('button', { name: /A.*一张很大的床/ }))
    expect(screen.getByText('02 / 25')).toBeInTheDocument()
  })

  it('returns from the actual second question and cancels its pending advance', async () => {
    vi.useFakeTimers()
    render(<QuizSession mode="creator" subjectNickname={subjectNickname} initialAnswers={{}} onComplete={vi.fn()} />)
    await finishDraftRecovery()
    expect(screen.getByRole('button', { name: '下一题' })).toBeDisabled()

    fireEvent.click(screen.getByRole('button', { name: /A.*一张很大的床/ }))
    act(() => vi.advanceTimersByTime(200))
    expect(screen.getByText('02 / 25')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /A.*路灯/ }))
    fireEvent.click(screen.getByRole('button', { name: '上一题' }))
    expect(screen.getByText('01 / 25')).toBeInTheDocument()
    act(() => vi.runAllTimers())
    expect(screen.getByText('01 / 25')).toBeInTheDocument()
  })

  it('clamps a recovered current index and completes only once after the final complete answer', async () => {
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
    await finishDraftRecovery()
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

  it('does not let completed navigation recreate a caller-cleared draft', async () => {
    vi.useFakeTimers()
    const key = getDraftKey('creator', subjectNickname)
    const onComplete = vi.fn(() => clearDraft(key))

    render(<QuizSession mode="creator" subjectNickname={subjectNickname} initialAnswers={answersThrough(24)} onComplete={onComplete} />)
    await finishDraftRecovery()
    fireEvent.click(screen.getByRole('button', { name: /A.*马上找人出去玩/ }))
    act(() => vi.advanceTimersByTime(200))

    expect(onComplete).toHaveBeenCalledTimes(1)
    expect(loadDraft(key)).toBeNull()
    expect(screen.getByRole('button', { name: '上一题' })).toBeDisabled()
    expect(screen.getByRole('button', { name: '下一题' })).toBeDisabled()
    fireEvent.click(screen.getByRole('button', { name: '上一题' }))
    expect(screen.getByText('25 / 25')).toBeInTheDocument()
    expect(loadDraft(key)).toBeNull()
  })

  it('does not complete or write again after unmounting a final-answer timer', async () => {
    vi.useFakeTimers()
    const onComplete = vi.fn()
    const writeDraft = vi.spyOn(Storage.prototype, 'setItem')
    const { unmount } = render(<QuizSession mode="creator" subjectNickname={subjectNickname} initialAnswers={answersThrough(24)} onComplete={onComplete} />)
    await finishDraftRecovery()
    fireEvent.click(screen.getByRole('button', { name: /A.*马上找人出去玩/ }))
    const writesBeforeUnmount = writeDraft.mock.calls.length
    unmount()

    act(() => vi.runAllTimers())
    expect(onComplete).not.toHaveBeenCalled()
    expect(writeDraft).toHaveBeenCalledTimes(writesBeforeUnmount)
  })

  it('restores after hydration without changing the server markup or accepting input first', async () => {
    const key = getDraftKey('creator', subjectNickname)
    saveDraft(key, {
      version: 1,
      nickname: subjectNickname,
      answers: answersThrough(7),
      currentIndex: 7,
      updatedAt: new Date().toISOString(),
    })
    vi.stubGlobal('window', undefined)
    const markup = renderToString(<QuizSession mode="creator" subjectNickname={subjectNickname} initialAnswers={{}} onComplete={vi.fn()} />)
    vi.unstubAllGlobals()
    const container = document.createElement('div')
    container.innerHTML = markup
    document.body.append(container)
    const hydrationError = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    let root: ReturnType<typeof hydrateRoot> | undefined

    try {
      expect(container.textContent).toContain('01 / 25')
      expect(container.querySelectorAll('button:disabled')).toHaveLength(6)
      root = hydrateRoot(container, <QuizSession mode="creator" subjectNickname={subjectNickname} initialAnswers={{}} onComplete={vi.fn()} />)
      await act(async () => undefined)

      expect(hydrationError).not.toHaveBeenCalled()
      expect(container.textContent).toContain('08 / 25')
    } finally {
      const hydratedRoot = root
      if (hydratedRoot) act(() => hydratedRoot.unmount())
      container.remove()
    }
  })

  it('resets state and cancels old timers when the friend share code changes', async () => {
    vi.useFakeTimers()
    const { rerender } = render(<QuizSession mode={{ role: 'friend', shareCode: 'AAA' }} subjectNickname={subjectNickname} initialAnswers={{}} onComplete={vi.fn()} />)
    await finishDraftRecovery()
    fireEvent.click(screen.getByRole('button', { name: /A.*一张很大的床/ }))

    rerender(<QuizSession mode={{ role: 'friend', shareCode: 'BBB' }} subjectNickname={subjectNickname} initialAnswers={{}} onComplete={vi.fn()} />)
    await finishDraftRecovery()
    expect(screen.getByText('01 / 25')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /B.*一堆没整理的小东西/ }))
    act(() => vi.advanceTimersByTime(200))

    expect(loadDraft(getDraftKey('friend', 'AAA'))).toMatchObject({ answers: { q01: 'A' }, currentIndex: 0 })
    expect(loadDraft(getDraftKey('friend', 'BBB'))).toMatchObject({ answers: { q01: 'B' }, currentIndex: 1 })
    expect(screen.getByText('02 / 25')).toBeInTheDocument()
  })

  it('restores no farther than the first unanswered question after merging answers', async () => {
    saveDraft(getDraftKey('creator', subjectNickname), {
      version: 1,
      nickname: subjectNickname,
      answers: { q01: 'A' },
      currentIndex: 24,
      updatedAt: new Date().toISOString(),
    })

    render(<QuizSession mode="creator" subjectNickname={subjectNickname} initialAnswers={{ q02: 'B' }} onComplete={vi.fn()} />)
    await finishDraftRecovery()
    expect(screen.getByText('03 / 25')).toBeInTheDocument()
  })
})
