'use client'

import { useState } from 'react'
import { ArchiveComplete } from '@/components/create/ArchiveComplete'
import { QuizSession } from '@/components/quiz/QuizSession'
import { InlineError } from '@/components/system/InlineError'
import { clearDraft, getDraftKey } from '@/lib/drafts'
import { getAnonymousSessionId } from '@/lib/anonymous-session'
import type { QuizAnswers } from '@/types/domain'

type CreatorQuizProps = {
  nickname: string
}

type Archive = { shareUrl: string; manageUrl: string }

export function CreatorQuiz({ nickname }: CreatorQuizProps) {
  const [archive, setArchive] = useState<Archive | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [sessionRevision, setSessionRevision] = useState(0)

  async function complete(answers: QuizAnswers) {
    if (submitting || archive) return
    setSubmitting(true)
    setError('')
    try {
      const response = await fetch('/api/tests', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ nickname, answers, anonymousSessionId: getAnonymousSessionId() }),
      })
      const payload = await response.json() as Partial<Archive> & { error?: { message?: string } }
      if (!response.ok || !payload.shareUrl || !payload.manageUrl) throw new Error(payload.error?.message ?? '暂时没能封存档案，请稍后重试。')
      clearDraft(getDraftKey('creator', nickname))
      setArchive({ shareUrl: payload.shareUrl, manageUrl: payload.manageUrl })
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '暂时没能封存档案，请稍后重试。')
    } finally {
      setSubmitting(false)
    }
  }

  if (archive) return <ArchiveComplete {...archive} />

  const initialAnswers = {} as QuizAnswers
  return (
    <>
      <QuizSession key={`${nickname}:${sessionRevision}`} mode="creator" subjectNickname={nickname} initialAnswers={initialAnswers} onComplete={complete} />
      {submitting ? <p role="status" className="submit-status">正在封存你的答案…</p> : null}
      {error ? <InlineError message={error} retryLabel="重新提交" onRetry={() => { setError(''); setSessionRevision((revision) => revision + 1) }} /> : null}
    </>
  )
}
