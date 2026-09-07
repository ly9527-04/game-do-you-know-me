import { CreatorQuiz } from '@/components/create/CreatorQuiz'
import { QUESTION_POOL } from '@/lib/questions'

export default async function CreatorQuizPage({ searchParams }: { searchParams: Promise<{ nickname?: string }> }) {
  const params = await searchParams
  const nickname = params.nickname?.trim() ?? ''
  if (!nickname) {
    return <main className="page-shell"><h1>找不到这个昵称</h1><p>请回到创建页重新开始。</p></main>
  }
  return <main className="page-shell"><CreatorQuiz nickname={nickname} questionSetVersion={2} questions={QUESTION_POOL} /></main>
}
