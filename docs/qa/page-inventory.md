# 页面库存执行表

> 机器可读权威清单：`e2e/page-inventory.ts`
> 执行器：`e2e/ui-audit.spec.ts`（`npm run qa:audit`）
> 更新：2026-08-09 Apple Design 重构验收

应用已经切换到 React Router Data Router。下列页面均有稳定 URL，可直接访问、刷新、后退和分享；旧 `/?activity=<id>` 会重定向到 `/activities/:id`。

| ID | 页面 | 路由 | 角色 | 主要验收 |
| --- | --- | --- | --- | --- |
| home | 活动首页 | `/activities` | any | 画像进度、精选活动、通知入口 |
| activity-detail | 活动详情 | `/activities/club-dinner` | any | 媒体主视觉、信息分组、收藏、预约/报名 |
| explore | 发现 | `/discover` | any | URL 搜索/筛选、游标加载更多 |
| needs | 需求 | `/needs` | any | 需求流、相似筛选、详情深链 |
| life | 生活 | `/needs?view=life` | any | 分段视图、生活流、详情深链 |
| need-detail | 需求详情 | `/needs/d1` | any | 收藏、共鸣、评论 |
| life-detail | 生活详情 | `/life/life-1` | any | 收藏、共鸣、评论 |
| profile | 我的 | `/profile` | any | 画像、记录、消息、主题、安全、退出 |
| profile-editor | 编辑资料 | `/profile/edit` | any | 服务端画像读取与保存 |
| records-attended | 参加记录 | `/profile/records/attended` | any | 正式报名记录 |
| records-saved-needs | 需求收藏 | `/profile/records/saved-needs` | any | 服务端收藏与详情跳转 |
| saved-activities | 活动收藏 | `/profile/records/saved-activities` | any | 服务端收藏与详情跳转 |
| messages | 消息 | `/messages` | any | 会话列表 |
| message-detail | 消息详情 | `/messages/system-safety` | any | 可刷新会话详情 |
| create-activity | 发布活动 | `/publish/activity` | operator | 字段校验、pre 生命周期创建 |
| create-need | 发布需求 | `/publish/need` | any | 发布并写入统一内容模型 |
| create-life | 发布生活 | `/publish/life` | any | 发布并写入统一内容模型 |
| notif-center | 通知中心 | `/notifications` | any | React Query 缓存、SSE、已读归档 |
| notif-detail | 通知详情 | `/notifications/notice-safety` | any | 已读更新与目标跳转 |
| operator-content | 内容治理 | `/admin/content` | operator | 筛选、状态、标签与审计 |

`/login`、`/onboarding`、加载、错误与空状态由单元测试和针对性流程测试覆盖；路由库存使用 preview 数据模式自动进入已完成 onboarding 的 operator 会话，因此不把这些互斥入口状态伪装成普通页面计入分母。

## 自动审计规则

每个库存路由在 `390×844` 下检查：

- 无横向溢出；
- 无 console error、pageerror 和异常 4xx/5xx；
- 可见按钮、链接、输入、选择器和文本域命中高度至少 44px；
- 视口内可交互控件中心点未被其他层遮挡；
- 页面主内容可见。

最新 `npm run qa:audit`：20/20 通过。完整 `npm run e2e` 还会在移动浅色、移动深色、移动 reduced-motion、桌面浅色和桌面深色五个项目中重复功能与库存验收。
