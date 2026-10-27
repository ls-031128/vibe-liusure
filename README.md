# AI PetCare｜宠物健康平台 MVP

[![CI tests](https://github.com/ls-031128/vibe-liusure/actions/workflows/test.yml/badge.svg)](https://github.com/ls-031128/vibe-liusure/actions/workflows/test.yml)

面向普通宠物主人的健康信息辅助平台，将宠物资料、手动健康观察记录、统计图表和 AI 护理建议集中展示，帮助用户整理观察信息并为咨询兽医做好准备。

**在线体验：** [https://vibe-liusure.vercel.app](https://vibe-liusure.vercel.app)

**当前部署：** Vercel + Neon PostgreSQL

**文档更新：** 2026-10-27

**项目源码：** [pet-health-platform](./pet-health-platform)；目录内使用的路径与命令均以该项目目录为基准。

> 本项目不进行疾病诊断，不提供处方、药物剂量或自我治疗方案。用户填写的风险标签不是医学评分，AI 建议存在不确定性，不能替代兽医诊断。

## 1. 项目简介与功能列表

项目围绕“录入资料 → 保存观察记录 → 查看统计 → 获取 AI 建议”构建最小闭环，优先保证数据可保存、可查询和可验证，不提前扩展为完整医疗或宠物服务平台。

| 功能 | 当前实现 | 边界说明 |
| --- | --- | --- |
| 宠物资料 | 创建、查询宠物，支持多宠物选择 | 保存名称、物种、年龄；没有品种字段，不包含编辑和删除 |
| 健康评估记录 | 为指定宠物创建和查询历史记录 | 风险提示与观察摘要由用户手动填写，不是 AI 自动评估 |
| 风险标签分布 | 饼图统计当前宠物各原始标签的数量 | 颜色只区分类别，不表示医学风险高低 |
| 记录趋势 | 柱状图按日期聚合记录数量并排序 | 按 UTC 日期统计，不是健康评分或疾病预测 |
| AI 健康助手 | 结合宠物资料与近期记录回答问题 | 提供日常护理、观察要点与咨询兽医提醒 |
| 首页访问统计 | 异步记录访问事件，查询累计次数 | 不记录身份信息，统计页面访问量而非唯一访客数 |
| 响应式界面 | 宠物卡片、记录时间线、加载与空状态、错误提示 | 桌面分栏，手机单列；新增宠物后需点击“刷新列表” |

当前线上部署及 Visitor 修复状态已在此前验收中确认。2026-10-14 的只读检查显示首页和 ping 正常、统计查询返回数字。该记录是历史检查，不代表本次文档更新重新完成了线上、手机或真实 AI 验收。

## 2. 技术栈

| 层次 | 技术 | 项目用途 |
| --- | --- | --- |
| 页面与路由 | Next.js App Router、React | 页面展示、交互及服务端 Route Handlers |
| 类型与样式 | TypeScript 严格模式、Tailwind CSS 4 | 类型检查、统一视觉与移动端布局 |
| 可视化 | Recharts 3.10.1 | 风险标签分布、记录数量趋势 |
| 数据访问 | Prisma 7.10.0、`@prisma/adapter-pg`、`pg` | 模型定义、类型化查询和 PostgreSQL 连接 |
| 数据库 | Neon PostgreSQL | 保存宠物、评估记录和首页访问事件 |
| AI | DeepSeek Chat Completions API | 服务端生成上下文相关的护理与观察建议 |
| 测试与 CI | Node.js 内置 `node:test`、GitHub Actions | 业务断言、外部依赖替身和自动化回归 |
| 部署 | Vercel | 当前公网页面与服务端 API 托管 |
| 备选部署 | Docker、Next.js standalone | 已准备配置，未作为当前实际服务器部署成果 |

依赖声明以 `package.json` 为准，安装结果以 `package-lock.json` 为准。部署与 CI 使用 Node.js 22；建议本地使用 Node.js 22.12 或以上的 22.x 版本。

## 3. 架构说明

### 整体架构

浏览器调用本站 Next.js API。宠物、评估和访问统计接口通过 Prisma 读写 PostgreSQL；AI 接口先查询宠物与近期记录，再由服务端请求 DeepSeek。数据库与 AI 服务均由服务端访问，数据库不会直接调用 AI。

```text
用户浏览器
└── Next.js 页面 / 客户端组件
    └── Next.js Route Handlers（Vercel）
        ├── Prisma + PostgreSQL adapter → Neon PostgreSQL
        └── AI 建议接口 → DeepSeek API
```

图表复用健康评估查询结果，不额外创建图表 API 或数据库字段。切换宠物时，评估记录按宠物 ID 隔离，并结合 `AbortController`、请求版本和当前宠物校验，避免旧结果覆盖新页面。AI 面板随宠物切换清空上下文并取消旧请求。

趋势图统一按 UTC 日期聚合；历史列表按浏览器本地格式显示。项目没有用户时区设置，午夜附近两者可能显示不同日期，不能将 UTC 日期当成本地日期解释。

### 数据模型

| 数据表 | 内容 | 关系与隐私边界 |
| --- | --- | --- |
| `pets` | ID、名称、物种、年龄、创建时间 | 没有主人账户和品种字段 |
| `health_assessments` | ID、petId、风险提示、观察摘要、创建时间 | 通过 petId 关联宠物，一只宠物可有多条记录 |
| `visitors` | ID、创建时间、访问路径 | 当前固定记录首页 `/`，不保存 IP、设备标识或身份信息 |

AI 问题与回复不写入本项目数据库。原 SQLite 文件 `prisma/dev.db` 及 `prisma/migrations/` 作为本地归档保留，不会自动导入线上数据库；当前 PostgreSQL 迁移位于 `prisma/migrations-postgresql/`。

### 主要文件

```text
app/
  page.tsx                         首页入口与产品布局
  pet-registration-form.tsx       宠物录入表单
  health-assessment-panel.tsx     宠物选择、评估提交和历史列表
  health-assessment-charts.tsx    统计图表
  ai-pet-advice-panel.tsx         AI 输入与回复
  visit-tracker.tsx               非阻塞访问记录与计数展示
  api/                           ping、宠物、评估、AI、统计接口
lib/
  prisma.ts                      运行时 Prisma Client
  ai-pet-advice.ts                AI 上下文、调用与安全提示
  health-assessment-chart-data.ts 标签计数与日期聚合
  request-version.ts             请求版本控制
scripts/                         测试、迁移及构建安全启动器
prisma/schema.prisma             数据模型
prisma7.config.ts                Prisma CLI 与迁移目录配置
tests/                           自动化测试
```

### API 概览

| 方法 | 路径 | 用途 |
| --- | --- | --- |
| GET | `/api/ping` | 返回 `{"ok":true}`，不代表数据库或 AI 健康 |
| POST / GET | `/api/pets` | 创建宠物 / 查询宠物列表 |
| POST | `/api/health-assessments` | 创建指定宠物的手动评估记录 |
| GET | `/api/health-assessments?petId=...` | 查询该宠物的历史记录 |
| POST | `/api/ai/pet-advice` | 根据 `{petId, question}` 返回 `{answer}` |
| POST / GET | `/api/visitors` | 记录首页访问 / 查询累计次数 |

访问统计采用尽力而为策略：POST 成功与失败均返回 204，GET 查询失败返回 `{count:null}`，页面隐藏计数，不影响原有功能。只有数字计数和实际记录核验才能支持统计可用，不能只凭 HTTP 200 或 204 判定落库。

## 4. AI 功能说明

### 上下文与调用流程

1. 用户选择已有宠物，输入不超过 2000 字的问题。
2. 服务端校验 petId 和 question，查询宠物名称、物种、年龄及最近 5 条手动评估记录。
3. 组织安全提示词与结构化上下文。品种未记录时明确说明，不从物种推测；单条历史摘要超过 2000 字时截断并注明。
4. 服务端调用 DeepSeek `/chat/completions`，使用非流式回复，设置 20 秒上游超时和最多 1024 个输出 tokens。
5. 页面展示纯文本建议；服务端为回复增加固定的不确定性与兽医提醒。

Key 未配置、错误 Key、额度不足、上游超时、网络异常或异常回复会通过 AI 接口返回 HTTP 503，提示“AI服务暂时不可用，请稍后重试”。缺少必要参数返回 400，宠物不存在返回 404。

### 配置与安全边界

| 环境变量 | 用途 |
| --- | --- |
| `DATABASE_URL` | 应用运行时 PostgreSQL 连接，不能使用 SQLite 归档地址 |
| `DIRECT_URL` | Prisma CLI 配置；迁移时使用已核验目标的非池化直连地址 |
| `AI_API_KEY` | 仅服务端使用的 DeepSeek Key |
| `AI_API_BASE_URL` | DeepSeek 基础地址，代码默认 `https://api.deepseek.com` |
| `AI_MODEL` | 模型标识，代码默认 `deepseek-flash`；实际可用性和价格需核对服务方配置 |

变量示例见 [`.env.example`](pet-health-platform/.env.example)，仅在本地环境文件或托管平台填写真实值，不提交 `.env`，不使用 `NEXT_PUBLIC_` 暴露密钥。修改托管环境变量后需重新部署对应版本。

点击 AI 提交会将当前宠物资料、近期记录和问题发送给 DeepSeek。不要输入个人身份信息或真实敏感健康资料；本平台不保存问答，不等于第三方完全不处理这些数据。提示词约束与固定提醒不能保证医学正确性。

## 5. 本地运行与部署

在仓库的 `pet-health-platform/` 目录操作：

1. 保留已有环境文件；新环境按 `.env.example` 创建本地 `.env`，填写正确的 PostgreSQL 运行时与 CLI 配置。
2. 使用已有、已批准且结构匹配的开发数据库；本地启动和构建不会自动建表或迁移。
3. 执行：

```bash
npm ci
npm run db:validate
npm run db:generate
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000)，检查 [`/api/ping`](http://localhost:3000/api/ping)。宠物与手动评估功能无需 AI Key，AI 助手需要有效服务端配置。

生产构建与启动：

```bash
npm run typecheck
npm run build
npm run start
```

构建包含 Prisma Client 生成，并会校验相关 PostgreSQL URL。若本地 `.env` 保留 SQLite 归档地址，不要覆盖它；可在独立启动进程配置已批准的开发连接。现有 `npm run build:safe` 仅用于经人工确认的 Neon test 环境构建验证，不是 Vercel Production 配置。

当前上线使用 Vercel，Root Directory 为 `pet-health-platform`，Build Command 为 `npm run build`。Production 与 Preview 应分别配置环境变量，测试连接不得指向 production。完整步骤见 [部署手册](docs/部署手册.md)。

现有 `npm run db:migrate:deploy` 只允许通过保护流程操作人工核验的 Neon test 分支。不要绕过保护对 production 执行迁移，也不要使用 reset、清库或导入 SQLite 数据来解决部署问题。后续结构变更应先确认目标、备份和迁移方案。

## 6. 测试说明

### 非数据库测试与检查

```bash
npm test
npm run typecheck
npm run build
```

`npm test` 使用 Node.js 内置 `node:test`，默认不连接真实数据库、不调用收费 AI。数据库集成用例会显示为跳过，不计为通过。干净环境先按上节生成 Prisma Client。

| 测试文件 | 主要覆盖 |
| --- | --- |
| `tests/api-validation.test.ts` | 宠物必填与非法年龄校验、评估查询缺少 petId、创建评估的非法输入 |
| `tests/pets.test.ts` | 宠物创建完整返回、数据库持久化及查询，需显式启用数据库测试 |
| `tests/health-assessments.test.ts` | 评估持久化与查询、非法参数、不同宠物数据隔离，需显式启用数据库测试 |
| `tests/health-assessment-chart-data.test.ts` | 标签计数、空数据、未知标签、同日聚合、排序、跨时区边界与非法日期 |
| `tests/request-version.test.ts` | 旧请求失效、组件清理后请求失效 |
| `tests/ai-pet-advice.test.ts` | 输入校验、上下文、宠物不存在、无记录及 AI 成功/失败响应，使用外部依赖替身 |
| `tests/visitors.test.ts` | 访问写入参数、计数返回及数据库/网络失败降级，使用数据库替身 |
| `tests/ping.test.ts`、`tests/database-config.test.ts` | ping 响应及运行时/迁移 URL 校验 |

此前记录的完整普通测试结果为 **42 通过、0 失败、7 个数据库集成测试跳过**，类型检查与生产构建通过。这是历史结果，本次 README 整理没有重新运行测试、构建或真实 AI 调用。

### 独立数据库测试

经 Neon 控制台人工确认专用 test 分支，并配置以下变量：

- `TEST_DATABASE_URL`：独立 test 数据库连接。
- `NEON_TEST_BRANCH_ID`、`NEON_TEST_ENDPOINT_ID`：人工核对的非秘密标识。

随后运行：

```bash
npm run test:db
```

启动器在独立子进程将运行时连接设为测试连接，不修改父进程或本地环境文件。URL/ID 一致性检查不等于 Neon 服务端身份验证，必须完成人工核对。数据库测试会创建测试记录，只能操作获准的 test 分支。

### GitHub Actions CI 与人工验收

工作流 [`.github/workflows/test.yml`](.github/workflows/test.yml) 在 push 和 Pull Request 时安装 Node.js 22、安装依赖、使用本机占位 URL 生成 Prisma Client，再运行普通测试，不连接真实 Neon。需在仓库分支保护中将 `Test` 设置为必需检查，失败才会阻止合并；工作流存在不代表已核验每次远端结果。

自动化替身测试不能代替浏览器、真实数据库和真实 AI 验收。演示前应检查手机访问、宠物切换、保存后刷新持久化、图表数量、统计增量、真实 AI 回复及错误提示。步骤见 [线上部署验收](docs/线上部署验收.md)，其中历史状态应结合记录日期理解。

## 7. 当前局限与路线图

### 当前局限

- 没有登录、用户权限与按用户数据隔离，公开接口不适合保存真实敏感资料。
- 未实现完整限流、用户配额和 AI 成本监控，公开访问可能产生费用或污染演示数据。
- AI 没有经过兽医专业验证，可能输出错误、遗漏或不适用建议，不能承担诊断职责。
- 宠物资料尚无品种字段，不支持编辑和删除；新增后需手动刷新列表。
- 当前只有基本观察记录，没有完整长期健康档案、医学评分或自动健康预测。
- 统计是可能漏记、可重复计数的页面访问事件，不是去重用户人数。
- 趋势图采用 UTC 日期，可能与用户本地时间显示不同；部分请求尚无统一超时兜底。
- 历史依赖安装曾报告 4 个 high 审计项，尚无本次重新审计结论，不能视为已消除。
- 当前没有完整生产监控与恢复演练证据；手机、真实 AI 等验收应保留实际记录，不能以构建成功替代。

### 后续路线图

以下均为计划，不表示已经实现或承诺交付日期：

1. **近期：稳定演示闭环。** 补齐跨设备及真实 AI 验收证据，完善错误与空状态区分，核查依赖风险、统计增量与备份恢复流程。
2. **下一阶段：完善使用安全。** 根据真实反馈评估访问控制、调用配额、预算提醒和宠物信息维护，先保证数据安全与成本可控。
3. **中期：评估长期健康记录。** 在授权与数据隔离基础上，考虑更完整的资料和历史追踪，不引入未经验证的医学阈值。
4. **远期探索：用户体系及更多 AI 辅助能力。** 经需求验证后再评估服务对接或商业化，不提前加入社区、商城或在线问诊。

## 项目文档与协作

- [产品需求 PRD](docs/PRD.md)
- [技术方案](docs/技术方案.md)
- [数据库字典](docs/数据库字典.md)
- [AI 成本估算](docs/AI成本估算.md)
- [部署手册](docs/部署手册.md)
- [线上部署验收](docs/线上部署验收.md)
- [冲刺任务板](docs/冲刺任务板.md)
- [AGENTS.md](pet-health-platform/AGENTS.md)：项目协作、数据保护与 AI 编码约束。

课程过程记录、历史技术方案与当前实现可能存在阶段差异。阅读时结合日期，以实际代码、有效配置及对应验收证据核对，不把计划功能视为完成成果。

## 课程仓库信息

### Vibe Coding 个人仓库

- 我是谁：刘硕
- 讨论组号：
- 这门课我想练成什么：能够使用 AI 完成软件项目开发，并具备验证、调试和交付能力。
