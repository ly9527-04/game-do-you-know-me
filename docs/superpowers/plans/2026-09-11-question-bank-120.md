# 120题与第8分类 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将活动题库从v2的75题扩充为v3的120题，新增「价值观与边界」并为8张分类卡配置有趣短说明，同时保留所有旧测试。

**Architecture:** 静态题库与Supabase继续使用同一组q01～q120稳定ID。生产新增不可变v3题集：复制v2旧75题、插入45道新题，再原子切换唯一活动题集；旧v1/v2及其测试引用保持不变。前端只扩展题组联合类型和分类配置，选25题、答题与计分逻辑不变。

**Tech Stack:** Next.js 16、TypeScript、React、Vitest、Testing Library、Supabase PostgreSQL、PGlite。

## Global Constraints

- q76～q120题面、A/B/C/D选项与mismatchPriority必须逐字采用设计稿。
- 正式分类共8个；q116、q117、q120归入daily，q118、q119归入scenario。
- 新测试使用v3，旧测试继续引用原question_set_id；不得更新或删除v1/v2题目。
- 用户仍从全部题目中任意选择25题，不增加分类配额。
- v2未提交草稿可以在v3启用后失效。
- 只做定向题库、迁移、组件契约测试以及lint/typecheck/build，不扩大视觉回归。
- 设计来源：`docs/superpowers/specs/2026-09-11-question-bank-120-design.md`。

---

### Task 1: 静态120题与8类卡片

**Files:**
- Modify: `src/types/domain.ts`
- Modify: `src/lib/questions.ts`
- Modify: `src/lib/question-groups.ts`
- Modify: `tests/unit/questions.test.ts`
- Modify: `tests/unit/account-selection.test.tsx`

**Interfaces:**
- Consumes: 设计稿中q76～q120的精确内容与分类卡短说明。
- Produces: `QUESTION_POOL: readonly Question[]`包含q01～q120；`QUESTION_GROUPS`包含8个唯一分类；`questionGroup(question)`返回其中一个分类ID。

- [ ] **Step 1: 写失败的120题契约测试**

在`tests/unit/questions.test.ts`把75题断言改为：

```ts
it('contains all 120 questions with stable ids and complete choices', () => {
  expect(QUESTION_POOL).toHaveLength(120)
  expect(QUESTION_POOL.map((item) => item.id)).toEqual(
    Array.from({ length: 120 }, (_, index) => `q${String(index + 1).padStart(2, '0')}`),
  )
  expect(new Set(QUESTION_POOL.map((item) => item.id))).toHaveSize(120)
  expect(QUESTION_POOL.every((item) => item.options.map((option) => option.value).join('') === 'ABCD')).toBe(true)
  expect(QUESTION_POOL.slice(75).every((item) => [2, 3].includes(item.mismatchPriority))).toBe(true)
})
```

再按可见分类而非原始poolGroup断言数量：

```ts
expect(Object.fromEntries(QUESTION_GROUPS.map(group => [
  group.id,
  QUESTION_POOL.filter(question => questionGroup(question) === group.id).length,
]))).toEqual({
  abstract: 20,
  inner: 18,
  daily: 13,
  personality: 17,
  scenario: 12,
  relationship: 17,
  roast: 15,
  values: 8,
})
```

- [ ] **Step 2: 写失败的第8分类与短文案测试**

在`tests/unit/account-selection.test.tsx`中将题库长度改为120，并新增：

```ts
it('shows eight category cards with exploratory descriptions', async () => {
  render(<TestBuilder {...props} />)
  expect(QUESTION_GROUPS).toHaveLength(8)
  expect(await screen.findByRole('button', { name: /价值观与边界/ })).toHaveTextContent(
    '有些答案，认识很久也未必知道',
  )
  expect(screen.getByRole('button', { name: /损友与社交/ })).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: /朋友互损/ })).not.toBeInTheDocument()
})
```

- [ ] **Step 3: 运行定向测试确认失败**

Run:

```bash
npx vitest run tests/unit/questions.test.ts tests/unit/account-selection.test.tsx
```

Expected: FAIL，明确显示题库仍为75题、缺少values分类或新卡片文案。

- [ ] **Step 4: 扩展题组类型和分类配置**

将`QuestionPoolGroup`扩展为：

