'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { clearDraft, getDraftKey, loadDraft, type DraftMode, type QuizDraft } from '@/lib/drafts'

type ResumeDraftProps = {
  mode?: DraftMode
  draftIdentity?: string
  onContinue?: (draft: QuizDraft) => void
  onRestart?: (draft: QuizDraft) => void
  getContinueHref?: (draft: QuizDraft) => string
  getRestartHref?: (draft: QuizDraft) => string
}

type DraftCandidate = { key: string; draft: QuizDraft }

export function ResumeDraft({ mode = 'creator', draftIdentity, onContinue, onRestart, getContinueHref, getRestartHref }: ResumeDraftProps) {
  const [candidate, setCandidate] = useState<DraftCandidate | null>(null)

  useEffect(() => {
    let active = true
    queueMicrotask(() => {
      if (active) setCandidate(findLatestDraft(mode, draftIdentity))
    })
    return () => {
      active = false
    }
  }, [mode, draftIdentity])

  if (!candidate) return null

  const { draft, key } = candidate
  const questionNumber = Math.min(25, Math.max(1, draft.currentIndex + 1))

  return (
    <section className="resume-draft" aria-labelledby="resume-draft-title">
      <p className="eyebrow">发现一份未完成的小卡片</p>
      <h2 id="resume-draft-title">要继续回答 {draft.nickname} 的测试吗？</h2>
      <p>已经答到第 {String(questionNumber).padStart(2, '0')} / 25 题，答案保存在这台设备上。</p>
      <div className="resume-draft__actions">
        {getContinueHref ? <Link className="button button--primary" href={getContinueHref(draft)}>继续上次进度</Link> : <button className="button button--primary" type="button" onClick={() => onContinue?.(draft)}>继续上次进度</button>}
        {getRestartHref ? <Link className="button button--secondary" href={getRestartHref(draft)} onClick={() => { clearDraft(key); setCandidate(null); onRestart?.(draft) }}>重新开始</Link> : <button className="button button--secondary" type="button" onClick={() => { clearDraft(key); setCandidate(null); onRestart?.(draft) }}>重新开始</button>}
      </div>
    </section>
  )
}

function findLatestDraft(mode: DraftMode, draftIdentity?: string): DraftCandidate | null {
  if (typeof window === 'undefined') return null

  if (draftIdentity) {
    const key = getDraftKey(mode, draftIdentity)
    const draft = loadDraft(key)
    return draft ? { key, draft } : null
  }

  const prefix = `know-me:quiz-draft:v1:${mode}:`
  let latest: DraftCandidate | null = null
  try {
    for (let index = 0; index < window.localStorage.length; index += 1) {
      const key = window.localStorage.key(index)
      if (!key?.startsWith(prefix)) continue
      const draft = loadDraft(key)
      if (!draft) continue
      if (!latest || Date.parse(draft.updatedAt) > Date.parse(latest.draft.updatedAt)) latest = { key, draft }
    }
  } catch {
    return null
  }
  return latest
}
