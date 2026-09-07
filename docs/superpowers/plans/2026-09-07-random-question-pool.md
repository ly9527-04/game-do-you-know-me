# 75 题随机题库 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将题库扩展为 75 题，并让每份新测试按“经典 5 题 + 其余五组各 4 题”固定抽取、保存和分享同一套 25 题，同时兼容全部旧测试。

**Architecture:** v2 题集保存完整 75 题，纯函数负责客户端均衡抽样；`test_questions` 保存每份测试选中的题号及顺序。创建接口和数据库 RPC 双重验证题组，公开测试、朋友提交和结果读取均以 `test_questions` 为边界；迁移为旧测试回填原 25 题。

**Tech Stack:** Next.js 16、React 19、TypeScript、Zod、Supabase/PostgreSQL、Vitest。

## Global Constraints

- 总题库固定为 75 道：原题 `q01`～`q25`，新增题 `q26`～`q75`。
- 每份新测试严格抽取 `classic` 5 道，`daily`、`personality`、`scenario`、`relationship`、`roast` 各 4 道。
- 抽中后再次洗牌，保存顺序；朋友必须回答同一套 25 题。
- 刷新和提交重试恢复同一题组；明确重新开始才重新抽。
- 旧测试、旧链接、每题 4 分、满分 100、排行榜和错题揭晓必须保持有效。
- 服务端不信任客户端题号，必须验证数量、唯一性、所属活动题集、分组比例和答案键集合。
- v1 题集和旧数据不得删除。

---

### Task 1: 75 题领域模型与均衡抽样

**Files:**
- Modify: `src/types/domain.ts`
- Modify: `src/lib/questions.ts`
- Create: `src/lib/question-selection.ts`
- Modify: `tests/unit/questions.test.ts`
- Create: `tests/unit/question-selection.test.ts`

**Interfaces:**
- Produces: `QuestionPoolGroup`, `QUESTION_POOL`, `drawBalancedQuestions(questions, random?)`。
- `drawBalancedQuestions` 返回恰好 25 个 `Question`，顺序已洗牌且无重复。

- [ ] **Step 1: 写失败的题库契约测试**

断言 `QUESTION_POOL` 长度为 75、ID 为 `q01`～`q75`、六组数量为 25/10/10/10/10/10，每题有 A/B/C/D 四个选项。

- [ ] **Step 2: 运行题库测试并确认失败**

Run: `npm run test:run -- tests/unit/questions.test.ts`

Expected: FAIL，实际仍只有 25 题或缺少 `poolGroup`。

- [ ] **Step 3: 扩展类型和完整题库**

在 `Question` 增加：

```ts
export type QuestionPoolGroup = 'classic' | 'daily' | 'personality' | 'scenario' | 'relationship' | 'roast'

export interface Question {
  readonly id: string
  readonly order: number
  readonly prompt: string
  readonly options: readonly QuestionOption[]
  readonly category: QuestionCategory
  readonly poolGroup: QuestionPoolGroup
  readonly mismatchPriority: number
}
```

将现有 25 题标记为 `classic`，按用户给定顺序录入 `q26`～`q75`，导出 `QUESTION_POOL`。

- [ ] **Step 4: 写失败的均衡抽样测试**

测试固定随机源时返回 25 题、经典 5 题、其他组各 4 题、ID 唯一，并验证连续两次不同随机源可产生不同组合。

- [ ] **Step 5: 实现无偏抽样**

```ts
export type RandomSource = () => number

export function drawBalancedQuestions(
  questions: readonly Question[],
  random: RandomSource = cryptoRandom,
): Question[] {
  const quotas: Record<QuestionPoolGroup, number> = {
    classic: 5,
    daily: 4,
    personality: 4,
    scenario: 4,
    relationship: 4,
    roast: 4,
  }
  return shuffle(Object.entries(quotas).flatMap(([group, count]) =>
    shuffle(questions.filter((question) => question.poolGroup === group), random).slice(0, count),
  ), random).map((question, index) => ({ ...question, order: index + 1 }))
}
```

分组不足时抛出领域错误，不返回残缺题组。

- [ ] **Step 6: 运行测试并提交**

Run: `npm run test:run -- tests/unit/questions.test.ts tests/unit/question-selection.test.ts tests/unit/scoring.test.ts`

Commit: `feat: add balanced 75-question pool`

---

### Task 2: 草稿保存固定题组

**Files:**
- Modify: `src/lib/drafts.ts`
- Modify: `src/components/create/CreatorStartPage.tsx`
- Modify: `src/components/create/CreatorQuiz.tsx`
- Modify: `src/components/quiz/QuizSession.tsx`
- Modify: `tests/unit/drafts.test.ts`
- Modify: `tests/unit/CreatorQuiz.test.tsx`

