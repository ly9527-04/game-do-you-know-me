'use client'

import { useEffect, useState } from 'react'
import { ArchiveComplete } from '@/components/create/ArchiveComplete'
import { QuizSession } from '@/components/quiz/QuizSession'
import { InlineError } from '@/components/system/InlineError'
import { clearDraft, getDraftKey, loadDraft, saveDraft } from '@/lib/drafts'
import { drawBalancedQuestions } from '@/lib/question-selection'
import { getAnonymousSessionId } from '@/lib/anonymous-session'
import type { Question, QuizAnswers } from '@/types/domain'

type CreatorQuizProps = {
  nickname: string
  questionSetVersion: number
  questions: readonly Question[]
}

type Archive = { shareUrl: string; manageUrl: string }

export function CreatorQuiz({ nickname, questionSetVersion, questions }: CreatorQuizProps) {
  const [archive, setArchive] = useState<Archive | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [sessionRevision, setSessionRevision] = useState(0)
  const [selectedQuestions, setSelectedQuestions] = useState<Question[] | null>(null)
  const draftKey = getDraftKey('creator', nickname)

  useEffect(() => {
    const questionById = new Map(questions.map((question) => [question.id, question]))
    const draft = loadDraft(draftKey, questions.map((question) => question.id))
    const restored = draft?.questionSetVersion === questionSetVersion
      ? draft.questionIds.map((id) => questionById.get(id)).filter((question): question is Question => Boolean(question))
      : []
    const selection = restored.length === 25 ? restored : drawBalancedQuestions(questions)
    const ordered = selection.map((question, index) => ({ ...question, order: index + 1 }))

    if (restored.length !== 25) {
      saveDraft(draftKey, {
        version: 2,
        questionSetVersion,
        questionIds: ordered.map((question) => question.id),
        nickname,
        answers: {},
        currentIndex: 0,
        updatedAt: new Date().toISOString(),
      })
    }
    setSelectedQuestions(ordered)
  }, [draftKey, nickname, questionSetVersion, questions])

  async function complete(answers: QuizAnswers) {
    if (submitting || archive) return
    setSubmitting(true)
    setError('')
    try {
      const response = await fetch('/api/tests', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ nickname, questionIds: selectedQuestions?.map((question) => question.id), answers, anonymousSessionId: getAnonymousSessionId() }),
      })
      const payload = await response.json() as Partial<Archive> & { error?: { message?: string } }
      if (!response.ok || !payload.shareUrl || !payload.manageUrl) throw new Error(payload.error?.message ?? '暂时没能封存档案，请稍后重试。')
      clearDraft(draftKey)
      setArchive({ shareUrl: payload.shareUrl, manageUrl: payload.manageUrl })
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '暂时没能封存档案，请稍后重试。')
    } finally {
      setSubmitting(false)
    }
  }

  if (archive) return <ArchiveComplete {...archive} />
  if (!selectedQuestions) return <p role="status" className="submit-status">正在准备你的题目…</p>

  const initialAnswers = {} as QuizAnswers
  return (
    <>
      <QuizSession key={`${nickname}:${sessionRevision}`} mode="creator" subjectNickname={nickname} questions={selectedQuestions} questionSetVersion={questionSetVersion} initialAnswers={initialAnswers} onComplete={complete} />
      {submitting ? <p role="status" className="submit-status">正在封存你的答案…</p> : null}
      {error ? <InlineError message={error} retryLabel="重新提交" onRetry={() => { setError(''); setSessionRevision((revision) => revision + 1) }} /> : null}
    </>
  )
}
