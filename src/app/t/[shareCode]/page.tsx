import { getPublicTest } from '@/lib/repositories/tests'
import { FriendStartPage } from '@/components/friend/FriendStartPage'
import { InlineError } from '@/components/system/InlineError'

export const dynamic = 'force-dynamic'

export default async function FriendStartRoute({ params }: { params: Promise<{ shareCode: string }> }) {
  const { shareCode } = await params
  let test
  try {
    test = await getPublicTest(shareCode)
  } catch {
    return <main className="page-shell"><h1>测试卡暂时打不开</h1><InlineError message="服务正在喘口气，请稍后再试。" showCreateLink /></main>
  }
  if (!test || test.questions.length !== 25) return <main className="page-shell"><h1>这个测试可能不存在或已失效</h1><InlineError message="链接可能已经失效，也可以创建一张属于自己的测试卡。" showCreateLink /></main>
  return <FriendStartPage shareCode={shareCode} creatorNickname={test.creatorNickname} />
}
