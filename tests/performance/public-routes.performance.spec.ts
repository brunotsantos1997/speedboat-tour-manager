import type { Page } from '@playwright/test';
import { expect, test } from '@playwright/test';

const readNavigationTiming = async (page: Page) => {
  return page.evaluate(() => {
    const entry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;

    if (!entry) {
      return null;
    }

    return {
      domContentLoaded: entry.domContentLoadedEventEnd - entry.startTime,
      load: entry.loadEventEnd - entry.startTime
    };
  });
};

test.describe('Performance - Public Routes', () => {
  test('landing page loads within a local baseline budget', async ({ page }) => {
    await page.goto('/');

    const timing = await readNavigationTiming(page);
    expect(timing).not.toBeNull();
    expect(timing?.domContentLoaded ?? Infinity).toBeLessThan(3000);
    expect(timing?.load ?? Infinity).toBeLessThan(5000);
  });

  test('public voucher route responds within a local baseline budget', async ({ page }) => {
    await page.goto('/voucher/test-event-id');

    const timing = await readNavigationTiming(page);
    expect(timing).not.toBeNull();
    expect(timing?.domContentLoaded ?? Infinity).toBeLessThan(3000);
    expect(timing?.load ?? Infinity).toBeLessThan(5000);
  });
});
