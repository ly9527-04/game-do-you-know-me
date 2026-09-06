# 项目进度

## 项目概览

「你真的懂我吗」是一个移动端优先的朋友认知偏差测试网站：创建者回答固定 25 题并分享链接，朋友猜测创建者的答案，完成后获得默契度和少量错题揭晓；创建者通过独立管理链接查看排行榜。

## 模块清单

- **项目基础、工具链与设计令牌**（`package.json`、根配置、`src/app`、`tests/unit/home.test.tsx`）
  - 已完成 Next.js、TypeScript、Tailwind、ESLint、Vitest 与 Playwright 基础配置；可使用 `dev`、`build`、`lint`、`test`、`test:run`、`test:e2e`、`typecheck` 命令。
  - 首页 smoke test 覆盖产品承诺和创建入口；全局样式固定朋友手帐色板、键盘焦点与减少动态效果。

- **产品设计**（`docs/superpowers/specs/2026-09-06-do-you-really-know-me-design.md`）
  - 已完成 MVP 范围、用户流程、视觉方向、技术架构、数据模型、安全、埋点、测试与部署设计。
- **实施计划**（`docs/superpowers/plans/2026-09-06-do-you-really-know-me-mvp.md`）
  - 已将 MVP 拆为 12 个可独立测试和提交的任务，执行时采用 TDD，并在每个任务后更新本文件。
  - 覆盖项目基础、题库与计分、Supabase、匿名安全、答题组件、创建/挑战/结果/管理闭环、埋点、E2E 和部署。

## 重要细节 / 坑

- 正式站点使用 `me.ly0688.online`；原提问箱继续使用 `ly0688.online` 和 `www.ly0688.online`。
- 新旧站必须使用独立 Git 仓库、Vercel 项目和数据库，迁移时不得覆盖旧提问箱。
- 第一版不注册。公开分享码与私密管理令牌严格分离；数据库只保存管理令牌哈希。
- 创建者答案不能在朋友提交前下发；计分必须由服务端完成。
- 固定 25 道题不可改动，题库需版本化，保证后续改题不破坏已有测试。
- 设计令牌统一使用 `--paper`、`--ink`、`--coral`、`--violet`、`--marker`；重要交互必须保留非颜色状态提示与可见焦点。
