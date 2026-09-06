'use client'

import { TrackedLink } from '@/components/analytics/TrackedLink'
import { ResumeDraft } from '@/components/system/ResumeDraft'

export function HomeActions() {
  function draftHref(nickname: string) {
    return `/create/quiz?nickname=${encodeURIComponent(nickname)}`
  }

  return (
    <>
      <ResumeDraft getContinueHref={(draft) => draftHref(draft.nickname)} getRestartHref={(draft) => draftHref(draft.nickname)} />
      <TrackedLink className="button button--primary" href="/create" eventName="create_test_click" metadata={{ source: 'home', surface: 'hero' }}>创建我的测试</TrackedLink>
    </>
  )
}
