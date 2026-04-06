import { test, type Page } from '@playwright/test';
import fs from 'fs';

const SCREENSHOT_DIR = 'app_screenshots';

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  fs.mkdirSync(`${SCREENSHOT_DIR}/desktop`, { recursive: true });
  fs.mkdirSync(`${SCREENSHOT_DIR}/mobile`, { recursive: true });
}

async function takeScreenshots(page: Page, name: string) {
  // Desktop
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: `${SCREENSHOT_DIR}/desktop/${name}.png`, fullPage: false });

  // Mobile
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: `${SCREENSHOT_DIR}/mobile/${name}.png`, fullPage: false });
}

async function waitForLoading(page) {
  await page.waitForFunction(() => {
    const body = document.body.innerText;
    return !body.includes('Carregando') && !body.includes('Carregando perfil');
  }, { timeout: 30000 }).catch(() => console.log('Timeout waiting for loading to finish'));
  await page.waitForTimeout(2000);
}

test('Capture Screenshots with Tutorials', async ({ page }) => {
  test.setTimeout(600000);

  // Login
  await page.goto('/login');
  await page.fill('input[type="email"]', '$env:VITE_TEST_EMAIL ?? "test@example.com"');
  await page.fill('input[type="password"]', '$env:VITE_TEST_PASSWORD ?? "TestPassword123!"');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard');
  await waitForLoading(page);

  // Reset Tutorials
  console.log('Resetting tutorials...');
  await page.goto('/dashboard/profile');
  await waitForLoading(page);
  await page.click('button:has-text("Resetar Tutoriais")');
  const confirmBtn = page.locator('button:has-text("Confirmar")');
  if (await confirmBtn.isVisible()) await confirmBtn.click();
  await page.waitForTimeout(2000);

  const tutorialScreens = [
    { path: '/dashboard', name: '03-dashboard-tutorial' },
    { path: '/dashboard/create-event', name: '05-create-event-tutorial' },
    { path: '/dashboard/finance', name: '07-finance-tutorial' },
    { path: '/dashboard/boats', name: '10-boats-tutorial' },
    { path: '/dashboard/products', name: '09-products-tutorial' },
    { path: '/dashboard/boarding-locations', name: '11-boarding-locations-tutorial' },
    { path: '/dashboard/tour-types', name: '12-tour-types-tutorial' },
    { path: '/dashboard/admin/users', name: '13-user-management-tutorial' },
    { path: '/dashboard/google-sync', name: '18-google-sync-tutorial' },
    { path: '/dashboard/commission-report', name: '08-commission-report-tutorial' },
  ];

  for (const screen of tutorialScreens) {
      console.log(`Capturing tutorial for ${screen.path}...`);
      await page.goto(screen.path);
      await waitForLoading(page);

      // Wait for Joyride beacon or tooltip
      // react-joyride usually uses these classes
      const tutorialSelector = '.joyride-beacon, .joyride-tooltip';
      try {
          await page.waitForSelector(tutorialSelector, { timeout: 10000 });
          console.log(`Tutorial active on ${screen.name}`);
      } catch (_e) {
          console.log(`Tutorial NOT found on ${screen.name}`);
      }

      await takeScreenshots(page, screen.name);

      // Skip it for the next one
      const skipBtn = page.locator('button[aria-label="Skip"], button:has-text("Pular")');
      if (await skipBtn.isVisible()) {
          await skipBtn.click();
          await page.waitForTimeout(1000);
      }
  }
});
