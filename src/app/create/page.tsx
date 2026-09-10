import { requireUser } from '@/lib/auth'
import { getActiveQuestionSet } from '@/lib/repositories/tests'
import { getOwnedTest } from '@/lib/repositories/accounts'
import { TestBuilder } from '@/components/account/TestBuilder'
export const dynamic = 'force-dynamic'
export default async function CreatePage() {
  const user = await requireUser()
  const [active, previous] = await Promise.all([getActiveQuestionSet(), getOwnedTest(user.id)])
  if (!active || active.questions.length < 25) return <main className="page-shell"><h1>题库暂时不可用</h1><p>请稍后刷新重试。</p></main>
  return <main className="page-shell"><TestBuilder userId={user.id} nickname={user.nickname} account={user.account} previousTestId={previous?.id ?? null} questionSetId={active.id} questionSetVersion={active.version} questions={active.questions} /></main>
}
