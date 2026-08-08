import { expect, type Page } from '@playwright/test';

export async function loginAndCompleteOnboarding(
  page: Page,
  phone = '13800000000',
  onStep?: (id: 'login' | 'onboard-light' | 'onboard-qa' | 'onboard-profile' | 'onboard-portrait' | 'home') => Promise<void>,
) {
  await page.goto('/');
  await page.evaluate(() => window.localStorage.clear());
  await page.reload();
  await onStep?.('login');

  await page.locator('.login-form input').first().fill(phone);
  await page.locator('.login-form input[type="password"]').fill('qiahao123');
  await page.getByRole('button', { name: '登录' }).click();

  await expect(page.getByText('你的回答就是最好的自我介绍')).toBeVisible();
  await onStep?.('onboard-light');
  for (const answer of ['想认识靠谱的人', '少人数饭局', '怕尴尬']) {
    await page.getByRole('button', { name: answer }).click();
  }
  await page.getByRole('button', { name: '继续到 QA 问答' }).click();
  await onStep?.('onboard-qa');
  await page.getByLabel('当前回答').fill('做自己的时候最舒服，也愿意认真听别人说话。');
  await page.getByRole('button', { name: '保存并继续' }).click();
  await page.getByRole('button', { name: '跳到基础资料' }).click();
  await onStep?.('onboard-profile');
  await page.getByLabel('昵称').fill(phone === '13800000000' ? '小满' : '成员测试');
  await page.getByRole('button', { name: '生成画像' }).click();
  await expect(page.getByRole('heading', { name: '低压力线下重启型' })).toBeVisible();
  await onStep?.('onboard-portrait');
  await page.getByRole('button', { name: /去看活动/ }).click();
  await expect(page.getByRole('heading', { name: '恰好' })).toBeVisible();
  await onStep?.('home');
}
