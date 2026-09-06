import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createHmac } from 'node:crypto'

const { createServerDb, from, insert, rpc } = vi.hoisted(() => ({
  createServerDb: vi.fn(),
  from: vi.fn(),
  insert: vi.fn(),
  rpc: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({ createServerDb }))
vi.mock('server-only', () => ({}))

import { recordEvent } from '@/lib/analytics'
import { assertRateLimit, RateLimitError } from '@/lib/rate-limit'

const anonymousSessionId = '10000000-0000-4000-8000-000000000001'

beforeEach(() => {
  vi.clearAllMocks()
  insert.mockResolvedValue({ error: null })
  rpc.mockResolvedValue({ data: true, error: null })
  from.mockReturnValue({ insert })
  createServerDb.mockReturnValue({ from, rpc })
  process.env.RATE_LIMIT_SECRET = 'unit-test-rate-limit-secret'
})

describe('analytics recording', () => {
  it('persists only whitelisted non-sensitive metadata', async () => {
    await expect(recordEvent({
      eventName: 'friend_quiz_complete',
      anonymousSessionId,
      metadata: { source: 'quiz', ignored: 'discard-me' },
    })).resolves.toBeUndefined()

    expect(from).toHaveBeenCalledWith('analytics_events')
    expect(insert).toHaveBeenCalledWith({
      event_name: 'friend_quiz_complete',
      anonymous_session_id: anonymousSessionId,
      test_id: null,
      attempt_id: null,
      metadata: { source: 'quiz' },
    })
  })

  it('rejects sensitive metadata before a database write', async () => {
    await expect(recordEvent({
      eventName: 'homepage_view',
      anonymousSessionId,
      metadata: { ip: '203.0.113.1' },
    })).rejects.toThrow()

    expect(from).not.toHaveBeenCalled()
  })

  it('hashes only the first Vercel forwarded client IP before calling the RPC', async () => {
    await expect(assertRateLimit(new Request('https://me.ly0688.online/api/events', {
      headers: { 'x-forwarded-for': '203.0.113.1, 10.0.0.1' },
    }), 'analytics_event')).resolves.toBeUndefined()

    expect(rpc).toHaveBeenCalledWith('check_rate_limit', {
      p_key_hash: createHmac('sha256', 'unit-test-rate-limit-secret').update('203.0.113.1', 'utf8').digest('hex'),
      p_action: 'analytics_event',
      p_limit: 60,
      p_window_seconds: 60,
    })
    expect(JSON.stringify(rpc.mock.calls)).not.toContain('203.0.113.1')
  })

  it('does not expose an RPC error when rate limiting is unavailable', async () => {
    rpc.mockResolvedValue({ data: null, error: { message: 'connection details must stay private' } })

    await expect(assertRateLimit(new Request('https://me.ly0688.online/api/events', {
      headers: { 'x-forwarded-for': '203.0.113.1' },
    }), 'analytics_event')).rejects.toEqual(expect.objectContaining({
      name: 'RateLimitError',
      reason: 'unavailable',
    } satisfies Partial<RateLimitError>))
  })

  it('maps a rejected RPC promise to the same safe unavailable error', async () => {
    rpc.mockRejectedValue(new Error('database connection details must stay private'))

    await expect(assertRateLimit(new Request('https://me.ly0688.online/api/events', {
      headers: { 'x-forwarded-for': '203.0.113.1' },
    }), 'analytics_event')).rejects.toEqual(expect.objectContaining({
      name: 'RateLimitError',
      reason: 'unavailable',
    } satisfies Partial<RateLimitError>))
  })
})
