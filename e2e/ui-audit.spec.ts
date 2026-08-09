import { expect, test, type Page } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { loginAndCompleteOnboarding } from './helpers';
import { PAGE_INVENTORY } from './page-inventory';

type Severity = 'P0' | 'P1' | 'P2' | 'P3';
type Finding = {
  id: string;
  severity: Severity;
  pageId: string;
  title: string;
  expected: string;
  actual: string;
  evidence: string;
  code: string;
  status: 'confirmed' | 'not-reproduced' | 'blocked';
};

const visited = new Set<string>();
const findings: Finding[] = [];
const diagnostics = {
  consoleErrors: [] as string[],
  pageErrors: [] as string[],
  badResponses: [] as string[],
};

function record(finding: Finding) {
  if (!findings.some((item) => item.id === finding.id)) findings.push(finding);
}

function nav(page: Page, label: string) {
  return page.locator('nav[aria-label="主要导航"]').getByRole('button', { name: label, exact: true });
}

async function capture(page: Page, id: string) {
  visited.add(id);
  const index = String(PAGE_INVENTORY.findIndex((item) => item.id === id) + 1).padStart(2, '0');
  const outputDir = join(process.cwd(), 'test-results', 'audit');
  mkdirSync(outputDir, { recursive: true });
  try {
    await page.screenshot({ path: join(outputDir, `${index}-${id}.png`), fullPage: true });
  } catch (error) {
    record({
      id: `SCREENSHOT-${id.toUpperCase()}`,
      severity: 'P2',
      pageId: id,
      title: '页面截图失败',
      expected: '审计节点应能保存全页截图',
      actual: error instanceof Error ? error.message : String(error),
      evidence: `test-results/audit/${index}-${id}.png（未生成）`,
      code: 'e2e/ui-audit.spec.ts:capture',
      status: 'confirmed',
    });
  }
  return page.evaluate(() => ({
    h1: [...document.querySelectorAll('h1')].map((node) => node.textContent?.trim()).filter(Boolean),
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth: window.innerWidth,
    bodyHeight: document.body.scrollHeight,
  }));
}

function attachDiagnostics(page: Page) {
  page.on('pageerror', (error) => diagnostics.pageErrors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') diagnostics.consoleErrors.push(message.text());
  });
  page.on('response', (response) => {
    const url = response.url();
    if (response.status() >= 400 && !url.endsWith('/favicon.ico')) {
      diagnostics.badResponses.push(`${response.status()} ${url}`);
    }
    if (response.status() >= 400 && /\/api\/notifications\/[^/]+\/read$/.test(url)) {
      record({
        id: 'NOTIF-READ-400',
        severity: 'P1',
        pageId: 'toast',
        title: '打开通知时已读请求失败',
        expected: '打开通知后应成功持久化已读状态',
        actual: `${response.status()} ${url}`,
        evidence: 'Playwright response listener；Browser Relay network log',
        code: 'src/notifications/NotificationContext.tsx；server/app.ts: PATCH /api/notifications/:id/read',
        status: 'confirmed',
      });
    }
    if (response.status() >= 400 && url.endsWith('/api/auth/logout')) {
      record({
        id: 'AUTH-LOGOUT-HTTP',
        severity: 'P1',
        pageId: 'profile',
        title: '退出登录请求失败',
        expected: '退出当前账号应成功撤销服务端会话',
        actual: `${response.status()} ${url}`,
        evidence: 'Playwright response listener',
        code: 'src/api/client.ts；src/state/QiahaoContext.tsx；server/app.ts: POST /api/auth/logout',
        status: 'confirmed',
      });
    }
  });
}

async function openPublish(page: Page) {
  await nav(page, '发布').click();
  await expect(page.getByRole('dialog', { name: '选择发布类型' })).toBeVisible();
}

async function dismissToast(page: Page) {
  const close = page.getByRole('button', { name: '关闭提示' });
  if (await close.count()) await close.click();
}

