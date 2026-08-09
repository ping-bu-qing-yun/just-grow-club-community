import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }, testInfo) => {
  if (testInfo.project.metadata.reducedMotion) await page.emulateMedia({ reducedMotion: 'reduce' });
});

test('legacy share query redirects to the canonical activity route', async ({ page }) => {
  await page.goto('/?activity=club-dinner');
  await expect(page).toHaveURL(/\/activities\/club-dinner$/);
  await expect(page.getByRole('heading', { name: '周五轻聊天晚餐局' })).toBeVisible();
});

test('primary navigation, URL filters and deep-link refresh work', async ({ page }) => {
  await page.goto('/activities');
  await page.getByRole('button', { name: '发现', exact: true }).click();
  await expect(page).toHaveURL(/\/discover$/);
  await page.getByRole('textbox', { name: '搜索活动' }).fill('散步');
  await expect(page).toHaveURL(/\/discover\?q=%E6%95%A3%E6%AD%A5$/);
  await page.reload();
  await expect(page.getByRole('textbox', { name: '搜索活动' })).toHaveValue('散步');
});

test('publish sheet closes with Escape and restores focus', async ({ page }) => {
  await page.goto('/activities');
  const trigger = page.getByRole('button', { name: '发布', exact: true });
  await trigger.click();
  await expect(page.getByRole('dialog', { name: '选择发布类型' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog', { name: '选择发布类型' })).toBeHidden();
  await expect(trigger).toBeFocused();
});

test('pre activities use interest reservation language', async ({ page }) => {
  await page.goto('/activities/coffee-002');
  await expect(page.getByRole('button', { name: '预约兴趣' })).toBeVisible();
});
