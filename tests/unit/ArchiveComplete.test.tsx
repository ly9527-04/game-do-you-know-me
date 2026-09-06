import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ sendAnalyticsEvent: vi.fn() }))
vi.mock('@/components/analytics/EventBeacon', () => ({ sendAnalyticsEvent: mocks.sendAnalyticsEvent }))

import { ArchiveComplete } from '@/components/create/ArchiveComplete'

afterEach(() => {
  vi.clearAllMocks()
})

describe('ArchiveComplete', () => {
  it('records share_link_copy only after the friend link is copied', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.assign(navigator, { clipboard: { writeText } })
    render(<ArchiveComplete shareUrl="https://me.ly0688.online/t/share" manageUrl="https://me.ly0688.online/m/manage" />)

    fireEvent.click(screen.getByRole('button', { name: '复制朋友链接' }))

    await waitFor(() => expect(writeText).toHaveBeenCalledWith('https://me.ly0688.online/t/share'))
    expect(mocks.sendAnalyticsEvent).toHaveBeenCalledWith('share_link_copy', { source: 'create', surface: 'archive_complete' })
  })

  it('does not count a failed clipboard write as a share', async () => {
    Object.assign(navigator, { clipboard: { writeText: vi.fn().mockRejectedValue(new Error('blocked')) } })
    render(<ArchiveComplete shareUrl="https://me.ly0688.online/t/share" manageUrl="https://me.ly0688.online/m/manage" />)

    fireEvent.click(screen.getByRole('button', { name: '复制朋友链接' }))

    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('复制失败，请长按链接复制'))
    expect(mocks.sendAnalyticsEvent).not.toHaveBeenCalled()
  })
})
