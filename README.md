# 恰好搭子 App

手机优先的城市活动搭子应用。前端使用 React + Vite，后端使用 Fastify + MySQL 8。

活动页右上角的小铃铛提供公告、系统、点赞和评论回复四类通知。通知中心支持未读红点、分类筛选、时间戳、详情跳转、已读归档、SSE 实时到达和本地缓存；网络异常时会继续展示本地缓存并自动重连。

## 本地运行

```bash
npm install
npm run dev:all
```

打开 [http://127.0.0.1:5174/](http://127.0.0.1:5174/)。演示账号已预填：手机号 `13800000000`，密码 `qiahao123`。

API 默认运行在 `http://127.0.0.1:3001`，健康检查为 `/api/health`。首次启动前需要准备已执行迁移的 MySQL 数据库，应用通过 `MYSQL_HOST`、`MYSQL_PORT`、`MYSQL_USER`、`MYSQL_PASSWORD`、`MYSQL_DATABASE` 读取连接信息，也可以用 `QIAHAO_API_HOST` 和 `QIAHAO_API_PORT` 覆盖监听地址。

### 活动分享（直达 + 微信图文）

- 详情页分享：系统分享或复制 `/api/share/activity/<id>`
- 该地址返回带 `og:title` / `og:image` 的 HTML（微信卡片用图）；浏览器会跳到前端 `/?activity=<id>` 直达详情
- 分享目录与 `src/club/seed.ts` 的 `clubActivities` 同源，改活动 seed 会同步到 OG
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
npm run build
npm run e2e
```

`server/migrations/mysql/` 提供基础表、通知、内容治理、标签和评论迁移脚本。配置 MySQL 环境变量后，先执行 `npm run db:migrate -- --apply`，再启动 API；迁移会检查必要表和字段，重复执行不会重复登记版本。配置 `REDIS_URL` 后可启用跨实例通知事件桥接，Redis 不可用时会自动回退到进程内推送。

服务器集成测试使用独立的 `MYSQL_TEST_*` 环境变量；未配置时相关用例会明确跳过。配置后请使用 `npm run test:server`，该命令以单 worker、串行文件顺序执行，避免测试数据库互相清理。
