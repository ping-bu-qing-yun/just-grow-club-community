# 全站页面走查 → 问题清单 → AI 修复流水线

> 状态：**流水线已落地**；最新问题清单见 `ui-issues-2026-08-09.md`（`ui-issues-2026-08-08.md` 保留为上一轮快照）
> 复测日期：2026-08-09（Browser Relay 真实 Chrome 走查证据 + Playwright mobile audit）
> 分支：`codex/go-wal-community`
> 关联：`CONTEXT.md`、ADR-0001/0002/0003

---

## 1. 目标

1. 梳理现有功能与全部页面
2. Playwright（`qa:audit`）按 inventory 遍历并采集问题
3. 输出 `ui-issues-*.md`
4. 另一 AI 按 `FIX-PROTOCOL.md` 修复
5. 重跑 audit 做 retest

---

## 2. 产品与技术现状（第四次重扫）

### 2.1 架构

| 项 | 事实 |
|----|------|
| 前端 | React 19 + Vite，手机画布 ~460px |
| 后端运行时 | **MySQL（mysql2/promise 连接池）**，`server/db.ts` + `server/migrations` |
| 迁移 | `001_canonical_domain_schema.sql` + `002_dynamic_business_config.sql` 两段式活动迁移链；脚本 `npm run db:migrate` |
| 可选 | Redis 通知扇出（`notification-redis.ts` / ioredis） |
| 路由 | React Router Data Router；活动、内容、消息、通知、发布与管理页面均有可刷新 URL |
| 状态 | React Query 管理服务端缓存；Provider 暂作旧页面兼容适配层；画像草稿仍按用户保留在本地 |
| 三 Provider | `QiahaoProvider` → **`NotificationsProvider`** → `ClubProvider` |
| 双活动模型 | **ClubActivity**（首页/发现/俱乐部详情/通知跳活动）vs **domain Activity**（API、CreateActivity、SavedPage、旧 Discover） |

### 2.2 信息架构

```
Login → Onboarding(4) → AppShell
  底栏：活动 | 发现 | [+] | 需求 | 我的
  通知中心/详情时 showBottomNav=false
  浮层：PublishTypeSheet、Toast、DislikeReasonSheet、报名 sheet
```

**渲染优先级：** notification center/detail → need detail → club activity detail → subview → tab。

### 2.3 演示账号

| 手机号 | 密码 | id | 前端可发活动 | 备注 |
|--------|------|-----|--------------|------|
| 13800000000 | qiahao123 | me | ✅ `canPublishActivity(id)` | 登录预填 |
| 13800000001–006 | qiahao123 | u1… | ❌ UI 隐藏活动项 | API **仍可能** POST 成功（无 role 校验） |

> ADR-0003 已落地：角色统一为 `member | host | operator`，活动创建与治理接口由服务端强制校验 `operator`。

### 2.4 脚本

```bash
npm run dev:all          # API + Vite :5174
npm run db:migrate       # MySQL 迁移
npm test -- --run
npm run test:server
npm run e2e
npm run qa:audit         # e2e/ui-audit.spec.ts → 写 docs/qa/ui-issues-*.md
```

### 2.5 已落地的 QA 工程资产

| 路径 | 作用 |
|------|------|
| `docs/qa/page-inventory.md` | 节点表 |
| `docs/qa/FIX-PROTOCOL.md` | 修复协议 |
| `docs/qa/ui-issues-2026-08-09.md` | 最新审计报告（confirmed 问题，25/27 节点，93%） |
| `e2e/helpers.ts` | login + onboarding |
| `e2e/page-inventory.ts` | 节点 id 列表（与 audit 同步） |
| `e2e/ui-audit.spec.ts` | 串行走查 + 探针 + 写报告 |
| `package.json` → `qa:audit` | 一键 |

---

## 3. 页面清单

### 3.1 可达（主路径）

