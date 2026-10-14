# 宠物健康平台 MVP

[![CI tests](https://github.com/ls-031128/vibe-liusure/actions/workflows/test.yml/badge.svg)](https://github.com/ls-031128/vibe-liusure/actions/workflows/test.yml)

这是一个面向普通宠物主人的健康信息辅助工具，支持宠物资料录入、手动健康观察记录、风险标签可视化及 AI 日常护理建议，不进行疾病诊断。

当前已完成宠物和用户手动健康评估记录闭环、Recharts 图表，以及 Day 7 的 DeepSeek AI 护理建议助手。数据库使用 PostgreSQL；AI 助手不会创建评估记录或执行医学诊断。当前已部署至 Vercel，并连接 Neon PostgreSQL；在线地址为 [vibe-liusure.vercel.app](https://vibe-liusure.vercel.app)。Visitor 统计已修复，DeepSeek AI 已接入。

## Day 9 上线状态

更新日期：2026-10-14。本轮只读检查：首页 HTTP 200，`/api/ping` 返回 `{"ok":true}`，`GET /api/visitors` 返回 HTTP 200 和 `{"count":8}`。8 是检查时的累计值，不是固定值，也不表示唯一访客人数。本轮未创建记录、执行迁移或调用收费 AI。

当前技术栈为 Next.js App Router、React、TypeScript、Tailwind CSS、Prisma 7、Neon PostgreSQL、Recharts 和服务端 DeepSeek API。页面通过本站 API 读写数据库；AI 接口读取宠物及近期手动记录，在服务端调用 DeepSeek，Key 不发送到浏览器。

当前部署与更新入口见 [部署手册](../docs/部署手册.md)。[线上部署验收](../docs/线上部署验收.md)保留手机、真实 AI 和统计落库验收步骤，其中此前的 404 等历史检查不代表当前状态；Day 9 最新 HTTP 结果以上表述为准。教师手机实测、刷新计数增量及真实 AI 成功问答的证据仍需人工补齐。

## 本地启动

需要 Node.js LTS。

```bash
npm install
# 先按 .env.example 配置 PostgreSQL DATABASE_URL 和 DIRECT_URL
npm run db:generate
npm run dev
```

启动后访问 [http://localhost:3000](http://localhost:3000)。首页显示产品 Header、宠物概览、健康评估与图表、AI 助手。

宠物和评估记录功能不需要 AI Key；使用 AI 助手需要配置服务端 DeepSeek Key。配置本地环境时，按 `.env.example` 提供的变量名填写 PostgreSQL 连接地址；不要将真实连接 URL 或 Key 提交到 Git。

## 项目协作约束

`AGENTS.md` 是本项目的协作和 AI 编码约束，包含 MVP 边界、宠物健康安全边界、修改流程和验证要求。

## 数据库说明

Day 4 T2 使用 PostgreSQL + Prisma 7。Prisma Schema 位于 `prisma/schema.prisma`，PostgreSQL migration 历史位于 `prisma/migrations-postgresql/`，生成的 Client 位于 `generated/prisma/`。原 SQLite migration 保留在 `prisma/migrations/`，历史结构参考为 `db/schema.sqlite.sql`；`prisma/dev.db` 原文件作为本地数据归档保留，不会自动导入线上数据库。

数据库 Schema 定义 `pets`、`health_assessments` 和新加入的 `visitors` 表。访问记录保存 ID、时间和固定首页路径 `/`，不保存身份信息。当前线上统计查询已恢复；不保存 AI 问题/回复或疾病诊断数据，不导入 SQLite 中的任何记录。

配置生成与校验：

```bash
npm ci
npm run db:validate
npm run db:generate
```

实际连接 Neon 前，应先配置 `DIRECT_URL`。现有 `npm run db:migrate:deploy` 仅适用于人工核验的 Neon test 分支；不要用于 production 或绕过保护。当前上线不需要为了文档同步再次执行迁移，后续结构变更须先核对实际目标、备份并按批准流程处理。

数据库 API 集成测试仅在设置独立的 `TEST_DATABASE_URL` 后执行；没有该变量时会明确跳过这些测试。不得将该变量指向生产数据库。

## 验证 `/api/ping`

浏览器访问：

```text
http://localhost:3000/api/ping
```

或使用命令行：

```bash
curl http://localhost:3000/api/ping
```

预期返回：

```json
{"ok":true}
```

## 测试和构建

```bash
npm test
npx tsc --noEmit
npm run build
```

测试使用 Node 内置测试运行器，不调用真实 AI。图表数据转换、请求竞态及 ping 测试不需要数据库；宠物和健康评估 API 集成测试需要独立 PostgreSQL 测试数据库。

## Day 5 T2：GitHub Actions CI

仓库根目录的 `.github/workflows/test.yml` 会在每次 `push` 和 Pull Request 时运行测试：checkout 仓库、安装 Node.js 22、执行 `npm install`、生成 Prisma Client，然后在 `pet-health-platform/` 中运行 `npm test`。

CI 不配置 Neon 或真实 `DATABASE_URL`。普通测试通过现有隔离启动器运行；需要数据库的集成测试会明确显示为跳过，不会连接线上数据库，也不会删除这些测试。需要在 GitHub 仓库的分支保护规则中将 `Test` 检查设为必需项，测试失败才会阻止合并。

本地可先运行 `npm test` 检查非数据库测试。数据库集成测试需单独按项目的安全流程显式启用。

## Day 4 T1：Recharts 图表组件接入

### 组件选择与安装

本阶段选择 Recharts，因为它适配 React 客户端组件，能够直接使用已有的健康评估记录渲染饼图和柱状图，不需要新增数据库字段或图表服务。

安装固定版本：

```bash
npm install recharts@3.10.1
```

### 新增文件

- `app/health-assessment-charts.tsx`：客户端图表组件，展示风险提示分布饼图和评估记录趋势柱状图。
- `lib/health-assessment-chart-data.ts`：独立的图表数据转换函数，负责风险等级计数、日期聚合和排序。
- `tests/health-assessment-chart-data.test.ts`：覆盖图表数据转换逻辑的单元测试。
- `lib/request-version.ts`：提供轻量请求版本控制，阻止已过期请求更新界面状态。
- `tests/request-version.test.ts`：覆盖旧请求失效和清理时请求失效。

### 图表功能和数据流程

- 风险提示分布：读取当前宠物评估记录的 `riskLevel`，统计每个原始标签的数量；缺失或非法标签归入“其他”。
- 评估记录趋势：读取 Prisma `DateTime` 的 `createdAt`。API JSON 将时间序列化为带 `Z` 的 ISO UTC 时间；图表按 UTC 日历日聚合并按日期升序排列。项目当前没有用户时区设置，因此 UTC 是统一默认值。用户本地凌晨附近的记录可能显示在与本地日历不同的 UTC 日期；列表时间仍按浏览器本地格式显示。
- 数据来源：健康评估面板已经通过 `GET /api/health-assessments?petId=...` 获取记录，图表直接复用该响应，不新增 API。
- 风险提示只表示用户手动填写的初步信息，不转换为医学评分，也不表示 AI 诊断。

### 宠物切换与日期边界

- 切换宠物时，面板按宠物 ID 隔离记录状态，因此新宠物页面立即不再渲染上一只宠物的列表和图表。
- 评估查询使用 `AbortController` 取消前一请求，并用请求版本和当前宠物 ID 双重校验；迟到结果、失败响应和组件卸载后的结果不会更新当前界面。成功新增记录会使旧查询失效，再显示新记录。
- 趋势图固定按 UTC 分组，避免把 UTC 时间字符串伪装成本地日期。此版本没有账号或用户时区偏好，且 UTC 分组可能与浏览器本地显示的日期不同。
- 自动化测试覆盖旧请求失效、卸载时请求版本失效、跨 UTC 午夜在 UTC 与 `Asia/Shanghai` 下的分组差异、同日聚合、日期排序，以及缺失/非法日期忽略。

图表组件使用 Next.js 客户端组件机制，因为 Recharts 需要浏览器端渲染。无数据时显示明确空状态；图表容器使用响应式宽度，屏幕较窄时改为单列布局。

### 本地运行与验证

```bash
npm install
npm run dev
npm test
npm run typecheck
npm run build
```

本阶段实际完成了 API 数据转换测试、完整测试、TypeScript 检查和 production build。尚未使用浏览器自动化工具逐项验证图表交互。

### 实际遇到的问题

- 安装 Recharts 时 npm 报告当前依赖树存在 4 个高危审计项；本阶段没有使用强制升级，避免扩大改动范围。
- production build 会自动修改 `next-env.d.ts` 的类型路径。确认这是构建生成变化后已恢复，未保留在本阶段功能 diff 中。
- production build 提示仓库外存在 `package-lock.json`，Next.js 忽略了该文件；该提示不影响本地构建结果。

## Day 7：DeepSeek AI 宠物健康助手

### 配置和使用

在项目本地 `.env` 中配置以下服务端变量；示例中的 Key 留空，由开发者自行填写。`.env` 已被 Git 忽略。没有有效 Key 时助手返回友好错误，原有记录功能继续可用。

```dotenv
AI_API_BASE_URL=https://api.deepseek.com
AI_API_KEY=
AI_MODEL=deepseek-flash
```

配置后重新启动开发服务。在健康评估区域选择宠物，输入问题并点击“获取 AI 建议”。当前运行时仍需要 PostgreSQL `DATABASE_URL`；如果本地 `.env` 保留 SQLite 归档地址，应仅向启动子进程提供 PostgreSQL 运行时地址，不改写或导入 SQLite 归档。

模型与请求格式依据 [DeepSeek Chat Completions 官方文档](https://api-docs.deepseek.com/api/create-chat-completion/)。API Key 只在服务端读取；页面仅调用本站接口，不接触 DeepSeek Key。

### 数据流程与文件职责

- `app/api/ai/pet-advice/route.ts`：接收 `POST {petId, question}`，校验输入，查询当前宠物和最近 5 条评估记录，返回 `{answer}`。缺少字段返回 400，宠物不存在返回 404。
- `lib/ai-pet-advice.ts`：构建结构化上下文并调用 DeepSeek `/chat/completions`，使用非思考、非流式模式，最多生成 1024 tokens，20 秒超时；错误 Key、余额不足、网络异常、超时及异常响应统一返回 503 和“AI服务暂时不可用，请稍后重试”。
- `app/ai-pet-advice-panel.tsx`：输入、提交、加载、错误和纯文本回复区域。随宠物 ID 切换重新挂载，清空此前内容并取消旧请求；请求版本检查阻止迟到回复更新界面。
- `tests/ai-pet-advice.test.ts`：通过数据库查询和 HTTP 调用的替身，测试实际 Route Handler；不连接真实数据库或调用收费 AI。

问题最多 2000 字。上下文包含名称、年龄、物种、最近风险标签和评估摘要；当前模型未保存品种，所以明确传入“品种未记录”，不会从物种推测品种。每条历史摘要超过 2000 字时会注明截断。

用户填写的 `riskLevel` 不是医学风险评分。提示词要求不诊断、不提供处方、药物剂量或自我治疗方案，不编造事实，明确不确定性并提醒咨询兽医；服务端还为每条回复添加固定提醒。提示词和提醒不能保证模型内容医学正确，仍需人工判断。

问题与 AI 回复不会写入数据库。点击提交时，当前宠物资料、近期评估和问题会发送到 DeepSeek，页面对此有明确说明。当前接口沿用课程 MVP 的无登录模式，尚未实现用户配额控制。

### 验证方式

```bash
node --test tests/ai-pet-advice.test.ts
npm test
npm run typecheck
```

自动化用例覆盖缺少 `petId`、缺少 `question`、空白/过长问题、宠物不存在、正确上下文和成功响应、无历史记录、Key 未配置、错误 Key、余额不足、网络异常、超时和空回复。真实 DeepSeek 成功调用及浏览器端交互需在配置有效 Key 和 PostgreSQL 运行时地址后手动验证：提交问题、查看回复、切换宠物、检查错误提示。本次自动化测试不会将这些手动验收视为通过。

Day 7 当时的验证结果：AI 接口测试 13 通过；全部测试 32 通过、0 失败、7 个数据库集成测试按既有隔离机制跳过；TypeScript 检查通过。生产构建通过，并生成动态路由 `/api/ai/pet-advice`。构建仅向当前进程注入本机占位 PostgreSQL URL，未连接真实数据库；未调用真实 DeepSeek API。

## 当前 Vercel 部署、Docker 备选与首页访问统计

当前实际部署采用 Vercel + Neon；`Dockerfile` 和 `docker-compose.yml` 是 Ubuntu 备选路线，尚未在服务器执行。备选方案采用 Node.js 22、Next.js standalone、多阶段构建及非 root 用户。构建使用锁文件和占位 PostgreSQL URL；真实数据库连接与 AI Key 仅在容器运行时通过服务器 `.env.production` 注入。`.dockerignore` 排除本地环境文件、SQLite 归档及构建产物。

在 Ubuntu 服务器填写 `.env.production` 后启动：

```bash
docker compose --env-file .env.production config -q
docker compose --env-file .env.production up -d --build
docker compose --env-file .env.production ps
```

新建部署环境应核对 `20261014000000_add_visitors` 和 `20261014010000_add_visitor_path` 两份迁移。当前线上统计已修复，本轮不重复执行迁移。当前受保护迁移脚本仅接受人工核验的 Neon test 分支，不能绕过保护对 production 执行迁移。详细环境配置、迁移、上传、启动和验收方法见 [部署手册](../docs/部署手册.md)，实际验证状态见 [部署记录](../docs/部署记录.md)。

首页 `VisitTracker` 在客户端挂载后异步提交 `POST /api/visitors`，保存 `id`、`createdAt` 和固定路径 `/`；不保存查询参数或身份信息。页面不等待请求结果，网络、HTTP 或数据库失败均静默处理。开发 Strict Mode 的重复 effect 共享同一个记录请求，不重复发送同次挂载事件。统计的是尽力而为的页面访问事件，刷新可增加计数，不是唯一访客人数。

记录请求完成后，组件独立调用 `GET /api/visitors`，读取首页累计次数并显示在页面底部；数据库不可用时返回 `{count:null}`，客户端隐藏统计区域，不显示错误或假造为 0。GET 使用 `no-store`，不影响原有宠物、评估和 AI 功能。

新增路径迁移为 `20261014010000_add_visitor_path`，通过非空默认值 `/` 回填旧访问事件；保留原建表迁移，不删除已有记录。Day 9 文档同步时线上统计已正常返回数字；本轮未执行迁移或重新部署。

新增测试位于 `tests/visitors.test.ts`，验证数据库写入参数、事件 ID 唯一、数据库失败静默，以及客户端成功、网络失败和 HTTP 失败行为。测试使用数据库替身，不代表已在真实数据库中验证访问统计。

## UI/UX 展示层优化

采用 Tailwind CSS 4 和 PostCSS，保留现有 API、数据库与请求控制逻辑。柔和蓝绿色主题、白色卡片与响应式仪表盘覆盖宠物资料、健康时间线、图表和 AI 助手；手机视口下自动切换为单列。表单保留标签与键盘焦点，按钮至少 44px 高，动画尊重减少动态效果偏好。

宠物数量来自既有宠物列表；评估数量仅统计当前所选宠物，不是所有宠物的总数。加载或读取失败时不假造统计值。品种尚无数据字段，显示“未记录”；风险提示保留用户原始文字，图表配色仅区分类别，不表示医学等级。新增宠物后仍需点击“刷新列表”，沿用现有流程。

本地运行 `npm run dev`。准备有效 PostgreSQL 运行时配置后，建议截图：

- 桌面 1440px：产品 Header、概览统计和左右卡片布局。
- 手机 390px：单列宠物卡片、健康记录、图表和 AI 助手。
- 有记录时的图表与时间线，以及没有记录时的空状态。
- AI 的初始提示、加载状态、成功回复及失败提示。

自动化回归使用 `npm test`、`npm run typecheck` 和 `npm run build`。当前本地 SQLite 归档地址不适用于 PostgreSQL 运行时；可用已受保护的 `build:safe` 完成课程构建验证，不要覆盖归档配置。上线时使用独立 Production 环境变量。

## 当前暂未实现

- 独立的宠物管理页面
- AI 自动评估和疾病诊断
- 登录与按用户隔离的宠物管理、长期健康档案
- 社区、商城、在线问诊和预约挂号
