import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto'

const SESSION_VERSION = 'v1'
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export interface ManageSession {
  readonly testId: string
  readonly expires: number
}

export const createManageToken = () => randomBytes(32).toString('base64url')

export const createShareCode = () => randomBytes(8).toString('base64url')

export const hashToken = (token: string) =>
  createHash('sha256').update(token, 'utf8').digest('hex')

function managementSessionSecret(): string {
  const secret = process.env.MANAGEMENT_SESSION_SECRET
  if (!secret) throw new Error('Management session configuration is unavailable')
  return secret
}

function signingPayload(testId: string, expires: number): string {
  return `${SESSION_VERSION}.${testId}.${expires}`
}

export function signManageSession(testId: string, expires: number): string {
  if (!UUID_PATTERN.test(testId) || !Number.isSafeInteger(expires) || expires <= 0) {
    throw new Error('Invalid management session payload')
  }

  const payload = signingPayload(testId, expires)
  const signature = createHmac('sha256', managementSessionSecret()).update(payload, 'utf8').digest('base64url')
  return `${payload}.${signature}`
}

export function verifyManageSession(serializedSession: string, now = Math.floor(Date.now() / 1000)): ManageSession | null {
  const parts = serializedSession.split('.')
  if (parts.length !== 4) return null

  const [version, testId, expiresText, signature] = parts
  if (version !== SESSION_VERSION || !UUID_PATTERN.test(testId) || !/^\d+$/.test(expiresText)) return null

  const expires = Number(expiresText)
  if (!Number.isSafeInteger(expires) || expires <= now) return null

  const expectedSignature = createHmac('sha256', managementSessionSecret())
    .update(signingPayload(testId, expires), 'utf8')
    .digest()
  const receivedSignature = Buffer.from(signature, 'base64url')

  if (
    receivedSignature.length !== expectedSignature.length
    || receivedSignature.toString('base64url') !== signature
    || !timingSafeEqual(receivedSignature, expectedSignature)
  ) return null

  return { testId, expires }
}