| ID | 页面 | 进入 | 备注 |
|----|------|------|------|
| login … onboard-* | 登录/入门 | 默认 | e2e + audit |
| home | 活动首页 | tab 活动 | **NotificationBell** |
| activity-detail | 俱乐部详情 | 卡片/精选/通知 | 报名本地 state；**考虑仅 Toast**；**不考虑 1–3 计数，≥4 弹 DislikeReasonSheet** |
| explore | 发现 | tab | Bell + 筛选 |
| needs / life | 需求/生活 | tab + 子 tab | 生活静态 seed |
| need-detail | 需求详情 | 卡片 | 共鸣/收藏 Club 本地 |
| notif-center | 通知中心 | 铃铛 | 底栏隐藏；API list/read/archive/SSE |
| notif-detail | 通知详情 | 中心点开 | 可跳活动/需求/消息 |
| profile … messages | 我的子页 | 我的入口 | 见矩阵 |
| publish / create-* | 发布 | 中央 + | life 不落库 |
| toast / dislike-sheet | 反馈 | 各动作 | |

### 3.2 「我的」矩阵（未变）

| 入口 | 实际 |
|------|------|
| 编辑 | ✅ |
| 参加过 | ✅ domain joinedIds（**俱乐部报名进不来**） |
| 活动收藏 | ✅ SavedPage；**开详情 Toast 桩**；**俱乐部收藏进不来** |
| 需求收藏 | NeedCard **onOpen 空** |
| 动态 | 切 needs tab |
| 画像 | 空操作；成长 reset onboarding |
| 消息 | 列表无会话详情 |
| 帮助/安全/设置 | Toast |
| 退出 | logout API（审计曾报 400，MySQL 改造后需复验） |

### 3.3 遗留未挂主路径

- `DiscoverPage`、`ActivityDetail`+`JoinSheet`（仍有部分单测）
- ~~Notification* 未挂载~~ → **已挂载，勿再当死代码**

### 3.4 活动详情反馈（产品行为，第四次确认）

| 动作 | 行为 |
|------|------|
| 考虑 | **不弹原因**；Toast「已记下你的考虑…」；`aria-pressed` |
| 不考虑 1–3 | Toast 计数；localStorage `qiahao-dislike-count` |
| 不考虑 ≥4 | **`DislikeReasonSheet`**（仅此一种原因 sheet） |
| 报名/收藏 | 组件 `useState`，不写 Qiahao / 后端 |

组件：`FeedbackReasonSheet.tsx` 现仅导出 `DislikeReasonSheet`（已无「考虑原因」sheet）。

---

## 4. 功能差与假成功（相对 ADR/预期）

| 主题 | 现状 |
|------|------|
| 通知 | ✅ 前后端 + e2e mock + audit 探针 |
| 中央 + | ✅ ADR-0002 |
| 角色写校验 | ❌ 后端任意登录可创建活动（issues: ROLE-ADR-DRIFT P0） |
| pre→formal | ❌ 无后端状态；仅 club seed UI |
| 需求后端 | ❌ Club local only |
| 生活发布 | ❌ Toast 成功、feed 不变（LIFE-PUBLISH-NO-FEED） |
| Club 报名/收藏 | ❌ 与「我的」/ domain 脱节 |
| Club 本地态 | ❌ `qiahao-club-state-v1` **不按 userId 隔离**（CLUB-STATE-CROSS-USER） |
| 双模型 | domain 发布活动不进 club 首页 |
| Saved 真开 | Toast 桩仍在 |
| 消息详情 | 无 |

---

## 5. 测试资产

### 5.1 Unit（节选）

- `ActivityFlow`、`ClubActivityDetailPage`（考虑无 sheet + 第四次不考虑）
- `ClubNavigation`、Needs、CreateActivity、Login、Contexts、NotificationCenter
- `DiscoverPage.test` 仍测死路径

### 5.2 E2E

- `qiahao.spec.ts`：入门四 tab、发活动/需求、**通知流（route mock）**
- `ui-audit.spec.ts`：全 inventory 探针 + 写 issues

### 5.3 服务端

- `server/test/*`：auth、activities、social、notifications、db、hub
- 依赖 MySQL 测试环境（见 helpers）

---

## 6. 流水线用法

