# 恰好搭子 App

手机优先的城市活动搭子应用。前端使用 React + Vite，后端使用 Fastify + MySQL 8。

活动页右上角的小铃铛提供公告、系统、点赞和评论回复四类通知。通知中心支持未读红点、分类筛选、时间戳、详情跳转、已读归档、SSE 实时到达和本地缓存；网络异常时会继续展示本地缓存并自动重连。

## 本地运行

```bash
npm install
cp .env.example .env
npm run dev:all
```

打开 [http://127.0.0.1:5174/](http://127.0.0.1:5174/)。演示账号已预填：手机号 `13800000000`，密码 `qiahao123`。

API 默认运行在 `http://127.0.0.1:3001`，健康检查为 `/api/v2/health`。首次启动前需要复制 `.env.example` 为 `.env` 并填写 MySQL 连接参数；`dev:api`、`start` 和 `db:migrate` 会通过 Node 的原生 `--env-file-if-exists=.env` 自动加载它。应用通过 `MYSQL_HOST`、`MYSQL_PORT`、`MYSQL_USER`、`MYSQL_PASSWORD`、`MYSQL_DATABASE` 读取连接信息，也可以用 `QIAHAO_API_HOST` 和 `QIAHAO_API_PORT` 覆盖监听地址。跨域部署时用 `QIAHAO_WEB_ORIGIN` 和逗号分隔的 `QIAHAO_CORS_ORIGINS` 明确列出可信前端来源，不支持通配符。

### 数据库和 Redis 配置

`.env` 是本地私密文件，已被 Git 忽略，不能提交真实密码。可以先运行只读预检：

```bash
npm run db:migrate
```

预检只连接数据库、读取表元数据并列出迁移 SQL，不会执行迁移；需要执行迁移时才显式追加 `-- --apply`。Redis 使用 `REDIS_URL`，格式为 `redis://:password@host:6379/0`；未配置或不可用时，应用会退回到单进程通知推送。

### 活动分享（直达 + 微信图文）

- 详情页分享：系统分享或复制 `/api/share/activity/<id>`
- 该地址返回带 `og:title` / `og:image` 的 HTML（微信卡片用图）；浏览器会跳到前端 `/activities/<id>` 直达详情，旧 `/?activity=<id>` 仍兼容重定向
- 分享信息由服务端按活动 ID 查询 MySQL；活动标题或主图更新后，分享页会读取同一份正式数据
- 生产环境请配置公网 HTTPS，否则微信抓不到本地图片：

```bash
# 前端公网地址（OG 跳转目标 + 默认图片域名）
export QIAHAO_WEB_ORIGIN=https://app.example.com
# 可选：静态资源/CDN（og:image 优先用这个）
export QIAHAO_ASSET_ORIGIN=https://cdn.example.com
```

本地自检：

```bash
curl -s "http://127.0.0.1:3001/api/share/activity/club-dinner" | rg "og:title|og:image|activity="
# 浏览器打开 http://127.0.0.1:5174/?activity=club-dinner 应直达详情
```

## 验证

```bash
npm test -- --run
npm run test:server
npm run build
npm run e2e
npm run qa:audit
```

`server/migrations/mysql/` 的活动迁移链由 `server/db.ts` 显式固定为 `001_canonical_domain_schema.sql` 和增量迁移 `002_dynamic_business_config.sql`。canonical baseline 对应 31 张正式领域表；`002` 只增加动态业务配置、审计及兼容字段，不重放旧的 `001_initial.sql` 至 `009_v2_domain_model.sql`。配置 MySQL 环境变量后，先运行只读 `npm run db:migrate` 和 `npm run db:config:audit`，核对目标库结构、现有业务值与待执行 SQL；只有在完成可恢复快照并确认兼容后，才显式执行 `npm run db:migrate -- --apply`。迁移会检查必要表、字段、索引与外键，且不会自动删除旧业务表或业务数据。配置 `REDIS_URL` 后可启用配置缓存失效和跨实例通知事件桥接；Redis 不可用时会回退到进程内行为，MySQL 始终是配置事实来源。

服务器集成测试使用独立的 `MYSQL_TEST_*` 环境变量；未配置时相关用例会明确跳过。配置后请使用 `npm run test:server`，该命令以单 worker、串行文件顺序执行，避免测试数据库互相清理。
