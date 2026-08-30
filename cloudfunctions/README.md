# 云函数规划

| 云函数 | 职责 | 涉及集合 |
| --- | --- | --- |
| `login` | 从云上下文登录、初始化并收敛唯一用户记录 | `users` |
| `userProfile` | 本人资料安全读取/保存、旧记录迁移 | `users` |
| `activityData` | 本人报名意向的读取、提交、取消，以及活动容量与满员判断 | `registrations` |
| `activityCatalog` | 公开活动发布、列表与本人下架；公开结果剥离身份字段 | `activities` |
| `need` | 需求卡发布、列表、详情、删除 | `needs` |
| `comment` | 评论新增、列表 | `comments` |
| `action` | 共鸣/收藏（去重） | `need_actions` |
| `register` | 活动报名/取消（状态流转） | `registrations` |

字段设计见根目录《数据库设计.md》。

## 当前部署说明

- 已实现 `login`、`userProfile`、`activityData`、`activityCatalog`；其余为后续规划。
- 四个已实现函数都只使用 `cloud.getWXContext()` 判断本人身份。
- `userProfile` 请求只允许 `{ action: "get" }` 或 `{ action: "save", profile: {...} }`，不得携带任何用户身份字段。
- `activityData` 的报名与取消只操作云上下文对应的本人记录；客户端不得传入 `openid`。
- `activityCatalog` 对发布字段做服务端白名单和长度校验；公开列表不返回 `_openid`，下架时重新校验云上下文是否为发布者。
- 固定活动容量由云函数内的白名单维护；公开活动容量从 `activities.capacity` 读取，客户端传入值不能覆盖。达到上限返回 `ACTIVITY_FULL`，下架返回 `ACTIVITY_UNAVAILABLE`。
- 四个函数需分别在微信开发者工具中选择“上传并部署：云端安装依赖”。
- `users`、`registrations`、`activities` 集合应设为“仅管理端可读写” (`read: false, write: false`)；公开活动也只能经云函数读取。
- 云函数调用权限建议：四个已实现函数均为 `auth.loginType != 'ANONYMOUS' && auth != null`。
