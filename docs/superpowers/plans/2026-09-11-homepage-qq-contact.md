# 首页Q群入口 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在首页所有状态的主卡片底部展示Q群讨论提示与群号，并将已完成的120题版本一并发布。

**Architecture:** 在`src/app/page.tsx`内定义无状态`QQContact`组件，并在未登录、已登录和服务异常三个返回分支中复用。新增两条局部CSS规则保持低干扰展示；发布前先备份线上数据、应用004迁移，再推送main触发Vercel部署。

**Tech Stack:** Next.js 16、React、CSS、Supabase PostgreSQL、Vercel。

## Global Constraints

- 文案逐字为“任何需求可进Q群讨论”和“1124631376”。
- 群号仅为可复制文字，不增加链接、按钮或跳转。
- 登录前、登录后和首页服务异常状态均展示。
- 用户明确要求本次不新增、不运行测试；只做差异检查。
- 本次发布包含main上尚未推送的120题、8分类和004迁移。

---

### Task 1: 首页Q群文字与提交

**Files:**
- Modify: `src/app/page.tsx`
- Modify: `src/app/globals.css`
- Modify: `src/components/account/TestBuilder.tsx`
- Modify: `PROGRESS.md`

**Interfaces:**
- Consumes: 首页三个渲染分支与现有`page-shell`卡片。
- Produces: `QQContact(): JSX.Element`，在所有首页状态展示同一段联系信息。

- [ ] **Step 1: 添加可复用联系区块**

在`src/app/page.tsx`加入：

```tsx
function QQContact() {
  return <aside className="homepage-contact" aria-label="需求讨论群">
    <p>任何需求可进Q群讨论</p>
    <p className="homepage-contact__number">1124631376</p>
  </aside>
}
```

将三个`<main className="page-shell">`分支中的原内容保留，并在结束标签前加入`<QQContact />`。

- [ ] **Step 2: 添加低干扰样式**

在`src/app/globals.css`账号首页样式区域加入：

```css
.homepage-contact { margin-top: 24px; padding-top: 18px; border-top: 1px solid var(--line); text-align: center; color: var(--muted); font-size: 12px; }
.homepage-contact p { margin: 0; }
.homepage-contact__number { margin-top: 6px !important; color: var(--cyan); font-weight: 800; letter-spacing: .08em; font-variant-numeric: tabular-nums; }
```

- [ ] **Step 3: 同步120题现有页面文案**

将`src/components/account/TestBuilder.tsx`中的：

```tsx
<p className="lede">从75道题中自由挑选25道，选好后再回答自己的测试。不限制每类数量。</p>
```

改为：

```tsx
<p className="lede">从120道题中自由挑选25道，选好后再回答自己的测试。不限制每类数量。</p>
```

- [ ] **Step 4: 记录、检查并提交**

在`PROGRESS.md`当前迭代记录首页Q群入口。按用户要求不运行测试，只执行：

```bash
git diff --check
git status --short
git diff --stat
git add src/app/page.tsx src/app/globals.css src/components/account/TestBuilder.tsx PROGRESS.md
git commit -m "feat: add homepage QQ contact"
```

预期：差异只包含首页联系区块、两条文案、样式与进度记录。

### Task 2: 备份、迁移与发布

**Files:**
- Read: `supabase/migrations/004_question_bank_v3.sql`
- Read: `docs/runbooks/account-release.md`

**Interfaces:**
- Consumes: 当前生产数据库、main分支和004迁移。
- Produces: 生产活动题库v3=120题，Vercel线上首页包含Q群信息。

- [ ] **Step 1: 备份并核对生产库**

使用已连接的Supabase项目凭据，把迁移前关键表及计数保存到本机发布工件目录；确认当前唯一活动题集为v2、75题，并记录tests与attempts数量。

- [ ] **Step 2: 应用004迁移**

只执行`supabase/migrations/004_question_bank_v3.sql`，随后查询确认version=3唯一活动且120题，v1/v2仍存在，tests与attempts数量不变。

- [ ] **Step 3: 推送并等待Vercel发布**

```bash
git push -u origin main
```

等待Vercel生产部署Ready，并确认`https://me.ly0688.online`首页出现两行Q群文字、创建页显示120题、8张分类卡可读取。按用户要求不执行额外测试闭环。
