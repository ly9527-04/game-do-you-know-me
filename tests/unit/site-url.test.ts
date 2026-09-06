import { afterEach, describe, expect, it } from 'vitest'
import { getCanonicalOrigin } from '@/lib/site-url'

afterEach(() => {
  delete process.env.NEXT_PUBLIC_SITE_URL
})

describe('canonical site URL', () => {
  it('returns only the configured HTTP(S) origin', () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://me.ly0688.online/some/path'
    expect(getCanonicalOrigin()).toBe('https://me.ly0688.online')
  })

  it('rejects missing and non-HTTP(S) configuration instead of leaking a localhost link', () => {
    expect(() => getCanonicalOrigin()).toThrow('Canonical site URL is not configured')
    process.env.NEXT_PUBLIC_SITE_URL = 'ftp://me.ly0688.online'
    expect(() => getCanonicalOrigin()).toThrow('Canonical site URL must use HTTP(S)')
  })
})
