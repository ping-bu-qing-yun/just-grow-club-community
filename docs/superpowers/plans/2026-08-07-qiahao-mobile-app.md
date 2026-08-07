# “恰好”手机搭子 App Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建一个可在手机浏览器完整体验的“恰好”搭子活动应用，支持发现、筛选、收藏、报名、发布、消息与个人页，并持久化用户操作。

**Architecture:** 使用 React 单页应用和集中式 Context Store。页面只负责展示和发出领域事件，`QiahaoProvider` 负责活动、收藏、报名、消息与 `localStorage` 持久化；不引入路由库，使用应用内部视图状态实现接近原生 App 的页面堆栈和底栏切换。

**Tech Stack:** React 19、TypeScript、Vite、Lucide React、Vitest、Testing Library、Playwright、CSS Modules-free scoped class conventions。

---

## File map

- `package.json`：开发、测试、构建与端到端命令。
- `src/domain/types.ts`：活动、用户、消息、发布表单等共享类型。
- `src/domain/seed.ts`：首屏真实感活动、类别和当前用户数据。
- `src/state/QiahaoContext.tsx`：全部领域动作与持久化边界。
- `src/state/storage.ts`：安全读写 `localStorage`，异常时回退。
- `src/components/*`：可复用的导航、活动卡、头像组、反馈提示。
- `src/pages/*`：发现、详情、心愿、消息、发布和个人页面。
- `src/styles/*`：设计令牌、基础样式与手机布局。
- `tests/*`：状态与组件测试。
- `e2e/qiahao.spec.ts`：390x844 核心用户路径。

### Task 1: 工程骨架与测试基线

**Files:**
- Create: `package.json`
- Create: `index.html`
- Create: `tsconfig.json`
- Create: `vite.config.ts`
- Create: `src/main.tsx`
- Create: `src/App.tsx`
- Create: `src/test/setup.ts`
- Create: `src/App.test.tsx`

- [ ] **Step 1: 写失败的应用冒烟测试**

```tsx
import { render, screen } from '@testing-library/react';
import App from './App';

it('renders the qiahao brand and discovery navigation', () => {
  render(<App />);
  expect(screen.getByRole('heading', { name: '恰好' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: '发现' })).toBeInTheDocument();
});
```

- [ ] **Step 2: 安装依赖并确认测试失败**

Run: `npm install && npm test -- --run src/App.test.tsx`

Expected: FAIL，原因是 `App` 尚未提供品牌标题和“发现”按钮。

- [ ] **Step 3: 创建最小应用骨架**

`package.json` 必须提供 `dev`、`build`、`test`、`test:watch`、`e2e` 命令；`vite.config.ts` 使用 React 插件并配置 Vitest 的 `jsdom` 与 `src/test/setup.ts`。`App.tsx` 先返回：

```tsx
export default function App() {
  return (
    <main>
      <h1>恰好</h1>
      <button type="button">发现</button>
    </main>
  );
}
```

- [ ] **Step 4: 运行测试和类型检查**

Run: `npm test -- --run src/App.test.tsx && npm run build`

Expected: 1 test PASS，Vite build 成功。

- [ ] **Step 5: 提交骨架**

```bash
git add package.json package-lock.json index.html tsconfig.json vite.config.ts src
git commit -m "chore: scaffold qiahao mobile app"
```

### Task 2: 领域模型、种子数据与持久化 Store

**Files:**
- Create: `src/domain/types.ts`
- Create: `src/domain/seed.ts`
- Create: `src/state/storage.ts`
- Create: `src/state/QiahaoContext.tsx`
- Create: `src/state/QiahaoContext.test.tsx`

- [ ] **Step 1: 写收藏、报名、发布和恢复状态的失败测试**

测试通过一个 `StoreProbe` 组件读取 Context，并验证：`toggleSaved('walk-001')` 会收藏；`joinActivity('walk-001')` 会产生报名和消息；`createActivity(draft)` 会把新活动放到列表首位；重新挂载 Provider 后能够从 `localStorage` 恢复上述状态。

```tsx
expect(screen.getByTestId('saved')).toHaveTextContent('walk-001');
expect(screen.getByTestId('joined')).toHaveTextContent('walk-001');
expect(screen.getByTestId('first-title')).toHaveTextContent('周日城市散步');
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npm test -- --run src/state/QiahaoContext.test.tsx`

Expected: FAIL，模块或 Provider 不存在。

- [ ] **Step 3: 定义稳定领域接口**

```ts
export type ActivityCategory = '饭搭子' | '咖啡' | '运动' | '徒步' | '看展' | '桌游';
export interface Activity {
  id: string; title: string; category: ActivityCategory; image: string;
  dateLabel: string; time: string; location: string; distance: string;
  description: string; host: UserSummary; participants: UserSummary[];
  capacity: number; price: number; featured?: boolean;
}
export interface CreateActivityInput {
  title: string; category: ActivityCategory; description: string;
  dateLabel: string; time: string; location: string; capacity: number; price: number;
}
```

