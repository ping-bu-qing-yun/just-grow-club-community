import { expect, test, type Page } from '@playwright/test';
import { loginAndCompleteOnboarding } from './helpers';

test.beforeEach(async ({ page }) => {
  await loginAndCompleteOnboarding(page);
});

test('completes discovery and browses the four mobile-first tabs', async ({ page }, testInfo) => {
  for (const label of ['活动', '发现', '需求', '我的']) {
    await expect(page.getByRole('button', { name: label, exact: true })).toBeVisible();
  }
  await expect(page.getByRole('button', { name: '发布' })).toBeVisible();
  await expect(page.locator('link[rel="manifest"]')).toHaveAttribute('href', '/manifest.webmanifest');
  await expect.poll(
    () => page.locator('.club-feature img').evaluate((image: HTMLImageElement) => image.naturalWidth),
    { message: '首页大图应成功解码', timeout: 10_000 },
  ).toBeGreaterThan(0);
  if (testInfo.project.name === 'mobile-chrome') {
    await page.screenshot({ path: 'test-results/qiahao-club-home.png', fullPage: true });
  }

  await page.getByRole('button', { name: '发现', exact: true }).click();
  await expect(page.getByRole('heading', { name: '发现其他活动' })).toBeVisible();
  await page.getByRole('button', { name: '散步', exact: true }).click();
  await expect(page.getByRole('heading', { name: '我们向月亮走去 · 周五散步局' })).toBeVisible();

  await page.getByRole('button', { name: '需求', exact: true }).click();
  await expect(page.getByRole('heading', { name: '先说出你想遇见什么' })).toBeVisible();
  await expect(page.getByRole('button', { name: '发布需求' })).toHaveCount(0);
  await page.getByRole('button', { name: '不想尴尬交换微信，但想认真认识人' }).click();
  await expect(page.getByText('这张需求正在发生什么')).toBeVisible();
  await page.getByRole('button', { name: '我也有' }).click();
  await expect(page.getByRole('button', { name: '已共鸣' })).toBeVisible();
  if (testInfo.project.name === 'mobile-chrome') {
    await page.screenshot({ path: 'test-results/qiahao-need-detail.png', fullPage: true });
  }

  await page.getByRole('button', { name: '我的', exact: true }).click();
  await expect(page.getByRole('heading', { name: '小满' })).toBeVisible();
  await page.getByRole('button', { name: /参加过活动/ }).click();
  await expect(page.getByRole('heading', { name: '参加过活动' })).toBeVisible();

  const hasHorizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  expect(hasHorizontalOverflow).toBe(false);
  if (testInfo.project.name === 'desktop-chrome') {
    const shellWidth = await page.locator('.app-shell').evaluate((element) => element.getBoundingClientRect().width);
    expect(shellWidth).toBeLessThanOrEqual(462);
  }
});

test('publishes an activity and a need from the central plus menu', async ({ page }, testInfo) => {
  const activityTitle = `周日城市散步 · ${testInfo.project.name}`;

  await page.getByRole('button', { name: '发布' }).click();
  await expect(page.getByRole('dialog', { name: '选择发布类型' })).toBeVisible();
  await page.getByRole('button', { name: /活动/ }).filter({ hasText: '线下' }).click();
  await page.getByRole('button', { name: '确认发布' }).click();
  await expect(page.getByText('请填写活动标题')).toBeVisible();
  await page.getByRole('button', { name: '徒步' }).click();
  await page.getByLabel('活动标题').fill(activityTitle);
  await page.getByLabel('活动介绍').fill('从梧桐区走到苏州河，边走边认识城市。');
  await page.getByLabel('日期').fill('周日 · 8月9日');
  await page.getByLabel('时间').fill('16:00');
  await page.getByLabel('集合地点').fill('衡山路地铁站');
  await page.getByRole('button', { name: '确认发布' }).click();
  await expect(page.getByRole('status')).toContainText('活动已发布');

  await page.getByRole('button', { name: '发布' }).click();
  await page.getByRole('button', { name: /需求/ }).filter({ hasText: '遇见' }).click();
  await page.getByRole('button', { name: '确认发布' }).click();
  await expect(page.getByText('先写下一句话')).toBeVisible();
  await page.getByLabel('需求内容').fill('想找周末一起逛展、散步的搭子');
  await page.getByRole('button', { name: '#周末' }).click();
  await page.getByRole('button', { name: '确认发布' }).click();
  await expect(page.getByRole('status')).toContainText('需求已发布');
  await expect(page.getByRole('heading', { name: '想找周末一起逛展、散步的搭子' })).toBeVisible();
});

