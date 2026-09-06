'use client'

import { useRouter } from 'next/navigation'
import { FriendStart } from '@/components/friend/FriendStart'
import { ResumeDraft } from '@/components/system/ResumeDraft'

export function FriendStartPage({ shareCode, creatorNickname }: { shareCode: string; creatorNickname: string }) {
  const router = useRouter()
  const continueToQuiz = (nickname: string) => router.push(`/t/${encodeURIComponent(shareCode)}/quiz?nickname=${encodeURIComponent(nickname)}`)

  return (
    <main className="page-shell">
      <ResumeDraft mode="friend" draftIdentity={shareCode} onContinue={(draft) => continueToQuiz(draft.nickname)} />
      <FriendStart creatorNickname={creatorNickname} onContinue={continueToQuiz} />
    </main>
  )
}
