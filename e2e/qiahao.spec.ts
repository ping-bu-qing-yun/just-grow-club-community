import { expect, test, type Page } from '@playwright/test';

async function loginAndCompleteOnboarding(page: Page) {
  await page.goto('/');
  await page.evaluate(() => window.localStorage.clear());
  await page.reload();
  await page.getByLabel('手机号').fill('13800000000');
  await page.getByLabel('密码').fill('qiahao123');
  await page.getByRole('button', { name: '登录' }).click();

  await expect(page.getByText('你的回答就是最好的自我介绍')).toBeVisible();
  for (const answer of ['想认识靠谱的人', '少人数饭局', '怕尴尬']) {
    await page.getByRole('button', { name: answer }).click();
  }
  await page.getByRole('button', { name: '继续到 QA 问答' }).click();
  await page.getByLabel('当前回答').fill('做自己的时候最舒服，也愿意认真听别人说话。');
  await page.getByRole('button', { name: '保存并继续' }).click();
  await page.getByRole('button', { name: '跳到基础资料' }).click();
  await page.getByLabel('昵称').fill('小满');
  await page.getByRole('button', { name: '生成画像' }).click();
  await expect(page.getByRole('heading', { name: '低压力线下重启型' })).toBeVisible();
  await page.getByRole('button', { name: /去看活动/ }).click();
  await expect(page.getByRole('heading', { name: '恰好' })).toBeVisible();
}

test.beforeEach(async ({ page }) => {
  await loginAndCompleteOnboarding(page);
});

test('completes discovery and browses the four mobile-first tabs', async ({ page }, testInfo) => {
  for (const label of ['活动', '发现', '需求', '我的']) {
    await expect(page.getByRole('button', { name: label, exact: true })).toBeVisible();
  }
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

test('publishes an activity and a need from their current entry points', async ({ page }, testInfo) => {
  const activityTitle = `周日城市散步 · ${testInfo.project.name}`;
  await page.getByRole('button', { name: '发布活动' }).click();
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

  await page.getByRole('button', { name: '需求', exact: true }).click();
  await page.getByRole('button', { name: '发布需求' }).click();
  await page.getByRole('button', { name: '确认发布' }).click();
  await expect(page.getByText('先写下一句话')).toBeVisible();
  await page.getByLabel('需求内容').fill('想找周末一起逛展、散步的搭子');
  await page.getByRole('button', { name: '#周末' }).click();
  await page.getByRole('button', { name: '确认发布' }).click();
  await expect(page.getByRole('heading', { name: '想找周末一起逛展、散步的搭子' })).toBeVisible();
});
