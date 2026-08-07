import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => window.localStorage.clear());
  await page.reload();
  await page.getByLabel('手机号').fill('13800000000');
  await page.getByLabel('密码').fill('qiahao123');
  await page.getByRole('button', { name: '登录' }).click();
  await expect(page.getByRole('button', { name: '发现' })).toBeVisible();
});

test('discovers, joins, and opens the generated conversation', async ({ page }, testInfo) => {
  await expect(page.getByRole('heading', { name: '恰好' })).toBeVisible();
  await expect(page.locator('link[rel="manifest"]')).toHaveAttribute('href', '/manifest.webmanifest');
  await expect.poll(
    () => page.locator('.discover-hero img').evaluate((image: HTMLImageElement) => image.naturalWidth),
    { message: '精选活动图片应成功解码', timeout: 10_000 },
  ).toBeGreaterThan(0);
  await expect.poll(
    () => page.locator('.activity-card img').first().evaluate((image: HTMLImageElement) => image.naturalWidth),
    { message: '活动卡图片应成功解码', timeout: 10_000 },
  ).toBeGreaterThan(0);
  await page.getByRole('button', { name: '查看周六滨江轻徒步' }).click();
  await expect(page.getByRole('heading', { name: '周六滨江轻徒步' })).toBeVisible();
  if (testInfo.project.name === 'mobile-chrome') {
    await page.screenshot({ path: 'test-results/qiahao-detail.png' });
  }
  await page.getByRole('button', { name: '申请加入' }).click();
  await page.getByRole('button', { name: '确认申请' }).click();
  await expect(page.getByRole('button', { name: '已申请' })).toBeDisabled();
  await page.getByRole('button', { name: '消息' }).click();
  await expect(page.getByText('滨江轻徒步群聊')).toBeVisible();
});

test('publishes a new activity without horizontal overflow', async ({ page }, testInfo) => {
  const title = `周日城市散步 · ${testInfo.project.name}`;
  await expect.poll(
    () => page.locator('.discover-hero img').evaluate((image: HTMLImageElement) => image.naturalWidth),
    { message: '截图前精选活动图片应成功解码', timeout: 10_000 },
  ).toBeGreaterThan(0);
  const navBox = await page.locator('.bottom-nav').boundingBox();
  const viewport = page.viewportSize();
  expect(navBox).not.toBeNull();
  expect(Math.abs((navBox!.y + navBox!.height) - viewport!.height)).toBeLessThanOrEqual(1);
  if (testInfo.project.name === 'mobile-chrome') {
    await page.screenshot({ path: 'test-results/qiahao-home.png' });
  }
  await page.getByRole('button', { name: '发布' }).click();
  if (testInfo.project.name === 'mobile-chrome') {
    await page.screenshot({ path: 'test-results/qiahao-create.png' });
  }
  await page.getByRole('button', { name: '徒步' }).click();
  await page.getByLabel('活动标题').fill(title);
  await page.getByLabel('活动介绍').fill('从梧桐区走到苏州河，边走边认识城市。');
  await page.getByLabel('日期').fill('周日 · 8月9日');
  await page.getByLabel('时间').fill('16:00');
  await page.getByLabel('集合地点').fill('衡山路地铁站');
  await page.getByRole('button', { name: '确认发布' }).click();
  await expect(page.getByRole('heading', { name: title }).first()).toBeVisible();
  const hasHorizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  expect(hasHorizontalOverflow).toBe(false);

  if (testInfo.project.name === 'desktop-chrome') {
    const shellWidth = await page.locator('.app-shell').evaluate((element) => element.getBoundingClientRect().width);
    expect(shellWidth).toBeLessThanOrEqual(462);
  }
});
