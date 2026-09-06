'use client'

import { FormEvent, useState } from 'react'

type CreatorStartProps = {
  onContinue: (nickname: string) => void
}

export function CreatorStart({ onContinue }: CreatorStartProps) {
  const [nickname, setNickname] = useState('')
  const [error, setError] = useState('')

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const value = nickname.trim()
    const length = Array.from(value).length
    if (length < 1) {
      setError('先写下一个昵称吧。')
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
    <form className="creator-start" onSubmit={submit} noValidate>
      <label htmlFor="creator-nickname">你的昵称</label>
      <input
        id="creator-nickname"
        name="nickname"
        value={nickname}
        onChange={(event) => setNickname(event.target.value)}
        maxLength={40}
        autoComplete="nickname"
        placeholder="比如：阿钙"
      />
      {error ? <p className="form-error" role="alert">{error}</p> : null}
      <button type="submit" className="button button--primary">开始答题</button>
    </form>
  )
}
