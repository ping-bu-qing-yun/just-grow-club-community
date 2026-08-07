# “恰好”搭子 App 后端设计规格

## 1. 目标与范围

本阶段把现有手机端原型从 `localStorage` 迁移到可登录、可持久化、可测试的本地后端。完成后，用户在刷新页面或更换浏览器会话后仍可通过账号取回自己的收藏、报名、发布活动和消息列表。

首版后端包含：

- 手机号和密码登录，返回不透明会话令牌；
- 当前用户资料；
- 活动列表、详情和发布；
- 收藏和取消收藏；
- 报名活动，并自动创建对应会话；
- 会话列表及会话消息读取；
- 数据库初始化、示例数据和自动化 API 测试；
- 前端 API 客户端、登录页、加载态和错误反馈。

首版不包含短信验证码、第三方登录、实时 WebSocket、图片上传、消息发送、推送通知、支付、地图服务、后台审核和内容举报。这些能力需要独立的产品与安全设计，不应阻塞当前数据闭环。

## 2. 方案比较与选择

### 方案 A：Fastify + Node.js SQLite（采用）

API 使用 Fastify，数据库使用当前 Node.js 运行时自带的 `node:sqlite`。优点是无需 Docker 或独立数据库服务，用户启动项目即可登录体验；Fastify 的注入测试可直接覆盖 HTTP 契约。缺点是 SQLite 只适合单实例和中小规模写入。数据访问集中在 repository 层，后续可替换 PostgreSQL。

### 方案 B：Fastify + PostgreSQL + Prisma

事务、并发和部署扩展更成熟，适合正式生产。代价是本地启动依赖 Docker 或 PostgreSQL，迁移和生成客户端也增加首轮配置复杂度。当前目标是交付可立即使用的完整本地闭环，因此暂不采用。

### 方案 C：Supabase

可以快速获得托管数据库、认证与实时订阅，但本地体验依赖外部项目配置和网络，且会提前绑定供应商的数据与认证模型。当前不采用。

## 3. 运行架构

项目保持单仓库：

- `src/`：React 手机端；
- `server/`：Fastify API、领域服务、数据访问和种子数据；
- `data/qiahao.sqlite`：本地运行数据库，加入 `.gitignore`；
- `server/data/schema.sql`：可重复执行的数据库结构；
- `server/data/seed.ts`：幂等示例数据初始化；
- `src/api/`：浏览器 API 客户端和 DTO 映射。

开发时 Vite 运行在 `127.0.0.1:5174`，API 运行在 `127.0.0.1:3001`。Vite 将 `/api` 代理到 API，使手机端只访问同源路径。生产构建中 API 可托管 `dist` 静态文件，从同一个端口提供应用和接口。

## 4. 身份与会话

示例账号为 `13800000000`，初始密码为 `qiahao123`，仅用于本地演示。

密码使用 Node.js `scrypt` 加随机盐后保存，不保存明文。登录成功后生成高熵随机令牌，数据库只保存令牌的 SHA-256 摘要和过期时间；原始令牌返回给浏览器，并由前端保存在 `localStorage`。所有用户相关接口通过 `Authorization: Bearer <token>` 鉴权。会话有效期为 30 天，退出登录删除服务端会话和本地令牌。

首版只有登录，不提供公开注册和找回密码。这样既满足可登录体验，又避免没有短信验证时产生不可信账号。

## 5. 数据模型

### users

`id`、`phone`（唯一）、`password_hash`、`name`、`avatar`、`bio`、`verified`、`created_at`、`updated_at`。

### sessions

`id`、`user_id`、`token_hash`（唯一）、`expires_at`、`created_at`。删除用户时级联删除会话。

### activities

`id`、`host_id`、`title`、`category`、`image`、`date_label`、`time`、`location`、`distance`、`description`、`capacity`、`price`、`featured`、`note`、`created_at`。类别限定为现有六类；人数为 2-50，价格为非负整数。

### favorites

`user_id`、`activity_id`、`created_at`，以用户和活动组成联合主键。

### activity_members

