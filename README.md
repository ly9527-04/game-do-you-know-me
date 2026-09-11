# 你真的懂我吗

移动端优先的朋友默契测试。注册/登录后，通过朋友的八位账号做测试；从120道题、8个分类中自选25道创建自己的测试；查看自己的排行榜。结果默认展示3处差异，可展开全部。

## 本地运行

```bash
npm ci
copy .env.example .env.local
npm run dev
```

本地需独立Supabase数据库；NEXT_PUBLIC_SITE_URL必须与实际访问origin一致。初始化和已有站点升级顺序见[账号版发布说明](docs/runbooks/account-release.md)。不要使用旧提问箱的凭据。

## 验证

```bash
npm run test:run
npm run lint
npm run typecheck
npm run build
```

测试包括内存PostgreSQL事务验证。浏览器夹具、专用Supabase E2E与发布门禁见[账号版发布说明](docs/runbooks/account-release.md)。真实数据库E2E仅在专用环境开启E2E_TEST_READY=1。

## 数据规则

名字、唯一8位数字账号、至少8位密码；第一版不支持找回密码。每人一份当前测试，每位朋友对同一份测试提交一次。重建前明确提醒，新答卷成功保存时才清空旧测试与旧排行榜。旧匿名分享/管理入口停用，已有匿名记录保留，不自动认领。

## 域名边界

仅使用me.ly0688.online。原提问箱ly0688.online、www.ly0688.online及其项目和数据库保持独立。

- [账号版部署与回滚规则](docs/runbooks/account-release.md)
- [历史部署记录](docs/runbooks/deploy.md)
- [回滚说明](docs/runbooks/rollback.md)
