'use client'
import { useRouter } from 'next/navigation'
import { useState, type FormEvent } from 'react'
export function FriendSearch() {
  const router = useRouter()
  const [account, setAccount] = useState('')
  function submit(event: FormEvent) { event.preventDefault(); if (/^[0-9]{8}$/.test(account)) router.push('/friend/' + account) }
  return <form className="creator-start" onSubmit={submit}><label htmlFor="friend-account">朋友的8位数字账号</label><input id="friend-account" value={account} onChange={(event) => setAccount(event.target.value)} type="text" inputMode="numeric" minLength={8} maxLength={8} pattern="[0-9]{8}" autoComplete="off" required placeholder="输入朋友告诉你的账号" /><button className="button button--primary">查找朋友的测试</button></form>
}
