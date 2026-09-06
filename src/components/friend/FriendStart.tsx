'use client'

import { FormEvent, useState } from 'react'

type FriendStartProps = {
  creatorNickname: string
  onContinue: (nickname: string) => void
}

export function FriendStart({ creatorNickname, onContinue }: FriendStartProps) {
  const [nickname, setNickname] = useState('')
  const [error, setError] = useState('')

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const value = nickname.trim()
    const length = Array.from(value).length
    if (length < 1) {
      setError('留个昵称，让 TA 知道是谁猜的。')
      return
    }
    if (length > 20) {
      setError('昵称最多 20 个字。')
      return
    }
    setError('')
    onContinue(value)
  }

  return (
    <section className="friend-start" aria-labelledby="friend-start-title">
      <p className="eyebrow">朋友默契实验室</p>
      <h1 id="friend-start-title">你正在猜：{creatorNickname}</h1>
      <p className="lede">别想太久，凭第一反应回答 25 道小题。</p>
      <form className="creator-start" onSubmit={submit} noValidate>
        <label htmlFor="friend-nickname">你的昵称</label>
        <input id="friend-nickname" name="nickname" value={nickname} onChange={(event) => setNickname(event.target.value)} maxLength={40} autoComplete="nickname" placeholder="比如：小明" />
        {error ? <p className="form-error" role="alert">{error}</p> : null}
        <button type="submit" className="button button--primary">开始猜</button>
      </form>
    </section>
  )
}
