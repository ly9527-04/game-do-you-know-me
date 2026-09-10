import type { Mismatch } from '@/types/domain'

export function MismatchCard({ mismatch, index }: { mismatch: Mismatch; index: number }) {
  return (
    <article className="mismatch-card">
      <p className="mismatch-card__index">偏差 {String(index + 1).padStart(2, '0')}</p>
      <h2>{mismatch.prompt}</h2>
      <div className="mismatch-card__answers">
        <p><span>原答案</span><strong>{mismatch.creatorAnswerText}</strong></p>
        <p><span>朋友猜</span><strong>{mismatch.friendAnswerText}</strong></p>
      </div>
    </article>
  )
}
