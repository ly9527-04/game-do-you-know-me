import Link from 'next/link'
import { requireUser } from '@/lib/auth'
import { getFriendTest, getUserAttempt } from '@/lib/repositories/accounts'
import { AccountQuiz } from '@/components/account/AccountQuiz'
export const dynamic = 'force-dynamic'
export default async function FriendTestPage({ params }: { params: Promise<{ account: string }> }) {
  const user = await requireUser()
  const { account } = await params
  if (!/^[0-9]{8}$/.test(account)) return <main className="page-shell"><h1>请输入8位数字账号</h1><Link href="/friend">重新查找</Link></main>
  if (user.account === account) return <main className="page-shell"><h1>这是你自己的账号</h1><p>让朋友来挑战你的测试吧。</p><Link href="/">返回首页</Link></main>
  const friend = await getFriendTest(account)
  if (!friend) return <main className="page-shell"><h1>没有找到这个账号</h1><p>请检查朋友的8位数字账号。</p><Link href="/friend">重新查找</Link></main>
  if (!friend.test) return <main className="page-shell"><h1>{friend.nickname}还没有创建测试</h1><p>请让朋友先完成自己的测试。</p><Link href="/friend">返回查找</Link></main>
  if (friend.test.questions.length !== 25) return <main className="page-shell"><h1>测试已更新</h1><p>朋友刚刚更新了测试，请重新查找后再开始。</p><Link href="/friend">重新查找</Link></main>
  const attempt = await getUserAttempt(user.id, friend.test.testId)
  if (attempt) return <main className="page-shell"><h1>你已经做过{friend.nickname}的这份测试</h1><p>每份测试只能提交一次；TA重新创建后，你可以再次挑战。</p><Link className="button button--primary" href={'/r/' + attempt}>查看我的结果</Link><Link className="account-back" href="/">返回首页</Link></main>
  return <main className="page-shell"><p className="account-notice">正在挑战 {friend.nickname} · 账号 {account}</p><AccountQuiz userId={user.id} nickname={user.nickname} mode="friend" testId={friend.test.testId} questionSetVersion={friend.test.questionSetVersion} questions={friend.test.questions} /><Link className="account-back" href="/">返回首页</Link></main>
}
