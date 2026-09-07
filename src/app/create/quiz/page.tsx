import { CreatorQuiz } from '@/components/create/CreatorQuiz'
import { getActiveQuestionSet } from '@/lib/repositories/tests'

export default async function CreatorQuizPage({ searchParams }: { searchParams: Promise<{ nickname?: string }> }) {
  const params = await searchParams
  const nickname = params.nickname?.trim() ?? ''
  if (!nickname) {
    return <main className="page-shell"><h1>找不到这个昵称</h1><p>请回到创建页重新开始。</p></main>
  }
  const activeSet = await getActiveQuestionSet().catch(() => null)
  if (!activeSet || activeSet.questions.length < 25) {
    return <main className="page-shell"><h1>题目还没准备好</h1><p>请稍后刷新页面再试。</p></main>
  }
  return <main className="page-shell"><CreatorQuiz nickname={nickname} questionSetVersion={activeSet.version} questions={activeSet.questions} /></main>
}
