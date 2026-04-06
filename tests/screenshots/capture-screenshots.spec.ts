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

test('Capture application screenshots', async ({ page }) => {
  // 1. Landing Page
  await page.goto('/');
  await takeScreenshots(page, '01-landing-page');

  // 2. Login
  await page.goto('/login');
  await takeScreenshots(page, '02-login');

  await page.fill('input[type="email"]', '$env:VITE_TEST_EMAIL ?? "test@example.com"');
  await page.fill('input[type="password"]', '$env:VITE_TEST_PASSWORD ?? "TestPassword123!"');
  await page.click('button[type="submit"]');

  // Wait for dashboard
  await page.waitForURL('**/dashboard', { timeout: 10000 });
  await takeScreenshots(page, '03-dashboard');

  // 3. Reset Tutorials (if possible via UI)
  await page.goto('/dashboard/profile');
  await page.waitForTimeout(1000);
  const resetTutorialsBtn = page.locator('button:has-text("Resetar Tutoriais")');
  if (await resetTutorialsBtn.isVisible()) {
    await resetTutorialsBtn.click();
    await page.waitForTimeout(500);
  }
  await takeScreenshots(page, '04-profile');

  // 4. Navigate through all screens
  const screens = [
    { path: '/dashboard/create-event', name: '05-create-event' },
    { path: '/dashboard/clients', name: '06-clients' },
    { path: '/dashboard/finance', name: '07-finance' },
    { path: '/dashboard/commission-report', name: '08-commission-report' },
    { path: '/dashboard/products', name: '09-products' },
    { path: '/dashboard/boats', name: '10-boats' },
    { path: '/dashboard/boarding-locations', name: '11-boarding-locations' },
    { path: '/dashboard/tour-types', name: '12-tour-types' },
    { path: '/dashboard/admin/users', name: '13-user-management' },
    { path: '/dashboard/admin/commissions', name: '14-commissions-settings' },
    { path: '/dashboard/voucher-terms', name: '15-voucher-terms' },
    { path: '/dashboard/company-data', name: '16-company-data' },
    { path: '/dashboard/voucher-appearance', name: '17-voucher-appearance' },
    { path: '/dashboard/google-sync', name: '18-google-sync' },
  ];

  for (const screen of screens) {
    await page.goto(screen.path);
    await page.waitForTimeout(2000); // Wait for potential tutorials or data loading
    await takeScreenshots(page, screen.name);

    // If there is a tutorial (Joyride), try to take a shot of it
    const joyride = page.locator('.joyride-step');
    if (await joyride.isVisible()) {
        await takeScreenshots(page, `${screen.name}-tutorial`);
        // Skip tutorial to move to next screen
        const skipBtn = page.locator('button[aria-label="Skip"]');
        if (await skipBtn.isVisible()) await skipBtn.click();
    }
  }

  // 5. Create a test event to show data
  await page.goto('/dashboard/create-event');
  // Fill some basic info if possible to show form state
  // ... (omitting complex form filling for now unless needed)

  // 6. Voucher Screen (requires an event ID)
  // We can try to find an event on the dashboard and click it
  await page.goto('/dashboard/clients'); // Client history usually has events
  const viewVoucherBtn = page.locator('button:has-text("Voucher")').first();
  if (await viewVoucherBtn.isVisible()) {
      await viewVoucherBtn.click();
      await page.waitForTimeout(2000);
      await takeScreenshots(page, '19-voucher-detail');
  }
});
