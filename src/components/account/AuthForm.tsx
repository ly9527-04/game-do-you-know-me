'use client'
import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
export function AuthForm() {
  const router = useRouter()
  const [register, setRegister] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy) return
    const form = new FormData(event.currentTarget)
    const body = { account: String(form.get('account')), password: String(form.get('password')),
      ...(register ? { nickname: String(form.get('nickname')), confirmPassword: String(form.get('confirmPassword')) } : {}) }
    setBusy(true); setError('')
    try {
      const response = await fetch('/api/auth/' + (register ? 'register' : 'login'), { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error?.message ?? '暂时无法登录，请稍后再试。')
      router.refresh()
    } catch (cause) { setError(cause instanceof Error ? cause.message : '网络异常，请稍后重试。') }
    finally { setBusy(false) }
  }
  return <section>
    <div className="home-orbit" aria-hidden="true"><span>?</span></div>
    <p className="eyebrow">FRIENDSHIP CHALLENGE · 默契挑战</p>
    <h1 className="gradient-text">你朋友真的懂你吗？</h1>
    <p className="lede">登录后，创建你的25道题，或用朋友的账号挑战TA。</p>
    <div className="account-tabs" aria-label="登录或注册">
      <button type="button" className="button button--secondary" aria-pressed={!register} disabled={busy} onClick={() => { setRegister(false); setError('') }}>登录</button>
      <button type="button" className="button button--secondary" aria-pressed={register} disabled={busy} onClick={() => { setRegister(true); setError('') }}>注册</button>
    </div>
    <form className="creator-start" onSubmit={submit} key={String(register)}>
      {register && <><label htmlFor="nickname">你的名字</label><input id="nickname" name="nickname" autoComplete="nickname" required maxLength={40} placeholder="朋友认识的那个名字" disabled={busy} /></>}
      <label htmlFor="account">8位数字账号</label>
      <input id="account" name="account" type="text" inputMode="numeric" pattern="[0-9]{8}" minLength={8} maxLength={8} autoComplete="username" required placeholder="例如 00123456" disabled={busy} aria-describedby={register ? 'account-hint' : undefined} />
      {register && <small id="account-hint" className="lede">自己设置8位数字，不能与已有账号重复。</small>}
      <label htmlFor="password">密码</label><input id="password" name="password" type="password" minLength={8} maxLength={128} autoComplete={register ? 'new-password' : 'current-password'} required disabled={busy} placeholder="至少8位" />
      {register && <><label htmlFor="confirmPassword">确认密码</label><input id="confirmPassword" name="confirmPassword" type="password" minLength={8} maxLength={128} autoComplete="new-password" required disabled={busy} /><p className="account-notice">本站暂不支持找回密码，请妥善保存账号密码。</p></>}
      {error && <p role="alert" className="form-error">{error}</p>}
      <button className="button button--primary" disabled={busy}>{busy ? '请稍候…' : register ? '注册并进入' : '登录'}</button>
    </form>
  </section>
}
