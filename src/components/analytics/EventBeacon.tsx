'use client'

import { useEffect } from 'react'
import { getAnonymousSessionId } from '@/lib/anonymous-session'
import type { AnalyticsEventName } from '@/lib/validation'

type EventBeaconProps = {
  eventName: AnalyticsEventName
  testId?: string
  metadata?: Record<string, unknown>
}

export function EventBeacon({ eventName, testId, metadata }: EventBeaconProps) {
  const metadataKey = JSON.stringify(metadata ?? {})

  useEffect(() => {
    const onceKey = `know-me:event:${eventName}`
    if (eventName === 'homepage_view' && hasSessionMarker(onceKey)) return
    if (eventName === 'homepage_view') markSession(onceKey)
    sendAnalyticsEvent(eventName, JSON.parse(metadataKey) as Record<string, unknown>, testId)
  }, [eventName, testId, metadataKey])

  return null
}

export function sendAnalyticsEvent(eventName: AnalyticsEventName, metadata?: Record<string, unknown>, testId?: string) {
  const anonymousSessionId = getAnonymousSessionId()
  void fetch('/api/events', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ eventName, anonymousSessionId, testId, metadata }),
    keepalive: true,
  }).catch(() => undefined)
}

function hasSessionMarker(key: string): boolean {
  try {
    return window.sessionStorage.getItem(key) === '1'
  } catch {
    return false
  }
}

function markSession(key: string): void {
  try {
    window.sessionStorage.setItem(key, '1')
  } catch {
    // Session storage is optional; the beacon remains best-effort.
  }
}
