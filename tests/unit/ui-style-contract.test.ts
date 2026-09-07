import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const css = readFileSync(resolve('src/app/globals.css'), 'utf8')

describe('lightweight social-card visual system', () => {
  it('defines the approved color tokens', () => {
    for (const value of [
      '#fff9f2',
      '#fffefa',
      '#252133',
      '#686274',
      '#705be7',
      '#eeeaff',
      '#ff806f',
      '#ffe78a',
      '#ded8e6',
    ]) {
      expect(css).toContain(value)
    }
  })

  it('uses friendly rounded controls and cards', () => {
    expect(css).toMatch(/\.button\s*\{[^}]*border-radius:\s*999px/i)
    expect(css).toMatch(/\.question-card\s*\{[^}]*border-radius:\s*(?:1rem|16px|18px|20px)/i)
    expect(css).toMatch(/\.creator-start input\s*\{[^}]*min-height:\s*(?:44px|2\.75rem|3rem)/i)
  })

  it('gives quiz, result, and leaderboard states clear hierarchy', () => {
    expect(css).toMatch(/\.question-card__option\[data-selected="true"\]\s*\{[^}]*background:\s*var\(--violet-soft\)/i)
    expect(css).toMatch(/\.result-score\s*\{[^}]*background:\s*var\(--ink\)/i)
    expect(css).toMatch(/\.leaderboard__entries li:first-child\s*\{[^}]*background:\s*var\(--violet-soft\)/i)
    expect(css).not.toMatch(/border-color:[^;]+!important/i)
  })
})
