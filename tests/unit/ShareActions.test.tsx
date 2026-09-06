import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ShareActions } from '@/components/share/ShareActions'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('ShareActions', () => {
  it('copies the canonical URL when navigator.share is unavailable and records the event', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.assign(navigator, { clipboard: { writeText }, share: undefined })
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{}', { status: 202 }))
    render(<ShareActions resultUrl="https://me.ly0688.online/r/abc" title="你真的懂我吗" text="来看看我们有多默契" />)

    fireEvent.click(screen.getByRole('button', { name: '复制结果链接' }))

    await waitFor(() => expect(writeText).toHaveBeenCalledWith('https://me.ly0688.online/r/abc'))
    expect(screen.getByRole('status')).toHaveTextContent('链接已复制')
    expect(fetchMock).toHaveBeenCalledWith('/api/events', expect.objectContaining({ method: 'POST' }))
  })

  it('prefers the system share sheet when available', async () => {
    const share = vi.fn().mockResolvedValue(undefined)
    Object.assign(navigator, { share })
    render(<ShareActions resultUrl="https://me.ly0688.online/r/abc" title="你真的懂我吗" text="来看看我们有多默契" />)

    fireEvent.click(screen.getByRole('button', { name: '分享结果' }))

    await waitFor(() => expect(share).toHaveBeenCalledWith({ title: '你真的懂我吗', text: '来看看我们有多默契', url: 'https://me.ly0688.online/r/abc' }))
  })

  it('falls back to copying when the system share sheet fails unexpectedly', async () => {
    const share = vi.fn().mockRejectedValue(new Error('share service unavailable'))
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.assign(navigator, { share, clipboard: { writeText } })
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(null, { status: 204 }))
    render(<ShareActions resultUrl="https://me.ly0688.online/r/abc" title="你真的懂我吗" text="来看看我们有多默契" />)

    fireEvent.click(screen.getByRole('button', { name: '分享结果' }))

    await waitFor(() => expect(writeText).toHaveBeenCalledWith('https://me.ly0688.online/r/abc'))
    expect(screen.getByRole('status')).toHaveTextContent('链接已复制')
  })

  it('does not copy when the user cancels the system share sheet', async () => {
    const cancelled = Object.assign(new Error('cancelled'), { name: 'AbortError' })
    const share = vi.fn().mockRejectedValue(cancelled)
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.assign(navigator, { share, clipboard: { writeText } })
    render(<ShareActions resultUrl="https://me.ly0688.online/r/abc" title="你真的懂我吗" text="来看看我们有多默契" />)

    fireEvent.click(screen.getByRole('button', { name: '分享结果' }))

    await waitFor(() => expect(share).toHaveBeenCalled())
    expect(writeText).not.toHaveBeenCalled()
  })
})
