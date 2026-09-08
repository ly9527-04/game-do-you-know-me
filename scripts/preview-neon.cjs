// Isolated visual fixtures: renders real components, never calls the production API.
const fs = require('node:fs')
const path = require('node:path')
const Module = require('node:module')
const ts = require('typescript')
const React = require('react')
const { renderToStaticMarkup } = require('react-dom/server')
const { chromium } = require('@playwright/test')

const root = path.resolve(__dirname, '..')
const resolveFilename = Module._resolveFilename
Module._resolveFilename = function (request, ...args) {
  return resolveFilename.call(this, request.startsWith('@/') ? path.join(root, 'src', request.slice(2)) : request, ...args)
}
for (const extension of ['.ts', '.tsx']) {
  require.extensions[extension] = (module, filename) => {
    const code = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 },
    }).outputText
    module._compile(code, filename)
  }
}
require.extensions['.css'] = () => {}

const { RootLayout } = { RootLayout: require('../src/app/layout.tsx').default }
const { QuizSession } = require('../src/components/quiz/QuizSession.tsx')
const { QuestionCard } = require('../src/components/quiz/QuestionCard.tsx')
const { ResultScore } = require('../src/components/results/ResultScore.tsx')
const { Leaderboard } = require('../src/components/manage/Leaderboard.tsx')
const { QUESTIONS } = require('../src/lib/questions.ts')
const h = React.createElement
const fixtures = {
  host: h(QuizSession, { mode: 'creator', subjectNickname: 'AD钙', initialAnswers: {}, onComplete() {} }),
  quiz: h(QuizSession, { mode: { role: 'friend', shareCode: 'visual-only' }, subjectNickname: '测试朋友', initialAnswers: {}, onComplete() {} }),
  selected: h(QuestionCard, { question: QUESTIONS[0], value: 'B', disabled: false, onSelect() {} }),
  result: h(ResultScore, { score: 80, verdict: '很熟，但还是藏了一些你不知道的东西。' }),
  leaderboard: h(Leaderboard, {
    creatorNickname: 'AD钙', challengeCount: 3, averageScore: 76, shareUrl: 'https://example.invalid/t/fixture',
    entries: [
      { attemptId: 'a', nickname: '最懂你的朋友', score: 100, createdAt: '2026-09-08T08:00:00Z' },
      { attemptId: 'b', nickname: '这个昵称故意写得非常非常长用于检查手机换行', score: 80, createdAt: '2026-09-08T09:00:00Z' },
      { attemptId: 'c', nickname: '小明', score: 48, createdAt: '2026-09-08T10:00:00Z' },
    ],
  }),
}

async function main() {
  const output = process.argv[2]
  if (!output) throw new Error('Pass an output directory for screenshots')
  fs.mkdirSync(output, { recursive: true })
  const browser = await chromium.launch({ channel: 'msedge', headless: true })
  const fontStyles = [
    '@fontsource/fredoka/latin-600.css', '@fontsource/fredoka/latin-700.css',
    '@fontsource/plus-jakarta-sans/latin-500.css', '@fontsource/plus-jakarta-sans/latin-700.css',
    '@fontsource/plus-jakarta-sans/latin-800.css',
    '@fortawesome/fontawesome-free/css/fontawesome.min.css',
    '@fortawesome/fontawesome-free/css/solid.min.css',
  ].map(name => {
    const filename = require.resolve(name)
    return fs.readFileSync(filename, 'utf8').replace(/url\(['"]?([^)'"]+)['"]?\)/g, (_match, resource) => {
      const font = fs.readFileSync(path.resolve(path.dirname(filename), resource))
      return 'url(data:font/woff2;base64,' + font.toString('base64') + ')'
    })
  }).join('\n')
  const css = fontStyles + fs.readFileSync(path.join(root, 'src/app/globals.css'), 'utf8').replace('@import "tailwindcss";', '')
  try {
    for (const width of [320, 390, 1280]) {
      const page = await browser.newPage({ viewport: { width, height: 900 }, reducedMotion: 'reduce' })
      const errors = []
      page.on('pageerror', error => errors.push(error.message))
      for (const [name, content] of Object.entries(fixtures)) {
        const html = renderToStaticMarkup(h(RootLayout, {}, h('main', { className: 'page-shell' }, content)))
        // Static SSR has not hydrated: unlock only the fixture presentation, not application code.
        await page.setContent('<!doctype html>' + html.replace(/ disabled=""/g, ''), { waitUntil: 'networkidle' })
        await page.addStyleTag({ content: css })
        await page.evaluate(() => document.fonts.ready)
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)
        if (overflow) throw new Error(name + ' overflows at ' + width + 'px')
        await page.screenshot({ path: path.join(output, name + '-' + width + '.png'), fullPage: true })
        console.log(name + ' ' + width + 'px: no horizontal overflow')
      }
      if (errors.length) throw new Error(errors.join('\n'))
      await page.close()
    }
  } finally { await browser.close() }
}
main().catch(error => { console.error(error); process.exitCode = 1 })
