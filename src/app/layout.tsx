import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '你真的懂我吗',
  description: '用 25 道小题，看看你有多懂朋友。',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'),
  openGraph: {
    title: '你真的懂我吗',
    description: '用 25 道小题，看看你有多懂朋友。',
  },
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  )
}