**Interfaces:**
- `QuizDraft` 升级为 version 2，并新增 `questionIds: string[]`、`questionSetVersion: number`。
- `CreatorQuiz` 接收 `questionSetVersion` 与完整 `questions`，恢复或抽取后把选中题组传给 `QuizSession`。

- [ ] **Step 1: 写失败的草稿题组测试**

断言合法 25 题顺序可恢复；重复题号、缺题、未知题号和 version 1 草稿返回 `null`。

- [ ] **Step 2: 运行并确认失败**

Run: `npm run test:run -- tests/unit/drafts.test.ts`

- [ ] **Step 3: 升级草稿结构**

```ts
export type QuizDraft = {
  version: 2
  questionSetVersion: number
  questionIds: string[]
  nickname: string
  answers: QuizAnswers
  currentIndex: number
  updatedAt: string
}
```

`loadDraft` 接收允许的题号集合，并验证题号恰好 25 个、无重复、答案键是题号子集。

- [ ] **Step 4: 写失败的 CreatorQuiz 恢复测试**

断言同一昵称的有效草稿复用原题号；无草稿时只抽一次；提交 payload 同时包含 `questionIds` 与答案。

- [ ] **Step 5: 实现题组初始化与持久化**

创建者答题组件只在无有效草稿时调用 `drawBalancedQuestions`。`QuizSession` 保存草稿时保留 `questionIds` 和 `questionSetVersion`，重新开始清除旧草稿后重新抽取。

- [ ] **Step 6: 运行测试并提交**

Run: `npm run test:run -- tests/unit/drafts.test.ts tests/unit/CreatorQuiz.test.tsx tests/unit/QuizSession.test.tsx tests/unit/ResumeDraft.test.tsx`

Commit: `feat: persist randomized creator question sets`

---

### Task 3: 数据库 v2 题集与 test_questions

**Files:**
- Create: `supabase/migrations/002_random_question_pool.sql`
- Modify: `supabase/seed.sql`
- Modify: `tests/unit/migration-contract.test.ts`

**Interfaces:**
- Produces table `test_questions(test_id, question_set_id, question_id, position)`。
- Replaces RPC `create_test(..., p_question_ids text[], p_answers jsonb)`。
- `create_attempt` validates against `test_questions` rather than all questions in a set.

- [ ] **Step 1: 写失败的迁移契约测试**

断言迁移创建 `pool_group`、`test_questions`、位置唯一约束、复合外键、旧测试回填、v2 激活顺序和 RPC 权限；种子包含 q01～q75 且分组数量正确。

- [ ] **Step 2: 运行并确认失败**

Run: `npm run test:run -- tests/unit/migration-contract.test.ts`

- [ ] **Step 3: 编写向前迁移**

迁移顺序：新增分组列与约束 → 创建 `test_questions` → 回填旧测试 → 写入 v2/75 题 → 重建 RPC → 撤销 public/anon/authenticated 权限并授予 service_role → 最后激活 v2。

RPC 核心验证必须等价于：

```sql
if cardinality(p_question_ids) <> 25
  or (select count(distinct id) from unnest(p_question_ids) id) <> 25
  or not valid_balanced_selection then
  raise exception 'invalid question selection';
end if;
```

`create_test` 在同一事务写入测试、按数组下标写入 `test_questions.position` 和创建者答案。

- [ ] **Step 4: 运行迁移测试并提交**

Run: `npm run test:run -- tests/unit/migration-contract.test.ts tests/unit/questions.test.ts`

Commit: `feat: store per-test question selections`

---

### Task 4: 动态验证与创建 API

**Files:**
- Modify: `src/lib/validation.ts`
- Modify: `src/lib/repositories/tests.ts`
- Modify: `src/app/create/quiz/page.tsx`
- Modify: `src/app/api/tests/route.ts`
- Modify: `tests/unit/validation.test.ts`
- Modify: `tests/integration/create-test-route.test.ts`
- Modify: `tests/integration/repositories.test.ts`

**Interfaces:**
- Produces `validateSelectedAnswers(questionIds, answers)`。
- `CreateTestRecordInput` 新增 `questionIds: string[]`。
- 创建页面从 `getActiveQuestionSet()` 获取 v2 完整题库并传给 `CreatorQuiz`。

- [ ] **Step 1: 写失败的动态验证测试**

断言 schema 接受任意合法 25 个题号与完全匹配答案，拒绝重复、24/26 题、额外答案、缺失答案和非法选项。

- [ ] **Step 2: 运行并确认失败**

