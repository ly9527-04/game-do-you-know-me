'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { QUESTION_GROUPS, questionGroup } from '@/lib/question-groups'
import { AccountQuiz } from '@/components/account/AccountQuiz'
import type { Question } from '@/types/domain'
type Draft = { ids: string[]; testId: string; started: boolean }
type Props = { userId: string; nickname: string; account: string; previousTestId: string | null; questionSetId: string; questionSetVersion: number; questions: Question[] }
export function TestBuilder(props: Props) {
  const [draft, setDraft] = useState<Draft | null>(null)
  const [confirmed, setConfirmed] = useState(!props.previousTestId)
  const [category, setCategory] = useState<string | null>(null)
  const key = 'know-me:selection:' + props.userId + ':' + props.questionSetId + ':' + (props.previousTestId ?? 'new')
  useEffect(() => {
    let saved: Draft | null = null
    try {
      const value = JSON.parse(localStorage.getItem(key) ?? 'null')
      if (value && typeof value.testId === 'string' && /^[0-9a-f-]{36}$/i.test(value.testId)
        && Array.isArray(value.ids) && value.ids.length <= 25 && new Set(value.ids).size === value.ids.length
        && value.ids.every((id: string) => props.questions.some((q) => q.id === id)) && typeof value.started === 'boolean') {
        saved = { ...value, started: value.started && value.ids.length === 25 }
      }
    } catch { /* Storage is optional. */ }
    const initial = saved ?? { ids: [], testId: crypto.randomUUID(), started: false }
    let active = true
    queueMicrotask(() => { if (active) setDraft(initial) })
    return () => { active = false }
  }, [key, props.questions])
  function update(next: Draft) {
    setDraft(next)
    try { localStorage.setItem(key, JSON.stringify(next)) } catch { /* Keep working without storage. */ }
  }
  if (!confirmed) return <section className="account-warning" aria-labelledby="replace-title">
    <p className="eyebrow">重新创建测试</p><h1 id="replace-title">旧测试和排行榜将被清空</h1>
    <p>新测试创建成功后，会覆盖旧测试，并清空旧排行榜及答题记录，无法恢复。</p>
    <p className="lede">选题或答题中途退出，旧测试仍会保留。</p>
    <div className="account-menu"><button className="button button--primary" onClick={() => setConfirmed(true)}>确认，继续创建</button><Link className="button button--secondary" href="/">取消，保留旧测试</Link></div>
  </section>
  if (!draft) return <p role="status">正在恢复选题进度…</p>
  if (draft.started) {
    const questions = draft.ids.map((id, index) => ({ ...props.questions.find((q) => q.id === id)!, order: index + 1 }))
    return <AccountQuiz {...props} testId={draft.testId} questions={questions} mode="creator" onCreated={() => { try { localStorage.removeItem(key) } catch {} }} />
  }
  const selected = new Set(draft.ids)
  const shown = props.questions.filter((question) => questionGroup(question) === category)
  function toggle(id: string) {
    if (!draft) return
    if (selected.has(id)) update({ ...draft, ids: draft.ids.filter((value) => value !== id) })
    else if (draft.ids.length < 25) update({ ...draft, ids: [...draft.ids, id] })
  }
  return <section>
    <p className="eyebrow">BUILD YOUR TEST · 自选题目</p><h1 className="gradient-text">哪些问题最像你？</h1>
    <p className="lede">从75道题中自由挑选25道，选好后再回答自己的测试。不限制每类数量。</p>
    <div className="selection-summary"><strong role="status" aria-live="polite">已选 {draft.ids.length} / 25 题</strong><button className="button button--primary" disabled={draft.ids.length !== 25} onClick={() => update({ ...draft, started: true })}>选好了，开始回答</button></div>
    {draft.ids.length === 25 && <p className="account-notice">已经选满25题，取消一道后可以换选其他题。</p>}
    {category === null ? <div className="question-categories">{QUESTION_GROUPS.map((group) => {
      const members = props.questions.filter((q) => questionGroup(q) === group.id)
      return <button className="category-card" key={group.id} onClick={() => setCategory(group.id)}><strong>{group.label}</strong><span>{group.description}</span><small>{members.length}题 · 已选{members.filter((q) => selected.has(q.id)).length}题 →</small></button>
    })}</div> : <>
      <button className="button button--secondary" onClick={() => setCategory(null)}>返回分类</button>
      <h2 className="selection-title">{QUESTION_GROUPS.find((g) => g.id === category)?.label}</h2>
      <div className="question-selection">{shown.map((question) => <label key={question.id} className="selection-item" data-selected={selected.has(question.id)}>
        <input type="checkbox" checked={selected.has(question.id)} disabled={!selected.has(question.id) && selected.size >= 25} onChange={() => toggle(question.id)} />
        <span><strong>{question.prompt}</strong><small>{question.options.map((option) => option.text).join(' / ')}</small></span>
      </label>)}</div>
    </>}
    <Link className="account-back" href="/">返回首页</Link>
  </section>
}
