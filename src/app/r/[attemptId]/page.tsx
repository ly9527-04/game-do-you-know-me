import { TrackedLink } from '@/components/analytics/TrackedLink'
import { MismatchCard } from '@/components/results/MismatchCard'
import { ResultScore } from '@/components/results/ResultScore'
import { ShareActions } from '@/components/share/ShareActions'
import { InlineError } from '@/components/system/InlineError'
import { getResultSource } from '@/lib/repositories/attempts'
import { getVerdict, selectMismatches } from '@/lib/scoring'
import { getCanonicalOrigin } from '@/lib/site-url'

export const dynamic = 'force-dynamic'

export default async function ResultPage({ params }: { params: Promise<{ attemptId: string }> }) {
  const { attemptId } = await params
  let source
  try {
    source = await getResultSource(attemptId)
  } catch {
    return <main className="page-shell"><h1>结果暂时打不开</h1><InlineError message="服务正在喘口气，请稍后再试。" /></main>
  }
  if (!source) return <main className="page-shell"><h1>找不到这次挑战</h1><p>结果链接可能已经失效。</p></main>
  const mismatches = selectMismatches(source, attemptId).slice(0, 3)
  let resultUrl
  try {
    resultUrl = new URL(`/r/${attemptId}`, getCanonicalOrigin()).toString()
  } catch {
    return <main className="page-shell"><h1>结果暂时打不开</h1><InlineError message="站点地址尚未配置，请稍后再试。" /></main>
  }

  return (
    <main className="page-shell result-page">
      <p className="eyebrow">{source.friendNickname} 猜 {source.creatorNickname}</p>
      <ResultScore score={source.score} verdict={getVerdict(source.score)} />
      {mismatches.length ? <section aria-labelledby="mismatch-title"><h2 id="mismatch-title">你们不一样的地方</h2><div className="mismatch-list">{mismatches.map((mismatch, index) => <MismatchCard key={mismatch.questionId} mismatch={mismatch} index={index} />)}</div></section> : <p className="perfect-note">25 道题全部猜中，默契得有点犯规。</p>}
      <ShareActions resultUrl={resultUrl} title="你真的懂我吗" text={`${source.friendNickname} 和 ${source.creatorNickname} 的默契结果`} />
      <TrackedLink className="button button--secondary" href="/create" eventName="friend_create_own_test_click" metadata={{ source: 'result', surface: 'result_page' }}>我也要创建自己的测试</TrackedLink>
    </main>
  )
}