`user_id`、`activity_id`、`status`、`created_at`，联合主键防止重复报名。首版状态固定为 `joined`。活动发起人不写入此表。

### threads / thread_members / messages

`threads` 可关联一个活动并标记系统会话；`thread_members` 记录用户成员和未读数；`messages` 保存发送者、正文和时间。报名事务会创建或复用活动会话、加入成员，并写入欢迎消息。首版前端仅读取消息，不开放发送入口。

## 6. REST API 契约

所有响应为 JSON，成功数据统一放在 `data` 字段；错误统一为 `{ "error": { "code", "message" } }`。

- `POST /api/auth/login`：手机号和密码换取令牌及用户资料；
- `POST /api/auth/logout`：撤销当前令牌；
- `GET /api/me`：当前用户资料和活动统计；
- `GET /api/activities`：活动列表，返回当前用户的 `saved`、`joined` 标记；
- `GET /api/activities/:id`：活动详情；
- `POST /api/activities`：发布活动；
- `PUT /api/activities/:id/favorite`：收藏，幂等；
- `DELETE /api/activities/:id/favorite`：取消收藏，幂等；
- `POST /api/activities/:id/join`：报名并返回活动会话，幂等；
- `GET /api/threads`：当前用户的会话摘要；
- `GET /api/threads/:id/messages`：会话消息，只有成员可读；
- `GET /api/health`：服务与数据库健康检查，无需登录。

列表首版一次返回所有种子与用户活动，顺序为用户新发布活动优先，其次精选和创建时间。数据量增长后再增加游标分页，不提前增加前端复杂度。

## 7. 数据流与前端迁移

应用启动先读取本地令牌。没有令牌时展示手机号/密码登录页；有令牌时请求 `/api/me` 和活动、会话数据。鉴权失败会清除令牌并返回登录页，网络失败则保留当前界面并显示可重试错误。

`QiahaoContext` 继续作为页面与数据层的稳定边界，但内部改为异步 API 调用，暴露 `loading`、`error`、`user`、`login` 和 `logout`。收藏采用确认后更新，避免失败时状态与服务器不一致；报名和发布在接口成功后更新本地集合。原有 `localStorage` 业务状态不再写入，只有会话令牌保留在浏览器。

为了兼容现有页面，API DTO 会映射回当前 `Activity` 和 `MessageThread` 类型。创建、收藏、报名改为返回 Promise；页面按钮在请求中禁用，并在失败时使用现有 Toast 显示中文错误。

## 8. 一致性、权限与错误处理

报名在一个数据库事务中完成成员写入、会话成员写入和欢迎消息写入，避免出现“已报名但无会话”。活动满员时返回 `409 ACTIVITY_FULL`；重复报名返回现有结果；不存在返回 `404 NOT_FOUND`；参数错误返回 `400 VALIDATION_ERROR`；未登录或令牌失效返回 `401 UNAUTHORIZED`；无会话权限返回 `403 FORBIDDEN`。

发布活动仅允许已登录用户，服务端重新校验所有字段并忽略客户端提供的 host、participants、featured 等所有权字段。SQL 全部使用预编译参数，密码与令牌不进入日志。CORS 仅允许本地 Vite 地址；通过 Vite 代理访问时不需要跨域。

## 9. 测试与完成标准

后端使用临时 SQLite 数据库，通过 Fastify `inject` 做集成测试：

- 正确与错误密码登录；
- 未登录接口拒绝访问；
- 活动列表和详情结构；
- 发布字段校验与所有权；
- 收藏增删幂等；
- 报名幂等、满员判断及会话事务；
- 非成员不能读取消息；
- 重启应用实例后数据仍可读取。

前端用 Mock API 测试 Context 的登录、初始化、收藏、报名、发布和 401 退出行为；Playwright 在真实 API 和临时数据库上覆盖“登录 -> 收藏 -> 报名 -> 发布 -> 刷新后仍存在”的手机端主路径。

完成标准是：`npm test`、API 测试、Playwright、TypeScript 构建全部通过；执行一个开发命令可同时启动前端和 API；浏览器访问 `http://127.0.0.1:5174/` 可用示例账号登录并完成核心流程。
