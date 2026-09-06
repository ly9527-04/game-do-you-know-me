import { describe, expect, it } from 'vitest'

import {
  createManageToken,
  createShareCode,
  hashToken,
  signManageSession,
  verifyManageSession,
} from '@/lib/security'

const testId = '10000000-0000-4000-8000-000000000001'

process.env.MANAGEMENT_SESSION_SECRET = 'unit-test-management-session-secret'

describe('security utilities', () => {
  it('creates opaque base64url tokens and hashes tokens deterministically', () => {
    const manageToken = createManageToken()
    const shareCode = createShareCode()

    expect(manageToken).toMatch(/^[A-Za-z0-9_-]{43}$/)
    expect(shareCode).toMatch(/^[A-Za-z0-9_-]{11}$/)
    expect(hashToken('same-token')).toBe(hashToken('same-token'))
    expect(hashToken('same-token')).toMatch(/^[a-f0-9]{64}$/)
    expect(hashToken('same-token')).not.toContain('same-token')
  })

  it('accepts an authenticated unexpired management session', () => {
    const now = 1_700_000_000
    const session = signManageSession(testId, now + 3600)

    expect(verifyManageSession(session, now)).toEqual({ testId, expires: now + 3600 })
  })

  it('rejects malformed, tampered, expired, and expiry-boundary sessions', () => {
    const now = 1_700_000_000
    const session = signManageSession(testId, now + 3600)
    const tampered = `${session.slice(0, -1)}${session.endsWith('A') ? 'B' : 'A'}`

    expect(verifyManageSession(tampered, now)).toBeNull()
    expect(verifyManageSession(signManageSession(testId, now), now)).toBeNull()
    expect(verifyManageSession('v1.invalid', now)).toBeNull()
  })
})
