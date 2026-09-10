import { NextResponse } from 'next/server'
import { getCurrentUser, assertSameOrigin } from '@/lib/auth'
import { accountAttemptSchema } from '@/lib/account-test-validation'
import { accountApiError, apiError, readAccountBody } from '@/lib/account-api'
import { submitAccountAttempt } from '@/lib/repositories/accounts'
import { assertRateLimit } from '@/lib/rate-limit'
export async function POST(request: Request) {
  try { assertSameOrigin(request) } catch { return apiError('请求来源不正确。', 403) }
  try {
    const user = await getCurrentUser()
    if (!user) return apiError('请先登录。', 401)
    await assertRateLimit(request, 'submit_attempt')
    const parsed = accountAttemptSchema.safeParse(await readAccountBody(request).catch(() => null))
    if (!parsed.success) return apiError('请完整回答25道题。')
    if (parsed.data.expectedUserId !== user.id) return apiError('登录账号已切换，请返回首页重新进入，原账号的答题进度仍保留。', 409)
    const attemptId = await submitAccountAttempt(user.id, parsed.data.testId, parsed.data.answers)
    return NextResponse.json({ attemptId }, { headers: { 'Cache-Control': 'private, no-store' } })
  } catch (error) { return accountApiError(error) }
}
