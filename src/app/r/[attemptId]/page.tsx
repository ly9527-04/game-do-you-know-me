import Link from 'next/link'
import { requireUser } from '@/lib/auth'
import { canReadResult } from '@/lib/repositories/accounts'
import { getResultSource } from '@/lib/repositories/attempts'
import { getVerdict, selectMismatches } from '@/lib/scoring'
import { MismatchList } from '@/components/results/MismatchList'
import { ResultScore } from '@/components/results/ResultScore'
export const dynamic = 'force-dynamic'
export default async function ResultPage({ params }: { params: Promise<{ attemptId: string }> }) {
  const user = await requireUser()
  const { attemptId } = await params
  const allowed = await canReadResult(user.id, attemptId)
  const source = allowed ? await getResultSource(attemptId) : null
  if (!source) return <main className="page-shell"><h1>结果不可查看</h1><p>测试可能已被重新创建，或这不是你的答题记录。</p><Link href="/">返回首页</Link></main>
  return <main className="page-shell result-page"><p className="eyebrow">{source.friendNickname} 猜 {source.creatorNickname}</p>
    <ResultScore score={source.score} verdict={getVerdict(source.score)} />
    <MismatchList mismatches={selectMismatches(source, attemptId, undefined, Infinity)} />
    <Link className="account-back" href="/">返回首页</Link>
  </main>
}
