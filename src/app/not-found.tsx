import Link from 'next/link'

export default function NotFound() {
  return (
    <main>
      <h1>这一页走丢了</h1>
      <p>回到首页，重新开始一场默契小测试吧。</p>
      <Link href="/">回到首页</Link>
    </main>
  )
}
