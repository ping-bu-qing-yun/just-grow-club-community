# 恰好搭子 App

手机优先的城市活动搭子应用。前端使用 React + Vite，后端使用 Fastify + Node.js SQLite。

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

当前 SQLite 方案适用于本地和单实例部署；生产多实例部署应将 repository 层替换为 PostgreSQL，并保留现有 REST 契约。
