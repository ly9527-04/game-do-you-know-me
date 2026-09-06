export type QuizProgressProps = {
  current: number
  total: number
}

export function QuizProgress({ current, total }: QuizProgressProps) {
  const label = `${String(current).padStart(2, '0')} / ${String(total).padStart(2, '0')}`

  return (
    <div className="quiz-progress">
      <span className="quiz-progress__count" aria-label={`第 ${current} 题，共 ${total} 题`}>{label}</span>
      <div className="quiz-progress__track" role="progressbar" aria-label="答题进度" aria-valuemin={1} aria-valuemax={total} aria-valuenow={current}>
        <span className="quiz-progress__fill" style={{ width: `${(current / total) * 100}%` }} />
      </div>
    </div>
  )
}
