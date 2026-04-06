import { test, expect } from '@playwright/test';
import fs from 'fs';

const SCREENSHOT_DIR = 'app_screenshots';

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  fs.mkdirSync(`${SCREENSHOT_DIR}/desktop`, { recursive: true });
  fs.mkdirSync(`${SCREENSHOT_DIR}/mobile`, { recursive: true });
}

async function takeScreenshots(page, name) {
  // Desktop
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${SCREENSHOT_DIR}/desktop/${name}.png`, fullPage: false });

  // Mobile
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${SCREENSHOT_DIR}/mobile/${name}.png`, fullPage: false });
}

async function waitForLoading(page) {
  await page.waitForFunction(() => {
    const body = document.body.innerText;
    return !body.includes('Carregando') && !body.includes('Carregando perfil');
  }, { timeout: 45000 }).catch(() => console.log('Timeout waiting for loading to finish'));
  await page.waitForTimeout(3000);
}

test('Final Comprehensive Screenshot Capture - Fixed', async ({ page }) => {
  test.setTimeout(900000);

  // 1. Landing & Login
  await page.goto('/');
  await page.waitForSelector('text=Gerenciador de Passeios', { timeout: 30000 });
  await takeScreenshots(page, '01-landing-page');

  await page.goto('/login');
  await page.waitForSelector('input[type="email"]', { timeout: 30000 });
  await takeScreenshots(page, '02-login');

  await page.fill('input[type="email"]', '$env:VITE_TEST_EMAIL ?? "test@example.com"');
  await page.fill('input[type="password"]', '$env:VITE_TEST_PASSWORD ?? "TestPassword123!"');
  await page.click('button[type="submit"]');

  await page.waitForURL('**/dashboard', { timeout: 45000 });
  await waitForLoading(page);

  // 2. Tutorial Reset
  console.log('Resetting tutorials...');
  await page.goto('/dashboard/profile');
  await waitForLoading(page);
  await page.click('button:has-text("Resetar Tutoriais")');
  const confirmBtn = page.locator('button:has-text("Confirmar")');
  if (await confirmBtn.isVisible()) await confirmBtn.click();
  await page.waitForTimeout(2000);

  const screens = [
    { path: '/dashboard', name: '03-dashboard' },
    { path: '/dashboard/create-event', name: '05-create-event' },
    { path: '/dashboard/profile', name: '04-profile' },
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
    console.log(`Processing ${screen.path}...`);
    await page.goto(screen.path);
    await waitForLoading(page);

    // Detect tutorial
    const tutorialStep = page.locator('.joyride-step');
    const tutorialBeacon = page.locator('.joyride-beacon');

    if (await tutorialStep.isVisible() || await tutorialBeacon.isVisible()) {
        console.log(`Tutorial detected on ${screen.name}`);
        // Capture with tutorial
        await takeScreenshots(page, `${screen.name}-tutorial`);

        // Skip tutorial
        const skipBtn = page.locator('button[aria-label="Skip"], button:has-text("Pular"), button:has-text("Skip")');
        if (await skipBtn.isVisible()) {
            await skipBtn.click();
            // Wait for it to disappear
            await expect(tutorialStep).not.toBeVisible({ timeout: 5000 });
            await page.waitForTimeout(1000);
        }
    }

    // Take clean screenshot
    await takeScreenshots(page, screen.name);
  }

  // 3. Voucher Detail
  await page.goto('/dashboard/clients');
  await waitForLoading(page);
  await page.fill('input[placeholder*="Buscar"]', 'João Teste');
  await page.waitForTimeout(2000);
  const viewVoucherBtn = page.locator('button:has-text("Voucher")').first();
  if (await viewVoucherBtn.isVisible()) {
    await viewVoucherBtn.click();
    await page.waitForURL('**/voucher/**', { timeout: 30000 });
    await waitForLoading(page);
    await takeScreenshots(page, '19-voucher-detail');
  }
});
