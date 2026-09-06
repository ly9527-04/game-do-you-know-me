import { randomUUID } from 'node:crypto'
import { NextResponse } from 'next/server'
import { recordEvent } from '@/lib/analytics'
import { assertRateLimit } from '@/lib/rate-limit'
import { createTestRecord, getActiveQuestionSet } from '@/lib/repositories/tests'
import { createManageToken, createShareCode, hashToken } from '@/lib/security'
import { getCanonicalOrigin } from '@/lib/site-url'
import { createTestSchema } from '@/lib/validation'

const MAX_BODY_BYTES = 32 * 1024
const CREATE_ERROR = { error: { code: 'CREATE_FAILED', message: '暂时没能封存档案，请稍后重试。' } } as const

export async function POST(request: Request) {
  let body: unknown
  try {
    const raw = await request.text()
    if (new TextEncoder().encode(raw).byteLength > MAX_BODY_BYTES) return NextResponse.json({ error: { code: 'BAD_REQUEST', message: '请求太大了。' } }, { status: 400 })
    body = JSON.parse(raw)
  } catch {
    return NextResponse.json({ error: { code: 'BAD_REQUEST', message: '请求格式不正确。' } }, { status: 400 })
  }

  if (isHoneypotHit(body)) return NextResponse.json({ error: { code: 'BAD_REQUEST', message: '请求格式不正确。' } }, { status: 400 })
  const parsed = createTestSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: { code: 'BAD_REQUEST', message: '请完整回答 25 道题。' } }, { status: 400 })

  try {
    await assertRateLimit(request, 'create_test')
  } catch (error) {
    if (isRateLimitExceeded(error)) return NextResponse.json({ error: { code: 'RATE_LIMITED', message: '今天创建得有点多，请稍后再试。' } }, { status: 429 })
    return NextResponse.json({ error: { code: 'TEMPORARILY_UNAVAILABLE', message: '服务正在喘口气，请稍后再试。' } }, { status: 503 })
  }

  try {
    const origin = getCanonicalOrigin()
    const activeSet = await getActiveQuestionSet()
    if (!activeSet) throw new Error('No active question set')

    const testId = randomUUID()
    const shareCode = createShareCode()
    const manageToken = createManageToken()
    await createTestRecord({
      testId,
      questionSetId: activeSet.id,
      nickname: parsed.data.nickname,
      shareCode,
      manageTokenHash: hashToken(manageToken),
      answers: parsed.data.answers,
    })

    void recordEvent({
      eventName: 'creator_quiz_complete',
      anonymousSessionId: parsed.data.anonymousSessionId ?? randomUUID(),
      testId,
      metadata: { source: 'create', surface: 'creator_quiz' },
    }).catch(() => undefined)

    return NextResponse.json({
      testId,
      shareUrl: new URL(`/t/${shareCode}`, origin).toString(),
      manageUrl: new URL(`/m/${manageToken}`, origin).toString(),
    })
  } catch {
    return NextResponse.json(CREATE_ERROR, { status: 500 })
  }
}

function isHoneypotHit(body: unknown): boolean {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return false
  const candidate = body as Record<string, unknown>
  return typeof candidate.website === 'string' && candidate.website.trim().length > 0
}

function isRateLimitExceeded(error: unknown): boolean {
  return Boolean(error && typeof error === 'object' && 'reason' in error && error.reason === 'exceeded')
}
