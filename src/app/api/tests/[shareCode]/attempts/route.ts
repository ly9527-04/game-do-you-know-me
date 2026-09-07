import { randomUUID } from 'node:crypto'
import { NextResponse } from 'next/server'
import { recordEvent } from '@/lib/analytics'
import { assertRateLimit } from '@/lib/rate-limit'
import { createAttemptRecord } from '@/lib/repositories/attempts'
import { getCreatorAnswers, getPublicTest } from '@/lib/repositories/tests'
import { scoreAnswers } from '@/lib/scoring'
import { createAttemptSchema, validateSelectedAnswers } from '@/lib/validation'
import { getCanonicalOrigin } from '@/lib/site-url'

const MAX_BODY_BYTES = 32 * 1024
const ATTEMPT_ERROR = { error: { code: 'ATTEMPT_FAILED', message: '暂时没能记下这次挑战，请稍后重试。' } } as const

type RouteContext = { params: Promise<{ shareCode: string }> }

export async function POST(request: Request, context: RouteContext) {
  const { shareCode } = await context.params
  let body: unknown
  try {
    const raw = await request.text()
    if (new TextEncoder().encode(raw).byteLength > MAX_BODY_BYTES) return badRequest()
    body = JSON.parse(raw)
  } catch {
    return badRequest()
  }

  if (isHoneypotHit(body)) return badRequest()
  const parsed = createAttemptSchema.safeParse(stripClientScore(body))
  if (!parsed.success) return badRequest()

  try {
    await assertRateLimit(request, 'submit_attempt')
  } catch (error) {
    if (isRateLimitExceeded(error)) return NextResponse.json({ error: { code: 'RATE_LIMITED', message: '今天挑战得有点多，请稍后再试。' } }, { status: 429 })
    return NextResponse.json({ error: { code: 'TEMPORARILY_UNAVAILABLE', message: '服务正在喘口气，请稍后再试。' } }, { status: 503 })
  }

  try {
    const origin = getCanonicalOrigin()
    const test = await getPublicTest(shareCode)
    if (!test || test.questions.length !== 25) return NextResponse.json({ error: { code: 'TEST_NOT_FOUND', message: '找不到这张测试卡。' } }, { status: 404 })
    if (!validateSelectedAnswers(test.questions.map((question) => question.id), parsed.data.answers)) return badRequest()
    const creatorAnswers = await getCreatorAnswers(test.testId)
    const scoreResult = scoreAnswers(creatorAnswers, parsed.data.answers, test.questions)
    const attemptId = randomUUID()
    const persistedAttemptId = await createAttemptRecord({
      attemptId,
      testId: test.testId,
      nickname: parsed.data.nickname,
      idempotencyKey: parsed.data.idempotencyKey,
      answers: parsed.data.answers,
      scoreResult,
    })

    void recordEvent({
      eventName: 'friend_quiz_complete',
      anonymousSessionId: parsed.data.anonymousSessionId ?? randomUUID(),
      testId: test.testId,
      attemptId: persistedAttemptId,
      metadata: { source: 'challenge', surface: 'friend_quiz' },
    }).catch(() => undefined)

    return NextResponse.json({ attemptId: persistedAttemptId, resultUrl: new URL(`/r/${persistedAttemptId}`, origin).toString() })
  } catch {
    return NextResponse.json(ATTEMPT_ERROR, { status: 500 })
  }
}

function stripClientScore(body: unknown): unknown {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return body
  const { score: _ignored, ...withoutScore } = body as Record<string, unknown>
  return withoutScore
}

function isHoneypotHit(body: unknown): boolean {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return false
  const value = (body as Record<string, unknown>).website
  return typeof value === 'string' && value.trim().length > 0
}

function isRateLimitExceeded(error: unknown): boolean {
  return Boolean(error && typeof error === 'object' && 'reason' in error && error.reason === 'exceeded')
}

function badRequest() {
  return NextResponse.json({ error: { code: 'BAD_REQUEST', message: '请检查昵称和 25 道答案。' } }, { status: 400 })
}
