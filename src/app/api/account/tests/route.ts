import { NextResponse } from 'next/server'
import { getCurrentUser, assertSameOrigin } from '@/lib/auth'
import { accountTestSchema } from '@/lib/account-test-validation'
import { accountApiError, apiError, readAccountBody } from '@/lib/account-api'
import { getActiveQuestionSet } from '@/lib/repositories/tests'
import { replaceAccountTest } from '@/lib/repositories/accounts'
import { assertRateLimit } from '@/lib/rate-limit'

export async function POST(request: Request) {
  try { assertSameOrigin(request) } catch { return apiError('请求来源不正确。', 403) }
  try {
    const user = await getCurrentUser()
    if (!user) return apiError('请先登录。', 401)
    await assertRateLimit(request, 'create_test')
    const parsed = accountTestSchema.safeParse(await readAccountBody(request).catch(() => null))
    if (!parsed.success) return apiError('请选择并回答25道不同的题目。')
    if (parsed.data.expectedUserId !== user.id) return apiError('登录账号已切换，请返回首页重新进入，原账号的答题进度仍保留。', 409)
    const active = await getActiveQuestionSet()
    if (!active || active.id !== parsed.data.questionSetId) return apiError('题库已更新，请重新选题。', 409)
    const available = new Set(active.questions.map((question) => question.id))
    if (parsed.data.questionIds.some((id) => !available.has(id))) return apiError('题目不存在，请重新选题。')
    const testId = await replaceAccountTest({ ...parsed.data, userId: user.id })
    return NextResponse.json({ testId }, { headers: { 'Cache-Control': 'private, no-store' } })
  } catch (error) { return accountApiError(error) }
}
