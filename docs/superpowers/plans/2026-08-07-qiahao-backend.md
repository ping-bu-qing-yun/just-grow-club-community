# Qiahao Backend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a locally runnable authenticated backend and migrate the Qiahao mobile frontend from business data in `localStorage` to persistent API data.

**Architecture:** A Fastify process owns authentication and REST routes. Focused repositories use Node's built-in SQLite driver behind prepared statements; the React context remains the UI boundary and calls a typed API client through Vite's `/api` proxy.

**Tech Stack:** TypeScript, Fastify, `node:sqlite`, Node crypto, React 19, Vitest, Fastify inject, Playwright

---

## File Map

- `server/db.ts`: opens SQLite, applies schema, exposes transaction-safe database handle.
- `server/schema.sql`: tables, foreign keys, indexes, and uniqueness constraints.
- `server/auth.ts`: scrypt password hashes, opaque session creation, bearer authentication.
- `server/seed.ts`: idempotent demo users, activities, system thread, and messages.
- `server/activity-repository.ts`: activity reads/writes and DTO assembly.
- `server/social-repository.ts`: favorites, joins, threads, and messages.
- `server/app.ts`: Fastify construction, validation, routes, and error contract.
- `server/index.ts`: local server startup and shutdown.
- `server/test/*.test.ts`: temporary-database API integration tests.
- `src/api/client.ts`: browser transport, token persistence, typed errors.
- `src/api/types.ts`: request/response DTOs shared by frontend modules.
- `src/state/QiahaoContext.tsx`: async session and domain state coordinator.
- `src/pages/LoginPage.tsx`: phone-first demo login form.
- `src/App.tsx`: authentication, loading, retry, and app routing gates.
- `vite.config.ts`: `/api` development proxy.
- `playwright.config.ts`: starts API and Vite together for E2E.

### Task 1: Tooling and SQLite Foundation

**Files:**
- Modify: `package.json`
- Modify: `.gitignore`
- Create: `tsconfig.server.json`
- Create: `server/schema.sql`
- Create: `server/db.ts`
- Test: `server/test/db.test.ts`

- [ ] **Step 1: Install the runtime and development packages**

Run: `npm install fastify @fastify/cors && npm install -D @types/node tsx concurrently`

Expected: `package.json` includes Fastify runtime dependencies and Node/tsx/concurrently development dependencies.

- [ ] **Step 2: Write the failing database test**

```ts
import { afterEach, expect, it } from 'vitest';
import { createDatabase, type QiahaoDatabase } from '../db';

let database: QiahaoDatabase | undefined;
afterEach(() => database?.close());

it('creates the complete schema in memory', () => {
  database = createDatabase(':memory:');
  const tables = database.raw.prepare(
    "SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name",
  ).all().map((row) => (row as { name: string }).name);
  expect(tables).toEqual(expect.arrayContaining([
    'activities', 'activity_members', 'favorites', 'messages',
    'sessions', 'thread_members', 'threads', 'users',
  ]));
});
```

- [ ] **Step 3: Run the test and confirm the missing module failure**

Run: `npm test -- server/test/db.test.ts --run`

Expected: FAIL because `server/db.ts` does not exist.

- [ ] **Step 4: Implement schema loading and database construction**

`createDatabase(path)` must create parent directories for file databases, enable `PRAGMA foreign_keys = ON`, execute `server/schema.sql`, and return `{ raw, close }`. The SQL must define all eight tables from the design, constrain activity category/capacity/price, and create indexes for activity creation time, thread messages, and session expiry.

```ts
export interface QiahaoDatabase {
  raw: DatabaseSync;
  close(): void;
}

export function createDatabase(path = process.env.QIAHAO_DB_PATH ?? 'data/qiahao.sqlite'): QiahaoDatabase;
```

- [ ] **Step 5: Add server TypeScript configuration and scripts**

Add `dev:api`, `dev:all`, `test:server`, and `start` scripts. Include `server/**/*.ts` in `tsconfig.server.json`, and ignore `data/*.sqlite*`.

- [ ] **Step 6: Verify and commit**

Run: `npm test -- server/test/db.test.ts --run && npx tsc -p tsconfig.server.json --noEmit`

Expected: one passing database test and no TypeScript errors.

Commit: `git commit -am "feat: add sqlite backend foundation"` after adding new files.

### Task 2: Authentication and Seed Data

**Files:**
- Create: `server/auth.ts`
- Create: `server/seed.ts`
- Create: `server/app.ts`
- Test: `server/test/auth.test.ts`

- [ ] **Step 1: Write failing login and authorization tests**

