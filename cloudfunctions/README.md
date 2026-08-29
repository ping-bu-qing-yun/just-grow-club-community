# 云函数规划

> 此目录用于存放微信云开发云函数。当前为空，接入数据库时按以下规划逐个创建。

| 云函数 | 职责 | 涉及集合 |
| --- | --- | --- |
| `login` | 从云上下文登录、初始化并收敛唯一用户记录 | `users` |
| `userProfile` | 本人资料安全读取/保存、旧记录迁移 | `users` |
| `need` | 需求卡发布、列表、详情、删除 | `needs` |
| `comment` | 评论新增、列表 | `comments` |
| `action` | 共鸣/收藏（去重） | `need_actions` |
| `register` | 活动报名/取消（状态流转） | `registrations` |
| `activity` | 活动管理（小CC端） | `activities` |

字段设计见根目录《数据库设计.md》。

## 当前部署说明

- `login` 与 `userProfile` 都只使用 `cloud.getWXContext()` 判断本人身份。
- `userProfile` 请求只允许 `{ action: "get" }` 或 `{ action: "save", profile: {...} }`，不得携带任何用户身份字段。
- 两个函数需分别在微信开发者工具中选择“上传并部署：云端安装依赖”。
- `users` 集合应设为“仅管理端可读写” (`read: false, write: false`)；客户端一律经云函数访问。
- 云函数调用权限建议：`login`、`userProfile` 均为 `auth.loginType != 'ANONYMOUS' && auth != null`。