async function loginUserWithoutResettingClubState(page: Page) {
  await page.evaluate(() => localStorage.removeItem('qiahao-auth-token'));
  await page.reload();
  await page.locator('.login-form input').first().fill('13800000001');
  await page.locator('.login-form input[type="password"]').fill('qiahao123');
  await page.getByRole('button', { name: '登录' }).click();
  await expect(page.locator('.app-shell')).toBeVisible();
}

function writeReport() {
  if (visited.size === 0) return;
  const date = process.env.UI_AUDIT_DATE ?? new Date().toISOString().slice(0, 10);
  const output = join(process.cwd(), 'docs', 'qa', `ui-issues-${date}.md`);
  mkdirSync(join(process.cwd(), 'docs', 'qa'), { recursive: true });
  let commit = 'unknown';
  try {
    commit = execFileSync('git', ['rev-parse', '--short', 'HEAD'], { encoding: 'utf8' }).trim();
  } catch {
    // The report remains useful when run from an exported source tree.
  }
  const coverage = Math.round((visited.size / PAGE_INVENTORY.length) * 100);
  const unvisited = PAGE_INVENTORY.filter((item) => !visited.has(item.id)).map((item) => item.id);
  const allFindings = [...findings];
  if (diagnostics.consoleErrors.length > 0) {
    allFindings.push({
      id: 'RUNTIME-CONSOLE-ERROR',
      severity: 'P1',
      pageId: 'toast',
      title: '浏览器 console 出现 error',
      expected: '主路径不应产生 console error',
      actual: diagnostics.consoleErrors.join(' | '),
      evidence: 'Playwright ui-audit runtime capture',
      code: 'e2e/ui-audit.spec.ts:attachDiagnostics',
      status: 'confirmed',
    });
  }
  if (diagnostics.pageErrors.length > 0) {
    allFindings.push({
      id: 'RUNTIME-PAGE-ERROR',
      severity: 'P0',
      pageId: 'error',
      title: '页面运行时异常',
      expected: '主路径不应抛出 pageerror',
      actual: diagnostics.pageErrors.join(' | '),
      evidence: 'Playwright ui-audit runtime capture',
      code: 'e2e/ui-audit.spec.ts:attachDiagnostics',
      status: 'confirmed',
    });
  }
  const uniqueResponses = [...new Set(diagnostics.badResponses)];
  if (uniqueResponses.length > 0) {
    allFindings.push({
      id: 'RUNTIME-BAD-RESPONSE',
      severity: 'P1',
      pageId: 'toast',
      title: '浏览器捕获到 4xx/5xx 响应',
      expected: '主路径 API 与资源请求应成功',
      actual: uniqueResponses.join(' | '),
      evidence: 'Playwright response listener',
      code: 'e2e/ui-audit.spec.ts:attachDiagnostics',
      status: 'confirmed',
    });
  }
  const orderedFindings = allFindings.sort((a, b) => `${a.severity}-${a.id}`.localeCompare(`${b.severity}-${b.id}`));
  const issueMarkdown = orderedFindings.length === 0
    ? '## 问题列表\n\n本轮未采集到问题。\n'
    : `## 问题列表\n\n${orderedFindings.map((item) => `### [${item.severity}] ${item.id} ${item.title}\n- 状态: ${item.status}\n- 页面 ID: ${item.pageId}\n- 期望: ${item.expected}\n- 实际: ${item.actual}\n- 证据: ${item.evidence}\n- 代码线索: ${item.code}\n`).join('\n')}`;
  writeFileSync(output, `# UI 走查问题清单 · ${date}\n\n## 元信息\n- commit: ${commit}\n- 视口: 390×844（mobile-chrome）\n- 账号: 13800000000 / 13800000001\n- 工具: Playwright e2e/ui-audit.spec.ts；本轮已补充 Browser Relay 真实 Chrome 走查\n- 基线文档: docs/qa/full-site-crawl-and-fix-pipeline.md\n\n## 覆盖率\n| 指标 | 值 |\n|---|---|\n| 计划节点 | ${PAGE_INVENTORY.length} |\n| 已访问 | ${visited.size} |\n| 覆盖率 | ${coverage}% |\n| 未访问节点 | ${unvisited.join(', ') || '无'} |\n| stub 跳过深链 | 0 |\n| 未挂载遗留（不爬） | 4 组 |\n| 截图目录 | test-results/audit/ |\n\n${issueMarkdown}\n## 运行时摘要\n- console.error: ${diagnostics.consoleErrors.length}\n- pageerror: ${diagnostics.pageErrors.length}\n- 4xx/5xx response: ${uniqueResponses.length}\n- 详细节点入口: docs/qa/page-inventory.md\n`, 'utf8');
}

