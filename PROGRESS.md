# 项目进度

## 项目概览

「你真的懂我吗」是一个移动端优先的朋友认知偏差测试网站：创建者回答固定 25 题并分享链接，朋友猜测创建者的答案，完成后获得默契度和少量错题揭晓；创建者通过独立管理链接查看排行榜。

## 模块清单

- **项目基础、工具链与设计令牌**（`package.json`、根配置、`src/app`、`tests/unit/home.test.tsx`）
  - 已完成 Next.js、TypeScript、Tailwind、ESLint、Vitest 与 Playwright 基础配置；可使用 `dev`、`build`、`lint`、`test`、`test:run`、`test:e2e`、`typecheck` 命令。
  - 首页 smoke test 覆盖产品承诺、创建入口和“无需注册 / 25 道题 / 约 3 分钟”投入说明。
  - 全站已完成轻量社交卡片视觉精修：统一暖白底色、紫色主操作、柔和描边与圆角，保留键盘焦点、44px 触控区域、320px 响应式和减少动态效果；答题选中态、深色结果卡及排行榜首位均有明确层级。

- **版本化题库与结果规则**（`src/types/domain.ts`、`src/lib/questions.ts`、`src/lib/scoring.ts`、`tests/unit/questions.test.ts`、`tests/unit/scoring.test.ts`）
  - 已录入附录 A 固定 25 题，题目 ID 为 `q01`～`q25`，并以 `QUESTION_SET_VERSION = 1` 固定版本；选项和顺序只读，分类仅供内部使用。
  - 已扩展出 75 题完整题池：原 25 题归入 `classic`，新增日常、性格、情景、友情/暧昧、损友五组各 10 题；均衡抽样固定选择经典 5 题和其他五组各 4 题，再统一洗牌为 25 题且分组不足时拒绝生成。
  - 已实现完整答卷校验、每题 4 分的纯计分、六个分数段文案，以及按错题优先级和挑战 ID 稳定散列选择最多 3 题的结果规则。
  - 答卷校验会在运行时严格验证完整 `q01`～`q25` 键集与 A/B/C/D 选项，拒绝同数量无关键、缺失题号和非法值，避免畸形输入产生虚假满分。

- **Supabase 持久化边界**（`supabase/`、`src/lib/supabase/server.ts`、`src/lib/repositories/`、`tests/unit/migration-contract.test.ts`、`tests/integration/repositories.test.ts`）
  - 已定义八张启用 RLS 且默认无客户端策略的核心表；`create_test`、`create_attempt` 与 `check_rate_limit` 通过 `security definer` RPC 提供服务端事务写入、幂等挑战和原子限流。
  - 固定版本 1 的 25 题以可重复执行的 SQL 种子保存；静态契约逐题核对 `q01`～`q25` 的题面和选项，真实迁移留待独立 Supabase 预览项目验证。
  - 服务端仓储统一使用 `SUPABASE_SECRET_KEY`，将数据库 snake_case 映射为 camelCase DTO；公开测试读取列清单不包含创建者答案，数据库原始错误不会传给调用方。
  - 修复 JSONB 对象键计数兼容 PostgreSQL，并为全部 SECURITY DEFINER 函数显式撤销客户端执行权限；管理统计改由服务端聚合 RPC 返回，排行榜明细保持 score 降序、created_at 升序。
  - 题目主键改为 `(question_set_id, id)`，创建者答案和朋友答案均通过复合外键绑定测试创建时的题库版本；后续题库仍可复用 `q01`～`q25`，不会与旧测试串题。

- **产品设计**（`docs/superpowers/specs/2026-09-06-do-you-really-know-me-design.md`）
  - 已完成 MVP 范围、用户流程、视觉方向、技术架构、数据模型、安全、埋点、测试与部署设计。
  - 已确认全站轻量 UI 精修方向：采用“轻盈社交卡片”为主视觉，结果页引入少量深色对比；功能、数据与 URL 保持不变，详见 `2026-09-07-ui-light-polish-design.md`。
- **实施计划**（`docs/superpowers/plans/2026-09-06-do-you-really-know-me-mvp.md`）
  - 已将 MVP 拆为 12 个可独立测试和提交的任务，执行时采用 TDD，并在每个任务后更新本文件。
  - 覆盖项目基础、题库与计分、Supabase、匿名安全、答题组件、创建/挑战/结果/管理闭环、埋点、E2E 和部署。

- **输入验证与匿名安全控制**（`src/lib/validation.ts`、`src/lib/security.ts`、`src/lib/rate-limit.ts`、`src/lib/analytics.ts`）
  - Zod 请求 schema 会 trim 昵称并按 Unicode code point 限制为 1～20 个字符；答卷契约由 `FIXED_QUESTION_IDS` 明确锁定为 q01～q25 全量键集、A/B/C/D 选项，不随题库加载结果变化，朋友提交的幂等键必须为 UUID。
  - 管理令牌和分享码由安全随机字节生成；管理会话采用版本化 HMAC-SHA256，并在比较时使用 timingSafeEqual，过期边界视为无效。
  - 限流只对 `x-forwarded-for` 首个且经 IP 校验的客户端值做 HMAC；无论 RPC 返回错误还是抛出/拒绝，都统一映射为不泄露数据库详情的错误。埋点在 schema 校验成功后同样将客户端、查询构造与 insert 的异常统一映射为 `AnalyticsError`；事件名固定为八个漏斗节点，敏感 metadata 键拒绝、其他非白名单键剔除。