```ts
export type QuestionPoolGroup =
  | 'classic'
  | 'abstract'
  | 'inner'
  | 'daily'
  | 'personality'
  | 'scenario'
  | 'relationship'
  | 'roast'
  | 'values'
```

将`QUESTION_GROUPS`改为设计稿中的8条配置，固定顺序为abstract、inner、daily、personality、scenario、relationship、roast、values；label与description逐字采用设计稿。保留`classic`题按category映射到abstract/inner的逻辑。

- [ ] **Step 5: 加入q76～q120静态题目**

在`src/lib/questions.ts`的扩展题目数组末尾加入设计稿表格中的45个完整对象。每个对象采用：

```ts
{
  id: 'q76',
  order: 76,
  prompt: '如果一个很重要的人让我失望很多次，我更可能？',
  options: options('直接说清楚', '慢慢疏远', '降低期待但继续相处', '再给一次机会'),
  category: 'real_anchor',
  poolGroup: 'values',
  mismatchPriority: 3,
}
```

q84～q91使用inner，q92～q98使用personality，q99～q105使用relationship，q106～q110使用abstract，q111～q115使用roast，q116/q117/q120使用daily，q118/q119使用scenario；其余字段逐字复制设计稿。

- [ ] **Step 6: 运行定向测试确认通过**

Run:

```bash
npx vitest run tests/unit/questions.test.ts tests/unit/account-selection.test.tsx
```

Expected: 2个测试文件全部通过，120题连续唯一，8类数量和卡片文案正确。

- [ ] **Step 7: 更新进度并提交**

在`PROGRESS.md`当前迭代新增“120题静态题库与8类卡片”记录。

```bash
git add src/types/domain.ts src/lib/questions.ts src/lib/question-groups.ts tests/unit/questions.test.ts tests/unit/account-selection.test.tsx PROGRESS.md
git commit -m "feat: expand question bank to 120"
```

---

### Task 2: Supabase v3题库迁移

**Files:**
- Create: `supabase/migrations/004_question_bank_v3.sql`
- Modify: `supabase/seed.sql`
- Modify: `tests/unit/migration-contract.test.ts`
- Modify: `tests/integration/account-database.test.ts`

**Interfaces:**
- Consumes: v2题集version=2及q01～q75；Task 1的q76～q120内容。
- Produces: v3题集ID `00000000-0000-4000-8000-000000000003`、version=3、唯一活动、120个题目行。

- [ ] **Step 1: 写失败的迁移静态契约**

在`tests/unit/migration-contract.test.ts`读取004文件并断言：

```ts
expect(v3Migration).toMatch(/00000000-0000-4000-8000-000000000003/)
expect(v3Migration).toMatch(/version[^;]*3/i)
for (const id of Array.from({ length: 45 }, (_, i) => `q${i + 76}`)) {
  expect(v3Migration).toContain(`'${id}'`)
}
expect(v3Migration).toMatch(/count\(\*\)[\s\S]*<> 120/i)
expect(v3Migration).toMatch(/update question_sets set is_active = false/)
expect(v3Migration).toMatch(/version = 3/)
```

- [ ] **Step 2: 写失败的PGlite迁移验证**

把004加入`tests/integration/account-database.test.ts`的迁移序列，并新增断言：

```ts
expect(await db.query(`
  select version, is_active, count(q.id)::int as questions
  from question_sets s join questions q on q.question_set_id=s.id
  group by version, is_active order by version
`)).toMatchObject({
  rows: expect.arrayContaining([
    { version: 2, is_active: false, questions: 75 },
    { version: 3, is_active: true, questions: 120 },
  ]),
})
```

在应用004前创建一个引用v2的旧测试，应用后断言其question_set_id不变且仍可读取25个test_questions。

查询v3的q76～q120，并与`QUESTION_POOL.slice(75)`逐题比较`id`、`sort_order/order`、`prompt`、四个选项、`pool_group/poolGroup`和`mismatch_priority/mismatchPriority`，确保数据库与静态题库完全一致。

- [ ] **Step 3: 运行迁移测试确认失败**

Run:

```bash
npx vitest run tests/unit/migration-contract.test.ts tests/integration/account-database.test.ts
```

Expected: FAIL，因为004尚不存在。

