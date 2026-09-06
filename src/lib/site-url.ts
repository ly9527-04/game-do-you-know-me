export function getCanonicalOrigin(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL
  if (!configured) throw new Error('Canonical site URL is not configured')
  const parsed = new URL(configured)
  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    throw new Error('Canonical site URL must use HTTP(S)')
  }
  return parsed.origin
}
