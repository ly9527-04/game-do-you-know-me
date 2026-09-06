import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  assertRateLimit: vi.fn(),
  recordEvent: vi.fn(),
}))

vi.mock('@/lib/rate-limit', () => ({
  assertRateLimit: mocks.assertRateLimit,
}))
vi.mock('@/lib/analytics', () => ({
  recordEvent: mocks.recordEvent,
}))
vi.mock('server-only', () => ({}))

import { POST } from '@/app/api/events/route'

const anonymousSessionId = '10000000-0000-4000-8000-000000000001'
const eventNames = [
  'homepage_view',
  'create_test_click',
  'creator_quiz_start',
  'creator_quiz_complete',
  'share_link_copy',
  'friend_quiz_start',
  'friend_quiz_complete',
  'friend_create_own_test_click',
] as const

function request(body: unknown) {
  return new Request('https://me.ly0688.online/api/events', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-forwarded-for': '203.0.113.1' },
    body: JSON.stringify(body),
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  mocks.assertRateLimit.mockResolvedValue(undefined)
  mocks.recordEvent.mockResolvedValue(undefined)
})

describe('POST /api/events', () => {
  it.each(eventNames)('accepts %s', async (eventName) => {
    const response = await POST(request({ eventName, anonymousSessionId, metadata: { source: 'test' } }))

    expect(response.status).toBe(204)
    expect(mocks.recordEvent).toHaveBeenCalledWith(expect.objectContaining({ eventName, anonymousSessionId }))
  })

  it('rejects unknown events and sensitive metadata', async () => {
    const unknown = await POST(request({ eventName: 'secret_event', anonymousSessionId }))
    const sensitive = await POST(request({ eventName: 'homepage_view', anonymousSessionId, metadata: { answer: 'A' } }))

    expect(unknown.status).toBe(400)
    expect(sensitive.status).toBe(400)
    expect(mocks.recordEvent).not.toHaveBeenCalled()
  })

  it('returns 429 when the analytics limit is exceeded', async () => {
    mocks.assertRateLimit.mockRejectedValueOnce({ reason: 'exceeded' })

    const response = await POST(request({ eventName: 'homepage_view', anonymousSessionId }))

    expect(response.status).toBe(429)
    expect(mocks.recordEvent).not.toHaveBeenCalled()
  })

  it('keeps the beacon endpoint successful when persistence is temporarily down', async () => {
    mocks.recordEvent.mockRejectedValueOnce(new Error('database details'))

    const response = await POST(request({ eventName: 'homepage_view', anonymousSessionId }))

    expect(response.status).toBe(204)
  })
})
