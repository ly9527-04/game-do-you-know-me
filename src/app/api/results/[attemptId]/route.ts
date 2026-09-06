import { NextResponse } from 'next/server'
import { getResultSource } from '@/lib/repositories/attempts'
import { getVerdict, selectMismatches } from '@/lib/scoring'

export const dynamic = 'force-dynamic'

export async function GET(_request: Request, { params }: { params: Promise<{ attemptId: string }> }) {
  const { attemptId } = await params
  try {
    const source = await getResultSource(attemptId)
    if (!source) return NextResponse.json({ error: { code: 'RESULT_NOT_FOUND', message: '找不到这次挑战。' } }, { status: 404 })
    const mismatches = selectMismatches(source, attemptId).slice(0, 3)
    const response = NextResponse.json({
      creatorNickname: source.creatorNickname,
      friendNickname: source.friendNickname,
      score: source.score,
      verdict: getVerdict(source.score),
      mismatches,
    })
    response.headers.set('Cache-Control', 'private, no-store')
    return response
  } catch {
    return NextResponse.json({ error: { code: 'RESULT_UNAVAILABLE', message: '结果暂时打不开，请稍后再试。' } }, { status: 503 })
  }
}
