\# 第4天反思



\## 今天指挥 AI 干成了什么



今天完成宠物健康平台 Day4。



主要完成：

\- 接入 Recharts，实现健康评估风险等级分布图和评估记录趋势图。

\- 修复宠物切换时请求竞态问题，避免旧请求覆盖新宠物数据。

\- 完成 SQLite 到 Neon PostgreSQL 的部署适配。

\- 完成 PostgreSQL migration、数据库集成测试和安全构建验证。

\- 完成 Next.js production build 验证。



\## 卡过什么坑、怎么爬出来的



最大问题：



Prisma 7 的迁移配置、数据库连接环境和构建环境存在差异。



解决：



\- 通过检查 Prisma 配置确认 PostgreSQL migration 路径。

\- 使用 migrate status 验证 Neon test 分支数据库同步。

\- 增加安全测试和构建脚本，让测试和构建使用 PostgreSQL 环境，同时保留本地 SQLite 归档。



\## 对话证据



关键问题：



\- AI 协助定位 Prisma migration 输出路径误解。

\- AI 协助设计 Neon test 数据库隔离方案。

\- AI 协助解决 DATABASE\_URL 导致 production build 失败的问题。



\## 明天改进的一个动作



部署前提前整理开发、测试、生产环境变量清单，减少环境差异导致的上线问题。

