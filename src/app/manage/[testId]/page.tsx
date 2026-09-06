import { cookies } from 'next/headers'
import { Leaderboard } from '@/components/manage/Leaderboard'
import { InlineError } from '@/components/system/InlineError'
import { getManageSummary } from '@/lib/repositories/manage'
import { manageCookieName, verifyManageSession } from '@/lib/manage-session'
import { getCanonicalOrigin } from '@/lib/site-url'

export const dynamic = 'force-dynamic'

export default async function ManagePage({ params }: { params: Promise<{ testId: string }> }) {
  const { testId } = await params
  const store = await cookies()
  const value = store.get(manageCookieName())?.value
  let session
  try {
    session = value ? verifyManageSession(value) : null
  } catch {
    session = null
  }
  if (!session || session.testId !== testId) return <main className="page-shell"><h1>这个管理链接无效或已失效</h1><p>请使用创建完成时保存的管理链接。</p></main>
  let summary
  try {
    summary = await getManageSummary(testId)
  } catch {
    return <main className="page-shell"><h1>排行榜暂时打不开</h1><InlineError message="服务正在喘口气，请稍后再试。" /></main>
  }
  if (!summary) return <main className="page-shell"><h1>找不到这张测试卡</h1><p>它可能已经被删除。</p></main>
  let shareUrl
  try {
    shareUrl = new URL(`/t/${summary.shareCode}`, getCanonicalOrigin()).toString()
  } catch {
    return <main className="page-shell"><h1>排行榜暂时打不开</h1><InlineError message="站点地址尚未配置，请稍后再试。" /></main>
  }
  return <main className="page-shell"><Leaderboard creatorNickname={summary.creatorNickname} challengeCount={summary.challengeCount} averageScore={Math.round(summary.averageScore)} entries={summary.entries} shareUrl={shareUrl} /></main>
}
