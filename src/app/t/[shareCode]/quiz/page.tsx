import { FriendQuiz } from '@/components/friend/FriendQuiz'
import { getPublicTest } from '@/lib/repositories/tests'
import { InlineError } from '@/components/system/InlineError'

export const dynamic = 'force-dynamic'

export default async function FriendQuizRoute({ params, searchParams }: { params: Promise<{ shareCode: string }>; searchParams: Promise<{ nickname?: string }> }) {
  const [{ shareCode }, query] = await Promise.all([params, searchParams])
  const nickname = query.nickname?.trim() ?? ''
  let test
  try {
    test = await getPublicTest(shareCode)
  } catch {
    return <main className="page-shell"><h1>这张答题卡暂时打不开</h1><InlineError message="服务正在喘口气，请稍后再试。" showCreateLink /></main>
  }
  if (!test || test.questions.length !== 25 || !nickname) return <main className="page-shell"><h1>这个测试可能不存在或已失效</h1><InlineError message="请从朋友发来的原始链接重新开始。" showCreateLink /></main>
  return <main className="page-shell"><FriendQuiz shareCode={shareCode} creatorNickname={test.creatorNickname} friendNickname={nickname} questionSetVersion={test.questionSetVersion} questions={test.questions} /></main>
}
