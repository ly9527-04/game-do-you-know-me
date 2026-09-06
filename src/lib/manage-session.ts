import { verifyManageSession } from '@/lib/security'

export const MANAGE_SESSION_MAX_AGE = 24 * 60 * 60

export function manageCookieName(): '__Host-manage_session' | 'manage_session' {
  return process.env.NODE_ENV === 'production' ? '__Host-manage_session' : 'manage_session'
}

export { verifyManageSession }
