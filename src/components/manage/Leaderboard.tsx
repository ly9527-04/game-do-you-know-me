'use client'

type LeaderboardEntry = { attemptId: string; nickname: string; score: number; createdAt: string }

type LeaderboardProps = {
  creatorNickname: string
  challengeCount: number
  averageScore: number
  entries: LeaderboardEntry[]
  shareUrl: string
}

export function Leaderboard({ creatorNickname, challengeCount, averageScore, entries, shareUrl }: LeaderboardProps) {
  async function copyShareUrl() {
    try { await navigator.clipboard.writeText(shareUrl) } catch { /* copy is a convenience */ }
  }

  return (
    <section className="leaderboard" aria-labelledby="leaderboard-title">
      <p className="eyebrow">朋友手帐 · 私密管理</p>
      <h1 id="leaderboard-title">{creatorNickname}的排行榜</h1>
      <div className="leaderboard__stats"><span>{challengeCount} 人挑战</span><span>平均 {averageScore} 分</span></div>
      {entries.length ? <ol className="leaderboard__entries">{entries.map((entry, index) => <li key={entry.attemptId}><span>第 {index + 1} 名</span><strong>昵称：{entry.nickname}</strong><b>{entry.score} 分</b><time dateTime={entry.createdAt}>{formatDate(entry.createdAt)}</time></li>)}</ol> : <p>还没有朋友来挑战，分享链接试试看。</p>}
      <button className="button button--primary" type="button" onClick={copyShareUrl}>复制朋友链接</button>
    </section>
  )
}

function formatDate(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '刚刚'
  return `${date.getMonth() + 1}月${date.getDate()}日完成`
}
