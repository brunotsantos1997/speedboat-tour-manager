import { test, expect } from '@playwright/test';

test.describe('Smoke Tests - Basic Stability', () => {
  test('app shell carrega sem erros JavaScript criticos', async ({ page }) => {
    const errors: string[] = [];

    page.on('pageerror', (error) => {
      errors.push(error.message);
    });

    await page.goto('/');
    await expect(page.locator('body')).toBeVisible();

    const criticalErrors = errors.filter(error =>
      error.includes('TypeError') ||
      error.includes('ReferenceError') ||
      error.includes('Cannot read properties')
    );

    expect(criticalErrors).toHaveLength(0);
  });

  test('roteamento basico funciona para paginas publicas', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Entrar' }).click();
    await expect(page).toHaveURL(/\/login$/);

    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/(login|dashboard)$/);
  });
});
