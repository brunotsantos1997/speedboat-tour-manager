import { expect, test } from '@playwright/test';

test.describe('Accessibility - Public Routes', () => {
  test('landing page exposes keyboard-reachable primary navigation', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('navigation')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Entrar' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Cadastrar' })).toBeVisible();

    await page.keyboard.press('Tab');
    await expect(page.getByRole('button', { name: 'Entrar' })).toBeFocused();
  });

  test('login and forgot-password forms expose accessible labels and actions', async ({ page }) => {
    await page.goto('/login');

    await expect(page.getByRole('heading', { name: 'Login' })).toBeVisible();
    await expect(page.getByLabel(/mail/i)).toBeVisible();
    await expect(page.locator('label[for="password"]')).toBeVisible();
    await expect(page.locator('#password')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Login', exact: true })).toBeVisible();
    await expect(page.locator('a[href="/forgot-password"]')).toBeVisible();

    await page.goto('/forgot-password');

    await expect(page.getByRole('heading', { name: 'Esqueci Minha Senha' })).toBeVisible();
    await expect(page.getByLabel(/mail/i)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Enviar Link de Redefinicao' })).toBeVisible();
  });
});