```ts
it('logs in the demo user and authorizes /api/me', async () => {
  const app = await buildTestApp();
  const login = await app.inject({ method: 'POST', url: '/api/auth/login', payload: {
    phone: '13800000000', password: 'qiahao123',
  }});
  expect(login.statusCode).toBe(200);
  const token = login.json().data.token as string;
  const me = await app.inject({ method: 'GET', url: '/api/me', headers: {
    authorization: `Bearer ${token}`,
  }});
  expect(me.statusCode).toBe(200);
  expect(me.json().data.user.name).toBe('小恰');
});

it('rejects a wrong password without exposing details', async () => {
  const response = await app.inject({ method: 'POST', url: '/api/auth/login', payload: {
    phone: '13800000000', password: 'wrong-password',
  }});
  expect(response.statusCode).toBe(401);
  expect(response.json().error.code).toBe('INVALID_CREDENTIALS');
});
```

- [ ] **Step 2: Run tests and confirm route/module failures**

Run: `npm test -- server/test/auth.test.ts --run`

Expected: FAIL because the app factory and auth functions are missing.

- [ ] **Step 3: Implement password and session primitives**

`hashPassword` stores `scrypt$<saltHex>$<derivedHex>`. `verifyPassword` uses `timingSafeEqual`. `createSession` returns a 32-byte base64url token and stores only SHA-256. `authenticateToken` rejects missing, expired, or unknown sessions.

```ts
export async function hashPassword(password: string): Promise<string>;
export async function verifyPassword(password: string, stored: string): Promise<boolean>;
export function createSession(db: QiahaoDatabase, userId: string): string;
export function authenticateToken(db: QiahaoDatabase, header?: string): AuthenticatedUser | null;
```

- [ ] **Step 4: Implement idempotent seed data and auth routes**

Seed the demo account, six supporting users, the eight existing activities, a system safety thread, and its welcome message. `buildApp({ database })` must register CORS, health, login, logout, and `/api/me`; responses use `{ data }` and `{ error: { code, message } }`.

- [ ] **Step 5: Verify and commit**

Run: `npm test -- server/test/auth.test.ts --run`

Expected: login, wrong password, logout, and unauthorized tests pass.

Commit: `git commit -am "feat: add qiahao authentication"` after adding new files.

### Task 3: Activity API

**Files:**
- Create: `server/activity-repository.ts`
- Modify: `server/app.ts`
- Test: `server/test/activities.test.ts`

- [ ] **Step 1: Write failing list, detail, and publish tests**

```ts
it('lists seeded activities with user state', async () => {
  const response = await authInject(app, { method: 'GET', url: '/api/activities' });
  expect(response.statusCode).toBe(200);
  expect(response.json().data.activities).toHaveLength(8);
  expect(response.json().data.activities[0]).toMatchObject({
    id: expect.any(String), host: { id: expect.any(String) }, saved: false, joined: false,
  });
});

it('publishes an activity owned by the current user', async () => {
  const response = await authInject(app, { method: 'POST', url: '/api/activities', payload: {
    title: '周日城市散步', category: '徒步', description: '沿苏州河慢慢走。',
    dateLabel: '周日 · 8月9日', time: '16:00', location: '衡山路地铁站', capacity: 6, price: 0,
  }});
  expect(response.statusCode).toBe(201);
  expect(response.json().data.activity.host.name).toBe('小恰');
});
```

- [ ] **Step 2: Run tests and observe 404 failures**

Run: `npm test -- server/test/activities.test.ts --run`

Expected: FAIL because activity routes are not registered.

- [ ] **Step 3: Implement repository DTO queries and routes**

Expose `listActivities(db, userId)`, `getActivity(db, userId, id)`, and `createActivity(db, userId, input)`. Assemble participants in a second prepared query, never concatenate SQL input, and derive `saved`/`joined` from left joins. Validate exact category values, title/description/location lengths, `HH:mm`, capacity 2-50, and non-negative integer price.

- [ ] **Step 4: Verify error contracts and persistence**

Run: `npm test -- server/test/activities.test.ts --run`

Expected: list, detail, publish, invalid body, missing activity, and database reopen tests pass.

- [ ] **Step 5: Commit**

Commit: `git commit -am "feat: add persistent activity api"` after adding the repository and test.

### Task 4: Favorites, Joins, Threads, and Messages

**Files:**
- Create: `server/social-repository.ts`
- Modify: `server/app.ts`
- Test: `server/test/social.test.ts`

- [ ] **Step 1: Write failing social state tests**

