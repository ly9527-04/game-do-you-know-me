export function LoadingCard({ label = '正在打开…' }: { label?: string }) {
  return <section className="loading-card" role="status" aria-live="polite" aria-busy="true">{label}</section>
}
