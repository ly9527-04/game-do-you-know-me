type ResultScoreProps = {
  score: number
  verdict: string
}

export function ResultScore({ score, verdict }: ResultScoreProps) {
  return (
    <section className="result-score" aria-labelledby="result-score-title">
      <p className="eyebrow">你们的默契分</p>
      <h1 id="result-score-title">{score} 分</h1>
      <p className="result-score__verdict">{verdict}</p>
      {score === 100 ? <p className="result-score__easter-egg" role="status">满分彩蛋：这题真的没有难倒你们。</p> : null}
    </section>
  )
}
