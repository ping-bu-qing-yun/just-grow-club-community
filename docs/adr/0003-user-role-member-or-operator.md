# 用户角色用 users.role 枚举表示（member | host | operator）

权限分化按 PRD §4 三角色落地。我们决定：`users.role` 取值 `'member' | 'host' | 'operator'`；`/api/v2/session` 把规范角色带回前端，历史 `admin | user` 只在迁移/兼容入口归一化。前端用 `user.role` 决定「+」菜单与入口可见性，后端在写接口做权威校验（`POST /api/v2/activities` 仅 `operator`，否则 403）。演示账号：`13800000000`=operator，`13800000001`=member，`13800000002`=host，密码均为 `qiahao123`。

## Considered Options

- **滥用 `verified` 标志**：零 schema 改动，但语义错乱（verified=已认证 ≠ 小CC），且会与「主理人认证」等概念撞车。
- **独立能力表 `user_capabilities`**：最灵活，但本期角色与能力有限，过度设计。
- **仅 member | operator，主理人后续再加**：与用户「按 PRD 来」的范围不符。
- **role 列 + 三角色枚举**：直接表达 PRD 域模型，前后端契约清晰。

## Consequences

- `AuthenticatedUser` / `ApiUser` / 登录响应均需新增 `role` 字段。
- 前端权限判断统一读 `user.role`；后端每个写接口再校验一次。
- seed 与测试夹具需同步：至少一个 operator、一个 host、一个 member。
- 主理人「活动提案」闭环与 operator「直接发活动」是两条路径；**提案闭环本期不做**——host 的「+」菜单同 member（仅需求/生活），需求详情不出现「我来发起活动」。
- 需求与生活发布即上线、免审；仅活动有 `pre|formal` 两态（见 ADR-0001）。
