import { test, type Page } from '@playwright/test';

const SCREENSHOT_DIR = 'app_screenshots';

async function takeScreenshots(page: Page, name: string) {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.screenshot({ path: `${SCREENSHOT_DIR}/desktop/${name}.png`, fullPage: false });

  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: `${SCREENSHOT_DIR}/mobile/${name}.png`, fullPage: false });
}

test('Capture application screenshots non-blank', async ({ page }) => {
  test.setTimeout(300000);

  // 1. Landing Page
  await page.goto('/');
  await page.waitForSelector('text=Gerenciador de Passeios', { timeout: 10000 });
  await takeScreenshots(page, '01-landing-page');

  // 2. Login
  await page.goto('/login');
  await page.waitForSelector('input[type="email"]', { timeout: 10000 });
  await takeScreenshots(page, '02-login');

  await page.fill('input[type="email"]', '$env:VITE_TEST_EMAIL ?? "test@example.com"');
  await page.fill('input[type="password"]', '$env:VITE_TEST_PASSWORD ?? "TestPassword123!"');
  await page.click('button[type="submit"]');

  await page.waitForURL('**/dashboard', { timeout: 20000 });
  // Wait for specific dashboard content
  await page.waitForSelector('h1:has-text("Dashboard")', { timeout: 10000 });
  await page.waitForTimeout(5000); // Extra time for charts/data
  await takeScreenshots(page, '03-dashboard');

  // 3. Profile & Reset Tutorials
  await page.goto('/dashboard/profile');
  await page.waitForSelector('h1:has-text("Meu Perfil")', { timeout: 10000 });
  const resetTutorialsBtn = page.locator('button:has-text("Resetar Tutoriais")');
  if (await resetTutorialsBtn.isVisible()) {
    await resetTutorialsBtn.click();
    await page.waitForTimeout(1000);
  }
  await takeScreenshots(page, '04-profile');

  // 4. Screens
  const screens = [
    { path: '/dashboard/create-event', name: '05-create-event', selector: 'h1:has-text("Novo Passeio")' },
    { path: '/dashboard/clients', name: '06-clients', selector: 'h1:has-text("Clientes")' },
    { path: '/dashboard/finance', name: '07-finance', selector: 'h1:has-text("Financeiro")' },
    { path: '/dashboard/commission-report', name: '08-commission-report', selector: 'h1:has-text("Comissões")' },
    { path: '/dashboard/products', name: '09-products', selector: 'h1:has-text("Produtos")' },
    { path: '/dashboard/boats', name: '10-boats', selector: 'h1:has-text("Lanchas")' },
    { path: '/dashboard/boarding-locations', name: '11-boarding-locations', selector: 'h1:has-text("Locais")' },
    { path: '/dashboard/tour-types', name: '12-tour-types', selector: 'h1:has-text("Tipos")' },
    { path: '/dashboard/admin/users', name: '13-user-management', selector: 'h1:has-text("Usuários")' },
    { path: '/dashboard/admin/commissions', name: '14-commissions-settings', selector: 'h1:has-text("Comissões")' },
    { path: '/dashboard/voucher-terms', name: '15-voucher-terms', selector: 'h1:has-text("Termos")' },
    { path: '/dashboard/company-data', name: '16-company-data', selector: 'h1:has-text("Empresa")' },
    { path: '/dashboard/voucher-appearance', name: '17-voucher-appearance', selector: 'h1:has-text("Aparência")' },
    { path: '/dashboard/google-sync', name: '18-google-sync', selector: 'h1:has-text("Agenda")' },
  ];

  for (const screen of screens) {
    await page.goto(screen.path);
    try {
        await page.waitForSelector(screen.selector, { timeout: 15000 });
    } catch (_e) {
        console.log(`Timeout waiting for ${screen.selector} on ${screen.path}`);
    }
    await page.waitForTimeout(3000);

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
  await page.waitForSelector('h1:has-text("Clientes")', { timeout: 10000 });
  await page.waitForTimeout(3000);
  const viewVoucherBtn = page.locator('button:has-text("Voucher")').first();
  if (await viewVoucherBtn.isVisible()) {
      await viewVoucherBtn.click();
      await page.waitForURL('**/voucher/**', { timeout: 15000 });
      await page.waitForTimeout(5000);
      await takeScreenshots(page, '19-voucher-detail');
  }
});
