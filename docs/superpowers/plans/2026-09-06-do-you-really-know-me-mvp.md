# 「你真的懂我吗」MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (- [ ]) syntax for tracking.

**Goal:** 构建一个移动端优先、无需注册的朋友认知偏差测试网站，完成创建、分享、朋友挑战、结果裂变和创建者排行榜闭环。

**Architecture:** 使用 Next.js App Router 承载页面和 Route Handlers，业务规则保持为可单测的纯 TypeScript 模块。浏览器只保存未提交草稿；创建者答案、计分、管理令牌校验和数据写入全部在服务端完成。Supabase PostgreSQL 通过服务端专用客户端和事务型 RPC 保存数据，Vercel 负责部署。

**Tech Stack:** Node.js 20.9+、Next.js App Router、React、TypeScript strict、Tailwind CSS、Zod、Supabase PostgreSQL、Vitest、Testing Library、Playwright、Vercel。

## Global Constraints

- 正式产品名称固定为“你真的懂我吗”。
- 固定使用设计文档附录 A 的 25 道题，题目、顺序和四个选项不得改动。
- 每题完全一致得 4 分，总分为 0～100 且必须是 4 的倍数。
- 第一版不注册、不接 AI、不增加社交、评论、付费或复杂人格算法。
- 朋友提交前，任何公开页面或接口不得返回创建者答案。
- 结果页最多揭示 3 道错题；满分显示专属彩蛋。
- 公开分享码和私密管理令牌必须分离；数据库只保存管理令牌 SHA-256 哈希。
- 新站只绑定 me.ly0688.online，不修改 ly0688.online、www.ly0688.online 或旧提问箱数据库。
- 设计采用朋友手帐方向：奶油底、墨黑描边、珊瑚橙主按钮、紫色辅助、黄色强调。
- 手机端优先；支持 prefers-reduced-motion；重要状态不能只靠颜色表达。
- 每完成一个任务立即更新 PROGRESS.md，并按任务独立提交。

## File Map

- src/app/layout.tsx：全站元数据、字体、基础布局和分享默认信息。
- src/app/globals.css：Tailwind 导入、设计令牌、基础样式和减少动态效果规则。
- src/app/page.tsx：首页。
- src/app/create/page.tsx：创建者昵称入口。
- src/app/create/quiz/page.tsx：创建者答题容器。
- src/app/t/[shareCode]/page.tsx：朋友挑战欢迎页。
- src/app/t/[shareCode]/quiz/page.tsx：朋友答题容器。
- src/app/r/[attemptId]/page.tsx：结果页。
- src/app/m/[manageToken]/route.ts：管理令牌交换和安全重定向。
- src/app/manage/[testId]/page.tsx：创建者排行榜。
- src/app/api/tests/route.ts：创建测试。
- src/app/api/tests/[shareCode]/route.ts：公开读取测试基本信息与题集。
- src/app/api/tests/[shareCode]/attempts/route.ts：提交朋友挑战。
- src/app/api/results/[attemptId]/route.ts：读取有限结果。
- src/app/api/manage/tests/[testId]/route.ts：读取管理统计。
- src/app/api/events/route.ts：白名单埋点。
- src/app/api/og/results/[attemptId]/route.tsx：动态分享图。
- src/components/quiz/QuestionCard.tsx：单题与选项交互。
- src/components/quiz/QuizProgress.tsx：题号和进度条。
- src/components/quiz/QuizSession.tsx：答题状态、导航和草稿恢复。
- src/components/results/ResultScore.tsx：分数与区间文案。
- src/components/results/MismatchCard.tsx：有限错题对比。
- src/components/share/ShareActions.tsx：复制、系统分享和图片入口。
- src/components/manage/Leaderboard.tsx：人数、均分和排行榜。
- src/lib/questions.ts：版本化固定题库。
- src/lib/scoring.ts：计分、文案和错题选择。
- src/lib/drafts.ts：localStorage 草稿键与序列化。
- src/lib/validation.ts：Zod 请求结构。
- src/lib/security.ts：随机码、令牌哈希和管理会话签名。
- src/lib/rate-limit.ts：服务端限流调用和匿名键生成。
- src/lib/analytics.ts：事件白名单与记录。
- src/lib/supabase/server.ts：服务端 Supabase 客户端。
- src/lib/repositories/tests.ts：测试与答案读写。
- src/lib/repositories/attempts.ts：挑战写入与结果源数据读取。
- src/lib/repositories/manage.ts：排行榜聚合读取。
- src/types/domain.ts：跨模块共享领域类型。
- supabase/migrations/001_initial_schema.sql：表、索引、RLS 和事务 RPC。
- supabase/seed.sql：固定 25 题种子。
- tests/unit：纯规则和组件单测。
- tests/integration：Route Handler 与仓储边界测试。
- tests/e2e：手机端完整闭环。
- docs/runbooks/deploy.md：Supabase、Vercel 与 me 子域名上线步骤。

---

### Task 1: 项目基础、工具链与设计令牌

**Files:**
- Create: package.json
- Create: package-lock.json
- Create: next-env.d.ts
- Create: tsconfig.json
- Create: next.config.ts
- Create: postcss.config.mjs
- Create: eslint.config.mjs
- Create: vitest.config.ts
- Create: playwright.config.ts
- Create: .gitignore
- Create: .env.example
- Create: src/app/layout.tsx
- Create: src/app/page.tsx
- Create: src/app/globals.css
- Create: src/app/not-found.tsx
- Create: src/test/setup.ts
- Modify: PROGRESS.md

**Interfaces:**
- Produces: npm scripts dev, build, lint, test, test:run, test:e2e and typecheck。
- Produces: CSS variables --paper, --ink, --coral, --violet, --marker and reusable focus styles。
- Consumes: 已确认的朋友手帐视觉方向。