test('opens the bell notification center, detail, and archives read notices', async ({ page }) => {
  let archived = false;
  const fixtures = [
    { id: 'e2e-announcement', category: 'announcement', title: '本周活动上新', body: '周末轻聊天晚餐局已开放报名。', createdAt: '2026-08-08T09:30:00.000Z', read: false, target: { type: 'activity', id: 'club-dinner', label: '查看活动' } },
    { id: 'e2e-system', category: 'system', title: '恰好安全提醒', body: '第一次线下见面请选择公共场所。', createdAt: '2026-08-08T08:15:00.000Z', read: true, target: { type: 'none' } },
    { id: 'e2e-like', category: 'like', title: '有人赞了你的需求', body: '清和赞了你的需求。', createdAt: '2026-08-07T20:40:00.000Z', read: false, target: { type: 'need', id: 'need-001', label: '查看需求' } },
    { id: 'e2e-comment', category: 'comment', title: '收到一条评论回复', body: '阿岚回复你：集合前我会在活动群里发准确位置。', createdAt: '2026-08-07T18:20:00.000Z', read: false, target: { type: 'messages', id: 'system-safety', label: '查看会话' } },
    { id: 'e2e-feedback', category: 'feedback', title: '填写活动反馈', body: '你参加的活动已结束，花 1 分钟写下感受。', createdAt: '2026-08-07T12:00:00.000Z', read: false, target: { type: 'activity', id: 'club-dinner', label: '去填写反馈' } },
  ];
  await page.route('**/api/notifications**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (url.pathname.endsWith('/stream')) {
      await route.fulfill({ status: 200, headers: { 'content-type': 'text/event-stream' }, body: ': connected\n\n' });
      return;
    }
    if (request.method() === 'GET' && url.pathname === '/api/notifications') {
      const notifications = archived ? fixtures.filter((item) => !item.read) : fixtures;
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: { notifications, unreadCount: notifications.filter((item) => !item.read).length } }) });
      return;
    }
    if (request.method() === 'PATCH' && url.pathname.includes('/read')) {
      const id = url.pathname.split('/').at(-2);
      const notification = fixtures.find((item) => item.id === id);
      if (notification) notification.read = true;
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: { notification: { ...notification, read: true, readAt: new Date().toISOString() } } }) });
      return;
    }
    if (request.method() === 'POST' && url.pathname.endsWith('/read/archive')) {
      archived = true;
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: { archivedCount: 2 } }) });
      return;
    }
    await route.continue();
  });
  await page.reload();
  const bell = page.getByRole('button', { name: /^通知/ });
  await expect(bell).toBeVisible();
  await expect(page.locator('.notification-bell__dot')).toBeVisible();
  await bell.click();

  await expect(page.getByRole('heading', { name: '通知' })).toBeVisible();
  await expect(page.getByRole('button', { name: '活动', exact: true })).toHaveCount(0);
  await expect(page.getByText('本周活动上新')).toBeVisible();
  await expect(page.getByRole('button', { name: '反馈', exact: true })).toBeVisible();

  await page.getByRole('button', { name: '反馈', exact: true }).click();
  await page.getByRole('button', { name: /填写活动反馈/ }).click();
  await expect(page.getByRole('heading', { name: '填写活动反馈' })).toBeVisible();
  await page.getByRole('button', { name: '去填写反馈' }).click();
  await expect(page.getByRole('heading', { name: '这场见面怎么样？' })).toBeVisible();
  await page.getByRole('button', { name: '返回' }).click();
  await page.getByRole('button', { name: /^通知/ }).click();

  await page.getByRole('button', { name: '评论', exact: true }).click();
  const comment = page.getByRole('button', { name: /收到一条评论回复/ });
  await comment.click();
  await expect(page.getByRole('heading', { name: '收到一条评论回复' })).toBeVisible();
  await expect(page.getByRole('button', { name: '查看会话' })).toBeVisible();

  await page.getByRole('button', { name: '返回通知' }).click();
  await page.getByRole('button', { name: '清空已读' }).click();
  await expect(page.getByText('收到一条评论回复')).toHaveCount(0);
  await page.reload();
  await expect(page.getByRole('heading', { name: '恰好' })).toBeVisible();
  await page.getByRole('button', { name: /^通知/ }).click();
  await expect(page.getByText('恰好安全提醒')).toHaveCount(0);
  await expect(page.getByText('收到一条评论回复')).toHaveCount(0);
});
