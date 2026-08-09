# MySQL 8 增量迁移

运行时权威迁移链由 `server/db.ts` 的 `REQUIRED_MIGRATIONS` 显式排序：先执行 `001_canonical_domain_schema.sql`，再执行非破坏性的业务配置扩展 `002_dynamic_business_config.sql`。

canonical baseline 与目标 MySQL 的 31 张领域基表、字段、索引和外键保持一致；它不包含迁移器自己维护的 `schema_migrations`。`002` 增加可运营的活动分类、onboarding、画像选项、反馈选项、推荐规则、版本与审计表，并以稳定业务键兼容现有分类、问卷和反馈值。当前链不会自动删除业务表或业务数据。

同目录中未被 `REQUIRED_MIGRATIONS` 引用的 SQL 不会由迁移器执行。旧的 `001_initial.sql` 至 `009_v2_domain_model.sql` 只保留为历史材料，不属于活动迁移链，也不会在 canonical 环境中被重放。

连接参数只从环境变量读取：

```text
MYSQL_HOST
MYSQL_PORT=3306
MYSQL_USER
MYSQL_PASSWORD
MYSQL_DATABASE
MYSQL_SSL=false
```

先进行只读结构预检和业务值兼容审计：

```bash
npm run db:migrate
npm run db:config:audit
```

确认目标库、备份和 SQL 预览无误后，才显式应用：

```bash
npm run db:migrate -- --apply
```

迁移完成后会校验必要表、字段、索引、外键、规范角色、活动生命周期、参与状态和内容父记录。任何清理或破坏性变更必须使用单独迁移，并且只能在隔离 MySQL 8 完成回填计数、角色矩阵、活动深链、通知和评论抽样后批准。
