# 你真的懂我吗：回滚 runbook

> 账号版新增限制：不得回滚到无登录鉴权的匿名构建；这会恢复公开结果访问。只能回退到兼容账号的已验证构建，或暂停新站流量后向前修复。详见 [account-release.md](account-release.md)。

回滚范围只包括 `me.ly0688.online` 对应的新 Vercel 部署。旧提问箱 `ly0688.online`、`www.ly0688.online`、旧 GitHub 仓库和旧数据库不需要、也禁止操作。

## 应用异常

1. 在 Vercel 新项目中将流量切回上一个已验证的 deployment，或撤销当前 `me.ly0688.online` 的别名绑定。
2. 保留失败 deployment 的日志和 `test-results`，记录错误时间、受影响路由和 deployment ID；不要把数据库错误原文发布给用户。
3. 重新跑 `npm run test:run`、`npm run lint`、`npm run typecheck`、`npm run build`，再对预览地址跑 `npm run test:e2e`。
4. 只有预览验收通过后，才把 `me.ly0688.online` 指向修复后的新 deployment。

## 数据库异常

- 先暂停新站流量或切回上一个应用 deployment，不执行破坏性 SQL。
- 迁移只允许向前修复：新增兼容列、函数或索引，完成验证后再发布应用。
- 不清空、不重建、不回滚旧提问箱数据库；新站数据库与旧库必须保持物理隔离。

## 域名保护

回滚期间不得删除或重新绑定 `ly0688.online`、`www.ly0688.online`。新站故障时可以暂时移除 `me.ly0688.online` 的 Vercel 别名，但旧主域名的 DNS 和 Vercel 项目不应改变。
