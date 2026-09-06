# 项目进度

## 项目概览

「你真的懂我吗」是一个移动端优先的朋友认知偏差测试网站：创建者回答固定 25 题并分享链接，朋友猜测创建者的答案，完成后获得默契度和少量错题揭晓；创建者通过独立管理链接查看排行榜。

## 模块清单

- **项目基础、工具链与设计令牌**（`package.json`、根配置、`src/app`、`tests/unit/home.test.tsx`）
  - 已完成 Next.js、TypeScript、Tailwind、ESLint、Vitest 与 Playwright 基础配置；可使用 `dev`、`build`、`lint`、`test`、`test:run`、`test:e2e`、`typecheck` 命令。
  - 首页 smoke test 覆盖产品承诺和创建入口；全局样式固定朋友手帐色板、键盘焦点与减少动态效果。

- **版本化题库与结果规则**（`src/types/domain.ts`、`src/lib/questions.ts`、`src/lib/scoring.ts`、`tests/unit/questions.test.ts`、`tests/unit/scoring.test.ts`）
  - 已录入附录 A 固定 25 题，题目 ID 为 `q01`～`q25`，并以 `QUESTION_SET_VERSION = 1` 固定版本；选项和顺序只读，分类仅供内部使用。
  - 已实现完整答卷校验、每题 4 分的纯计分、六个分数段文案，以及按错题优先级和挑战 ID 稳定散列选择最多 3 题的结果规则。
  - 答卷校验会在运行时严格验证完整 `q01`～`q25` 键集与 A/B/C/D 选项，拒绝同数量无关键、缺失题号和非法值，避免畸形输入产生虚假满分。

- **Supabase 持久化边界**（`supabase/`、`src/lib/supabase/server.ts`、`src/lib/repositories/`、`tests/unit/migration-contract.test.ts`、`tests/integration/repositories.test.ts`）
  - 已定义八张启用 RLS 且默认无客户端策略的核心表；`create_test`、`create_attempt` 与 `check_rate_limit` 通过 `security definer` RPC 提供服务端事务写入、幂等挑战和原子限流。
  - 固定版本 1 的 25 题以可重复执行的 SQL 种子保存；静态契约逐题核对 `q01`～`q25` 的题面和选项，真实迁移留待独立 Supabase 预览项目验证。
  - 服务端仓储统一使用 `SUPABASE_SECRET_KEY`，将数据库 snake_case 映射为 camelCase DTO；公开测试读取列清单不包含创建者答案，数据库原始错误不会传给调用方。
  - 修复 JSONB 对象键计数兼容 PostgreSQL，并为全部 SECURITY DEFINER 函数显式撤销客户端执行权限；管理统计改由服务端聚合 RPC 返回，排行榜明细保持 score 降序、created_at 升序。

- **产品设计**（`docs/superpowers/specs/2026-09-06-do-you-really-know-me-design.md`）
  - 已完成 MVP 范围、用户流程、视觉方向、技术架构、数据模型、安全、埋点、测试与部署设计。
- **实施计划**（`docs/superpowers/plans/2026-09-06-do-you-really-know-me-mvp.md`）
  - 已将 MVP 拆为 12 个可独立测试和提交的任务，执行时采用 TDD，并在每个任务后更新本文件。
  - 覆盖项目基础、题库与计分、Supabase、匿名安全、答题组件、创建/挑战/结果/管理闭环、埋点、E2E 和部署。

- **输入验证与匿名安全控制**（`src/lib/validation.ts`、`src/lib/security.ts`、`src/lib/rate-limit.ts`、`src/lib/analytics.ts`）
  - Zod 请求 schema 会 trim 昵称并按 Unicode code point 限制为 1～20 个字符；答卷严格限为 q01～q25 全量键集、A/B/C/D 选项，朋友提交的幂等键必须为 UUID。
  - 管理令牌和分享码由安全随机字节生成；管理会话采用版本化 HMAC-SHA256，并在比较时使用 timingSafeEqual，过期边界视为无效。
  - 限流只对 `x-forwarded-for` 首个且经 IP 校验的客户端值做 HMAC；无论 RPC 返回错误还是抛出/拒绝，都统一映射为不泄露数据库详情的错误。事件名固定为八个漏斗节点，敏感 metadata 键拒绝、其他非白名单键剔除。

## 重要细节 / 坑

- 正式站点使用 `me.ly0688.online`；原提问箱继续使用 `ly0688.online` 和 `www.ly0688.online`。
- 新旧站必须使用独立 Git 仓库、Vercel 项目和数据库，迁移时不得覆盖旧提问箱。
- 第一版不注册。公开分享码与私密管理令牌严格分离；数据库只保存管理令牌哈希。
- 创建者答案不能在朋友提交前下发；计分必须由服务端完成。
- 固定 25 道题不可改动，题库需版本化，保证后续改题不破坏已有测试。
- 不保存或记录原始 IP、答案、管理令牌等敏感埋点上下文；管理会话失效时间为秒级 Unix 时间，`expires <= now` 均视为过期。
- 设计令牌统一使用 `--paper`、`--ink`、`--coral`、`--violet`、`--marker`；重要交互必须保留非颜色状态提示与可见焦点。
