'use client'

import { useState } from 'react'
import { getAnonymousSessionId } from '@/lib/anonymous-session'

type ShareActionsProps = {
  resultUrl: string
  title: string
  text: string
}

export function ShareActions({ resultUrl, title, text }: ShareActionsProps) {
  const [status, setStatus] = useState('')

  async function share() {
    if (typeof navigator.share !== 'function') {
      await copy()
      return
    }
    try {
      await navigator.share({ title, text, url: resultUrl })
    } catch (error) {
      if (isShareCancellation(error)) return
      await copy()
    }
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(resultUrl)
      setStatus('链接已复制')
      void fetch('/api/events', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ eventName: 'share_link_copy', anonymousSessionId: getAnonymousSessionId(), metadata: { source: 'result', surface: 'share_actions' } }),
        keepalive: true,
      }).catch(() => undefined)
    } catch {
      setStatus('复制失败，请长按链接复制')
    }
  }

  return (
    <section className="share-actions" aria-label="分享结果">
      <button className="button button--primary" type="button" onClick={share}>分享结果</button>
      <button className="button button--secondary" type="button" onClick={copy}>复制结果链接</button>
      {status ? <p role="status">{status}</p> : null}
    </section>
  )
}

function isShareCancellation(error: unknown): boolean {
  return Boolean(error && typeof error === 'object' && 'name' in error && error.name === 'AbortError')
}
