import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const css = readFileSync(resolve('src/app/globals.css'), 'utf8')

describe('cyber neon game visual system', () => {
  it('defines the approved color tokens', () => {
    for (const value of [
      '#070913',
      '#0d1226',
      '#f8fafc',
      '#22d3ee',
      '#34d399',
      '#f472b6',
    ]) {
      expect(css).toContain(value)
    }
  })

  it('uses glass cards, accessible touch targets and responsive type', () => {
    expect(css).toContain('border-radius: 36px')
    expect(css).toContain('backdrop-filter: blur(20px)')
    expect(css).toContain('min-height: 48px')
    expect(css).toMatch(/\.creator-start input\s*\{[^}]*min-height:\s*52px/i)
    expect(css).toContain('"Plus Jakarta Sans"')
    expect(css).toContain('"Fredoka"')
    expect(css).toContain(':focus-visible')
    expect(css).toContain('prefers-reduced-motion: reduce')
  })

  it('gives quiz, result, and leaderboard states clear hierarchy', () => {
    expect(css).toMatch(/\.question-card__option\[data-selected="true"\]\s*\{[^}]*border-color:\s*var\(--green\)/i)
    expect(css).toMatch(/\.score-medallion\s*\{[^}]*border-radius:\s*50%/i)
    expect(css).toMatch(/\.leaderboard__entries li:first-child\s*\{[^}]*border-color:\s*#fbbf2466/i)
    expect(css).not.toMatch(/border-color:[^;]+!important/i)
  })

  it('bundles requested fonts and icons without third-party CDN requests', () => {
    const layout = readFileSync(resolve('src/app/layout.tsx'), 'utf8')
    expect(layout).toContain('@fontsource/fredoka/latin-700.css')
    expect(layout).toContain('@fontsource/plus-jakarta-sans/latin-800.css')
    expect(layout).toContain('@fortawesome/fontawesome-free/css/solid.min.css')
    expect(layout).not.toMatch(/fonts\.googleapis\.com|cdnjs\.cloudflare\.com/)
  })
})
