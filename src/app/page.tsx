import { AuthForm } from '@/components/account/AuthForm'
import { Dashboard } from '@/components/account/Dashboard'
import { getCurrentUser } from '@/lib/auth'
import { getOwnedTest } from '@/lib/repositories/accounts'
export const dynamic = 'force-dynamic'
export default async function HomePage() {
  let user
  let test
  try {
    user = await getCurrentUser()
    test = user ? await getOwnedTest(user.id) : null
  } catch {
    return <main className="page-shell"><h1>服务暂时不可用</h1><p>请稍后刷新页面重试。</p></main>
  }
  if (!user) return <main className="page-shell"><AuthForm /></main>
  return <main className="page-shell"><Dashboard nickname={user.nickname} account={user.account} hasTest={Boolean(test)} /></main>
}