```bash
# 1) 起栈（需可用 MySQL，见 env / db 配置）
npm run db:migrate
npm run dev:all

# 2) 审计（mobile-chrome）
npm run qa:audit
# → docs/qa/ui-issues-YYYY-MM-DD.md
# → test-results/audit/*.png

# 3) 修复后
npm test -- --run && npm run test:server && npm run e2e && npm run qa:audit
```

### 6.1 级别

P0 阻断/越权 · P1 假成功/数据错 · P2 UX · P3 债/死代码

### 6.2 已知问题索引 → 权威列表

**以 `ui-issues-2026-08-09.md` 的“Apple Design 重构后的复验”章节为准**（其余内容和 08-08 报告保留为历史快照）。此前的角色绕过、跨用户本地状态、Club/domain 双活动源、发布不入流、详情断链、旧退出/通知地址和消息无详情均已在 `/api/v2`、Data Router 与服务端唯一事实源重构中移除对应根因。

当前自动审计开放项为 0：`npm run qa:audit` 在 20 个 URL 库存页面检查 44px 命中、遮挡、溢出、console/page error 和异常响应，结果为 20/20。真实 MySQL 8 迁移、Cookie 登录、Redis 跨实例和生产网关仍属于环境验收边界，不应由 preview UI 结果代替。

---

## 7. 修复协议

见 `FIX-PROTOCOL.md`。要点：只修 issues 复现项；分清 Club/domain；最小 diff；修完重跑 test + qa:audit。

---

## 8. 落地任务状态

| 任务 | 状态 |
|------|------|
| page-inventory | ✅ |
| FIX-PROTOCOL | ✅ |
| e2e helpers + ui-audit + qa:audit | ✅ |
| 首轮 issues 报告 | ✅ `ui-issues-2026-08-08.md` |
| 按 P0/P1 修业务 | ✅ 已随 `/api/v2` 与服务端状态重构收敛 |
| 重跑 audit retest | ✅ 20/20 URL 库存，100% |
| inventory 与 Data Router 同步 | ✅ `page-inventory.md` / `e2e/page-inventory.ts` |

---

## 9. 后续环境验收顺序

1. 隔离 MySQL 8 按 `REQUIRED_MIGRATIONS` 执行完整迁移链（`001` 至 `009` 后追加动态配置扩展），核对迁移计数、角色、活动深链、通知、评论和配置种子抽样。
2. 使用 Cookie + CSRF 的真实 API 栈回放登录、退出、发布、收藏、预约转报名、通知已读和评论删除。
3. 配置 Redis 后验证跨实例 SSE/outbox；未配置时验证单进程降级。
4. 在生产网关补限流、TLS、可信 CORS 和 SSE 连接上限。

---

## 10. 源码速查

```
src/app/AppRouter.tsx
src/pages/ClubActivityDetailPage.tsx   # 考虑 Toast；不考虑阈值 + DislikeReasonSheet
src/components/FeedbackReasonSheet.tsx # 仅 DislikeReasonSheet
src/notifications/*                    # 已挂载
src/state/QiahaoContext.tsx            # React Query 服务端状态与本地草稿边界
src/domain/roles.ts                    # 规范角色与旧角色兼容映射
server/app.ts | auth.ts | db.ts        # MySQL async API
server/migrations/mysql/*
e2e/ui-audit.spec.ts | helpers.ts | page-inventory.ts
docs/qa/*
```

---

## 11. 修订记录

| 日期 | 说明 |
|------|------|
| 2026-08-08 | 初版–三版：清单、通知接通、预置问题 |
| 2026-08-08 | **四版重扫：** 后端 MySQL 化；QA 流水线已在仓内；issues 报告已存在；详情反馈改为仅「不考虑」原因 sheet；同步 inventory/protocol/issues 状态说明；明确仍 open 的 P0/P1 与需复验项 |
| 2026-08-09 | **审计复测：** Browser Relay 曾成功接入真实 Chrome 后断开；Playwright audit 复跑 25/27 节点（93%），生成最新 issues 报告；业务修复仍待后续 AI 执行 |
| 2026-08-09 | **Apple Design 重构复验：** Data Router、`/api/v2`、服务端唯一事实源、44px/遮挡门禁落地；preview 模式 20/20 URL 库存通过，环境验收边界单列 |
