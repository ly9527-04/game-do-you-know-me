import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="page-shell">
      <p className="eyebrow">链接失效</p>
      <h1>这个测试可能不存在或已失效</h1>
      <p>别担心，你也可以创建一张属于自己的测试卡。</p>
      <div className="inline-error__actions">
        <Link className="button button--primary" href="/create">创建自己的测试</Link>
        <Link className="button button--secondary" href="/">回到首页</Link>
      </div>
    </main>
  )
}
