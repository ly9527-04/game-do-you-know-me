'use client'

import { useState } from 'react'
import { sendAnalyticsEvent } from '@/components/analytics/EventBeacon'

type ArchiveCompleteProps = {
  shareUrl: string
  manageUrl: string
}

export function ArchiveComplete({ shareUrl, manageUrl }: ArchiveCompleteProps) {
  const [copyStatus, setCopyStatus] = useState<{ kind: 'share' | 'manage'; message: string } | null>(null)

  async function copy(value: string, kind: 'share' | 'manage') {
    try {
      await navigator.clipboard.writeText(value)
      setCopyStatus({ kind, message: kind === 'share' ? '已复制朋友链接' : '已复制管理链接' })
      if (kind === 'share') sendAnalyticsEvent('share_link_copy', { source: 'create', surface: 'archive_complete' })
    } catch {
      setCopyStatus({ kind, message: '复制失败，请长按链接复制' })
    }
  }

  return (
    <section className="archive-complete" aria-labelledby="archive-complete-title">
      <p className="eyebrow">档案已封存</p>
      <h1 id="archive-complete-title">把这张小卡片发给朋友吧</h1>
      <p>朋友答完后，你们会看到彼此眼里的那一点偏差。</p>
      <div className="archive-complete__actions">
        <button className="button button--primary" type="button" onClick={() => copy(shareUrl, 'share')}>复制朋友链接</button>
        {copyStatus?.kind === 'share' ? <span role="status">{copyStatus.message}</span> : null}
      </div>
      <details className="archive-complete__manage">
        <summary>查看我的管理链接</summary>
        <p>这条链接只属于你，建议保存到备忘录。</p>
        <code>{manageUrl}</code>
        <button className="button button--secondary" type="button" onClick={() => copy(manageUrl, 'manage')}>复制管理链接</button>
        {copyStatus?.kind === 'manage' ? <span role="status">{copyStatus.message}</span> : null}
      </details>
    </section>
  )
}
