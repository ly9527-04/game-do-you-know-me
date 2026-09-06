import Link from 'next/link'

type InlineErrorProps = {
  message?: string
  onRetry?: () => void
  retryLabel?: string
  showCreateLink?: boolean
}

export function InlineError({ message = '暂时打不开，请稍后再试。', onRetry, retryLabel = '再试一次', showCreateLink = false }: InlineErrorProps) {
  return (
    <section className="inline-error" role="alert" aria-live="polite">
      <p>{message}</p>
      <div className="inline-error__actions">
        {onRetry ? <button className="button button--secondary" type="button" onClick={onRetry}>{retryLabel}</button> : null}
        {showCreateLink ? <Link className="button button--primary" href="/create">创建自己的测试</Link> : null}
      </div>
    </section>
  )
}
