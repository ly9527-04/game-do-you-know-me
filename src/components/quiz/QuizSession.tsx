'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { QuestionCard } from '@/components/quiz/QuestionCard'
import { QuizProgress } from '@/components/quiz/QuizProgress'
import { getDraftKey, loadDraft, saveDraft, type DraftMode } from '@/lib/drafts'
import { QUESTIONS } from '@/lib/questions'
import type { AnswerChoice, Question, QuizAnswers } from '@/types/domain'

export type QuizMode = 'creator' | { role: 'friend'; shareCode: string }

export type QuizSessionProps = {
  draftIdentity?: string
  mode: QuizMode
  subjectNickname: string
  questions?: readonly Question[]
  questionSetVersion?: number
  initialAnswers: QuizAnswers
  onComplete: (answers: QuizAnswers) => void
}

type QuizSessionStateProps = Omit<QuizSessionProps, 'mode' | 'questions' | 'questionSetVersion'> & {
  draftKey: string
  questions: readonly Question[]
  questionSetVersion: number
  isHost: boolean
}

export function QuizSession({ mode, subjectNickname, questions = QUESTIONS, questionSetVersion = 1, initialAnswers, onComplete, draftIdentity: explicitIdentity }: QuizSessionProps) {
  const draftIdentity = explicitIdentity ?? (typeof mode === 'string' ? subjectNickname : mode.shareCode)
  const draftMode: DraftMode = typeof mode === 'string' ? mode : 'friend'
  const draftKey = getDraftKey(draftMode, draftIdentity)

  return <QuizSessionState key={draftKey} draftKey={draftKey} isHost={mode === 'creator'} subjectNickname={subjectNickname} questions={questions} questionSetVersion={questionSetVersion} initialAnswers={initialAnswers} onComplete={onComplete} />
}

function QuizSessionState({ draftKey, isHost, subjectNickname, questions, questionSetVersion, initialAnswers, onComplete }: QuizSessionStateProps) {
  const lastIndex = questions.length - 1
  const questionIds = useMemo(() => questions.map((question) => question.id), [questions])
  const completionRef = useRef(false)
  const advanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [seedAnswers] = useState(initialAnswers)
  const [answers, setAnswers] = useState<QuizAnswers>(seedAnswers)
  const [currentIndex, setCurrentIndex] = useState(() => firstUnansweredIndex(questions, seedAnswers))
  const [isReady, setIsReady] = useState(false)
  const [isCompleted, setIsCompleted] = useState(false)

  useEffect(() => {
    const draft = loadDraft(draftKey, questionIds)
    const restoredAnswers = { ...(draft?.answers ?? {}), ...seedAnswers }
    const firstUnanswered = firstUnansweredIndex(questions, restoredAnswers)
    const requestedIndex = draft ? clampIndex(draft.currentIndex, lastIndex) : firstUnanswered
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
  }, [draftKey, seedAnswers, questions, lastIndex, questionIds])

  useEffect(() => () => {
    if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current)
  }, [])

  const question = questions[currentIndex]
  const isLastQuestion = currentIndex === lastIndex
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
        if (isComplete(questions, nextAnswers) && !completionRef.current) {
          completionRef.current = true
          setIsCompleted(true)
          onComplete(nextAnswers)
        }
        return
      }

      const nextIndex = Math.min(currentIndex + 1, lastIndex)
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
    const nextIndex = Math.min(currentIndex + 1, lastIndex)
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
      version: 2,
      questionSetVersion,
      questionIds,
      nickname: subjectNickname,
      answers: nextAnswers,
      currentIndex: nextIndex,
      updatedAt: new Date().toISOString(),
    })
  }

  return (
    <section className="quiz-session" aria-label={`${subjectNickname}的答题卡`} aria-busy={!isReady}>
      <header className="quiz-header">
        <p className="eyebrow">{isHost ? 'HOST SETUP · 房主出题' : 'GAME QUIZ · 默契挑战'}</p>
        <h1 className="gradient-text">{isHost ? '创建你的专属问卷' : '看看你有多懂 TA'}</h1>
        <div className="quiz-player">
          <span className="player-avatar" aria-hidden="true">{Array.from(subjectNickname)[0]}</span>
          <div><strong>{subjectNickname}</strong><span>{isHost ? '选出真实的你，交给朋友来猜' : '跟着直觉，选出你心中的答案'}</span></div>
          <i className="fa-solid fa-gamepad" aria-hidden="true" />
        </div>
      </header>
      <QuizProgress current={currentIndex + 1} total={questions.length} />
      <QuestionCard question={question} value={answers[question.id]} onSelect={selectAnswer} disabled={isLocked} />
      <nav className="quiz-session__navigation" aria-label="题目导航">
        <button className="quiz-session__previous" type="button" onClick={goPrevious} disabled={isLocked || currentIndex === 0}>上一题</button>
        <button className="quiz-session__next" type="button" onClick={goNext} disabled={isLocked || !canContinue || isLastQuestion}>下一题</button>
      </nav>
      <p className="quiz-session__hint"><i className="fa-solid fa-bolt" aria-hidden="true" /> 选择后自动下一题 · 进度自动保存</p>
    </section>
  )
}

function clampIndex(index: number, lastIndex: number): number {
  return Math.max(0, Math.min(index, lastIndex))
}

function firstUnansweredIndex(questions: readonly Question[], answers: QuizAnswers): number {
  const firstUnanswered = questions.findIndex((question) => !answers[question.id])
  return firstUnanswered === -1 ? questions.length - 1 : firstUnanswered
}

function isComplete(questions: readonly Question[], answers: QuizAnswers): boolean {
  return questions.every((question) => answers[question.id])
}

function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true
}
