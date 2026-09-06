'use client'

import Link, { type LinkProps } from 'next/link'
import type { MouseEvent, ReactNode } from 'react'
import type { AnalyticsEventName } from '@/lib/validation'
import { getAnonymousSessionId } from '@/lib/anonymous-session'

type TrackedLinkProps = LinkProps & {
  eventName: AnalyticsEventName
  metadata?: Record<string, string>
  className?: string
  children: ReactNode
}

export function TrackedLink({ eventName, metadata, children, ...props }: TrackedLinkProps) {
  function handleClick(_event: MouseEvent<HTMLAnchorElement>) {
    sendAnalyticsEvent(eventName, metadata)
  }

  return <Link {...props} onClick={handleClick}>{children}</Link>
}

export function sendAnalyticsEvent(eventName: AnalyticsEventName, metadata?: Record<string, string>) {
  void fetch('/api/events', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ eventName, anonymousSessionId: getAnonymousSessionId(), metadata }),
    keepalive: true,
  }).catch(() => undefined)
}
