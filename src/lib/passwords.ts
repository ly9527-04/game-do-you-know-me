import 'server-only'
import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto'

const N = 32768
const OPTIONS = { N, r: 8, p: 1, maxmem: 64 * 1024 * 1024 }
// Fixed valid-format hash: absent accounts still perform the same scrypt work.
export const DUMMY_PASSWORD_HASH = 'scrypt$32768$8$1$' + '00'.repeat(16) + '$' + '00'.repeat(64)
function derive(password: string, salt: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(password, salt, 64, OPTIONS, (error, key) => error ? reject(error) : resolve(key))
  })
}
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16)
  const key = await derive(password, salt)
  return `scrypt$${N}$8$1$${salt.toString('hex')}$${key.toString('hex')}`
}
export async function verifyPassword(password: string, encoded: string): Promise<boolean> {
  const match = /^scrypt\$32768\$8\$1\$([0-9a-f]{32})\$([0-9a-f]{128})$/.exec(encoded)
  if (!match) return false
  const actual = await derive(password, Buffer.from(match[1], 'hex'))
  return timingSafeEqual(actual, Buffer.from(match[2], 'hex'))
}
