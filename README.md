# 你真的懂我吗

一个移动端优先的朋友认知偏差测试：创建者回答固定 25 道题，朋友通过分享链接猜答案，完成后获得默契分、少量错题和创建者排行榜。

## 本地运行

```bash
npm ci
copy .env.example .env.local
npm run dev
```

本地页面默认在 `http://127.0.0.1:3000`。真实数据功能需要把 `.env.local` 指向专用的 Supabase 项目；不要填写旧提问箱使用的项目凭据。

## 发布前检查

任何一项失败都停止发布：

```bash
npm ci
npm run test:run
npm run lint
npm run typecheck
npm run build
npm run test:e2e
```

E2E 默认只运行不依赖数据库的可访问性测试；完整创建/挑战/管理闭环需要显式设置 `E2E_TEST_READY=1`，并使用独立的预览数据库。运行浏览器验收前安装测试浏览器：

```bash
npx playwright install chromium webkit
```

## 域名边界

新站只绑定 `me.ly0688.online`。原提问箱继续使用 `ly0688.online` 和 `www.ly0688.online`，不得在新项目中删除、改绑、重定向或复用它们的 Vercel 项目、GitHub 仓库和数据库。

## 部署与回滚

- [部署 runbook](docs/runbooks/deploy.md)
- [回滚 runbook](docs/runbooks/rollback.md)

管理链接只在创建完成时展示一次；管理令牌仅以哈希写入新数据库，丢失后 MVP 不提供账号找回。
