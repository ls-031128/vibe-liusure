\# 第5天反思



\## 今天指挥 AI 干成了什么



今天使用 AI 完成了 Day5 质量护栏建设。



主要完成：

1\. 补充宠物创建和健康评估接口测试，覆盖参数校验、错误响应和数据隔离规则。

2\. 搭建 GitHub Actions CI 流程，实现 push 后自动安装依赖、生成 Prisma Client、运行测试。

3\. 使用第二个 AI 对代码进行评审，发现 CI 环境缺少 Prisma Client 生成步骤的问题，并完成修复。





\## 卡过什么坑、怎么爬出来的



最大问题是本地测试通过，但 GitHub Actions 失败。



原因：

本地环境已经存在 generated/prisma/client.ts，而 GitHub Runner 是全新环境，没有生成 Prisma Client。



AI 评审发现该问题后，修改 CI 流程，在测试前增加 Prisma Client 生成步骤。



修复后重新推送 GitHub，CI 可以继续验证。





\## 对话证据



问题：

GitHub Actions 报错：



Cannot find module generated/prisma/client.ts



分析：

CI 环境没有本地已有生成文件。



修复：

增加：



npm run db:generate



作为 CI 测试前步骤。





\## 明天改进的一个动作



以后使用 AI 修改工程配置时，优先模拟全新环境验证，而不是只依赖本地运行结果。

