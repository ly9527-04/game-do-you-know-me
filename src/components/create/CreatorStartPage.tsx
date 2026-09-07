'use client'

import { useRouter } from 'next/navigation'
import { CreatorStart } from '@/components/create/CreatorStart'
import { EventBeacon } from '@/components/analytics/EventBeacon'

export function CreatorStartPage() {
  const router = useRouter()

  function continueToQuiz(nickname: string) {
    router.push(`/create/quiz?nickname=${encodeURIComponent(nickname)}`)
  }

  return (
    <main className="page-shell">
      <EventBeacon eventName="creator_quiz_start" metadata={{ source: 'create', surface: 'nickname' }} />
      <p className="eyebrow">第一步 · 写下你自己</p>
      <h1>先从一个昵称开始</h1>
      <p className="lede">这不是考试，只是给朋友的一张小小观察卡。</p>
      <CreatorStart onContinue={continueToQuiz} />
    </main>
  )
}
