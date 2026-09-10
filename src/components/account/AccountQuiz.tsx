'use client'
import { useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { QuizSession } from '@/components/quiz/QuizSession'
import { clearDraft, getDraftKey } from '@/lib/drafts'
import type { Question, QuizAnswers } from '@/types/domain'
type Props = {
  userId: string; nickname: string; account?: string; questions: readonly Question[]; questionSetVersion: number;
  mode: 'creator' | 'friend'; testId: string; previousTestId?: string | null; questionSetId?: string; onCreated?: () => void
}
export function AccountQuiz(props: Props) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const [submitted, setSubmitted] = useState<QuizAnswers | null>(null)
  const inFlight = useRef(false)
  const identity = props.userId + ':' + props.testId
  async function complete(answers: QuizAnswers) {
    if (inFlight.current || done) return
    inFlight.current = true; setBusy(true); setError(''); setSubmitted(answers)
    try {
      const body = props.mode === 'creator'
        ? { expectedUserId: props.userId, testId: props.testId, previousTestId: props.previousTestId ?? null, questionSetId: props.questionSetId, questionIds: props.questions.map((q) => q.id), answers }
        : { expectedUserId: props.userId, testId: props.testId, answers }
      const response = await fetch('/api/account/' + (props.mode === 'creator' ? 'tests' : 'attempts'), { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })
      const payload = await response.json()
      if (!response.ok) {
        if (response.status === 401) throw new Error('登录已过期，请返回首页登录；答题进度已保存在本机。')
        throw new Error(payload.error?.message ?? '提交失败，请重试。')
      }
      clearDraft(getDraftKey(props.mode, identity))
      setDone(true)
      if (props.mode === 'creator') props.onCreated?.()
      else router.replace('/r/' + encodeURIComponent(payload.attemptId))
    } catch (cause) { setError(cause instanceof Error ? cause.message : '网络异常，请重试。') }
    finally { inFlight.current = false; setBusy(false) }
  }
  if (done) return <section className="archive-complete">
    <p className="eyebrow">READY · 测试已创建</p><h1>谁最懂你，等朋友来揭晓</h1>
    <p>让朋友打开官网，登录后选择“做朋友的测试”，输入你的账号即可。</p>
    <p className="account-number">我的账号 <strong>{props.account}</strong></p>
    <div className="account-menu"><Link className="button button--primary" href="/leaderboard">查看我的排行榜</Link><Link className="button button--secondary" href="/">返回首页</Link></div>
  </section>
  return <>
    <QuizSession mode={props.mode === 'creator' ? 'creator' : { role: 'friend', shareCode: props.testId }} draftIdentity={identity} subjectNickname={props.nickname} questions={props.questions} questionSetVersion={props.questionSetVersion} initialAnswers={{}} onComplete={complete} />
    {busy && <p role="status">正在保存答案…</p>}
    {error && <div role="alert" className="inline-error"><p>{error}</p>{submitted && <button className="button button--secondary" disabled={busy} onClick={() => complete(submitted)}>重试提交</button>}<Link className="button button--secondary" href="/">返回首页</Link></div>}
  </>
}