```ts
it('toggles favorites idempotently', async () => {
  expect((await authInject(app, { method: 'PUT', url: '/api/activities/walk-001/favorite' })).statusCode).toBe(200);
  expect((await authInject(app, { method: 'PUT', url: '/api/activities/walk-001/favorite' })).statusCode).toBe(200);
  const list = await authInject(app, { method: 'GET', url: '/api/activities' });
  expect(list.json().data.activities.find((item: { id: string }) => item.id === 'walk-001').saved).toBe(true);
});

it('joins once and creates a readable activity thread', async () => {
  const first = await authInject(app, { method: 'POST', url: '/api/activities/walk-001/join' });
  const second = await authInject(app, { method: 'POST', url: '/api/activities/walk-001/join' });
  expect(second.json().data.thread.id).toBe(first.json().data.thread.id);
  const threads = await authInject(app, { method: 'GET', url: '/api/threads' });
  expect(threads.json().data.threads).toEqual(expect.arrayContaining([
    expect.objectContaining({ activityId: 'walk-001' }),
  ]));
});
```

- [ ] **Step 2: Run tests and observe missing route failures**

Run: `npm test -- server/test/social.test.ts --run`

Expected: FAIL with 404 responses.

- [ ] **Step 3: Implement favorites and transactional joining**

Use `INSERT OR IGNORE` and a combined primary key for idempotency. Inside one SQLite transaction, check capacity, insert the activity member, create/reuse the activity thread, add host and participant memberships, and insert the welcome message only for a newly joined member. Return `409 ACTIVITY_FULL` when participant count reaches capacity.

- [ ] **Step 4: Implement member-scoped thread reads**

`listThreads` returns `MessageThread` summaries ordered by latest message. `listMessages` first checks `thread_members`; non-members receive `403 FORBIDDEN`, missing threads receive `404 NOT_FOUND`.

- [ ] **Step 5: Verify and commit**

Run: `npm test -- server/test/social.test.ts --run`

Expected: favorite, join, capacity, idempotency, list, and forbidden tests pass.

Commit: `git commit -am "feat: add social state and message api"` after adding files.

### Task 5: Typed Frontend API and Context Migration

**Files:**
- Create: `src/api/types.ts`
- Create: `src/api/client.ts`
- Create: `src/api/client.test.ts`
- Modify: `src/domain/types.ts`
- Modify: `src/state/QiahaoContext.tsx`
- Replace: `src/state/QiahaoContext.test.tsx`
- Delete: `src/state/storage.ts`

- [ ] **Step 1: Write failing transport tests**

```ts
it('adds the bearer token and unwraps data', async () => {
  localStorage.setItem(AUTH_TOKEN_KEY, 'token-1');
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(
    JSON.stringify({ data: { user: { id: 'me', name: '小恰' } } }),
    { status: 200, headers: { 'content-type': 'application/json' } },
  )));
  await api.getMe();
  expect(fetch).toHaveBeenCalledWith('/api/me', expect.objectContaining({
    headers: expect.objectContaining({ Authorization: 'Bearer token-1' }),
  }));
});
```

- [ ] **Step 2: Run and confirm the client module is missing**

Run: `npm test -- src/api/client.test.ts --run`

Expected: FAIL because `src/api/client.ts` does not exist.

- [ ] **Step 3: Implement transport and DTO types**

Create `ApiError` with `status`, `code`, and `message`. Export `login`, `logout`, `getMe`, `listActivities`, `createActivity`, `setFavorite`, `joinActivity`, and `listThreads`. Keep only `qiahao-auth-token` in local storage and remove it on 401.

- [ ] **Step 4: Write failing async context tests**

Inject the API through `QiahaoProvider api={fakeApi}`. Assert bootstrap loading, authenticated state, server-backed favorite/join/create changes, rejected mutation error state, and 401 clearing the user.

- [ ] **Step 5: Implement the async context boundary**

The context exports `status: 'loading' | 'anonymous' | 'authenticated' | 'error'`, `user`, `error`, `retry`, `login`, `logout`, and Promise-returning mutations. On bootstrap, no token means anonymous; a token loads `/me`, activities, and threads concurrently.

- [ ] **Step 6: Verify and commit**

Run: `npm test -- src/api src/state --run`

Expected: transport and context tests pass without business state stored in local storage.

Commit: `git commit -am "feat: connect qiahao state to api"` after adding/deleting files.

### Task 6: Login, Loading, and Async Interaction UI

