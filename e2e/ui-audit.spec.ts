import { expect, test } from '@playwright/test';
import { PAGE_INVENTORY } from './page-inventory';

test.beforeEach(async ({ page }, testInfo) => {
  if (testInfo.project.metadata.reducedMotion) await page.emulateMedia({ reducedMotion: 'reduce' });
});

for (const node of PAGE_INVENTORY) {
  test(`${node.id}: ${node.name} has no overflow, runtime error or failed request`, async ({ page }) => {
    const consoleErrors: string[] = [];
    const pageErrors: string[] = [];
    const failedResponses: string[] = [];

    page.on('console', (message) => {
      if (message.type() === 'error') consoleErrors.push(message.text());
    });
    page.on('pageerror', (error) => pageErrors.push(error.message));
    page.on('response', (response) => {
      if (response.status() >= 400) failedResponses.push(`${response.status()} ${response.url()}`);
    });

    await page.goto(node.route);
    await expect(page.locator('main')).toBeVisible();
    await page.waitForTimeout(80);

    const layout = await page.evaluate(() => ({
      viewport: document.documentElement.clientWidth,
      documentWidth: document.documentElement.scrollWidth,
      undersizedControls: [...document.querySelectorAll<HTMLElement>('button, a[href], input, select, textarea')]
        .filter((element) => {
          const style = getComputedStyle(element);
          if (style.display === 'none' || style.visibility === 'hidden') return false;
          const rect = element.getBoundingClientRect();
          return rect.width > 0 && rect.height > 0 && rect.height < 43.5;
        })
        .map((element) => ({ text: element.getAttribute('aria-label') || element.textContent?.trim().slice(0, 40), height: element.getBoundingClientRect().height })),
      coveredControls: [...document.querySelectorAll<HTMLElement>('button, a[href], input, select, textarea')]
        .filter((element) => {
          const style = getComputedStyle(element);
          if (style.display === 'none' || style.visibility === 'hidden' || style.pointerEvents === 'none') return false;
          const rect = element.getBoundingClientRect();
          if (rect.width <= 0 || rect.height <= 0 || rect.bottom <= 0 || rect.top >= innerHeight || rect.right <= 0 || rect.left >= innerWidth) return false;
          const x = Math.min(innerWidth - 1, Math.max(0, rect.left + rect.width / 2));
          const y = Math.min(innerHeight - 1, Math.max(0, rect.top + rect.height / 2));
          const hit = document.elementFromPoint(x, y);
          const canScrollFurther = scrollY + innerHeight < document.documentElement.scrollHeight - 1;
          if (hit?.closest('nav[aria-label="主要导航"]') && canScrollFurther) return false;
          return Boolean(hit && hit !== element && !element.contains(hit) && !hit.contains(element));
        })
        .map((element) => element.getAttribute('aria-label') || element.textContent?.trim().slice(0, 40)),
    }));

    expect(layout.documentWidth, `horizontal overflow on ${node.route}`).toBeLessThanOrEqual(layout.viewport + 1);
    expect(layout.undersizedControls, `undersized controls on ${node.route}`).toEqual([]);
    expect(layout.coveredControls, `covered controls on ${node.route}`).toEqual([]);
    expect(consoleErrors, `console errors on ${node.route}`).toEqual([]);
    expect(pageErrors, `page errors on ${node.route}`).toEqual([]);
    expect(failedResponses, `failed responses on ${node.route}`).toEqual([]);
  });
}
