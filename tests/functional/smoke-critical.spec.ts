import { test, expect } from '@playwright/test';

test.describe('Smoke Tests - Public Routes', () => {
  test('landing page carrega e oferece acesso para login', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('navigation').getByText(/Dilancha/i)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Entrar' })).toBeVisible();
  });

  test('login e recuperacao de senha carregam sem crashar', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: 'Login' })).toBeVisible();

    await page.goto('/forgot-password');
    await expect(page.getByRole('heading', { name: 'Esqueci Minha Senha' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Enviar Link de Redefinicao' })).toBeVisible();
  });

  test('rotas publicas institucionais carregam', async ({ page }) => {
    await page.goto('/privacy-policy');
    await expect(page.getByRole('heading', { name: /^Pol/ })).toBeVisible();

    await page.goto('/terms-of-service');
    await expect(page.getByRole('heading', { name: /^Termos de Uso$/ })).toBeVisible();
  });

  test('voucher publico responde sem quebrar a aplicacao', async ({ page }) => {
    await page.goto('/voucher/test-event-id');

    await expect(page.locator('body')).toBeVisible();
    await expect(page.locator('body')).toContainText(/Voucher|Evento/i);
  });
});
