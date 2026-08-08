# 恰好搭子 App

手机优先的城市活动搭子应用。前端使用 React + Vite，后端使用 Fastify + Node.js SQLite。

活动页右上角的小铃铛提供公告、系统、点赞和评论回复四类通知。通知中心支持未读红点、分类筛选、时间戳、详情跳转、已读归档、SSE 实时到达和本地缓存；网络异常时会继续展示本地缓存并自动重连。

## 本地运行

```bash
npm install
npm run dev:all
```

打开 [http://127.0.0.1:5174/](http://127.0.0.1:5174/)。演示账号已预填：手机号 `13800000000`，密码 `qiahao123`。

API 默认运行在 `http://127.0.0.1:3001`，健康检查为 `/api/health`。数据库文件写入 `data/qiahao.sqlite`，首次启动会自动创建表并写入示例活动。可以通过 `QIAHAO_DB_PATH`、`QIAHAO_API_HOST` 和 `QIAHAO_API_PORT` 覆盖默认配置。

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

当前 SQLite 方案适用于本地和单实例部署。`server/migrations/mysql/` 提供 MySQL 8 的基础表、通知表和 outbox 表迁移脚本；执行前请通过环境变量配置连接信息，并显式使用 `npm run db:migrate -- --apply`。应用当前仍使用 SQLite repository，云端迁移和数据导入需在备份、权限和回滚方案确认后单独执行。配置 `REDIS_URL` 后可启用跨实例通知事件桥接，Redis 不可用时会自动回退到进程内推送。
