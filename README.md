# 恰好关系俱乐部小程序

## 一个帮主理人把"用户交友需求"反向生成线下活动、并按需招募到对的人的 AI Agent。

一个手机优先的「关系型活动 + 需求洞察 + 小CC运营工作台」微信小程序原型。
它围绕用户从注册问答、画像生成、专属活动推荐、需求/生活发布、活动报名/预约/反馈，到小CC基于需求生成 AI 活动提案的闭环进行演示。

本地演示链接：[http://127.0.0.1:5174/](http://127.0.0.1:5174/)

前端使用 React + Vite，后端使用 Fastify + MySQL 8。当前分支 `justV0.2` 重点补强了注册问卷、专属页互动小猫、活动卡片、评论/报名/取消、用户画像与管理动作工作台等准商用演示能力。

## 核心能力

- 注册 onboarding：欢迎页、三问入门、初级/中级/高级 QA、基础资料、关系画像生成。
- 专属推荐：首页根据画像展示活动推荐，支持活动详情、报名、预约、取消、不喜欢、考虑因素和评论互动。
- 需求与生活：用户可发布需求卡和生活动态，支持图片上传、标签选择、收藏、共鸣和评论。
- 我的页面：展示用户资料、画像完成度、活动记录、收藏、动态、消息和运营工作台入口。
- 小CC管理动作：包含 AI 活动提案、每日分身、经营明细、活动管理、待拍板提案和预活动转成熟活动流程。
- 视觉互动：专属页包含可拖动、可点击反馈的金渐层小猫助手。

活动页右上角的小铃铛提供公告、系统、点赞和评论回复四类通知。通知中心支持未读红点、分类筛选、时间戳、详情跳转、已读归档、SSE 实时到达和本地缓存；网络异常时会继续展示本地缓存并自动重连。

## 本地运行

```bash
npm install
cp .env.example .env
npm run dev:all
```

打开 [http://127.0.0.1:5174/](http://127.0.0.1:5174/)。演示账号已预填：手机号 `13800000000`，密码 `qiahao123`。

API 默认运行在 `http://127.0.0.1:3001`，健康检查为 `/api/health`。首次启动前需要复制 `.env.example` 为 `.env` 并填写 MySQL 连接参数；`dev:api`、`start` 和 `db:migrate` 会通过 Node 的原生 `--env-file-if-exists=.env` 自动加载它。应用通过 `MYSQL_HOST`、`MYSQL_PORT`、`MYSQL_USER`、`MYSQL_PASSWORD`、`MYSQL_DATABASE` 读取连接信息，也可以用 `QIAHAO_API_HOST` 和 `QIAHAO_API_PORT` 覆盖监听地址。

### 数据库和 Redis 配置

`.env` 是本地私密文件，已被 Git 忽略，不能提交真实密码。可以先运行只读预检：

```bash
npm run db:migrate
```

预检只连接数据库、读取表元数据并列出迁移 SQL，不会执行迁移；需要执行迁移时才显式追加 `-- --apply`。Redis 使用 `REDIS_URL`，格式为 `redis://:password@host:6379/0`；未配置或不可用时，应用会退回到单进程通知推送。

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