- **可复用答题会话与本地草稿**（`src/components/quiz/`、`src/lib/drafts.ts`、`tests/unit/QuestionCard.test.tsx`、`tests/unit/QuizSession.test.tsx`、`tests/unit/drafts.test.ts`）
  - 答题卡提供四个原生按钮、题目关联标签、`aria-pressed` 与文字化“已选”状态；进度以零补位题号和可访问进度条展示，手机端采用可触摸的手帐档案卡布局。
  - 会话按创建者昵称或朋友分享码隔离草稿，损坏、版本不符和 30 天失效草稿均安全忽略；选择会即时持久化，200ms 后自动前进（减少动态时立即前进），前后导航不允许越过未答题，完成第 25 题时只回调一次并保留草稿，后续提交调用方仅在服务端成功后调用 `clearDraft`。
  - 首次 SSR 与 hydration 使用同一份初始答卷并在挂载后锁定恢复草稿，避免进度不匹配或恢复前误写；分享码变更以 keyed 内部会话释放旧 timer、答案和完成状态，恢复题号不超过合并答卷的第一道未答题。
  - 草稿已升级为 v2，并同时保存题集版本、25 个题号及其固定顺序；创建者只在没有有效草稿时抽题，刷新和提交重试复用原题单，明确清除草稿后重新开始才会重新抽取。

- **创建、挑战、结果与管理闭环**（`src/app/create`、`src/app/t`、`src/app/r`、`src/app/m`、`src/app/manage`、`src/components/{create,friend,results,manage,share}`）
  - 创建者答案服务端封存后生成独立分享码和管理令牌；朋友提交时只接收公开题面，由服务端重新计分并以幂等键避免重复排行榜记录。
  - 结果页仅展示分数、预设点评和最多三道稳定错题；分享卡不包含答案或管理令牌。管理令牌交换为短期 HttpOnly 会话，排行榜仅对绑定测试可见。
  - 创建、挑战、结果、管理页面均对无效链接和数据库故障返回统一友好状态，不泄露堆栈、内部 ID 或配置细节。
  - 排行榜记录使用“第 N 名 / 昵称 / 分数 / M月D日完成”的完整文字标签，避免手机端裸数字含义不清。

- **埋点、恢复与韧性状态**（`src/app/api/events`、`src/components/analytics`、`src/components/system`、`tests/integration/events-route.test.ts`、`tests/unit/ResumeDraft.test.tsx`）
  - 八个漏斗事件通过限流后的 best-effort 接口写入，写入失败不阻塞创建、答题或分享；首页会话内的 `homepage_view` 只发送一次。
  - 首页自动发现最近有效的创建者草稿，提供“继续上次进度”和“重新开始”；提交失败保留答案并支持再次提交，统一错误边界和加载卡不显示内部细节。
  - 创建和挑战完成事件沿用浏览器匿名会话 ID，保证漏斗可连续统计；朋友入口只恢复当前分享码对应的草稿，避免多张测试互相混淆。
  - 系统分享异常会自动回退到剪贴板，用户主动取消则保持安静；创建完成页只在朋友链接复制成功后记录分享事件，复制失败提供可见提示。

- **跨浏览器 E2E 与可访问性验收**（`playwright.config.ts`、`tests/e2e/`）
  - 配置 Desktop Chrome、iPhone Safari 和 Android Chrome 三个项目，默认只启动本地开发服务；设置 `E2E_BASE_URL` 后可对预览地址运行，数据库闭环测试必须显式设置 `E2E_TEST_READY=1` 才会执行，避免误连生产库。
  - 覆盖创建→朋友挑战→结果→排行榜回流、草稿恢复与丢响应幂等重试、公开题面隐私、管理 Cookie 隔离、320px 键盘操作、焦点可见和减少动画检查。
  - 当前环境缺少 Playwright 浏览器二进制，代码已通过测试列举、typecheck 和 lint；运行 E2E 前需在具备下载权限的机器执行 `npx playwright install chromium webkit`。

- **部署、域名隔离与回滚文档**（`README.md`、`docs/runbooks/`、`.env.example`）
  - 发布门禁固定为安装依赖、单测、lint、typecheck、生产 build 和 E2E 全部通过；部署步骤要求使用独立 Supabase/Vercel 项目并核对活动题集为 25 题。
  - 明确新站只绑定 `me.ly0688.online`，旧提问箱的 `ly0688.online` 与 `www.ly0688.online` 不改 DNS、不改绑项目、不复用数据库；回滚采用新站 deployment 切换与数据库向前修复。

## 重要细节 / 坑

- 正式站点使用 `me.ly0688.online`；原提问箱继续使用 `ly0688.online` 和 `www.ly0688.online`。
- 所有对外链接统一通过严格的 canonical origin 生成；生产配置缺失或协议非法时不得回退为 `localhost`。
- 新旧站必须使用独立 Git 仓库、Vercel 项目和数据库，迁移时不得覆盖旧提问箱。
- 第一版不注册。公开分享码与私密管理令牌严格分离；数据库只保存管理令牌哈希。
- 创建者答案不能在朋友提交前下发；计分必须由服务端完成。
- 固定 25 道题不可改动，题库需版本化，保证后续改题不破坏已有测试。
- 不保存或记录原始 IP、答案、管理令牌等敏感埋点上下文；管理会话失效时间为秒级 Unix 时间，`expires <= now` 均视为过期。
- 设计令牌统一使用 `--paper`、`--surface`、`--ink`、`--muted`、`--coral`、`--violet`、`--violet-soft`、`--marker`、`--line`；重要交互必须保留非颜色状态提示与可见焦点。
