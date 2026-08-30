# 云函数规划

| 云函数 | 职责 | 涉及集合 |
| --- | --- | --- |
| `login` | 从云上下文登录、初始化并收敛唯一用户记录 | `users` |
| `userProfile` | 本人资料安全读取/保存、旧记录迁移 | `users` |
| `activityData` | 本人报名意向的读取、提交、取消，以及活动容量与满员判断 | `registrations` |
| `need` | 需求卡发布、列表、详情、删除 | `needs` |
| `comment` | 评论新增、列表 | `comments` |
| `action` | 共鸣/收藏（去重） | `need_actions` |
| `register` | 活动报名/取消（状态流转） | `registrations` |
| `activity` | 活动管理（小CC端） | `activities` |

字段设计见根目录《数据库设计.md》。

## 当前部署说明

- 已实现 `login`、`userProfile`、`activityData`；其余为后续规划。
- 三个已实现函数都只使用 `cloud.getWXContext()` 判断本人身份。
- `userProfile` 请求只允许 `{ action: "get" }` 或 `{ action: "save", profile: {...} }`，不得携带任何用户身份字段。
- `activityData` 的报名与取消只操作云上下文对应的本人记录；客户端不得传入 `openid`。
- 固定活动容量由云函数内的白名单维护；本地发布活动第一次报名时写入人数上限，后续报名沿用云端记录中的容量。达到上限返回 `ACTIVITY_FULL`，客户端不得把它降级为待同步报名。
- 三个函数需分别在微信开发者工具中选择“上传并部署：云端安装依赖”。
- `users`、`registrations` 集合应设为“仅管理端可读写” (`read: false, write: false`)；客户端一律经云函数访问。
- 云函数调用权限建议：三个已实现函数均为 `auth.loginType != 'ANONYMOUS' && auth != null`。
