import Link from 'next/link'
import { requireUser } from '@/lib/auth'
import { getOwnedTest } from '@/lib/repositories/accounts'
import { getManageSummary } from '@/lib/repositories/manage'
export const dynamic = 'force-dynamic'
export default async function LeaderboardPage() {
  const user = await requireUser()
  const test = await getOwnedTest(user.id)
  const summary = test ? await getManageSummary(test.id) : null
  return <main className="page-shell"><section className="leaderboard">
    <div className="leaderboard__trophy" aria-hidden="true"><i className="fa-solid fa-trophy" /></div>
    <p className="eyebrow">LEADERBOARD · 我的排行榜</p><h1>{user.nickname}的排行榜</h1>
    {!summary ? <><p>还没有自己的测试，先选25道题吧。</p><Link className="button button--primary" href="/create">创建自己的测试</Link></> : <>
      <div className="leaderboard__stats"><span>{summary.challengeCount} 人挑战</span><span>平均 {Math.round(summary.averageScore)} 分</span></div>
      {summary.entries.length ? <ol className="leaderboard__entries">{summary.entries.map((entry, index) => <li key={entry.attemptId}>
        <span className="leaderboard__rank">第{index + 1}名</span>
        <div className="leaderboard__person"><strong>{entry.nickname}</strong><span>答对 {entry.score / 4} / 25 题</span><time dateTime={entry.createdAt}>{new Date(entry.createdAt).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai', hour12: false })} 完成</time><Link href={'/r/' + entry.attemptId}>查看差异</Link></div>
        <div className="leaderboard__score"><b>{entry.score}%</b><small>{entry.score}分</small></div>
      </li>)}</ol> : <p className="leaderboard__empty">还没有朋友来挑战，把你的账号 {user.account} 告诉朋友吧。</p>}
    </>}
    <Link className="account-back" href="/">返回首页</Link>
  </section></main>
}
