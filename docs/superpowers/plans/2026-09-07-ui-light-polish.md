# 全站轻量 UI 精修 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在不改变功能、数据和 URL 的前提下，把全站调整为轻盈、圆润、适合分享的社交卡片视觉，并给结果分数一个克制的深色焦点。

**Architecture:** 保留现有 React 组件边界和请求流程，只在首页增加语义化成本标签，并通过 `src/app/globals.css` 的设计令牌与组件类统一视觉。使用 DOM 测试保护首页内容，使用 CSS 静态契约测试保护关键令牌、交互状态、响应式和减少动态规则。

**Tech Stack:** Next.js 16、React 19、TypeScript、CSS、Vitest、Testing Library、Playwright。

## Global Constraints

- 不更改题库、计分、API、数据库、鉴权、埋点事件名和 URL。
- 使用中文系统字体栈，不增加远程字体或新运行时依赖。
- 颜色固定为 `#fff9f2`、`#fffefa`、`#252133`、`#686274`、`#705be7`、`#eeeaff`、`#ff806f`、`#ffe78a`、`#ded8e6`。
- 主要卡片圆角 16～20px，主按钮为胶囊圆角，触控目标不小于约 44px。
- 320px 宽度不得横向滚动，桌面内容最大宽度约 42rem。
- 动效只用于选择、进度和复制反馈，时长 120～200ms；`prefers-reduced-motion` 关闭非必要过渡。
- 公共组件的可访问名称保持稳定。

---

### Task 1: 首页成本标签与首屏层级

**Files:**
- Modify: `tests/unit/home.test.tsx`
- Modify: `src/app/page.tsx`
- Modify: `src/app/globals.css`

**Interfaces:**
- Consumes: `HomeActions(): JSX.Element`，现有标题和 `/create` 主链接。
- Produces: `.home-page__facts` 与三个可读标签；后续视觉任务依赖该类名。

- [ ] **Step 1: Write the failing homepage test**

```tsx
it('explains the effort before the primary action', () => {
  render(<HomePage />)
  const facts = screen.getByRole('list', { name: '测试说明' })
  expect(within(facts).getByText('无需注册')).toBeInTheDocument()
  expect(within(facts).getByText('25 道题')).toBeInTheDocument()
  expect(within(facts).getByText('约 3 分钟')).toBeInTheDocument()
})
```

- [ ] **Step 2: Run the test and confirm the missing list failure**

Run: `npm run test:run -- tests/unit/home.test.tsx`
Expected: FAIL because no list named `测试说明` exists.

- [ ] **Step 3: Add the semantic facts list**

```tsx
<ul className="home-page__facts" aria-label="测试说明">
  <li>无需注册</li>
  <li>25 道题</li>
  <li>约 3 分钟</li>
</ul>
```

Place it after `.lede` and before `<HomeActions />`. Add compact flex-wrap styles so all three facts fit or wrap safely at 320px.

- [ ] **Step 4: Run the homepage test**

Run: `npm run test:run -- tests/unit/home.test.tsx`
Expected: PASS, 2 tests.

- [ ] **Step 5: Commit**

```bash
git add src/app/page.tsx src/app/globals.css tests/unit/home.test.tsx
git commit -m "feat: clarify homepage effort"
```

---

### Task 2: 全局令牌、页面容器与表单视觉

**Files:**
- Create: `tests/unit/ui-style-contract.test.ts`
- Modify: `src/app/globals.css`

**Interfaces:**
- Consumes: `.page-shell`、`.button`、`.button--primary`、`.button--secondary`、`.creator-start`、`.friend-start`、`.archive-complete`、`.resume-draft`、`.inline-error`、`.loading-card`。
- Produces: 九个固定 CSS 令牌以及全站卡片、按钮、输入框、焦点与 320px 响应式规则。

- [ ] **Step 1: Write the failing CSS token test**

```ts
const css = readFileSync(resolve('src/app/globals.css'), 'utf8')

it('defines the approved lightweight social-card tokens', () => {
  for (const value of ['#fff9f2', '#fffefa', '#252133', '#686274', '#705be7', '#eeeaff', '#ff806f', '#ffe78a', '#ded8e6']) {
    expect(css).toContain(value)
  }
  expect(css).toMatch(/\.button\s*\{[\s\S]*border-radius:\s*999px/i)
  expect(css).toMatch(/\.question-card[^{]*\{[\s\S]*border-radius:\s*(?:1rem|16px|18px|20px)/i)
})
```

- [ ] **Step 2: Run the contract test and confirm old tokens fail**

Run: `npm run test:run -- tests/unit/ui-style-contract.test.ts`
Expected: FAIL on the new color values and rounded geometry.

- [ ] **Step 3: Replace the root token system and base typography**

```css
:root {
  --paper: #fff9f2;
  --surface: #fffefa;
  --ink: #252133;
  --muted: #686274;
  --violet: #705be7;
  --violet-soft: #eeeaff;
  --coral: #ff806f;
  --marker: #ffe78a;
  --line: #ded8e6;
  --shadow-soft: 0 12px 30px rgb(54 42 92 / 9%);
}

body {
  font-family: "Microsoft YaHei", "PingFang SC", "Noto Sans CJK SC", system-ui, sans-serif;
  background: var(--paper);
}
```