- [ ] **Step 4: 创建004事务迁移**

`004_question_bank_v3.sql`必须在一个事务内完整执行以下顺序，不使用动态生成或省略行：

1. 以固定ID `00000000-0000-4000-8000-000000000003` upsert version=3，初始`is_active=false`。
2. 用`insert ... select`把v2的q01～q75完整复制到v3，并对`(question_set_id, id)`冲突执行字段更新。
3. 用一个完整的`insert ... values`语句明确写出设计稿中的q76～q120共45行；每行包含`id`、v3题集ID、`sort_order`、`prompt`、JSONB `options`、`category='real_anchor'`、`pool_group`和`mismatch_priority`，冲突时更新全部内容字段。
4. 在事务内用DO块断言v3题数等于当前v2题数加45；生产v2为75题时再严格断言v3等于120，否则抛出`QUESTION_BANK_V3_INCOMPLETE`。全新重置在seed执行前v2只有50题，因此允许暂时生成95题。
5. 将全部题集设为inactive，再只把`version=3`设为active，最后提交事务。

45行的prompt、options、pool_group和mismatch_priority必须逐字使用设计稿；SQL单引号按PostgreSQL规则双写。迁移不得修改任何tests、test_questions、answers或v1/v2 questions。

- [ ] **Step 5: 同步全新数据库seed**

全新数据库会先执行001～004再运行seed，因此不在seed重复维护45道新题。`supabase/seed.sql`先补齐v2经典题，再把v2中缺失的经典题幂等同步至v3，最后断言v3有120题并保持version=3为唯一活动题集。seed不删除历史题集或测试，也不覆盖已有v3题面。

- [ ] **Step 6: 运行迁移测试确认通过**

Run:

```bash
npx vitest run tests/unit/migration-contract.test.ts tests/integration/account-database.test.ts
```

Expected: 迁移契约和真实内存PostgreSQL测试全部通过；v2=75且inactive，v3=120且active，旧测试仍绑定v2。

- [ ] **Step 7: 更新进度并提交**

在`PROGRESS.md`补记004、seed幂等和旧测试兼容。

```bash
git add supabase/migrations/004_question_bank_v3.sql supabase/seed.sql tests/unit/migration-contract.test.ts tests/integration/account-database.test.ts PROGRESS.md
git commit -m "feat: add version 3 question bank migration"
```

---

### Task 3: 文档与精简发布门禁

**Files:**
- Modify: `README.md`
- Modify: `docs/runbooks/account-release.md`
- Modify: `PROGRESS.md`

**Interfaces:**
- Consumes: Task 1静态120题与Task 2数据库v3。
- Produces: 与实际120题、8类和004顺序一致的运维说明。

- [ ] **Step 1: 更新文档中的75题/7类描述**

使用：

```bash
rg -n "75题|75 道|7类|七类|q75|version=2|v2" README.md docs PROGRESS.md
```

只改当前行为和发布门禁；明确标为历史版本的记录保留。README写成“120题、8类、任选25题”；发布手册写明已有库只执行004，活动题库version=3且120题，旧v1/v2不变。

- [ ] **Step 2: 运行用户要求的精简验证**

Run:

```bash
npx vitest run tests/unit/questions.test.ts tests/unit/account-selection.test.tsx tests/unit/migration-contract.test.ts tests/integration/account-database.test.ts
npm run lint
npm run typecheck
npm run build
```

Expected: 所有定向测试、lint、typecheck和production build退出0。

- [ ] **Step 3: 检查改动范围**

Run:

```bash
git diff --check
git status --short
git diff --stat main...HEAD
```

Expected: 只包含题库、分类配置、004/seed、定向测试和文档；无账号、计分、排行榜或旧站改动。

- [ ] **Step 4: 更新进度并提交**

在`PROGRESS.md`记录验证命令和结果，不提前写“已上线”。

```bash
git add README.md docs/runbooks/account-release.md PROGRESS.md
git commit -m "docs: document 120-question release"
```

- [ ] **Step 5: 发布前交付**

向用户汇报实现、定向验证结果和数据库004影响范围；得到发布指令后再执行线上迁移与Vercel部署。发布时只做活动题集120题、8类卡片和旧测试可读取的定向检查，不重复完整账号闭环。
