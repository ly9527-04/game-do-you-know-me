import 'server-only'

import { createHmac } from 'node:crypto'
import { isIP } from 'node:net'

import { createServerDb } from '@/lib/supabase/server'

const RATE_LIMITS = {
  create_test: { limit: 5, windowSeconds: 10 * 60 },
  submit_attempt: { limit: 20, windowSeconds: 10 * 60 },
  analytics_event: { limit: 60, windowSeconds: 60 },
} as const

export type RateLimitAction = keyof typeof RATE_LIMITS

export class RateLimitError extends Error {
  constructor(readonly reason: 'exceeded' | 'unavailable' | 'invalid_request') {
    super(reason === 'exceeded' ? 'Rate limit exceeded' : 'Rate limit unavailable')
    this.name = 'RateLimitError'
  }
}

function anonymousKeySecret(): string {
  const secret = process.env.RATE_LIMIT_SECRET
  if (!secret) throw new RateLimitError('unavailable')
  return secret
}

function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get('x-forwarded-for')
  if (!forwardedFor) throw new RateLimitError('invalid_request')

  // Vercel puts the originating client first; later comma-separated values are proxies.
  const clientIp = forwardedFor.split(',', 1)[0]?.trim()
  if (!clientIp || isIP(clientIp) === 0) throw new RateLimitError('invalid_request')
  return clientIp
}

function hashAnonymousKey(clientIp: string): string {
  return createHmac('sha256', anonymousKeySecret()).update(clientIp, 'utf8').digest('hex')
}

export async function assertRateLimit(request: Request, action: RateLimitAction): Promise<void> {
  const policy = RATE_LIMITS[action]
  if (!policy) throw new RateLimitError('invalid_request')

  const rpcInput = {
    p_key_hash: hashAnonymousKey(getClientIp(request)),
    p_action: action,
    p_limit: policy.limit,
    p_window_seconds: policy.windowSeconds,
  }

  try {
    const { data, error } = await createServerDb().rpc('check_rate_limit', rpcInput)

    if (error) throw new RateLimitError('unavailable')
    if (data !== true) throw new RateLimitError('exceeded')
  } catch (error) {
    if (error instanceof RateLimitError) throw error
    throw new RateLimitError('unavailable')
  }
}