- [ ] **Step 1: 初始化依赖和 npm scripts**

Run:

    npm init -y
    npm install next@latest react@latest react-dom@latest zod @supabase/supabase-js server-only
    npm install -D typescript @types/node @types/react @types/react-dom tailwindcss @tailwindcss/postcss postcss eslint eslint-config-next vitest jsdom @vitejs/plugin-react @testing-library/react @testing-library/jest-dom @testing-library/user-event @playwright/test
    npm pkg set scripts.dev="next dev" scripts.build="next build" scripts.start="next start" scripts.lint="eslint ." scripts.typecheck="tsc --noEmit" scripts.test="vitest" scripts.test:run="vitest run" scripts.test:e2e="playwright test"

Expected: package-lock.json 生成；package.json 中存在上述七个脚本。

- [ ] **Step 2: 创建严格 TypeScript、Tailwind、ESLint、Vitest 和 Playwright 配置**

关键配置必须包含：

    // tsconfig.json
    {
      "compilerOptions": {
        "target": "ES2017",
        "lib": ["dom", "dom.iterable", "esnext"],
        "strict": true,
        "noEmit": true,
        "module": "esnext",
        "moduleResolution": "bundler",
        "jsx": "preserve",
        "plugins": [{ "name": "next" }],
        "paths": { "@/*": ["./src/*"] }
      },
      "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
      "exclude": ["node_modules"]
    }

    // postcss.config.mjs
    export default { plugins: { '@tailwindcss/postcss': {} } }

    // vitest.config.ts
    import react from '@vitejs/plugin-react'
    import { defineConfig } from 'vitest/config'
    import path from 'node:path'
    export default defineConfig({
      plugins: [react()],
      test: { environment: 'jsdom', globals: true, setupFiles: ['./src/test/setup.ts'] },
      resolve: { alias: { '@': path.resolve(__dirname, './src') } },
    })

src/test/setup.ts 内容固定为：

    import '@testing-library/jest-dom/vitest'

- [ ] **Step 3: 写基础页面 smoke test**

Create tests/unit/home.test.tsx:

    import { render, screen } from '@testing-library/react'
    import HomePage from '@/app/page'

    it('shows the product promise and primary action', () => {
      render(<HomePage />)
      expect(screen.getByRole('heading', { name: '你朋友真的懂你吗？' })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: '创建我的测试' })).toHaveAttribute('href', '/create')
    })

- [ ] **Step 4: 运行测试确认失败**

Run: npm run test:run -- tests/unit/home.test.tsx

Expected: FAIL，因为 src/app/page.tsx 尚不存在。

- [ ] **Step 5: 创建最小根布局、首页、404 和全局设计令牌**

