import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { canReadResult } from '@/lib/repositories/accounts'
import { getResultSource } from '@/lib/repositories/attempts'
import { getVerdict, selectMismatches } from '@/lib/scoring'
import { accountApiError, apiError } from '@/lib/account-api'
export const dynamic = 'force-dynamic'
export async function GET(_request: Request, { params }: { params: Promise<{ attemptId: string }> }) {
  try {
    const user = await getCurrentUser()
    if (!user) return apiError('请先登录。', 401)
    const { attemptId } = await params
    if (!await canReadResult(user.id, attemptId)) return apiError('结果不可查看。', 404)
    const source = await getResultSource(attemptId)
    if (!source) return apiError('结果不可查看。', 404)
    return NextResponse.json({ creatorNickname: source.creatorNickname, friendNickname: source.friendNickname, score: source.score, verdict: getVerdict(source.score), mismatches: selectMismatches(source, attemptId, undefined, Infinity) }, { headers: { 'Cache-Control': 'private, no-store' } })
  } catch (error) { return accountApiError(error) }
}
