import Link from 'next/link'

export default function HomePage() {
  return (
    <main>
      <h1>你朋友真的懂你吗？</h1>
      <p>回答 25 道小题，邀请朋友来猜猜你。</p>
      <Link href="/create">创建我的测试</Link>
    </main>
  )
}
