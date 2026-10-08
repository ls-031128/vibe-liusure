# 宠物健康平台 MVP

这是一个面向普通宠物主人的健康信息辅助工具。产品目标是帮助用户整理宠物基本信息和当前症状，并在后续阶段提供初步风险提示、观察建议和就医提醒。

当前项目处于 Day 3 核心闭环阶段，已接入本地 SQLite + Prisma，并完成宠物基本信息录入和健康评估记录闭环；尚未实现 AI 自动评估。

## 本地启动

需要 Node.js LTS。

```bash
npm install
npm run dev
```

启动后访问 [http://localhost:3000](http://localhost:3000)。首页会显示“宠物健康平台 MVP”和当前处于开发阶段的说明。

当前不需要真实 AI Key。`.env.example` 包含本地 SQLite 的 `DATABASE_URL` 示例和后续 AI 配置说明。

## 项目协作约束

`AGENTS.md` 是本项目的协作和 AI 编码约束，包含 MVP 边界、宠物健康安全边界、修改流程和验证要求。

## 数据库说明

Day 3 使用 SQLite + Prisma。Prisma Schema 位于 `prisma/schema.prisma`，本地数据库文件位于 `prisma/dev.db`，迁移记录位于 `prisma/migrations/`，生成的 Client 位于 `generated/prisma/`。

数据库只保存 `pets` 和 `health_assessments` 的最小必要字段，不保存用户原始健康文本、用户身份信息或疾病诊断数据。当前已完成宠物基本信息录入页面、`POST /api/pets`、健康评估记录创建和按宠物查询。

首次配置数据库可以执行：

```bash
npm run db:validate
npm run db:migrate
```

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

API 测试使用 Node 内置测试运行器，不调用真实 AI。

## 当前 Day 3 暂未实现

- 真实 AI 调用和 Fake AI Provider
- 独立的宠物管理页面
- AI 自动评估和疾病诊断
- 登录、健康档案和多宠物管理
- 社区、商城、在线问诊和预约挂号
