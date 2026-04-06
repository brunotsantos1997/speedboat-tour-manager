import { test, type Page } from '@playwright/test';

const SCREENSHOT_DIR = 'app_screenshots';

async function takeScreenshots(page: Page, name: string) {
  // Desktop
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: `${SCREENSHOT_DIR}/desktop/${name}.png`, fullPage: false });

  // Mobile
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: `${SCREENSHOT_DIR}/mobile/${name}.png`, fullPage: false });
}

async function waitForLoading(page) {
    // Wait for any "Carregando" text to disappear
    await page.waitForFunction(() => {
        const body = document.body.innerText;
        return !body.includes('Carregando');
    }, { timeout: 30000 }).catch(() => console.log('Timeout waiting for loading to finish'));
    await page.waitForTimeout(2000);
}

test('Capture application screenshots robust', async ({ page }) => {
  test.setTimeout(600000);

  // 1. Landing Page
  await page.goto('/');
  await page.waitForSelector('text=Gerenciador de Passeios', { timeout: 20000 });
  await takeScreenshots(page, '01-landing-page');

  // 2. Login
  await page.goto('/login');
  await page.waitForSelector('input[type="email"]', { timeout: 10000 });
  await takeScreenshots(page, '02-login');

  await page.fill('input[type="email"]', '$env:VITE_TEST_EMAIL ?? "test@example.com"');
  await page.fill('input[type="password"]', '$env:VITE_TEST_PASSWORD ?? "TestPassword123!"');
  await page.click('button[type="submit"]');

  await page.waitForURL('**/dashboard', { timeout: 30000 });
  await waitForLoading(page);
  await takeScreenshots(page, '03-dashboard');

  // 3. Profile & Reset Tutorials
  await page.goto('/dashboard/profile');
  await waitForLoading(page);
  const resetTutorialsBtn = page.locator('button:has-text("Resetar Tutoriais")');
  if (await resetTutorialsBtn.isVisible()) {
    await resetTutorialsBtn.click();
    await page.waitForTimeout(1000);
  }
  await takeScreenshots(page, '04-profile');

  // 4. Screens
  const screens = [
    { path: '/dashboard/boats', name: '10-boats' },
    { path: '/dashboard/products', name: '09-products' },
    { path: '/dashboard/boarding-locations', name: '11-boarding-locations' },
    { path: '/dashboard/tour-types', name: '12-tour-types' },
    { path: '/dashboard/create-event', name: '05-create-event' },
    { path: '/dashboard/clients', name: '06-clients' },
    { path: '/dashboard/finance', name: '07-finance' },
    { path: '/dashboard/commission-report', name: '08-commission-report' },
    { path: '/dashboard/admin/users', name: '13-user-management' },
    { path: '/dashboard/admin/commissions', name: '14-commissions-settings' },
    { path: '/dashboard/voucher-terms', name: '15-voucher-terms' },
    { path: '/dashboard/company-data', name: '16-company-data' },
    { path: '/dashboard/voucher-appearance', name: '17-voucher-appearance' },
    { path: '/dashboard/google-sync', name: '18-google-sync' },
  ];

  for (const screen of screens) {
    await page.goto(screen.path);
    await waitForLoading(page);

    // Check if empty and create data if needed (example for Boats)
    if (screen.path === '/dashboard/boats') {
        const noBoats = await page.locator('text=Nenhuma lancha cadastrada').isVisible();
        if (noBoats) {
            await page.click('button:has-text("Adicionar Lancha")');
            await page.fill('#boat-name', 'Lancha Teste VIP');
            await page.fill('#boat-capacity', '12');
            await page.fill('#boat-size', '30');
            await page.click('button:has-text("Salvar Lancha")');
            await page.waitForTimeout(2000);
        }
    }

    if (screen.path === '/dashboard/products') {
         const noProducts = await page.locator('text=Nenhum produto cadastrado').isVisible();
         if (noProducts) {
             await page.click('button:has-text("Adicionar Produto")');
             await page.fill('input[placeholder="Ex: Churrasco a bordo"]', 'Produto Teste');
             await page.click('button:has-text("Salvar Produto")');
             await page.waitForTimeout(2000);
         }
    }

    const joyride = page.locator('.joyride-step');
    if (await joyride.isVisible()) {
        await takeScreenshots(page, `${screen.name}-tutorial`);
        const skipBtn = page.locator('button[aria-label="Skip"], button:has-text("Pular"), button:has-text("Skip")');
        if (await skipBtn.isVisible()) {
            await skipBtn.click();
            await page.waitForTimeout(1000);
        }
    }
    await takeScreenshots(page, screen.name);
  }

  // 5. Voucher Detail
  await page.goto('/dashboard/clients');
  await waitForLoading(page);
  const viewVoucherBtn = page.locator('button:has-text("Voucher")').first();
  if (await viewVoucherBtn.isVisible()) {
      await viewVoucherBtn.click();
      await page.waitForURL('**/voucher/**', { timeout: 20000 });
      await waitForLoading(page);
      await takeScreenshots(page, '19-voucher-detail');
  }
});
