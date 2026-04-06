import { test, type Page } from '@playwright/test';

const SCREENSHOT_DIR = 'app_screenshots';

async function takeScreenshots(page: Page, name: string) {
  // Desktop
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.screenshot({ path: `${SCREENSHOT_DIR}/desktop/${name}.png`, fullPage: true });

  // Mobile
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: `${SCREENSHOT_DIR}/mobile/${name}.png`, fullPage: true });
}

test('Capture application screenshots part 2', async ({ page }) => {
  test.setTimeout(60000);

  // Login
  await page.goto('/login');
  await page.fill('input[type="email"]', '$env:VITE_TEST_EMAIL ?? "test@example.com"');
  await page.fill('input[type="password"]', '$env:VITE_TEST_PASSWORD ?? "TestPassword123!"');
  await page.click('button[type="submit"]');

  // Wait for dashboard
  await page.waitForURL('**/dashboard', { timeout: 10000 });

  // Continue from where it left off (approx)
  const screens = [
    { path: '/dashboard/admin/commissions', name: '14-commissions-settings' },
    { path: '/dashboard/voucher-terms', name: '15-voucher-terms' },
    { path: '/dashboard/company-data', name: '16-company-data' },
    { path: '/dashboard/voucher-appearance', name: '17-voucher-appearance' },
    { path: '/dashboard/google-sync', name: '18-google-sync' },
  ];

  for (const screen of screens) {
    await page.goto(screen.path);
    await page.waitForTimeout(2000);
    await takeScreenshots(page, screen.name);

    const joyride = page.locator('.joyride-step');
    if (await joyride.isVisible()) {
        await takeScreenshots(page, `${screen.name}-tutorial`);
        const skipBtn = page.locator('button[aria-label="Skip"], button:has-text("Pular"), button:has-text("Skip")');
        if (await skipBtn.isVisible()) await skipBtn.click();
    }
  }

  // Voucher Screen
  await page.goto('/dashboard/clients');
  await page.waitForTimeout(2000);
  const viewVoucherBtn = page.locator('button:has-text("Voucher")').first();
  if (await viewVoucherBtn.isVisible()) {
      await viewVoucherBtn.click();
      await page.waitForTimeout(3000);
      await takeScreenshots(page, '19-voucher-detail');
  }
});