`QiahaoContextValue` 暴露 `activities`、`savedIds`、`joinedIds`、`messages`、`toggleSaved`、`joinActivity` 和 `createActivity`。

- [ ] **Step 4: 实现安全存储和领域动作**

`storage.ts` 的 `readPersistedState()` 用 `try/catch` 校验 JSON 基本形状，失败返回空状态；`writePersistedState()` 捕获 quota/security 异常。Provider 使用函数式更新，并在状态变化后写入 `qiahao-state-v1`。

- [ ] **Step 5: 运行状态测试**

Run: `npm test -- --run src/state/QiahaoContext.test.tsx`

Expected: 收藏、报名、发布、恢复四组测试 PASS。

- [ ] **Step 6: 提交领域层**

```bash
git add src/domain src/state
git commit -m "feat: add qiahao activity state and persistence"
```

### Task 3: 手机 App Shell、发现页与筛选

**Files:**
- Create: `src/components/AppShell.tsx`
- Create: `src/components/BottomNav.tsx`
- Create: `src/components/ActivityCard.tsx`
- Create: `src/components/AvatarStack.tsx`
- Create: `src/pages/DiscoverPage.tsx`
- Create: `src/pages/DiscoverPage.test.tsx`
- Create: `src/styles/tokens.css`
- Create: `src/styles/global.css`
- Modify: `src/App.tsx`
- Modify: `src/main.tsx`

- [ ] **Step 1: 写发现页失败测试**

```tsx
expect(screen.getByText('恰好，一起出发')).toBeInTheDocument();
expect(screen.getAllByRole('button', { name: /收藏/ }).length).toBeGreaterThan(0);
await user.click(screen.getByRole('button', { name: '看展' }));
expect(screen.queryByText('周六滨江轻徒步')).not.toBeInTheDocument();
```

同时验证点击活动条目调用 `onOpenActivity(id)`，点击收藏不会触发打开详情。

- [ ] **Step 2: 运行测试确认失败**

Run: `npm test -- --run src/pages/DiscoverPage.test.tsx`

Expected: FAIL，发现页组件不存在。

- [ ] **Step 3: 实现 Airbnb 风格视觉令牌**

```css
:root {
  --brand: #e85245; --brand-dark: #c94136; --ink: #1f1f1f;
  --muted: #6f6f6f; --line: #e8e6e3; --surface: #ffffff;
  --canvas: #f7f6f4; --radius-card: 8px; --tap: 44px;
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, "PingFang SC", sans-serif;
}
```

`AppShell` 在手机视口占满屏幕；桌面只显示最大 480px 的手机内容区与柔和背景。底栏包含发现、心愿、发布、消息、我的，发布按钮视觉突出但仍使用 8px 圆角。

- [ ] **Step 4: 实现发现内容与活动卡**

首页包含城市头部、搜索输入、可横滑类别、照片英雄区、“离你正好”和“本周热门”。卡片必须显示日期、地点、距离、人数余量与价格；所有图片有 `alt` 和失败回退类。

- [ ] **Step 5: 运行测试和构建**

Run: `npm test -- --run src/pages/DiscoverPage.test.tsx && npm run build`

Expected: 测试 PASS，构建成功。

- [ ] **Step 6: 提交发现页**

```bash
git add src/components src/pages/DiscoverPage* src/styles src/App.tsx src/main.tsx
git commit -m "feat: build mobile discovery experience"
```

### Task 4: 活动详情、收藏页与报名消息闭环

**Files:**
- Create: `src/pages/ActivityDetail.tsx`
- Create: `src/pages/SavedPage.tsx`
- Create: `src/pages/MessagesPage.tsx`
- Create: `src/components/JoinSheet.tsx`
- Create: `src/pages/ActivityFlow.test.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: 写完整报名路径失败测试**

测试从发现页点击“周六滨江轻徒步”，断言详情展示发起人、时间地点和底部费用；点击“申请加入”，确认弹层后断言按钮为“已申请”；切到消息页后看到“滨江轻徒步群聊”。另测收藏后心愿页出现活动，取消收藏后出现空状态。

- [ ] **Step 2: 运行测试确认失败**

Run: `npm test -- --run src/pages/ActivityFlow.test.tsx`

Expected: FAIL，详情和页面切换未实现。

- [ ] **Step 3: 实现详情页和确认弹层**

详情页按“图片 → 时间地点 → 说明 → 发起人 → 参与者 → 注意事项”排序。`JoinSheet` 是带遮罩的底部弹层，支持取消和确认；确认按钮调用 `joinActivity(activity.id)`，并展示 `role="status"` 的成功反馈。

- [ ] **Step 4: 实现心愿和消息状态**

心愿页仅从 `savedIds` 派生列表，不复制活动状态。消息页先展示报名产生的活动消息，再展示固定系统安全提醒。空状态按钮必须切回发现页。

- [ ] **Step 5: 运行流程测试**

Run: `npm test -- --run src/pages/ActivityFlow.test.tsx`

Expected: 报名与收藏路径 PASS。

- [ ] **Step 6: 提交详情闭环**

```bash
git add src/pages src/components/JoinSheet.tsx src/App.tsx
git commit -m "feat: add activity detail and join flow"
```

### Task 5: 发布活动与个人页

**Files:**
- Create: `src/pages/CreateActivityPage.tsx`
- Create: `src/pages/ProfilePage.tsx`
- Create: `src/components/Toast.tsx`
- Create: `src/pages/CreateActivityPage.test.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: 写发布校验和成功路径失败测试**

