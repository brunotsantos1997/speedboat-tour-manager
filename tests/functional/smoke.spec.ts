import { test, expect } from '@playwright/test';

test.describe('Smoke Tests - Critical Flows', () => {
  test('should load login page', async ({ page }) => {
    await page.goto('/');
    
    // Verifica se a página carrega sem erros críticos
    await expect(page.locator('body')).toBeVisible();
    
    // Verifica se há elementos básicos da aplicação
    await expect(page.locator('body')).toContainText('Dilancha');
  });

  test('should load dashboard route', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Verifica se a página carrega (mesmo que redirecione para login)
    await expect(page.locator('body')).toBeVisible();
    
    // Não falha se redirecionar para login (comportamento esperado)
    const currentUrl = page.url();
    expect(currentUrl).toMatch(/(dashboard|login)/);
  });

  test('should load public voucher page', async ({ page }) => {
    await page.goto('/voucher/public/test-id');
    
    // Verifica se a página carrega sem crashar
    await expect(page.locator('body')).toBeVisible();
    
    // Verifica se não há erro 404 na página
    await expect(page.locator('body')).not.toContainText('404');
  });

  test('should have no critical JavaScript errors', async ({ page }) => {
    const errors: string[] = [];
    
    // Captura erros JavaScript
    page.on('pageerror', (error) => {
      errors.push(error.message);
    });
    
    await page.goto('/');
    await page.waitForTimeout(2000);
    
    // Verifica se não há erros JavaScript críticos
    const criticalErrors = errors.filter(e => 
      e.includes('TypeError') || 
      e.includes('ReferenceError') || 
      e.includes('Cannot read prop')
    );
    
    expect(criticalErrors).toHaveLength(0);
  });

  test('should load basic app structure', async ({ page }) => {
    await page.goto('/');
    
    // Verifica se a página carrega
    await expect(page.locator('html')).toBeVisible();
    await expect(page.locator('body')).toBeVisible();
    
    // Verifica se há título da página
    const title = await page.title();
    expect(title).toBeTruthy();
    expect(title.length).toBeGreaterThan(0);
    
    // Verifica se há meta tags básicas (indica que o HTML está estruturado)
    const metaTags = await page.locator('head meta').count();
    expect(metaTags).toBeGreaterThan(0);
  });
});
