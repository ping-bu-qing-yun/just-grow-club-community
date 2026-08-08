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

## 验证

```bash
npm test -- --run
npm run build
npm run e2e
```

当前 SQLite 方案适用于本地和单实例部署。`server/migrations/mysql/` 提供 MySQL 8 的基础表、通知表和 outbox 表迁移脚本；执行前请通过环境变量配置连接信息，并显式使用 `npm run db:migrate -- --apply`。应用当前仍使用 SQLite repository，云端迁移和数据导入需在备份、权限和回滚方案确认后单独执行。配置 `REDIS_URL` 后可启用跨实例通知事件桥接，Redis 不可用时会自动回退到进程内推送。
