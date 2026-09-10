'use client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
export function Dashboard({ nickname, account, hasTest }: { nickname: string; account: string; hasTest: boolean }) {
  const router = useRouter()
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  async function logout() {
    setBusy(true); setError('')
    try {
      const response = await fetch('/api/auth/logout', { method: 'POST' })
      if (!response.ok) throw new Error('退出失败，请再试一次。')
      router.refresh()
    } catch { setError('退出失败，请再试一次。') } finally { setBusy(false) }
  }
  return <section>
    <p className="eyebrow">YOUR LOBBY · 默契大厅</p>
    <h1 className="gradient-text">你好，{nickname}</h1>
    <p className="account-number">我的账号 <strong>{account}</strong></p>
    <p className="lede">把账号告诉朋友，看看谁最懂你。</p>
    <nav className="account-menu" aria-label="首页功能">
      <Link className="button button--primary" href="/friend"><i className="fa-solid fa-user-group" aria-hidden="true" />做朋友的测试</Link>
      <Link className="button button--secondary" href="/create"><i className="fa-solid fa-pen" aria-hidden="true" />{hasTest ? '重新创建自己的测试' : '创建自己的测试'}</Link>
      <Link className="button button--secondary" href="/leaderboard"><i className="fa-solid fa-trophy" aria-hidden="true" />我的排行榜</Link>
    </nav>
    {error && <p role="alert" className="form-error">{error}</p>}
    <button type="button" className="account-logout" onClick={logout} disabled={busy}>{busy ? '正在退出…' : '退出登录'}</button>
  </section>
}
