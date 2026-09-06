# 你真的懂我吗：部署 runbook

这份流程只用于新站 `me.ly0688.online`。它与旧提问箱完全隔离，任何步骤都不应操作 `ly0688.online` 或 `www.ly0688.online`。

## 1. 发布前门禁

在待发布分支执行，全部命令必须退出码为 0：

```bash
npm ci
npm run test:run
npm run lint
npm run typecheck
npm run build
npm run test:e2e
```

若要运行数据库闭环 E2E，先确认 `E2E_TEST_READY=1`，并核对 `E2E_BASE_URL` 是预览地址或本地地址，不是旧站域名。

## 2. 创建独立 Supabase 项目

1. 在 Supabase 新建项目，项目名称和凭据均不得与旧提问箱复用。
2. 只在这个新项目的 SQL Editor 执行 `supabase/migrations/001_initial_schema.sql`，再执行 `supabase/seed.sql`。
3. 查询活动题集，确认恰好 25 题且 ID 为 `q01`～`q25`：

   ```sql
   select qs.version, count(q.id) as question_count
   from public.question_sets qs
   join public.questions q on q.question_set_id = qs.id
   where qs.is_active = true
   group by qs.id, qs.version;
   ```

4. 确认 RLS 已启用、匿名客户端没有核心表读写策略，三项 RPC 只允许服务端密钥调用。
5. 保管 Supabase URL 和服务端密钥。服务端密钥只写入新 Vercel 项目，不提交 Git，不放入浏览器环境变量。

## 3. 创建独立 Vercel 项目

1. 将新 GitHub 仓库导入为新的 Vercel 项目，不要选择旧提问箱项目。
2. 在 Preview、Production 环境分别配置：

   ```text
   NEXT_PUBLIC_SITE_URL=https://<preview-or-production-host>
   SUPABASE_URL=<new-supabase-project-url>
   SUPABASE_SECRET_KEY=<new-supabase-server-secret>
   MANAGEMENT_SESSION_SECRET=<random-secret-at-least-32-bytes>
   RATE_LIMIT_SECRET=<random-secret-at-least-32-bytes>
   ```

   `NEXT_PUBLIC_SITE_URL` 必须是当前环境的 `http://` 或 `https://` origin；Preview 先填 Vercel 预览地址，正式环境再填 `https://me.ly0688.online`。
3. 不要配置 `ly0688.online`、`www.ly0688.online` 或旧项目的数据库变量。
4. 部署 Preview 后，先在预览地址完成一次完整手机流程：创建、复制朋友链接、朋友挑战、结果页、管理排行榜和动态 OG 图。

## 4. 绑定 me 子域名

只在新 Vercel 项目添加 `me.ly0688.online`：

- 如果 DNS 托管在 Vercel，按 Vercel Domains 页面给出的目标值创建 `me` 的 CNAME。
- 如果 DNS 在外部服务商，复制 Vercel 给出的 CNAME 目标并等待 DNS 生效。

完成后验证：

1. `https://me.ly0688.online` 可打开首页且 HTTPS 有效。
2. 创建结果中的朋友链接以 `https://me.ly0688.online/t/...` 开头。
3. 管理链接交换后跳转到 `/manage/...`，Cookie 为 HttpOnly、Secure、SameSite=Lax。
4. `/api/og/results/<attemptId>` 返回结果分享卡，卡片不含答案、管理令牌或内部 ID。
5. `https://ly0688.online` 与 `https://www.ly0688.online` 仍打开原提问箱，DNS、绑定和数据均未被改动。
