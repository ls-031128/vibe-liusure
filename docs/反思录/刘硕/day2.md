# Day 2 反思录

## 1. 今天完成了什么

今天完成了 T1 和 T2 的实际工作：

- 基于 Day 1 项目方向，形成“宠物健康平台”MVP 的产品需求。
- 完成 `docs/PRD.md`。
- 完成并收缩 `docs/技术方案.md` 的 MVP 范围。
- 明确当前只实现个人开发者能够在课程周期内完成的最小闭环。
- 创建 `pet-health-platform/` 的 Next.js + TypeScript + App Router 项目骨架。
- 创建首页，显示“宠物健康平台 MVP”和开发阶段说明。
- 创建 `GET /api/ping`，返回 `{"ok":true}`。
- 为 `/api/ping` 添加基础 API 测试。
- 完成依赖安装、测试、TypeScript 检查、production build 和浏览器验证。
- 完成 Day 2 的 Git commit、分支、tag 和远程推送。

目前只完成到 T2 的项目骨架、首页、`/api/ping`、测试、构建和 Git 管理阶段。完整的宠物健康 MVP 尚未完成，没有实现健康评估表单、真实 AI、数据库或医学功能。

## 2. 我学到了什么

PRD、技术方案和代码是逐层落实的关系：PRD 先定义目标用户和问题，技术方案把需求收缩为可实现的系统边界，代码再只实现当前阶段已经确认的内容。技术方案的价值不在于写得复杂，而在于帮助项目避免超出 MVP 范围。

我理解了为什么不能让 AI 一次性开发整个项目。一次性生成完整项目容易把未验证的业务规则、过早的架构和大量无关功能混在一起。先完成 `/api/ping` 这样的最小目标，可以先验证项目路径、依赖、启动、路由和构建链路。

我也更清楚地理解了 MVP 边界的重要性。宠物健康涉及医疗风险，如果一开始就加入数据库、登录、健康档案或社区，个人开发成本和隐私风险都会迅速增加。先验证最小可运行闭环，更适合课程实践。

AI 生成的代码必须自己运行和验收。文件是否落在正确仓库、测试是否真的执行、浏览器是否能访问、Git 是否干净，都不能只根据 AI 的汇报判断。Git 分支、commit 和 tag 能够保存阶段成果、记录变化并支持回退，是课程实践中重要的工程工具。

## 3. AI 帮我完成了什么

AI 在以下方面提供了帮助：

- 将项目想法整理成宠物健康平台 MVP 的 PRD。
- 根据 PRD 编写技术方案，并根据 review 收缩 MVP 范围。
- 生成 Next.js + TypeScript + App Router 项目骨架。
- 生成首页、`GET /api/ping` 和基础 API 测试。
- 协助分析 npm、文件路径、Git 暂存区和 TypeScript 构建缓存相关问题。

但 AI 的结果不能直接视为正确。实际过程中必须自己检查文件系统、运行 npm 命令、打开浏览器访问页面、检查 Git 状态，并根据真实输出判断任务是否完成。

## 4. 我自己实际验证了什么

最终验证结果如下：

- `npm install --fetch-timeout=120000 --fetch-retries=3`：成功，输出 `added 28 packages, and audited 29 packages`，并且 `found 0 vulnerabilities`。
- `npm test`：成功，`1 passed, 0 failed`。
- `npx tsc --noEmit`：成功，没有报错。
- `npm run build`：成功，输出包含 `Compiled successfully`，TypeScript 检查通过，静态页面生成成功，`/api/ping` 正常生成。
- 浏览器首页：实际访问成功，页面正常显示“宠物健康平台 MVP”和开发阶段说明。
- 浏览器访问 `http://localhost:3000/api/ping`：实际成功显示 `{"ok":true}`。
- Git 状态：最终为 `nothing to commit, working tree clean`。
- 当前分支：`feat/day2-requirements`。
- 已创建 commit：`e2e999a`、`b848687`、`241d3fc`。
- 已创建 `day2` tag，并指向最新 commit `241d3fc`。
- `feat/day2-requirements` 已 push 到 Gitee，`day2` tag 也已 push 到 Gitee。
- Day 1 的 `vibe-lab1/` 没有被修改。
- `docs/PRD.md` 和 `docs/技术方案.md` 没有被后续代码操作修改。

