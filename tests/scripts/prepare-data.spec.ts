import { test } from '@playwright/test';

test('Prepare minimum test data and reset tutorials', async ({ page }) => {
  test.setTimeout(240000);

  const login = async () => {
    await page.goto('/login');
    await page.fill('input[type="email"]', process.env.VITE_TEST_EMAIL || 'test@example.com');
    await page.fill('input[type="password"]', process.env.VITE_TEST_PASSWORD || 'TestPassword123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 30000 });
  };

  await login();

  // 1. Reset Tutorials
  console.log('Resetting tutorials...');
  await page.goto('/dashboard/profile');
  await page.click('button:has-text("Resetar Tutoriais")');
  const confirmBtn = page.locator('button:has-text("Confirmar")');
  if (await confirmBtn.isVisible()) await confirmBtn.click();
  await page.waitForTimeout(2000);

  // 2. Prepare Boat
  console.log('Ensuring boat exists...');
  await page.goto('/dashboard/boats');
  await page.waitForTimeout(2000);
  if (await page.locator('text=Nenhuma lancha cadastrada').isVisible() || (await page.locator('table tr').count() <= 1)) {
      await page.click('button:has-text("Adicionar Lancha")');
      await page.fill('#boat-name', 'Lancha de Teste');
      await page.fill('#boat-capacity', '10');
      await page.fill('#boat-size', '28');
      await page.click('button:has-text("Salvar Lancha")');
      await page.waitForTimeout(2000);
  }

  // 3. Prepare Boarding Location
  console.log('Ensuring boarding location exists...');
  await page.goto('/dashboard/boarding-locations');
  await page.waitForTimeout(2000);
  if (await page.locator('text=Nenhum local de embarque').isVisible() || (await page.locator('table tr').count() <= 1)) {
      await page.click('button:has-text("Adicionar Local")');
      await page.fill('#name', 'Marina de Teste');
      await page.click('button:has-text("Salvar Local")');
      await page.waitForTimeout(2000);
  }

  // 4. Prepare Tour Type
  console.log('Ensuring tour type exists...');
  await page.goto('/dashboard/tour-types');
  await page.waitForTimeout(2000);
  if (await page.locator('text=Nenhum tipo de passeio cadastrado').isVisible() || (await page.locator('ul li').count() === 0)) {
      await page.click('button:has-text("Adicionar Tipo")');
      await page.fill('input[placeholder*="Aniversário"]', 'Passeio de Teste');
      await page.click('button:has-text("Salvar Tipo")');
      await page.waitForTimeout(2000);
  }

  // 5. Create Event
  console.log('Creating event...');
  await page.goto('/dashboard/create-event');
  await page.waitForTimeout(5000);

  // Skip tutorial if it appears
  const skipBtn = page.locator('button[aria-label="Skip"], button:has-text("Pular")');
  if (await skipBtn.isVisible()) await skipBtn.click();

  await page.fill('input[placeholder*="Buscar"]', 'Cliente de Teste');
  await page.locator('input[type="number"]').first().fill('4');

  // Selects
  await page.waitForSelector('select#boat-select option:not([value=""])', { timeout: 10000 });
  await page.selectOption('select#boat-select', { index: 1 });

  await page.waitForSelector('select#boarding-location-select option:not([value=""])', { timeout: 10000 });
  await page.selectOption('select#boarding-location-select', { index: 1 });

  await page.waitForSelector('select#tour-type-select option:not([value=""])', { timeout: 10000 });
  await page.selectOption('select#tour-type-select', { index: 1 });

  await page.click('button:has-text("Agendar Passeio")');
  await page.waitForTimeout(5000);

  console.log('Data preparation finished.');
});
