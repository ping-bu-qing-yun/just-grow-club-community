# 云函数规划

> 此目录用于存放微信云开发云函数。当前为空，接入数据库时按以下规划逐个创建。

| 云函数 | 职责 | 涉及集合 |
| --- | --- | --- |
| `login` | 登录/初始化用户档案 | `users` |
| `need` | 需求卡发布、列表、详情、删除 | `needs` |
| `comment` | 评论新增、列表 | `comments` |
| `action` | 共鸣/收藏（去重） | `need_actions` |
| `register` | 活动报名/取消（状态流转） | `registrations` |
| `activity` | 活动管理（小CC端） | `activities` |

字段设计见根目录《数据库设计.md》。