首页先实现测试要求；globals.css 至少包含：

    @import "tailwindcss";
    :root {
      --paper: #fff8e7;
      --ink: #28243b;
      --coral: #ff786b;
      --violet: #7b67e8;
      --marker: #ffe36e;
      --muted: #625d70;
    }
    * { box-sizing: border-box; }
    body { margin: 0; background: var(--paper); color: var(--ink); }
    :focus-visible { outline: 3px solid var(--violet); outline-offset: 3px; }
    @media (prefers-reduced-motion: reduce) {
      *, *::before, *::after { scroll-behavior: auto !important; animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
    }

.env.example 只列键名：

    NEXT_PUBLIC_SITE_URL=http://localhost:3000
    SUPABASE_URL=
    SUPABASE_SECRET_KEY=
    MANAGEMENT_SESSION_SECRET=
    RATE_LIMIT_SECRET=

- [ ] **Step 6: 运行基础验证**

Run:

    npm run test:run -- tests/unit/home.test.tsx
    npm run lint
    npm run typecheck
    npm run build

Expected: 1 test PASS；lint、typecheck 和 build 均以 exit 0 结束。

- [ ] **Step 7: 更新进度并提交**

在 PROGRESS.md 记录项目工具链、设计令牌和命令，然后运行：

    git add package.json package-lock.json tsconfig.json next.config.ts postcss.config.mjs eslint.config.mjs vitest.config.ts playwright.config.ts .gitignore .env.example src tests/unit/home.test.tsx PROGRESS.md
    git commit -m "chore: scaffold the Next.js MVP"

---

### Task 2: 固定题库、计分与结果规则

**Files:**
- Create: src/types/domain.ts
- Create: src/lib/questions.ts
- Create: src/lib/scoring.ts
- Create: tests/unit/questions.test.ts
- Create: tests/unit/scoring.test.ts
- Modify: PROGRESS.md

**Interfaces:**
- Produces: AnswerChoice = 'A' | 'B' | 'C' | 'D'。
- Produces: Question、QuizAnswers、Mismatch、ScoreResult 类型。
- Produces: QUESTION_SET_VERSION、QUESTIONS、scoreAnswers()、getVerdict()、selectMismatches()。

- [ ] **Step 1: 写题库完整性失败测试**

    import { QUESTIONS } from '@/lib/questions'

    it('contains the exact fixed 25-question set', () => {
      expect(QUESTIONS).toHaveLength(25)
      expect(QUESTIONS.map((item) => item.order)).toEqual(Array.from({ length: 25 }, (_, index) => index + 1))
      expect(QUESTIONS.every((item) => item.options.length === 4)).toBe(true)
      expect(QUESTIONS[0].prompt).toBe('如果你是一间房，里面最可能有什么？')
      expect(QUESTIONS[24].options[3].text).toBe('做一直拖着没做的事')
    })

- [ ] **Step 2: 写计分和边界失败测试**

覆盖 0、39/40 不可能分值处理、40、60、70、80、90、100，及稳定错题选择：

    expect(scoreAnswers(allA, allA).score).toBe(100)
    expect(scoreAnswers(allA, allB).score).toBe(0)
    expect(getVerdict(88)).toBe('基本属于 TA 一个眼神你就知道什么意思。')
    expect(selectMismatches(result, 'attempt-1')).toHaveLength(3)
    expect(selectMismatches(result, 'attempt-1')).toEqual(selectMismatches(result, 'attempt-1'))

- [ ] **Step 3: 运行测试确认失败**

Run: npm run test:run -- tests/unit/questions.test.ts tests/unit/scoring.test.ts

Expected: FAIL，模块尚不存在。

- [ ] **Step 4: 实现领域类型与纯函数**

scoreAnswers 必须拒绝题数不为 25 的输入：

    export function scoreAnswers(creator: QuizAnswers, friend: QuizAnswers): ScoreResult {
      if (Object.keys(creator).length !== 25 || Object.keys(friend).length !== 25) {
        throw new Error('A complete 25-answer set is required')
      }
      const comparisons = QUESTIONS.map((question) => ({
        questionId: question.id,
        friendAnswer: friend[question.id],
        creatorAnswer: creator[question.id],
        isCorrect: friend[question.id] === creator[question.id],
      }))
      return {
        score: comparisons.filter((item) => item.isCorrect).length * 4,
        comparisons,
      }
    }

selectMismatches 只从错误项中选择，先按 mismatchPriority 降序，再使用 attemptId 派生的稳定散列排序，最多返回 3 项；零错题返回空数组。

- [ ] **Step 5: 按设计附录逐字录入全部 25 题**

QUESTIONS 使用 readonly 常量，id 固定为 q01～q25，category 仅使用 abstract、semi_abstract、real_anchor 三种内部值。完成后逐项对照设计文档附录 A，不自行润色。

- [ ] **Step 6: 运行测试和类型检查**

Run:

    npm run test:run -- tests/unit/questions.test.ts tests/unit/scoring.test.ts
    npm run typecheck

Expected: 所有题库与计分测试 PASS；typecheck exit 0。

- [ ] **Step 7: 更新进度并提交**

    git add src/types/domain.ts src/lib/questions.ts src/lib/scoring.ts tests/unit/questions.test.ts tests/unit/scoring.test.ts PROGRESS.md
    git commit -m "feat: add versioned questions and scoring rules"

---

### Task 3: Supabase 数据库、RLS 与事务 RPC

**Files:**
- Create: supabase/migrations/001_initial_schema.sql
- Create: supabase/seed.sql
- Create: tests/unit/migration-contract.test.ts
- Create: src/lib/supabase/server.ts
- Create: src/lib/repositories/tests.ts
- Create: src/lib/repositories/attempts.ts
- Create: src/lib/repositories/manage.ts
- Create: tests/integration/repositories.test.ts
- Modify: PROGRESS.md

**Interfaces:**
- Produces: getActiveQuestionSet()、createTestRecord(input)、getPublicTest(shareCode)、getCreatorAnswers(testId)、findTestByManageTokenHash(hash)。
- Produces: createAttemptRecord(input)、getResultSource(attemptId)；后者只允许服务端结果路由调用。
- Produces: getManageSummary(testId)。
- Consumes: Question、QuizAnswers、ScoreResult。

- [ ] **Step 1: 写仓储契约失败测试**

使用 vi.mock 模拟 Supabase client，至少断言：

    await createTestRecord(validInput)
    expect(rpc).toHaveBeenCalledWith('create_test', expect.objectContaining({
      p_share_code: validInput.shareCode,
      p_manage_token_hash: validInput.manageTokenHash,
    }))

以及公开读取结果不含 creator_answers、排行榜读取返回 challengeCount、averageScore、entries。

- [ ] **Step 2: 运行测试确认失败**

Run: npm run test:run -- tests/integration/repositories.test.ts

Expected: FAIL，仓储和 Supabase client 尚不存在。

- [ ] **Step 3: 创建初始 schema**

SQL 必须创建 question_sets、questions、tests、creator_answers、attempts、attempt_answers、analytics_events、rate_limits；加入以下关键约束：

    alter table attempts add constraint valid_score
      check (score between 0 and 100 and score % 4 = 0);
    alter table creator_answers add constraint creator_answer_choice
      check (answer in ('A', 'B', 'C', 'D'));
    create unique index attempts_idempotency
      on attempts(test_id, idempotency_key);
    create unique index questions_order_per_set
      on questions(question_set_id, sort_order);

所有核心表开启 RLS，且不创建 anon 或 authenticated 的允许策略。服务端使用 SUPABASE_SECRET_KEY。

- [ ] **Step 4: 创建事务函数**

create_test(p_test_id, p_question_set_id, p_nickname, p_share_code, p_manage_token_hash, p_answers jsonb) 在一个事务中插入 tests 和正好 25 条 creator_answers；答案数量或选项非法时 raise exception。

create_attempt(p_attempt_id, p_test_id, p_nickname, p_score, p_idempotency_key, p_answers jsonb) 在一个事务中插入 attempts 和正好 25 条 attempt_answers；唯一键冲突时返回已有 attempt id。

check_rate_limit(p_key_hash, p_action, p_limit, p_window_seconds) 使用 insert ... on conflict do update 原子递增，并返回 allowed boolean。

- [ ] **Step 5: 创建 25 题种子**

seed.sql 插入 question_sets.version = 1 和设计附录 A 全部 25 题。种子必须可重复运行：使用 on conflict 更新固定内容，不生成随机题目 ID。

- [ ] **Step 6: 实现仅服务端 Supabase client 和仓储**

server.ts 顶部加入：

    import 'server-only'
    import { createClient } from '@supabase/supabase-js'

    export function createServerDb() {
      const url = process.env.SUPABASE_URL
      const secret = process.env.SUPABASE_SECRET_KEY
      if (!url || !secret) throw new Error('Server database configuration is missing')
      return createClient(url, secret, { auth: { persistSession: false } })
    }

仓储负责把数据库 snake_case 映射为领域 camelCase；不把原始数据库错误直接返回给 Route Handler。

- [ ] **Step 7: 运行 migration 静态检查与仓储测试**

Run:

    npm run test:run -- tests/unit/migration-contract.test.ts tests/integration/repositories.test.ts
    npm run typecheck
    npm run lint

Expected: migration contract 与仓储测试 PASS，typecheck 与 lint exit 0。migration contract 必须读取 SQL 并断言八张表、三项 RPC、全部 RLS 声明及 seed 中 q01～q25 均存在。真实数据库执行在 Task 12 的独立 Supabase 预览项目完成。

- [ ] **Step 8: 更新进度并提交**

    git add supabase src/lib/supabase src/lib/repositories tests/unit/migration-contract.test.ts tests/integration/repositories.test.ts PROGRESS.md
    git commit -m "feat: add transactional Supabase persistence"

---

### Task 4: 输入验证、随机令牌、管理会话、限流与埋点

**Files:**
- Create: src/lib/validation.ts
- Create: src/lib/security.ts
- Create: src/lib/rate-limit.ts
- Create: src/lib/analytics.ts
- Create: tests/unit/validation.test.ts
- Create: tests/unit/security.test.ts
- Create: tests/unit/analytics.test.ts
- Modify: PROGRESS.md

**Interfaces:**
- Produces: createTestSchema、createAttemptSchema、eventSchema。
- Produces: createShareCode()、createManageToken()、hashToken()、signManageSession()、verifyManageSession()。
- Produces: assertRateLimit(request, action)。
- Produces: AnalyticsEventName、recordEvent(input)。

- [ ] **Step 1: 写验证与安全失败测试**

覆盖昵称空白、超过 20 字、少于或多于 25 个答案、非法选项、未知事件名、令牌篡改和过期会话：

    expect(createTestSchema.safeParse({ nickname: '', answers: {} }).success).toBe(false)
    expect(hashToken('same-token')).toBe(hashToken('same-token'))
    expect(verifyManageSession(signManageSession(testId, now + 3600), now)?.testId).toBe(testId)
    expect(verifyManageSession(tampered, now)).toBeNull()

- [ ] **Step 2: 运行测试确认失败**

Run: npm run test:run -- tests/unit/validation.test.ts tests/unit/security.test.ts tests/unit/analytics.test.ts

Expected: FAIL，模块尚不存在。

- [ ] **Step 3: 实现 Zod schema**

答案对象必须严格包含 q01～q25，每个值为 A/B/C/D；昵称 trim 后为 1～20 个 Unicode 字符；幂等键使用 UUID；事件名只允许八个固定值。

- [ ] **Step 4: 实现安全工具**

使用 node:crypto：

    export const createManageToken = () => randomBytes(32).toString('base64url')
    export const createShareCode = () => randomBytes(8).toString('base64url')
    export const hashToken = (token: string) =>
      createHash('sha256').update(token, 'utf8').digest('hex')

管理会话格式为 version.testId.expires.signature，signature 使用 MANAGEMENT_SESSION_SECRET 的 HMAC-SHA256。verifyManageSession 使用 timingSafeEqual，并拒绝格式错误、签名错误和已过期值。

- [ ] **Step 5: 实现匿名限流键**

从 Vercel 转发头获取单个客户端 IP，使用 RATE_LIMIT_SECRET 做 HMAC 后传给 check_rate_limit RPC；数据库和日志都不保存原始 IP。动作上限：

- create_test：每个匿名键每 10 分钟 5 次。
- submit_attempt：每个匿名键每 10 分钟 20 次。
- analytics_event：每个匿名键每分钟 60 次。

- [ ] **Step 6: 实现八个事件白名单**

recordEvent 只接受 homepage_view、create_test_click、creator_quiz_start、creator_quiz_complete、share_link_copy、friend_quiz_start、friend_quiz_complete、friend_create_own_test_click。metadata 删除未列入白名单的键，拒绝 answer、manageToken、ip。

- [ ] **Step 7: 运行测试**

Run:

    npm run test:run -- tests/unit/validation.test.ts tests/unit/security.test.ts tests/unit/analytics.test.ts
    npm run typecheck

Expected: 所有测试 PASS；typecheck exit 0。

- [ ] **Step 8: 更新进度并提交**

    git add src/lib/validation.ts src/lib/security.ts src/lib/rate-limit.ts src/lib/analytics.ts tests/unit PROGRESS.md
    git commit -m "feat: add validation and anonymous security controls"

---

### Task 5: 可复用答题组件与本地草稿

**Files:**
- Create: src/components/quiz/QuestionCard.tsx
- Create: src/components/quiz/QuizProgress.tsx
- Create: src/components/quiz/QuizSession.tsx
- Create: src/lib/drafts.ts
- Create: tests/unit/QuestionCard.test.tsx
- Create: tests/unit/QuizSession.test.tsx
- Create: tests/unit/drafts.test.ts
- Modify: src/app/globals.css
- Modify: PROGRESS.md

**Interfaces:**
- Produces: QuestionCardProps { question, value, onSelect, disabled }。
- Produces: QuizSessionProps { mode, subjectNickname, initialAnswers, onComplete }。
- Produces: getDraftKey(mode, identity)、loadDraft()、saveDraft()、clearDraft()。

- [ ] **Step 1: 写组件和草稿失败测试**

断言四个选项均可通过按钮角色访问、点击只发送选项值、进度显示 08 / 25、QuestionCard 不渲染后台 category、草稿按 creator 与具体 shareCode 隔离、损坏 JSON 返回 null。

- [ ] **Step 2: 运行测试确认失败**

Run: npm run test:run -- tests/unit/QuestionCard.test.tsx tests/unit/QuizSession.test.tsx tests/unit/drafts.test.ts

Expected: FAIL，组件与草稿模块尚不存在。

- [ ] **Step 3: 实现 QuestionCard 和 QuizProgress**

每个选项使用真实 button，aria-pressed 表达选择状态；问题标题使用 aria-labelledby；选择状态同时显示字母圆点、描边和背景，不只改变颜色。

- [ ] **Step 4: 实现 QuizSession**

QuizSession 管理当前题号和答案。选择后立即保存草稿，等待 200ms 后进入下一题；减少动态效果时立即切换。允许上一题，不允许跳过未答题目；第 25 题完成后调用 onComplete。

- [ ] **Step 5: 实现草稿恢复**

草稿结构：

    type QuizDraft = {
      version: 1
      nickname: string
      answers: QuizAnswers
      currentIndex: number
      updatedAt: string
    }

无效版本、超过 30 天或 JSON 损坏时返回 null；提交成功后清除对应键。

- [ ] **Step 6: 运行组件测试**

Run:

    npm run test:run -- tests/unit/QuestionCard.test.tsx tests/unit/QuizSession.test.tsx tests/unit/drafts.test.ts
    npm run typecheck
    npm run lint

Expected: 全部 PASS。

- [ ] **Step 7: 更新进度并提交**

    git add src/components/quiz src/lib/drafts.ts tests/unit src/app/globals.css PROGRESS.md
    git commit -m "feat: add accessible quiz session with draft recovery"

---

### Task 6: 首页与创建者建档闭环

**Files:**
- Modify: src/app/page.tsx
- Create: src/app/create/page.tsx
- Create: src/app/create/quiz/page.tsx
- Create: src/components/create/CreatorStart.tsx
- Create: src/components/create/CreatorQuiz.tsx
- Create: src/components/create/ArchiveComplete.tsx
- Create: src/components/analytics/EventBeacon.tsx
- Create: src/app/api/tests/route.ts
- Create: tests/integration/create-test-route.test.ts
- Create: tests/unit/CreatorStart.test.tsx
- Modify: src/app/globals.css
- Modify: PROGRESS.md

**Interfaces:**
- Consumes: createTestSchema、createShareCode、createManageToken、hashToken、createTestRecord、QuizSession。
- Produces: POST /api/tests -> { testId, shareUrl, manageUrl }。
- Produces: 创建者完成页，管理链接只保留在当前内存和明确复制动作中。

- [ ] **Step 1: 写创建接口失败测试**

模拟仓储与限流，断言：

- 非 POST 不适用，Route Handler 只导出 POST。
- 非法 24 题输入返回 400。
- 超限返回 429。
- 成功时 createTestRecord 收到哈希而非原始 manageToken。
- 响应包含公开 shareUrl 与私密 manageUrl，不包含 creator answers。

- [ ] **Step 2: 写昵称入口失败测试**

断言空昵称不能继续、有效昵称写入创建者草稿并导航至 /create/quiz。

- [ ] **Step 3: 运行测试确认失败**

Run: npm run test:run -- tests/integration/create-test-route.test.ts tests/unit/CreatorStart.test.tsx

Expected: FAIL，路由与组件尚不存在。

- [ ] **Step 4: 实现创建接口**

处理顺序固定为：读取 JSON 与大小限制 → schema 校验 → 蜜罐检查 → 限流 → 获取 active question set → 生成 testId/shareCode/manageToken → 哈希令牌 → 事务写入 → 记录 creator_quiz_complete → 返回完整绝对链接。

任何数据库错误返回：

    { "error": { "code": "CREATE_FAILED", "message": "暂时没能封存档案，请稍后重试。" } }

不得返回堆栈或数据库原文。

- [ ] **Step 5: 实现首页和创建者页面**

首页只保留已确认第一屏内容；进入按钮记录 create_test_click。CreatorStart 记录 creator_quiz_start；CreatorQuiz 使用 QuizSession；提交期间禁用重复点击，失败时保留草稿并显示重试。

- [ ] **Step 6: 实现 ArchiveComplete**

显示“{昵称} 的档案已封存”、随机档案编号、复制测试链接、系统分享和单独的“保存管理链接”区域。明确写明“管理链接丢失后无法找回”。管理 URL 不写入 localStorage。

- [ ] **Step 7: 运行验证**

Run:

    npm run test:run -- tests/integration/create-test-route.test.ts tests/unit/CreatorStart.test.tsx
    npm run lint
    npm run typecheck
    npm run build

Expected: 全部 exit 0。

- [ ] **Step 8: 更新进度并提交**

    git add src/app src/components/create src/components/analytics tests/integration/create-test-route.test.ts tests/unit/CreatorStart.test.tsx PROGRESS.md
    git commit -m "feat: complete the creator test flow"

---

### Task 7: 朋友挑战与服务端计分

**Files:**
- Create: src/app/t/[shareCode]/page.tsx
- Create: src/app/t/[shareCode]/quiz/page.tsx
- Create: src/components/friend/FriendStart.tsx
- Create: src/components/friend/FriendQuiz.tsx
- Create: src/app/api/tests/[shareCode]/route.ts
- Create: src/app/api/tests/[shareCode]/attempts/route.ts
- Create: tests/integration/public-test-route.test.ts
- Create: tests/integration/attempt-route.test.ts
- Create: tests/unit/FriendStart.test.tsx
- Modify: PROGRESS.md

**Interfaces:**
- Consumes: getPublicTest、getCreatorAnswers、scoreAnswers、selectMismatches、createAttemptRecord、assertRateLimit。
- Produces: GET /api/tests/{shareCode} -> { testId, creatorNickname, questionSetVersion, questions }。
- Produces: POST /api/tests/{shareCode}/attempts -> { attemptId, resultUrl }。

- [ ] **Step 1: 写公开读取安全测试**

成功响应必须含创建者昵称和 25 题，但序列化结果中不得出现 creatorAnswer、creator_answers、manageToken、manage_token_hash。未知 shareCode 返回 404 与统一友好文案。

- [ ] **Step 2: 写挑战提交失败测试**

覆盖非法答案、幂等重试、服务端 76 分计算、数据库失败、限流和不信任客户端 score 字段。即使请求带 score: 100，保存值也必须来自 scoreAnswers。

- [ ] **Step 3: 运行测试确认失败**

Run: npm run test:run -- tests/integration/public-test-route.test.ts tests/integration/attempt-route.test.ts tests/unit/FriendStart.test.tsx

Expected: FAIL。

- [ ] **Step 4: 实现公开测试 Route Handler**

只读取测试昵称和版本化题集，返回 Cache-Control: private, no-store。找不到或题集不完整时返回不可用页面所需的稳定错误码。

- [ ] **Step 5: 实现挑战提交 Route Handler**

处理顺序：校验 → 蜜罐 → 限流 → 读取测试与创建者答案 → scoreAnswers → 生成 attemptId → createAttemptRecord → 记录 friend_quiz_complete → 返回结果 URL。attempt_answers 中保存 isCorrect，但响应不直接返回完整 comparison。

- [ ] **Step 6: 实现朋友欢迎与答题页**

FriendStart 只收昵称并记录 friend_quiz_start；FriendQuiz 使用以 shareCode 隔离的草稿键，始终显示“你正在猜：{昵称}”。提交成功后清草稿并跳转结果页。

- [ ] **Step 7: 运行验证**

Run:

    npm run test:run -- tests/integration/public-test-route.test.ts tests/integration/attempt-route.test.ts tests/unit/FriendStart.test.tsx
    npm run typecheck
    npm run lint

Expected: 全部 PASS。

- [ ] **Step 8: 更新进度并提交**

    git add src/app/t src/app/api/tests src/components/friend tests PROGRESS.md
    git commit -m "feat: add the friend challenge flow"

---

### Task 8: 结果页、有限错题与分享传播

**Files:**
- Create: src/app/r/[attemptId]/page.tsx
- Create: src/app/api/results/[attemptId]/route.ts
- Create: src/app/api/og/results/[attemptId]/route.tsx
- Create: src/components/results/ResultScore.tsx
- Create: src/components/results/MismatchCard.tsx
- Create: src/components/share/ShareActions.tsx
- Create: tests/integration/result-route.test.ts
- Create: tests/unit/ResultScore.test.tsx
- Create: tests/unit/ShareActions.test.tsx
- Modify: PROGRESS.md

**Interfaces:**
- Consumes: getResultSource、getVerdict、selectMismatches、EventBeacon。
- Produces: LimitedResult { creatorNickname, friendNickname, score, verdict, mismatches }。
- Produces: 1200 × 1600 的动态 Open Graph/保存图片。

- [ ] **Step 1: 写结果隐私失败测试**

断言 4 个以上错题时只返回 3 个；2 个错题时返回 2 个；满分返回 0 个和满分彩蛋。序列化响应不得包含其余 22～25 题答案。

- [ ] **Step 2: 写结果组件与分享降级失败测试**

断言 76 分显示对应文案；满分显示彩蛋；navigator.share 不存在时复制 canonical result URL；复制后记录 share_link_copy。

- [ ] **Step 3: 运行测试确认失败**

Run: npm run test:run -- tests/integration/result-route.test.ts tests/unit/ResultScore.test.tsx tests/unit/ShareActions.test.tsx

Expected: FAIL。

- [ ] **Step 4: 实现有限结果 API 和页面**

结果路由用 getResultSource 在服务端读取该挑战的 25 项比对，调用 selectMismatches 后只序列化最多 3 项；完整比对永不进入客户端响应。结果页顺序为分数 → verdict → 错题卡 → “我也要创建自己的测试”。裂变按钮记录 friend_create_own_test_click 后跳转 /create。

- [ ] **Step 5: 实现动态分享图**

使用 Next.js ImageResponse 生成 1200 × 1600 PNG，内容只含品牌名、双方昵称、分数、verdict 和 me.ly0688.online，不包含管理链接或完整错题答案。结果页 metadata 的 og:image 指向该路由。

- [ ] **Step 6: 实现分享行为**

优先 navigator.share({ title, text, url })；不支持或用户取消时不报错；明确点击复制按钮时写剪贴板并显示成功状态。图片保存失败不能阻断普通链接复制。

- [ ] **Step 7: 运行验证**

Run:

    npm run test:run -- tests/integration/result-route.test.ts tests/unit/ResultScore.test.tsx tests/unit/ShareActions.test.tsx
    npm run typecheck
    npm run build

Expected: 全部 PASS。

- [ ] **Step 8: 更新进度并提交**

    git add src/app/r src/app/api/results src/app/api/og src/components/results src/components/share tests PROGRESS.md
    git commit -m "feat: add private-by-design results and sharing"

---

### Task 9: 管理令牌交换与排行榜

**Files:**
- Create: src/app/m/[manageToken]/route.ts
- Create: src/app/manage/[testId]/page.tsx
- Create: src/app/api/manage/tests/[testId]/route.ts
- Create: src/components/manage/Leaderboard.tsx
- Create: src/lib/manage-session.ts
- Create: tests/integration/manage-exchange.test.ts
- Create: tests/integration/manage-route.test.ts
- Create: tests/unit/Leaderboard.test.tsx
- Modify: PROGRESS.md

**Interfaces:**
- Consumes: hashToken、signManageSession、verifyManageSession、getManageSummary。
- Produces: 生产环境 __Host-manage_session HttpOnly Cookie；本地 HTTP 测试使用 manage_session。
- Produces: ManageSummary { creatorNickname, challengeCount, averageScore, entries, shareUrl }。

- [ ] **Step 1: 写令牌交换失败测试**

生产环境中，有效令牌必须返回 303，Location 为 /manage/{testId}，Set-Cookie 名为 __Host-manage_session 且含 HttpOnly、Secure、SameSite=Lax、Path=/，并且不含原始管理令牌。测试环境使用 manage_session 且不设置 Secure，保证 Playwright 的 localhost HTTP 流程可运行。无效令牌返回相同无权限页，不区分测试不存在或令牌错误。

- [ ] **Step 2: 写跨测试隔离失败测试**

使用 test-A 的管理 Cookie 请求 test-B 必须返回 403；无 Cookie 返回 401；有效 Cookie 返回按 score 降序、createdAt 升序作为平分规则的排行榜。

- [ ] **Step 3: 运行测试确认失败**

Run: npm run test:run -- tests/integration/manage-exchange.test.ts tests/integration/manage-route.test.ts tests/unit/Leaderboard.test.tsx

Expected: FAIL。

- [ ] **Step 4: 实现令牌交换**

对路径参数做长度和字符校验，哈希后查询 tests.manage_token_hash。成功时建立 24 小时管理会话并 303 重定向；响应使用 Cache-Control: private, no-store。

- [ ] **Step 5: 实现管理 API 和页面**

服务端从 Cookie 验证 testId，不接受客户端传入的管理令牌。平均分保留整数百分比；无人挑战时显示 0 人和空状态。Leaderboard 显示名次、朋友昵称、分数和完成时间，并提供再次复制公开链接。

- [ ] **Step 6: 运行验证**

Run:

    npm run test:run -- tests/integration/manage-exchange.test.ts tests/integration/manage-route.test.ts tests/unit/Leaderboard.test.tsx
    npm run typecheck
    npm run lint

Expected: 全部 PASS。

- [ ] **Step 7: 更新进度并提交**

    git add src/app/m src/app/manage src/app/api/manage src/components/manage src/lib/manage-session.ts tests PROGRESS.md
    git commit -m "feat: add secure link-based test management"

---

### Task 10: 埋点接入、错误体验与完整状态覆盖

**Files:**
- Create: src/app/api/events/route.ts
- Create: src/components/system/InlineError.tsx
- Create: src/components/system/ResumeDraft.tsx
- Create: src/components/system/LoadingCard.tsx
- Create: src/app/error.tsx
- Create: src/app/loading.tsx
- Create: tests/integration/events-route.test.ts
- Create: tests/unit/ResumeDraft.test.tsx
- Modify: src/app/page.tsx
- Modify: src/components/create/CreatorQuiz.tsx
- Modify: src/components/friend/FriendQuiz.tsx
- Modify: PROGRESS.md

**Interfaces:**
- Consumes: eventSchema、recordEvent、assertRateLimit、loadDraft。
- Produces: POST /api/events -> 204。
- Produces: 继续草稿、重新开始、网络重试和统一未知错误体验。

- [ ] **Step 1: 写事件和恢复失败测试**

断言八个事件通过、未知事件返回 400、metadata 中 answer/manageToken/ip 返回 400、超限返回 429；有效草稿显示“继续上次进度”和“重新开始”两个明确按钮。

- [ ] **Step 2: 运行测试确认失败**

Run: npm run test:run -- tests/integration/events-route.test.ts tests/unit/ResumeDraft.test.tsx

Expected: FAIL。

- [ ] **Step 3: 实现事件 API**

事件写入失败不影响核心用户流程；客户端 EventBeacon 使用 keepalive fetch，忽略网络失败。homepage_view 每个页面会话只发一次。

- [ ] **Step 4: 实现错误与恢复组件**

提交失败保留所有选择并显示“重新提交”；404 测试页显示“这个测试可能不存在或已失效”和创建入口；数据库暂时不可用显示稍后重试；任何 UI 都不显示堆栈、内部 ID 或环境变量。

- [ ] **Step 5: 接入全部八个埋点**

逐一搜索并确认：

    rg "homepage_view|create_test_click|creator_quiz_start|creator_quiz_complete|share_link_copy|friend_quiz_start|friend_quiz_complete|friend_create_own_test_click" src

Expected: 八个事件名均存在于白名单，并分别存在至少一个明确触发点。

- [ ] **Step 6: 运行验证**

Run:

    npm run test:run -- tests/integration/events-route.test.ts tests/unit/ResumeDraft.test.tsx
    npm run lint
    npm run typecheck
    npm run build

Expected: 全部 exit 0。

- [ ] **Step 7: 更新进度并提交**

    git add src/app src/components/system src/components/create src/components/friend tests PROGRESS.md
    git commit -m "feat: add funnel analytics and resilient error states"

---

### Task 11: 手机端 E2E、可访问性与跨浏览器验收

**Files:**
- Create: tests/e2e/helpers.ts
- Create: tests/e2e/creator-friend-loop.spec.ts
- Create: tests/e2e/draft-recovery.spec.ts
- Create: tests/e2e/privacy.spec.ts
- Create: tests/e2e/accessibility.spec.ts
- Create: tests/e2e/fixtures.ts
- Modify: playwright.config.ts
- Modify: package.json
- Modify: PROGRESS.md

**Interfaces:**
- Consumes: 完整应用和测试数据库环境。
- Produces: 对 Chromium、WebKit 和 mobile-chrome 项目的可重复验收。

- [ ] **Step 1: 配置 Playwright 项目与隔离数据库**

playwright.config.ts 配置 webServer: npm run dev、baseURL、trace: retain-on-failure、screenshot: only-on-failure，并创建 Desktop Chrome、iPhone Safari 尺寸和 Android Chrome 尺寸三个 project。测试使用专用 Supabase 项目或本地 Supabase，禁止指向生产数据库。

Run: npx playwright install chromium webkit

Expected: Chromium 与 WebKit 测试浏览器安装成功。

- [ ] **Step 2: 写完整闭环 E2E**

测试创建者昵称“AD钙”完成固定 25 题，复制分享链接；朋友“0011”以预设 19 题一致答案完成挑战，断言结果为 76%、只出现 1～3 张错题卡；再通过管理链接断言挑战人数 1、平均分 76%、0011 排名第一；最后点击“我也要创建自己的测试”并到达 /create。

- [ ] **Step 3: 写草稿恢复与幂等 E2E**

创建者答到第 8 题后 reload，选择继续并断言仍在 08 / 25；模拟提交响应丢失后重试，断言排行榜只增加一条记录。

- [ ] **Step 4: 写隐私 E2E**

拦截 GET /api/tests/{shareCode} 响应并断言不含创建者答案；未完成答题直接访问结果随机 UUID 得到友好不可用状态；test-A Cookie 无法查看 test-B 排行榜。

- [ ] **Step 5: 写可访问性检查**

检查每题四个选项可用键盘 Tab 与 Enter 操作、焦点可见、文本在 320px 宽不横向滚动、减少动画媒体查询下不会依赖过渡完成导航。若加入 axe-core，则阻断 serious/critical 级别问题。

- [ ] **Step 6: 运行完整验证**

Run:

    npm run test:run
    npm run lint
    npm run typecheck
    npm run build
    npm run test:e2e

Expected: 单元与集成测试 0 failures；lint/typecheck/build exit 0；三个 Playwright 项目全部 PASS。

- [ ] **Step 7: 更新进度并提交**

    git add tests/e2e playwright.config.ts package.json package-lock.json PROGRESS.md
    git commit -m "test: cover the mobile sharing loop end to end"

---

### Task 12: 部署文档、环境核验与 me 子域名上线

**Files:**
- Create: docs/runbooks/deploy.md
- Create: docs/runbooks/rollback.md
- Create: README.md
- Modify: .env.example
- Modify: PROGRESS.md

**Interfaces:**
- Consumes: 可通过 Task 11 全套验证的 main 分支。
- Produces: 独立 Supabase/Vercel 上线步骤与不触碰旧提问箱的回滚方案。

- [ ] **Step 1: 写部署前失败检查脚本说明**

README 的发布检查清单必须要求以下命令全部通过：

    npm ci
    npm run test:run
    npm run lint
    npm run typecheck
    npm run build
    npm run test:e2e

任何命令失败均停止发布。

- [ ] **Step 2: 编写 Supabase 部署步骤**

deploy.md 明确：新建独立 Supabase 项目；运行 001_initial_schema.sql 与 seed.sql；查询 active question set 恰好 25 题；只将 SUPABASE_URL 和 SUPABASE_SECRET_KEY 写入新 Vercel 项目环境变量；不复用旧提问箱数据库。

- [ ] **Step 3: 编写 Vercel 预览验收**

记录如何连接新 GitHub 仓库、配置 NEXT_PUBLIC_SITE_URL、MANAGEMENT_SESSION_SECRET、RATE_LIMIT_SECRET；先只使用 Vercel preview URL 跑 Task 11 的真实环境 smoke flow，不绑定正式域名。

- [ ] **Step 4: 编写 me.ly0688.online 绑定步骤**

只在新项目添加 me.ly0688.online。若域名 DNS 托管在 Vercel，则按 Vercel 提示创建 me 的 CNAME；若外部托管，则复制 Vercel 给出的目标值。验证 HTTPS、公开分享、管理 Cookie 和动态 OG 图。明确禁止删除或重新绑定 ly0688.online 与 www.ly0688.online。

- [ ] **Step 5: 编写回滚方案**

rollback.md 规定：上线异常时只移除或回滚 me 子域名对应的新 Vercel deployment；旧提问箱主域名和数据库无需操作。数据库 migration 不做破坏性回滚，使用向前修复。

- [ ] **Step 6: 最终验收**

Run:

    npm ci
    npm run test:run
    npm run lint
    npm run typecheck
    npm run build
    npm run test:e2e

Expected: 所有命令成功，测试 0 failures。

- [ ] **Step 7: 更新进度并提交**

    git add README.md .env.example docs/runbooks PROGRESS.md
    git commit -m "docs: add deployment and rollback runbooks"

- [ ] **Step 8: 确认最终工作区干净**

Run: git status --short

Expected: 无输出。

## Execution Notes

- 每个 Task 开始前先读 PROGRESS.md 和该 Task 的 Files/Interfaces。
- 每个红灯测试都必须在实现前实际运行并确认失败；不能因为“显然会失败”而跳过。
- 每个绿灯步骤必须保存最新命令输出；不能用上一个 Task 的结果代替。
- 若官方最新 Next.js 或 Supabase API 与计划片段发生不兼容，先查官方文档，保持接口职责与安全约束不变，再记录在 PROGRESS.md。
- 官方参考：
  - https://nextjs.org/docs/app
  - https://nextjs.org/docs/app/getting-started/installation
  - https://tailwindcss.com/docs/installation/framework-guides/nextjs
  - https://supabase.com/docs/guides/auth/choosing-a-server-package
