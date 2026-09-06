const SESSION_KEY = 'know-me:anonymous-session'

export function getAnonymousSessionId(): string {
  try {
    const existing = window.localStorage.getItem(SESSION_KEY)
    if (existing) return existing
    const created = crypto.randomUUID()
    window.localStorage.setItem(SESSION_KEY, created)
    return created
  } catch {
    return crypto.randomUUID()
  }
}