**Files:**
- Create: `src/pages/LoginPage.tsx`
- Create: `src/pages/LoginPage.test.tsx`
- Modify: `src/App.tsx`
- Modify: `src/pages/ActivityDetail.tsx`
- Modify: `src/pages/CreateActivityPage.tsx`
- Modify: `src/components/ActivityCard.tsx`
- Modify: `src/pages/ProfilePage.tsx`
- Modify: `src/styles/global.css`
- Modify: existing frontend tests under `src/**/*.test.tsx`

- [ ] **Step 1: Write failing login UI tests**

```ts
it('submits demo credentials and reports an invalid password', async () => {
  const login = vi.fn().mockRejectedValue(new ApiError(401, 'INVALID_CREDENTIALS', '手机号或密码错误'));
  render(<LoginPage login={login} />);
  await userEvent.setup().click(screen.getByRole('button', { name: '登录' }));
  expect(login).toHaveBeenCalledWith('13800000000', 'qiahao123');
  expect(await screen.findByText('手机号或密码错误')).toBeInTheDocument();
});
```

- [ ] **Step 2: Run and observe the missing component failure**

Run: `npm test -- src/pages/LoginPage.test.tsx --run`

Expected: FAIL because `LoginPage` does not exist.

- [ ] **Step 3: Build the authentication gates**

Render a compact phone-first login page for anonymous state, a centered progress indicator for loading, a retry panel for bootstrap errors, and the existing app for authenticated state. Prefill demo credentials, use `autocomplete="tel"` and `autocomplete="current-password"`, disable submission while pending, and show server messages inline.

- [ ] **Step 4: Await mutations and expose pending/error feedback**

Update favorite, join, and publish handlers to await promises. Disable only the affected command while it is running and route failures into existing Toast feedback. Add a profile logout row using a `LogOut` Lucide icon.

- [ ] **Step 5: Update existing tests with a fake authenticated API**

Create a reusable `src/test/fakeApi.ts` that returns seed activities and a demo user. Wrap page tests with `QiahaoProvider api={fakeApi}` and await initial content before interactions.

- [ ] **Step 6: Verify and commit**

Run: `npm test -- --run && npm run build`

Expected: all frontend and server tests pass; TypeScript and Vite production build pass.

Commit: `git commit -am "feat: add authenticated mobile experience"` after adding files.

### Task 7: Development Startup and End-to-End Persistence

**Files:**
- Modify: `vite.config.ts`
- Modify: `playwright.config.ts`
- Modify: `e2e/qiahao.spec.ts`
- Create: `.env.example`
- Modify: `README.md` if present, otherwise create `README.md`

- [ ] **Step 1: Proxy `/api` and add server startup**

Vite proxies `/api` to `http://127.0.0.1:3001`. `server/index.ts` opens `QIAHAO_DB_PATH`, runs seed data, listens on `QIAHAO_API_PORT` default `3001`, and closes on SIGINT/SIGTERM. `npm run dev:all` starts API and Vite at port 5174.

- [ ] **Step 2: Write the failing real-backend E2E path**

```ts
test('login and persistent activity workflow', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: '登录' }).click();
  await page.getByRole('button', { name: /收藏周六滨江轻徒步/ }).click();
  await page.getByRole('button', { name: /查看周六滨江轻徒步/ }).click();
  await page.getByRole('button', { name: '申请加入' }).click();
  await page.getByRole('dialog').getByRole('button', { name: '确认申请' }).click();
  await page.reload();
  await expect(page.getByRole('button', { name: '已申请' })).toBeDisabled();
});
```

- [ ] **Step 3: Configure isolated E2E database and two web servers**

Playwright starts `npm run dev:api` with `QIAHAO_DB_PATH=data/qiahao-e2e.sqlite` and Vite on 4173. A pretest script removes only that explicit E2E database file. The test logs out or resets data between cases so both browser projects are deterministic.

- [ ] **Step 4: Document local use**

Document `npm install`, `npm run dev:all`, URL `http://127.0.0.1:5174`, demo credentials, test commands, environment variables, and the SQLite-to-PostgreSQL production limitation.

- [ ] **Step 5: Run full verification**

Run: `npm test -- --run && npm run build && npm run e2e`

Expected: unit/API tests, production build, and mobile/desktop Playwright projects all pass.

- [ ] **Step 6: Start persistent local services and smoke-test health**

Run the repository's persistent Windows launcher for `npm run dev:all`, then request `http://127.0.0.1:3001/api/health` and `http://127.0.0.1:5174/`.

Expected: health returns `{ "data": { "status": "ok" } }`; frontend returns HTTP 200 and can log in with the demo account.

- [ ] **Step 7: Commit**

Commit: `git commit -am "test: verify backend persistence workflow"` after adding new files.