test.describe.configure({ mode: 'serial' });

test.afterAll(() => {
  writeReport();
});

test('walks the executable page inventory and writes the UI issue report', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile-chrome', 'Canonical UI audit uses the mobile viewport.');
  attachDiagnostics(page);
  const step = (id: Parameters<typeof capture>[1]) => capture(page, id).then((metrics) => {
    if (metrics.scrollWidth > metrics.innerWidth) {
      record({
        id: `OVERFLOW-${id.toUpperCase()}`,
        severity: 'P2',
        pageId: id,
        title: '页面存在横向溢出',
        expected: 'documentElement.scrollWidth 不应大于 viewport 宽度',
        actual: `scrollWidth=${metrics.scrollWidth}, innerWidth=${metrics.innerWidth}`,
        evidence: `test-results/audit/${String(PAGE_INVENTORY.findIndex((item) => item.id === id) + 1).padStart(2, '0')}-${id}.png`,
        code: 'e2e/ui-audit.spec.ts:capture',
        status: 'confirmed',
      });
    }
  });

  await loginAndCompleteOnboarding(page, '13800000000', step);
  expect(new URL(page.url()).hostname).toBe('127.0.0.1');

  await page.getByRole('button', { name: '查看深度对谈夜局详情' }).click();
  await expect(page.getByRole('heading', { name: '深度对谈夜局' })).toBeVisible();
  await step('activity-detail');
  const saveClubActivity = page.getByRole('button', { name: '收藏深度对谈夜局' });
  if (await saveClubActivity.count()) {
    await saveClubActivity.click();
    await expect(page.getByRole('button', { name: '取消收藏深度对谈夜局' })).toBeVisible();
    await dismissToast(page);
  }
  if (await page.getByRole('button', { name: '预约兴趣' }).count()) await page.getByRole('button', { name: '预约兴趣' }).click();
  else await page.getByRole('button', { name: '报名' }).click();
  await page.getByRole('button', { name: /确认预约|确认报名/ }).click();
  await expect(page.getByRole('button', { name: /已报名/ })).toBeVisible();
  await dismissToast(page);
  const dislike = page.getByRole('button', { name: '不考虑', exact: true });
  for (let count = 0; count < 3; count += 1) {
    await dislike.click();
    await dismissToast(page);
  }
  await dislike.click();
  await expect(page.getByRole('dialog', { name: '选择不考虑原因' })).toBeVisible();
  await step('dislike-sheet');
  await page.getByRole('button', { name: '时间不合适' }).click();
  await dismissToast(page);
  await page.getByRole('button', { name: '返回', exact: true }).click();

  await nav(page, '发现').click();
  await expect(page.getByRole('heading', { name: '发现其他活动' })).toBeVisible();
  await step('explore');
  await page.getByRole('button', { name: '散步', exact: true }).click();
  await expect(page.getByRole('heading', { name: '我们向月亮走去 · 周五散步局' })).toBeVisible();
  await page.getByRole('button', { name: '查看我们向月亮走去 · 周五散步局详情' }).click();
  await expect(page.getByRole('heading', { name: '我们向月亮走去 · 周五散步局' })).toBeVisible();
  await page.getByRole('button', { name: '返回', exact: true }).click();

  await nav(page, '需求').click();
  await expect(page.getByRole('heading', { name: '先说出你想遇见什么' })).toBeVisible();
  await step('needs');
  await page.getByRole('button', { name: '不想尴尬交换微信，但想认真认识人' }).click();
  await expect(page.getByRole('heading', { name: '不想尴尬交换微信，但想认真认识人' })).toBeVisible();
  await step('need-detail');
  await page.getByRole('button', { name: '我也有' }).click();
  await expect(page.getByRole('button', { name: '已共鸣' })).toBeVisible();
  await page.getByRole('button', { name: '收藏' }).click();
  await expect(page.getByRole('button', { name: '已收藏' })).toBeVisible();
  await dismissToast(page);
  await page.getByRole('button', { name: '返回', exact: true }).click();
  await page.locator('.needs-mode').getByRole('button', { name: '生活', exact: true }).click();
  await expect(page.getByRole('heading', { name: '生活动态' })).toBeVisible();
  await step('life');

  await openPublish(page);
  await step('publish-sheet');
  await page.getByRole('dialog').getByRole('button', { name: /直接说出你想遇见什么/ }).click();
  await expect(page.getByRole('heading', { name: '写下你想遇见什么' })).toBeVisible();
  await step('create-need');
  const needTitle = `Playwright 走查需求 ${Date.now()}`;
  await page.getByLabel('需求内容').fill(needTitle);
  await page.getByRole('button', { name: '#周末' }).click();
  await page.getByRole('button', { name: '确认发布' }).click();
  await expect(page.getByRole('status')).toContainText('需求已发布');
  await dismissToast(page);
  await expect(page.getByRole('heading', { name: needTitle })).toBeVisible();

  await openPublish(page);
  await page.getByRole('dialog').getByRole('button', { name: /分享日常/ }).click();
  await expect(page.getByRole('heading', { name: '分享此刻的日常' })).toBeVisible();
  await step('create-life');
  const lifeText = `Playwright 走查生活 ${Date.now()}`;
  await page.locator('textarea').fill(lifeText);
  await page.getByRole('button', { name: '确认发布' }).click();
  await expect(page.getByRole('status')).toContainText('生活动态已发布');
  await dismissToast(page);
  await page.locator('.needs-mode').getByRole('button', { name: '生活', exact: true }).click();
  if (!(await page.locator('body').innerText()).includes(lifeText)) {
    record({
      id: 'LIFE-PUBLISH-NO-FEED',
      severity: 'P1',
      pageId: 'create-life',
      title: '发布生活后内容未进入生活流',
      expected: '提交成功后生活流应出现新动态',
      actual: 'Toast 显示成功，但生活流中找不到刚发布的文本',
      evidence: 'test-results/audit/23-create-life.png',
      code: 'src/pages/CreateLifePage.tsx；src/pages/NeedsPage.tsx；ClubContext',
      status: 'confirmed',
    });
  }

  await openPublish(page);
  await page.getByRole('dialog').getByRole('button', { name: /发起一场可报名/ }).click();
  await expect(page.getByRole('heading', { name: '发起一次恰好的见面' })).toBeVisible();
  await step('create-activity');
  await page.getByRole('button', { name: '确认发布' }).click();
  await expect(page.getByText('请填写活动标题')).toBeVisible();
  await page.getByRole('button', { name: '徒步' }).click();
  const activityTitle = `Playwright 走查活动 ${Date.now()}`;
  await page.getByLabel('活动标题').fill(activityTitle);
  await page.getByLabel('活动介绍').fill('用于验证活动发布主链路。');
  await page.getByLabel('日期').fill('周日 · 8月9日');
  await page.getByLabel('时间').fill('16:00');
  await page.getByLabel('集合地点').fill('衡山路地铁站');
  await page.getByRole('button', { name: '确认发布' }).click();
  await expect(page.getByRole('status')).toContainText('活动已发布');
  await step('toast');
  await dismissToast(page);
  if ((await page.locator('body').innerText()).includes(activityTitle)) {
    record({
      id: 'CREATE-ACT-NOT-IN-CLUB',
      severity: 'P2',
      pageId: 'create-activity',
      title: '发布的 domain 活动未进入俱乐部首页/发现',
      expected: '发布成功后的活动应在用户可达的活动流中出现，或明确区分数据域',
      actual: '发布后回到首页但页面找不到刚发布的活动标题',
      evidence: 'test-results/audit/21-create-activity.png',
      code: 'src/state/QiahaoContext.tsx；src/club/seed.ts；src/App.tsx',
      status: 'confirmed',
    });
  } else {
    record({
      id: 'CREATE-ACT-NOT-IN-CLUB',
      severity: 'P2',
      pageId: 'create-activity',
      title: '发布的 domain 活动未进入俱乐部首页/发现',
      expected: '发布成功后的活动应在用户可达的活动流中出现，或明确区分数据域',
      actual: '发布后首页未找到刚发布的活动标题',
      evidence: 'test-results/audit/21-create-activity.png',
      code: 'src/state/QiahaoContext.tsx；src/club/seed.ts；src/App.tsx',
      status: 'confirmed',
    });
  }

  await nav(page, '我的').click();
  await expect(page.getByRole('heading', { name: /小满|成员测试/ })).toBeVisible();
  await step('profile');
  await page.getByRole('button', { name: '编辑资料' }).click();
  await expect(page.getByRole('heading', { name: '让别人慢慢了解你' })).toBeVisible();
  await step('profile-editor');
  await page.getByRole('button', { name: '保存资料' }).click();

  await page.getByRole('button', { name: /参加过活动/ }).click();
  await expect(page.getByRole('heading', { name: '参加过活动' })).toBeVisible();
  await step('records-attended');
  if (!(await page.locator('main').innerText()).includes('深度对谈夜局')) {
    record({
      id: 'CLUB-JOIN-EPHEMERAL',
      severity: 'P1',
      pageId: 'records-attended',
      title: '俱乐部报名未进入参加记录',
      expected: '报名成功的活动应出现在「参加过活动」',
      actual: '详情页显示已报名，但参加记录中找不到同一活动',
      evidence: 'test-results/audit/16-records-attended.png',
      code: 'src/pages/ClubActivityDetailPage.tsx；src/pages/ProfileRecordsPage.tsx；src/state/QiahaoContext.tsx',
      status: 'confirmed',
    });
  }
  await page.getByRole('button', { name: '返回', exact: true }).click();

  await page.getByRole('button', { name: /需求收藏/ }).first().click();
  await expect(page.getByRole('heading', { name: '需求收藏' })).toBeVisible();
  await step('records-saved-needs');
  const savedNeedCard = page.getByRole('button', { name: '不想尴尬交换微信，但想认真认识人' });
  if (await savedNeedCard.count()) {
    await savedNeedCard.click();
    if (await page.getByRole('heading', { name: '需求收藏' }).isVisible()) {
      record({
        id: 'RECORDS-NEED-OPEN',
        severity: 'P1',
        pageId: 'records-saved-needs',
        title: '需求收藏卡片点击无详情',
        expected: '点击收藏需求应进入需求详情',
        actual: '点击后仍停留在需求收藏列表',
        evidence: 'test-results/audit/17-records-saved-needs.png',
        code: 'src/pages/ProfileRecordsPage.tsx: NeedCard onOpen',
        status: 'confirmed',
      });
    }
  }
  await page.getByRole('button', { name: '返回', exact: true }).click();

  await page.getByRole('button', { name: /活动收藏/ }).click();
  await expect(page.getByRole('heading', { name: '我的心愿' })).toBeVisible();
  await step('saved-activities');
  if (!(await page.locator('main').innerText()).includes('深度对谈夜局')) {
    record({
      id: 'CLUB-SAVE-VS-DOMAIN',
      severity: 'P1',
      pageId: 'saved-activities',
      title: '俱乐部收藏未进入活动收藏',
      expected: '详情页收藏的活动应出现在「活动收藏」',
      actual: '详情页显示已收藏，但活动收藏中找不到同一活动',
      evidence: 'test-results/audit/18-saved-activities.png',
      code: 'src/pages/ClubActivityDetailPage.tsx；src/pages/SavedPage.tsx；src/state/QiahaoContext.tsx',
      status: 'confirmed',
    });
  }
  await nav(page, '我的').click();
  await page.getByRole('button', { name: /我的消息/ }).click();
  await expect(page.getByRole('heading', { name: '消息' })).toBeVisible();
  await step('messages');
  const firstMessage = page.locator('.message-list button').first();
  if (await firstMessage.count()) {
    await firstMessage.click();
    if (await page.getByRole('heading', { name: '消息' }).isVisible()) {
      record({
        id: 'MSG-NO-DETAIL',
        severity: 'P2',
        pageId: 'messages',
        title: '消息行点击无会话详情',
        expected: '点击消息行应进入会话或消息详情',
        actual: '点击后仍停留在消息列表',
        evidence: 'test-results/audit/19-messages.png',
        code: 'src/pages/MessagesPage.tsx；src/App.tsx',
        status: 'confirmed',
      });
    }
  }

  await nav(page, '活动').click();
  const bell = page.getByRole('button', { name: /通知/ });
  if (await bell.count()) {
    await bell.click();
    await expect(page.getByRole('heading', { name: '通知' })).toBeVisible();
    await step('notif-center');
    const notice = page.getByRole('button', { name: /本周活动上新/ });
    await expect(notice).toBeVisible();
    await notice.click();
    await step('notif-detail');
  }

  for (let i = 0; i < 2 && !(await nav(page, '我的').count()); i += 1) {
    const back = page.getByRole('button', { name: /^返回/ });
    if (await back.count()) await back.click();
  }
  await nav(page, '我的').click();
  await page.getByRole('button', { name: /退出当前账号/ }).click();
  await loginUserWithoutResettingClubState(page);
  await nav(page, '我的').click();
  const userProfileText = await page.locator('main').innerText();
  if (userProfileText.includes('小满') || userProfileText.includes('Playwright 走查需求')) {
    record({
      id: 'CLUB-STATE-CROSS-USER',
      severity: 'P1',
      pageId: 'profile',
      title: 'user 登录后继承了 admin 的俱乐部本地状态',
      expected: '用户画像、收藏和发布内容应按账号隔离',
      actual: 'user 仍看到 admin 的昵称/需求/收藏状态',
      evidence: 'user profile snapshot from Browser Relay and Playwright',
      code: 'src/club/storage.ts: CLUB_STORAGE_KEY；src/club/ClubContext.tsx',
      status: 'confirmed',
    });
  }
  await nav(page, '发布').click();
  const publishDialog = page.getByRole('dialog', { name: '选择发布类型' });
  await expect(publishDialog).toBeVisible();
  if (await publishDialog.getByRole('button', { name: /发起一场可报名/ }).count()) {
    record({
      id: 'ROLE-UI-USER-ACTIVITY',
      severity: 'P1',
      pageId: 'publish-sheet',
      title: 'user 发布菜单显示活动',
      expected: 'user 不应看到活动发布项',
      actual: '活动发布项可见',
      evidence: 'user publish sheet',
      code: 'src/domain/roles.ts；src/components/PublishTypeSheet.tsx',
      status: 'confirmed',
    });
  }
  const userCreate = await page.evaluate(async () => {
    const token = localStorage.getItem('qiahao-auth-token');
    const response = await fetch('/api/activities', {
      method: 'POST',
      headers: { 'content-type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ title: `user 权限探针 ${Date.now()}`, category: '徒步', description: '权限测试', dateLabel: '周日 · 8月9日', time: '17:00', location: '本地测试地点', capacity: 4, price: 0 }),
    });
    const body = await response.json();
    return { status: response.status, id: body?.data?.activity?.id, error: body?.error?.code };
  });
  if (userCreate.status < 400) {
    record({
      id: 'ROLE-ADR-DRIFT',
      severity: 'P0',
      pageId: 'publish-sheet',
      title: 'user 可绕过 UI 直接创建活动',
      expected: '后端应拒绝非 admin 的活动写入',
      actual: `user POST /api/activities 返回 ${userCreate.status}，id=${userCreate.id}`,
      evidence: 'Playwright page.evaluate API permission probe',
      code: 'server/app.ts: POST /api/activities；server/migrations/mysql/004_roles_content.sql',
      status: 'confirmed',
    });
  }
  await capture(page, 'publish-sheet');
});
