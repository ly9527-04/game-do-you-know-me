'use client'

import { useState } from 'react'

type LeaderboardEntry = { attemptId: string; nickname: string; score: number; createdAt: string }

type LeaderboardProps = {
  creatorNickname: string
  challengeCount: number
  averageScore: number
  entries: LeaderboardEntry[]
  shareUrl: string
}

export function Leaderboard({ creatorNickname, challengeCount, averageScore, entries, shareUrl }: LeaderboardProps) {
  const [copyStatus, setCopyStatus] = useState('')
  async function copyShareUrl() {
    try { await navigator.clipboard.writeText(shareUrl); setCopyStatus('已复制朋友链接') }
    catch { setCopyStatus('复制失败，请长按下方朋友链接复制') }
  }

  return (
    <section className="leaderboard" aria-labelledby="leaderboard-title">
      <div className="leaderboard__trophy" aria-hidden="true"><i className="fa-solid fa-trophy" /></div>
      <p className="eyebrow">LEADERBOARD · 私密管理</p>
      <h1 id="leaderboard-title">{creatorNickname}的排行榜</h1>
      <div className="leaderboard__stats"><span>{challengeCount} 人挑战</span><span>平均 {averageScore} 分</span></div>
      <h2 className="leaderboard__label">好友默契排行</h2>
      {entries.length ? <ol className="leaderboard__entries">{entries.map((entry, index) => (
        <li key={entry.attemptId}>
          <span className="leaderboard__rank"><span aria-hidden="true">{['🥇', '🥈', '🥉'][index] ?? '#' + (index + 1)}</span><small>第 {index + 1} 名</small></span>
          <span className="leaderboard__avatar" aria-hidden="true">{Array.from(entry.nickname)[0]}</span>
          <div className="leaderboard__person"><strong>昵称：{entry.nickname}</strong><span>答对 {entry.score / 4} / 25 题</span><time dateTime={entry.createdAt}>{formatDate(entry.createdAt)}</time></div>
          <div className="leaderboard__score"><b>{entry.score}%</b><small>{entry.score} 分</small></div>
        </li>
      ))}</ol> : <p className="leaderboard__empty">还没有朋友来挑战，分享链接试试看。</p>}
      <button className="button button--primary" type="button" onClick={copyShareUrl}>复制朋友链接</button>
      {copyStatus ? <p role="status" className="copy-status">{copyStatus}</p> : null}
      {copyStatus.startsWith('复制失败') ? <code className="share-fallback">{shareUrl}</code> : null}
    </section>
  )
}

function formatDate(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '刚刚'
  return `${date.getMonth() + 1}月${date.getDate()}日完成`
}
