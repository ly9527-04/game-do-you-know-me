'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { EventBeacon } from '@/components/analytics/EventBeacon'
import { QuizSession } from '@/components/quiz/QuizSession'
import { InlineError } from '@/components/system/InlineError'
import { clearDraft, getDraftKey } from '@/lib/drafts'
import { getAnonymousSessionId } from '@/lib/anonymous-session'
import type { QuizAnswers } from '@/types/domain'

type FriendQuizProps = {
  shareCode: string
  creatorNickname: string
  friendNickname: string
}

export function FriendQuiz({ shareCode, creatorNickname, friendNickname }: FriendQuizProps) {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [sessionRevision, setSessionRevision] = useState(0)
  const [idempotencyKey] = useState(() => crypto.randomUUID())

  async function complete(answers: QuizAnswers) {
    if (submitting) return
    setSubmitting(true)
    setError('')
    try {
      const response = await fetch(`/api/tests/${encodeURIComponent(shareCode)}/attempts`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ nickname: friendNickname, answers, idempotencyKey, anonymousSessionId: getAnonymousSessionId() }),
      })
      const payload = await response.json() as { attemptId?: string; resultUrl?: string; error?: { message?: string } }
      if (!response.ok || !payload.resultUrl) throw new Error(payload.error?.message ?? '暂时没能记下这次挑战，请稍后重试。')
      clearDraft(getDraftKey('friend', shareCode))
      router.push(payload.resultUrl)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '暂时没能记下这次挑战，请稍后重试。')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <EventBeacon eventName="friend_quiz_start" metadata={{ source: 'challenge', surface: 'friend_quiz' }} />
      <p className="eyebrow">你正在猜：{creatorNickname}</p>
      <QuizSession key={`${shareCode}:${friendNickname}:${sessionRevision}`} mode={{ role: 'friend', shareCode }} subjectNickname={friendNickname} initialAnswers={{} as QuizAnswers} onComplete={complete} />
      {submitting ? <p role="status" className="submit-status">正在记下你的答案…</p> : null}
      {error ? <InlineError message={error} retryLabel="重新提交" onRetry={() => { setError(''); setSessionRevision((revision) => revision + 1) }} /> : null}
    </>
  )
}
