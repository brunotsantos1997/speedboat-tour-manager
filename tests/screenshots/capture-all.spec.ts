import { test } from '@playwright/test';
import fs from 'fs';

const SCREENSHOT_DIR = 'app_screenshots';

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR);
  fs.mkdirSync(`${SCREENSHOT_DIR}/desktop`);
  fs.mkdirSync(`${SCREENSHOT_DIR}/mobile`);
}

async function takeScreenshots(page, name) {
  // Desktop
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.waitForTimeout(2000); // Wait for animations
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

async function handleTutorial(page, screenName) {
  const _tutorialOverlay = page.locator('.joyride-step'); // Assuming react-joyride class
  const skipBtn = page.locator('button[aria-label="Skip"], button:has-text("Pular"), button:has-text("Skip")');

  if (await skipBtn.isVisible()) {
    // Take a screenshot with the tutorial if it's the first time we see it on this screen
    await takeScreenshots(page, `${screenName}-with-tutorial`);
    await skipBtn.click();
    await page.waitForTimeout(1000);
  }
}

test('Comprehensive White-Label Screenshot Capture', async ({ page }) => {
  test.setTimeout(600000);

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

  await page.waitForURL('**/dashboard', { timeout: 30000 });
  await waitForLoading(page);

  // 2. Data Preparation and Tutorial Reset
  console.log('Resetting tutorials and preparing data...');
  await page.goto('/dashboard/profile');
  await waitForLoading(page);
  await page.click('button:has-text("Resetar Tutoriais")');
  const confirmBtn = page.locator('button:has-text("Confirmar")');
  if (await confirmBtn.isVisible()) await confirmBtn.click();
  await page.waitForTimeout(2000);

  // Ensure Boat
  await page.goto('/dashboard/boats');
  await waitForLoading(page);
  if (await page.locator('text=Nenhuma lancha cadastrada').isVisible() || (await page.locator('table tr').count() <= 1)) {
    await page.click('button:has-text("Adicionar Lancha")');
    await page.fill('#boat-name', 'Lancha de Teste VIP');
    await page.fill('#boat-capacity', '12');
    await page.fill('#boat-size', '30');
    await page.click('button:has-text("Salvar Lancha")');
    await page.waitForTimeout(2000);
  }

  // Ensure Tour Type
  await page.goto('/dashboard/tour-types');
  await waitForLoading(page);
  if (await page.locator('text=Nenhum tipo de passeio cadastrado').isVisible() || (await page.locator('ul li').count() === 0)) {
    await page.click('button:has-text("Adicionar Tipo")');
    await page.fill('input[placeholder*="Aniversário"]', 'Passeio Teste 4h');
    await page.click('button:has-text("Salvar Tipo")');
    await page.waitForTimeout(2000);
  }

  // 3. Screenshot Cycle
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
    await page.goto(screen.path);
    await waitForLoading(page);
    await handleTutorial(page, screen.name);
    await takeScreenshots(page, screen.name);
  }

  // 4. Voucher Detail
  await page.goto('/dashboard/clients');
  await waitForLoading(page);
  const viewVoucherBtn = page.locator('button:has-text("Voucher")').first();
  if (await viewVoucherBtn.isVisible()) {
    await viewVoucherBtn.click();
    await page.waitForURL('**/voucher/**', { timeout: 30000 });
    await waitForLoading(page);
    await takeScreenshots(page, '19-voucher-detail');
  }
});
