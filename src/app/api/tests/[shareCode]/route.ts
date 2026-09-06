import { NextResponse } from 'next/server'
import { getPublicTest } from '@/lib/repositories/tests'

type RouteContext = { params: Promise<{ shareCode: string }> }

export async function GET(_request: Request, context: RouteContext) {
  const { shareCode } = await context.params
  try {
    const test = await getPublicTest(shareCode)
    if (!test || test.questions.length !== 25) return notFound()

    const response = NextResponse.json({
      testId: test.testId,
      creatorNickname: test.creatorNickname,
      questionSetVersion: test.questionSetVersion,
      questions: test.questions.map(({ id, order, prompt, options }) => ({ id, order, prompt, options })),
    })
    response.headers.set('Cache-Control', 'private, no-store')
    return response
  } catch {
    return NextResponse.json({ error: { code: 'TEST_UNAVAILABLE', message: '这张测试卡暂时打不开，请稍后再试。' } }, { status: 503 })
  }
}

function notFound() {
  return NextResponse.json({ error: { code: 'TEST_NOT_FOUND', message: '找不到这张测试卡。' } }, { status: 404 })
}
