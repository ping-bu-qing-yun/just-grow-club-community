# UI 问题修复协议

> 更新：2026-08-09（配合第四次代码重扫）

1. **只修** `docs/qa/ui-issues-YYYY-MM-DD.md` 里状态为 `confirmed` / `open` 的问题；顺序 **P0 → P1 → P2**；P3 需点名。  
2. 每题先按报告复现（或 `npm run qa:audit` 探针）再改；**最小 diff**。  
3. 禁止借机：启用未要求的遗留页、整站上 React Router、无关重构。  
4. 改前分清三套数据：  
   - **ClubActivity**（`club/seed`、详情、通知 target activity）  
   - **domain Activity**（API、`QiahaoContext`、SavedPage、CreateActivity）  
   - **通知**（`NotificationsProvider` / MySQL `notifications`）  
5. 后端默认 **MySQL**（`server/db.ts`）；改 schema 需迁移 `server/migrations/mysql` + `npm run db:migrate`。  
6. 产品约束以 `CONTEXT.md` 与 ADR 为准：中央 `+`、预活动语义、角色 operator 才能发活动、项目视觉（非 H5 绿橙风）。  
7. 活动详情反馈现行产品行为：**「考虑」无原因 sheet**；**「不考虑」前 3 次仅计数，≥4 次 `DislikeReasonSheet`**——不要当成 bug「修回去」。  
8. 修复后在原 issue 下追加：  
   - `状态: fixed`（或 `wontfix` + 理由）  
   - 改动文件  
   - 验证命令与结果  
9. 最低验证：  
   ```bash
   npm test -- --run
   npm run test:server
   npm run e2e
   npm run qa:audit
   ```  
   未跑的检查不得写「已通过」。  
10. 修 P0 权限时，前后端一起做：seed `role`、API 403、前端 `canPublishActivity` 读 `user.role`（或等价字段），避免只藏 UI。  
11. 修跨用户 Club 状态时，存储 key 必须含 `userId`（对齐通知 storage 模式）。  
