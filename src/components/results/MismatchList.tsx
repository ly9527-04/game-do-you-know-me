'use client'
import { useState } from 'react'
import { MismatchCard } from '@/components/results/MismatchCard'
import type { Mismatch } from '@/types/domain'
export function MismatchList({ mismatches }: { mismatches: readonly Mismatch[] }) {
  const [expanded, setExpanded] = useState(false)
  if (!mismatches.length) return <p className="perfect-note">25 道题全部猜中，默契得有点犯规。</p>
  return <section aria-labelledby="mismatch-title"><h2 id="mismatch-title">你们不一样的地方 · {mismatches.length}题</h2>
    <div className="mismatch-list" id="all-mismatches">{(expanded ? mismatches : mismatches.slice(0, 3)).map((mismatch, index) => <MismatchCard key={mismatch.questionId} mismatch={mismatch} index={index} />)}</div>
    {mismatches.length > 3 && <button className="button button--secondary mismatch-expand" type="button" aria-expanded={expanded} aria-controls="all-mismatches" onClick={() => setExpanded(!expanded)}>{expanded ? '收起' : '查看更多（全部' + mismatches.length + '处差异）'}</button>}
  </section>
}