Update page width, headings, `.lede`, buttons, forms and system cards to use the new tokens. Buttons keep existing accessible names and receive `min-height: 44px`; inputs use a 14px radius and violet focus ring.

- [ ] **Step 4: Add the narrow viewport guard and reduced-motion rule**

```css
@media (max-width: 360px) {
  .page-shell { width: min(100% - 1rem, 42rem); }
  .button { width: 100%; }
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { transition-duration: 0.01ms !important; }
}
```

- [ ] **Step 5: Run style and existing form/status tests**

Run: `npm run test:run -- tests/unit/ui-style-contract.test.ts tests/unit/CreatorStart.test.tsx tests/unit/FriendStart.test.tsx tests/unit/ResumeDraft.test.tsx tests/unit/ArchiveComplete.test.tsx`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/app/globals.css tests/unit/ui-style-contract.test.ts
git commit -m "style: establish lightweight social card system"
```

---

### Task 3: 答题、结果与排行榜层级

**Files:**
- Modify: `tests/unit/ui-style-contract.test.ts`
- Modify: `src/app/globals.css`

**Interfaces:**
- Consumes: `.quiz-progress*`、`.question-card*`、`.result-score*`、`.mismatch-card*`、`.leaderboard*` 和现有 `data-selected="true"` 状态。
- Produces: 安静的浅色答题卡、紫色选中状态、深紫结果焦点、清晰错题卡和排行榜行。

- [ ] **Step 1: Extend the failing interaction-state contract**

```ts
it('styles selected answers and the result focal card without color-only state', () => {
  expect(css).toMatch(/\.question-card__option\[data-selected="true"\][\s\S]*background:\s*var\(--violet-soft\)/i)
  expect(css).toMatch(/\.result-score\s*\{[\s\S]*background:\s*var\(--ink\)/i)
  expect(css).toMatch(/\.question-card__selected/)
  expect(css).toMatch(/\.leaderboard__entries\s+li/)
})
```

- [ ] **Step 2: Run the contract test and confirm the old component rules fail**

Run: `npm run test:run -- tests/unit/ui-style-contract.test.ts`
Expected: FAIL because selected answers use yellow and result cards use a light background.

- [ ] **Step 3: Restyle quiz progress, question card and choices**

Use a thin rounded track, violet fill, 18px question-card radius, 14px answer radius and `var(--violet-soft)` selected background. Preserve `aria-pressed`, visible “已选”, disabled opacity and `:focus-visible`. Hover movement is limited to `transform: translateY(-1px)` and disabled under reduced motion.

- [ ] **Step 4: Restyle results, mismatches and leaderboard**

Set `.result-score` to `background: var(--ink); color: var(--surface)` with coral score numerals. Keep `.mismatch-card` and leaderboard rows light. Add explicit grid/flex rules for leaderboard stats and entries so nicknames wrap while scores stay aligned.

- [ ] **Step 5: Run component and contract tests**

Run: `npm run test:run -- tests/unit/ui-style-contract.test.ts tests/unit/QuestionCard.test.tsx tests/unit/QuizSession.test.tsx tests/unit/ResultScore.test.tsx tests/unit/Leaderboard.test.tsx tests/unit/ShareActions.test.tsx`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/app/globals.css tests/unit/ui-style-contract.test.ts
git commit -m "style: polish quiz result and leaderboard states"
```

---

### Task 4: 全量回归、视觉复核与进度记录

**Files:**
- Modify: `PROGRESS.md`
- Verify: `src/app/globals.css`
- Verify: all changed files from Tasks 1–3

**Interfaces:**
- Consumes: Tasks 1–3 completed UI and tests.
- Produces: verified build, desktop/mobile screenshots, updated project record and one release-ready commit series.

- [ ] **Step 1: Run the complete automated gate**

Run:

```bash
npm run test:run
npm run typecheck
npm run lint
npm run build
```

Expected: 0 failures. Restore `tsconfig.json` `jsx` to `preserve` after Next.js build if Next rewrites it, then rerun `npm run typecheck`.

- [ ] **Step 2: Run the local site and capture visual evidence**

Start: `npm run dev`

Capture at minimum:
- Home at 390×844 and 1440×900.
- A question with a selected answer at 320×720.
- A representative result score and mismatch list.

Confirm no horizontal overflow, no clipped copy, clear focus and one dominant visual focal point per page.

- [ ] **Step 3: Update project progress**

Add a `全站轻量 UI 精修` module to `PROGRESS.md` recording the token system, facts list, quiz states, result focal treatment, responsive constraints and exact verification results.

- [ ] **Step 4: Final diff and secret check**

Run:

```bash
git diff --check
git status --short
git diff --name-only origin/main...HEAD
```

Expected: only planned source, tests, documentation and progress files; `.env*`, `.vercel/`, `supabase/.temp/`, `.superpowers/`, `AGENTS.md` and `CLAUDE.md` are not committed.

- [ ] **Step 5: Commit progress and prepare push**

```bash
git add PROGRESS.md
git commit -m "docs: record UI polish verification"
```

Push only after the visual screenshots and full automated gate pass. Vercel deployment uses the existing GitHub `main` integration; database changes are not required.
