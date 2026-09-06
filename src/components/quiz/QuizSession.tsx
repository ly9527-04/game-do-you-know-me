'use client'

import { useEffect, useRef, useState } from 'react'
import { QuestionCard } from '@/components/quiz/QuestionCard'
import { QuizProgress } from '@/components/quiz/QuizProgress'
import { getDraftKey, loadDraft, saveDraft, type DraftMode } from '@/lib/drafts'
import { QUESTIONS } from '@/lib/questions'
import type { AnswerChoice, QuizAnswers } from '@/types/domain'

export type QuizMode = 'creator' | { role: 'friend'; shareCode: string }

export type QuizSessionProps = {
  mode: QuizMode
  subjectNickname: string
  initialAnswers: QuizAnswers
  onComplete: (answers: QuizAnswers) => void
}

type QuizSessionStateProps = Omit<QuizSessionProps, 'mode'> & { draftKey: string }

const LAST_INDEX = QUESTIONS.length - 1

export function QuizSession({ mode, subjectNickname, initialAnswers, onComplete }: QuizSessionProps) {
  const draftIdentity = typeof mode === 'string' ? subjectNickname : mode.shareCode
  const draftMode: DraftMode = typeof mode === 'string' ? mode : 'friend'
  const draftKey = getDraftKey(draftMode, draftIdentity)

  return <QuizSessionState key={draftKey} draftKey={draftKey} subjectNickname={subjectNickname} initialAnswers={initialAnswers} onComplete={onComplete} />
}

function QuizSessionState({ draftKey, subjectNickname, initialAnswers, onComplete }: QuizSessionStateProps) {
  const completionRef = useRef(false)
  const advanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [seedAnswers] = useState(initialAnswers)
  const [answers, setAnswers] = useState<QuizAnswers>(seedAnswers)
  const [currentIndex, setCurrentIndex] = useState(() => firstUnansweredIndex(seedAnswers))
  const [isReady, setIsReady] = useState(false)
  const [isCompleted, setIsCompleted] = useState(false)

  useEffect(() => {
    const draft = loadDraft(draftKey)
    const restoredAnswers = { ...(draft?.answers ?? {}), ...seedAnswers }
    const firstUnanswered = firstUnansweredIndex(restoredAnswers)
    const requestedIndex = draft ? clampIndex(draft.currentIndex) : firstUnanswered
    let active = true

    queueMicrotask(() => {
      if (!active) return
      setAnswers(restoredAnswers)
      setCurrentIndex(Math.min(requestedIndex, firstUnanswered))
      setIsReady(true)
    })

    return () => {
      active = false
    }
  }, [draftKey, seedAnswers])

  useEffect(() => () => {
    if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current)
  }, [])

  const question = QUESTIONS[currentIndex]
  const isLastQuestion = currentIndex === LAST_INDEX
  const canContinue = Boolean(answers[question.id])
  const isLocked = !isReady || isCompleted

  function selectAnswer(value: AnswerChoice) {
    if (isLocked) return

    const nextAnswers = { ...answers, [question.id]: value }
    setAnswers(nextAnswers)
    persistDraft(nextAnswers, currentIndex)

    scheduleSelectionResult(nextAnswers)
  }

  function scheduleSelectionResult(nextAnswers: QuizAnswers) {
    if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current)

    const resolveSelection = () => {
      advanceTimerRef.current = null
      if (isLastQuestion) {
        if (isComplete(nextAnswers) && !completionRef.current) {
          completionRef.current = true
          setIsCompleted(true)
          onComplete(nextAnswers)
        }
        return
      }

      const nextIndex = Math.min(currentIndex + 1, LAST_INDEX)
      setCurrentIndex(nextIndex)
      persistDraft(nextAnswers, nextIndex)
    }

    if (prefersReducedMotion()) {
      resolveSelection()
    } else {
      advanceTimerRef.current = setTimeout(resolveSelection, 200)
    }
  }

  function goNext() {
    if (isLocked || !canContinue || isLastQuestion) return
    if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current)
    const nextIndex = Math.min(currentIndex + 1, LAST_INDEX)
    setCurrentIndex(nextIndex)
    persistDraft(answers, nextIndex)
  }

  function goPrevious() {
    if (isLocked || currentIndex === 0) return
    if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current)
    const previousIndex = Math.max(currentIndex - 1, 0)
    setCurrentIndex(previousIndex)
    persistDraft(answers, previousIndex)
  }

  function persistDraft(nextAnswers: QuizAnswers, nextIndex: number) {
    saveDraft(draftKey, {
      version: 1,
      nickname: subjectNickname,
      answers: nextAnswers,
      currentIndex: nextIndex,
      updatedAt: new Date().toISOString(),
    })
  }

  return (
    <section className="quiz-session" aria-label={`${subjectNickname}的答题卡`} aria-busy={!isReady}>
      <QuizProgress current={currentIndex + 1} total={QUESTIONS.length} />
      <QuestionCard question={question} value={answers[question.id]} onSelect={selectAnswer} disabled={isLocked} />
      <nav className="quiz-session__navigation" aria-label="题目导航">
        <button className="quiz-session__previous" type="button" onClick={goPrevious} disabled={isLocked || currentIndex === 0}>上一题</button>
        <button className="quiz-session__next" type="button" onClick={goNext} disabled={isLocked || !canContinue || isLastQuestion}>下一题</button>
      </nav>
    </section>
  )
}

function clampIndex(index: number): number {
  return Math.max(0, Math.min(index, LAST_INDEX))
}

function firstUnansweredIndex(answers: QuizAnswers): number {
  const firstUnanswered = QUESTIONS.findIndex((question) => !answers[question.id])
  return firstUnanswered === -1 ? LAST_INDEX : firstUnanswered
}

function isComplete(answers: QuizAnswers): boolean {
  return QUESTIONS.every((question) => answers[question.id])
}

function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true
}
