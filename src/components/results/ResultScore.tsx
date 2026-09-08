type ResultScoreProps = {
  score: number
  verdict: string
}

export function ResultScore({ score, verdict }: ResultScoreProps) {
  return (
    <section className="result-score" aria-labelledby="result-score-title">
      <p className="eyebrow">CHALLENGE COMPLETE · 挑战完成</p>
      <div className="score-medallion">
        <h1 id="result-score-title" aria-label={`${score} 分`}><span>{score}</span><small>%</small></h1>
        <span className="score-medallion__label">MATCH RATE · 默契度</span>
      </div>
      <p className="result-score__verdict">{verdict}</p>
      <p className="result-score__detail">答对 {score / 4} / 25 题 · 默契得分 {score} 分</p>
      {score === 100 ? <p className="result-score__easter-egg" role="status">满分彩蛋：这题真的没有难倒你们。</p> : null}
    </section>
  )
}
