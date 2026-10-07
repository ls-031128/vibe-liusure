# 宠物健康平台 MVP

这是一个面向普通宠物主人的健康信息辅助工具。产品目标是帮助用户整理宠物基本信息和当前症状，并在后续阶段提供初步风险提示、观察建议和就医提醒。

当前项目处于 Day 2 / T2 阶段，只完成 Next.js 项目骨架和最小服务端连通性验证，尚未实现健康评估业务。

## 本地启动

需要 Node.js LTS。

```bash
npm install
npm run dev
```

启动后访问 [http://localhost:3000](http://localhost:3000)。首页会显示“宠物健康平台 MVP”和当前处于开发阶段的说明。

当前 T2 不需要真实 AI Key。`.env.example` 仅用于说明后续配置位置。

## 项目协作约束

`AGENTS.md` 是本项目的协作和 AI 编码约束，包含 MVP 边界、宠物健康安全边界、修改流程和验证要求。

## 数据库说明

`db/schema.sql` 是未来数据库设计示例，不代表当前 MVP 已接入数据库。当前版本仍然是无数据库运行的最小骨架，也不会保存用户健康文本。

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

## 当前 T2 暂未实现

- 健康评估表单
- `POST /api/health-assessments`
- 真实 AI 调用和 Fake AI Provider
- 数据库和任何健康数据持久化
- 登录、健康档案和多宠物管理
- 社区、商城、在线问诊和预约挂号
