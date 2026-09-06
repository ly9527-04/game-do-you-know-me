'use client'

import { InlineError } from '@/components/system/InlineError'

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="page-shell">
      <p className="eyebrow">先停一下</p>
      <h1>页面暂时走神了</h1>
      <InlineError message="服务暂时不可用，你的本地答案不会因此丢失。" onRetry={reset} showCreateLink />
    </main>
  )
}