```tsx
await user.click(screen.getByRole('button', { name: '发布' }));
await user.click(screen.getByRole('button', { name: '确认发布' }));
expect(screen.getByText('请填写活动标题')).toBeInTheDocument();
```

填写标题、类别、说明、日期、时间、地点、人数和费用后提交，断言成功提示出现、回到发现页，并且新活动位于列表首位。个人页测试断言实名状态、参与次数和“我发起的”计数存在。

- [ ] **Step 2: 运行测试确认失败**

Run: `npm test -- --run src/pages/CreateActivityPage.test.tsx`

Expected: FAIL，发布页不存在。

- [ ] **Step 3: 实现紧凑的手机发布表单**

表单使用受控字段；`validateDraft()` 返回以字段名为 key 的错误对象。人数步进器范围 2-20，费用范围 0-999。错误显示在字段附近并用 `aria-describedby` 关联。提交调用 `createActivity`，显示 Toast，再切回发现页。

- [ ] **Step 4: 实现个人页**

个人页展示头像、昵称、实名和信用徽标、参加/发起/收藏统计，以及“我发起的”“我参加的”“安全中心”三项入口。未接后端的入口显示解释性 Toast，不制造假页面。

- [ ] **Step 5: 运行测试和全部单元测试**

Run: `npm test -- --run`

Expected: 所有单元与组件测试 PASS。

- [ ] **Step 6: 提交发布与个人页**

```bash
git add src/pages/CreateActivityPage* src/pages/ProfilePage.tsx src/components/Toast.tsx src/App.tsx
git commit -m "feat: add activity publishing and profile"
```

### Task 6: PWA 元数据、端到端测试与视觉验收

**Files:**
- Create: `public/brand-mark.svg`
- Create: `public/manifest.webmanifest`
- Create: `playwright.config.ts`
- Create: `e2e/qiahao.spec.ts`
- Modify: `index.html`
- Modify: `src/styles/global.css`

- [ ] **Step 1: 写手机端端到端测试**

```ts
test.use({ viewport: { width: 390, height: 844 } });
test('discover, save, join and publish an activity', async ({ page }) => {
  await page.goto('/');
  await page.getByText('周六滨江轻徒步').click();
  await page.getByRole('button', { name: '申请加入' }).click();
  await page.getByRole('button', { name: '确认申请' }).click();
  await expect(page.getByRole('button', { name: '已申请' })).toBeVisible();
  await page.getByRole('button', { name: '消息' }).click();
  await expect(page.getByText('滨江轻徒步群聊')).toBeVisible();
});
```

另一个用例完成新活动发布并截图 `test-results/qiahao-home.png`。

- [ ] **Step 2: 运行 E2E 确认失败或浏览器缺失**

Run: `npm run e2e`

Expected: 首次可能因 Playwright Chromium 未安装而失败；若缺失，运行 `npx playwright install chromium` 后重试。

- [ ] **Step 3: 添加 PWA 和安全区细节**

Manifest 使用名称“恰好”、短名“恰好”、`display: standalone`、主题色 `#ffffff`、背景色 `#f7f6f4`。`index.html` 添加 viewport 的 `viewport-fit=cover`。底栏和详情固定栏使用 `env(safe-area-inset-bottom)`；发布表单使用 `scroll-padding-bottom` 避免软键盘遮挡。

- [ ] **Step 4: 执行完整验证**

Run: `npm test -- --run && npm run build && npm run e2e`

Expected: 全部测试 PASS，构建无 TypeScript 错误，E2E 在 390x844 完成。

- [ ] **Step 5: 检查截图**

查看手机首页、详情页和发布页截图，确认无横向滚动、文字截断、破图、底栏遮挡；在 1440x900 桌面视口确认应用保持手机式最大宽度。

- [ ] **Step 6: 提交完成版本**

```bash
git add public index.html playwright.config.ts e2e src/styles/global.css
git commit -m "test: verify qiahao mobile experience"
```

### Task 7: 最终质量门禁

**Files:**
- Modify only if verification reveals an issue.

- [ ] **Step 1: 检查工作区与提交历史**

Run: `git status --short && git log --oneline --decorate -8`

Expected: 除忽略的 `.superpowers/` 外工作区干净，功能提交按任务排列。

- [ ] **Step 2: 运行最终命令**

Run: `npm test -- --run && npm run build && npm run e2e`

Expected: 所有命令退出码为 0。

- [ ] **Step 3: 手动验收完成标准**

验证发现页可打开活动、收藏、申请加入、查看消息、发布新活动并在首页看到它；五个底部入口均有效；刷新后收藏、报名和发布内容仍保留。