## 5. 今天遇到的最大问题

### Node/npm 环境问题

最开始 Node 不在 PATH 中，导致 npm 无法正常调用 node。后来恢复/安装了正常的 Node.js 环境。npm registry 配置为 `https://registry.npmjs.org/`。

初次 `npm install` 遇到 `ENOTFOUND`。随后通过 `nslookup`、`Test-NetConnection` 和 `npm ping` 定位网络状况，确认 npm registry 可以访问但速度较慢；之后使用 `--fetch-timeout=120000 --fetch-retries=3` 重新执行 `npm install`，最终成功完成依赖安装。

### 项目路径问题

项目最初错误地落在了 `vibe-lab1/`。后来通过检查文件系统发现真正的仓库根目录是 `vibe-liusure/`，并把 Day 2 项目正确放到 `pet-health-platform/`。检查后确认没有破坏 Day 1 项目。

### Git 暂存区问题

Git 暂存过程中曾误把 `.next` 加入暂存区，后来通过 `.gitignore` 以及 `git reset` / `git rm --cached` 正确处理。`tsconfig.tsbuildinfo` 也曾被第一次 commit 提交，后来移除并加入 `.gitignore`。最终检查确认工作区 clean。

这些问题不是 AI 自动解决的，而是通过检查命令、查看错误输出、检查文件路径和检查 Git 状态逐步定位并处理的。

## 6. 对 Vibe Coding 的理解

今天让我理解到，Vibe Coding 不只是让 AI 快速生成项目。真正的开发能力还包括：

- 明确需求和验收标准。
- 控制 MVP 范围。
- 检查 AI 输出是否落在正确目录。
- 运行测试和 build，而不是只看代码表面是否完整。
- 定位 Node、npm、PATH、registry 等环境问题。
- 使用 Git 管理分支、commit、tag 和远程成果。
- 对最终结果负责，区分“遇到过失败”和“最终是否成功”。

AI 提高了生成速度，但不能替代开发者的检查、判断和责任。

## 7. 今天的不足

- 对 Next.js、TypeScript 和 App Router 项目结构还不够熟悉。
- 对 npm、PATH、registry 等开发环境问题的理解还不够系统。
- 一开始过于依赖 AI 的完成汇报，没有第一时间通过文件系统确认项目实际落点。
- Git 暂存区处理 `.next` 和 `tsconfig.tsbuildinfo` 时出现了反复操作。
- 对构建缓存、忽略规则和 Git 暂存范围的关系还需要进一步理解。
- 需要继续提高自己阅读代码、理解项目结构和定位问题的能力。

## 8. 明天准备做什么

- 继续完善宠物健康平台 MVP，在理解现有代码职责的基础上逐步实现健康信息输入和 API。
- 继续使用 Fake Provider 做测试，避免测试依赖真实 AI 调用。
- 不盲目增加数据库、登录、健康档案、社区、商城等功能。
- 每完成一个阶段都进行运行、测试、build 和 Git 验证。
- 在继续开发前先确认文件路径、当前分支和工作区状态。

今天 Day 2 已经完成到项目骨架、首页、`/api/ping`、API 测试、TypeScript 检查、production build 和 Git 管理阶段，但没有声称完整宠物健康 MVP 已经完成，也没有虚构任何医学功能。

今天最大的收获不是“AI 写出了一个 Next.js 项目”，而是自己开始能够检查文件路径、处理 Node/npm 环境问题、验证测试和 build、处理 Git 暂存区，并对 AI 的输出进行实际验收。
