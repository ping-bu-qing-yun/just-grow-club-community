# 已废弃：早期后端设计

这份早期设计已经由当前 MySQL 规范模型取代，不能再作为实现依据。

- 当前数据库连接、迁移与运行时入口：server/db.ts，以及由 REQUIRED_MIGRATIONS 排序的增量迁移链。
- 当前完整数据结构、业务映射和迁移边界：docs/data-model.md。
- 当前后端 API 的权威实现：server/app.ts 与各 repository 文件。

保留此文件仅为历史路径兼容；任何新开发都应以以上三处为准。
