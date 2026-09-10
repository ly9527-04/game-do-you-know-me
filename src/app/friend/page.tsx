import Link from 'next/link'
import { requireUser } from '@/lib/auth'
import { FriendSearch } from '@/components/account/FriendSearch'
export const dynamic = 'force-dynamic'
export default async function FriendPage() {
  await requireUser()
  return <main className="page-shell"><p className="eyebrow">FRIEND CHALLENGE</p><h1>做朋友的测试</h1><p className="lede">只需要朋友的账号，就能找到TA当前的测试。</p><FriendSearch /><Link className="account-back" href="/">返回首页</Link></main>
}
