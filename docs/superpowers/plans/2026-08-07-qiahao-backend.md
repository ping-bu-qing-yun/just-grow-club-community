# 已废弃：早期后端实施计划

这份计划对应的旧运行时和旧表结构已不再存在，不能继续执行。

请改用以下当前资料：

1. docs/data-model.md：规范实体关系、字段、约束和业务覆盖。
2. server/migrations/mysql：按 REQUIRED_MIGRATIONS 显式排序执行的非破坏性 MySQL 增量迁移链。
3. server/migrations/service.ts：迁移后表、字段、索引和外键校验。

后续实施应在上述规范模型上补齐 API 与前端持久化接线；兼容表只能在隔离环境完成迁移验收后通过独立清理迁移移除。
