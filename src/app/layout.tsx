import type { Metadata } from 'next'
import Link from 'next/link'
import '@fontsource/fredoka/latin-600.css'
import '@fontsource/fredoka/latin-700.css'
import '@fontsource/plus-jakarta-sans/latin-500.css'
import '@fontsource/plus-jakarta-sans/latin-700.css'
import '@fontsource/plus-jakarta-sans/latin-800.css'
import '@fortawesome/fontawesome-free/css/fontawesome.min.css'
import '@fortawesome/fontawesome-free/css/solid.min.css'
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
      <body>
        <div className="site-frame">
          <header className="site-brand">
            <Link href="/" aria-label="你真的懂我吗 · 返回首页">
              <span className="brand-mark" aria-hidden="true">?</span>
              <span className="game-font gradient-text">DO YOU KNOW ME?</span>
            </Link>
            <span className="brand-caption">朋友默契实验室</span>
          </header>
          {children}
          <footer className="site-footer">JUST FOR FUN <span aria-hidden="true">✦</span> 默契没有标准答案</footer>
        </div>
      </body>
    </html>
  )
}