Run: `npm run test:run -- tests/unit/validation.test.ts`

- [ ] **Step 3: 实现结构验证和服务端题组验证**

Zod 只负责请求结构；创建路由加载活动题集后，用题库映射验证题号存在、无重复、配额正确、答案键集合一致，再调用仓储。

- [ ] **Step 4: 更新仓储与页面数据流**

```ts
export interface CreateTestRecordInput {
  testId: string
  questionSetId: string
  questionIds: string[]
  nickname: string
  shareCode: string
  manageTokenHash: string
  answers: QuizAnswers
}
```

RPC 参数增加 `p_question_ids`；创建页在题库不可用或不足时显示统一错误卡。

- [ ] **Step 5: 运行测试并提交**

Run: `npm run test:run -- tests/unit/validation.test.ts tests/integration/create-test-route.test.ts tests/integration/repositories.test.ts tests/unit/CreatorQuizPage.test.tsx`

Commit: `feat: validate randomized test creation`

---

### Task 5: 朋友固定题组与结果兼容

**Files:**
- Modify: `src/lib/repositories/tests.ts`
- Modify: `src/lib/repositories/attempts.ts`
- Modify: `src/app/api/tests/[shareCode]/route.ts`
- Modify: `src/app/api/tests/[shareCode]/attempts/route.ts`
- Modify: `tests/integration/public-test-route.test.ts`
- Modify: `tests/integration/attempt-route.test.ts`
- Modify: `tests/integration/result-route.test.ts`
- Modify: `tests/integration/repositories.test.ts`

**Interfaces:**
- `getPublicTest` returns only questions joined through `test_questions`, sorted by `position`。
- Attempt validation consumes the test's exact `questionIds` and rejects all other keys。

- [ ] **Step 1: 写失败的公开题组测试**

仓储 fixture 使用 75 题题集但仅 25 条 `test_questions`；断言 API 只返回被选中的 25 题并保持保存顺序。

- [ ] **Step 2: 写失败的朋友提交测试**

断言朋友用整套 75 题、其他 25 题或缺少一题均返回 400；完全匹配的 25 题正常计分并写入。

- [ ] **Step 3: 运行并确认失败**

Run: `npm run test:run -- tests/integration/public-test-route.test.ts tests/integration/attempt-route.test.ts tests/integration/result-route.test.ts tests/integration/repositories.test.ts`

- [ ] **Step 4: 实现固定题组读取与提交**

公开读取先取测试身份和题集版本，再查询 `test_questions` 及关联 `questions`，按 position 映射为 1～25。朋友提交以该结果构造允许键集合；计分和错题揭晓仅遍历保存的 25 题。

- [ ] **Step 5: 运行测试并提交**

Run: `npm run test:run -- tests/integration/public-test-route.test.ts tests/integration/attempt-route.test.ts tests/integration/result-route.test.ts tests/integration/repositories.test.ts tests/unit/scoring.test.ts`

Commit: `feat: serve fixed randomized friend quizzes`

---

### Task 6: 全量回归、进度记录与发布

**Files:**
- Modify: `PROGRESS.md`
- Verify: all changed files

**Interfaces:**
- Consumes all earlier tasks; produces deployed v2 schema and application.

- [ ] **Step 1: 全量静态与单元验证**

Run:

```powershell
npm run test:run
npm run typecheck
npm run lint
$env:NEXT_TELEMETRY_DISABLED='1'; npm run build
```

Expected: 0 failures；若 Next.js 改写 `tsconfig.json`，用 `apply_patch` 恢复 `jsx: preserve` 后重跑 typecheck。

- [ ] **Step 2: 更新 PROGRESS.md**

记录 75 题分组、均衡抽样、草稿固定题组、`test_questions`、旧测试回填、部署顺序和回滚注意事项。

- [ ] **Step 3: 审核迁移与差异**

Run: `git diff --check`、`git status --short`，确认不提交 `.env*`、管理令牌、Vercel/Supabase 临时文件或无关 UI 工作。

- [ ] **Step 4: 提交并部署数据库迁移**

Commit: `docs: record randomized question pool`

先将 `002_random_question_pool.sql` 推送到独立 Supabase 项目 `ulpxdpqzkwwvsqjxprcd`，核对 v2 为唯一活动题集、共 75 题，并确认旧测试均有 25 条 `test_questions`。

- [ ] **Step 5: 推送应用并检查发布状态**

Push `main` 到 `https://github.com/ly9527-04/game-do-you-know-me.git`，等待 Vercel 项目 `game-do-you-know-me` 的 Production deployment 变为 Ready，并确认别名 `https://me.ly0688.online` 指向新部署。

