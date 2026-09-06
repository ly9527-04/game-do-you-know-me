import { NextResponse } from 'next/server'
import { recordEvent } from '@/lib/analytics'
import { assertRateLimit } from '@/lib/rate-limit'
import { eventSchema } from '@/lib/validation'

const MAX_BODY_BYTES = 16 * 1024

export async function POST(request: Request) {
  let body: unknown
  try {
    const raw = await request.text()
    if (new TextEncoder().encode(raw).byteLength > MAX_BODY_BYTES) return badRequest()
    body = JSON.parse(raw)
  } catch {
    return badRequest()
  }

  const parsed = eventSchema.safeParse(body)
  if (!parsed.success) return badRequest()

  try {
    await assertRateLimit(request, 'analytics_event')
  } catch (error) {
    if (isRateLimitExceeded(error)) {
      return NextResponse.json({ error: { code: 'RATE_LIMITED', message: '操作得有点频繁，请稍后再试。' } }, { status: 429 })
    }
    return NextResponse.json({ error: { code: 'TEMPORARILY_UNAVAILABLE', message: '服务正在喘口气，请稍后再试。' } }, { status: 503 })
  }

  // Analytics is deliberately best-effort: a failed beacon must never block the core flow.
  await recordEvent(parsed.data).catch(() => undefined)
  return new NextResponse(null, { status: 204 })
}

function isRateLimitExceeded(error: unknown): boolean {
  return Boolean(error && typeof error === 'object' && 'reason' in error && error.reason === 'exceeded')
}

function badRequest() {
  return NextResponse.json({ error: { code: 'BAD_REQUEST', message: '请求格式不正确。' } }, { status: 400 })
}
