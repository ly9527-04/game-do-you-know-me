import 'server-only'

import { createServerDb } from '@/lib/supabase/server'
import { eventSchema } from '@/lib/validation'

export type { AnalyticsEventName } from '@/lib/validation'
export type { AnalyticsEventInput } from '@/lib/validation'

export class AnalyticsError extends Error {
  constructor() {
    super('Analytics recording failed')
    this.name = 'AnalyticsError'
  }
}

export async function recordEvent(input: unknown): Promise<void> {
  const event = eventSchema.parse(input)
  const { error } = await createServerDb().from('analytics_events').insert({
    event_name: event.eventName,
    anonymous_session_id: event.anonymousSessionId,
    test_id: event.testId ?? null,
    attempt_id: event.attemptId ?? null,
    metadata: event.metadata,
  })

  if (error) throw new AnalyticsError()
}
