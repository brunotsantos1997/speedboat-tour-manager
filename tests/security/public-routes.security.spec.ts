import { expect, test } from '@playwright/test';

test.describe('Security - Public And Protected Routes', () => {
  test('protected dashboard routes redirect unauthenticated users away from admin areas', async ({ page }) => {
    await page.goto('/dashboard/company-data');

    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole('heading', { name: 'Login' })).toBeVisible();
    await expect(page.getByText('Dados da Empresa')).toHaveCount(0);
  });

  test('public voucher route handles script-like query input without executing dialogs', async ({ page }) => {
    const dialogs: string[] = [];
    page.on('dialog', (dialog) => {
      dialogs.push(dialog.message());
      dialog.dismiss().catch(() => {});
    });

    await page.goto('/voucher/test-event-id?name=%3Cscript%3Ealert(1)%3C%2Fscript%3E');

    await expect(page.locator('body')).toBeVisible();
    await expect(page.locator('body')).toContainText(/Voucher|Dados do voucher incompletos|Voucher publico nao encontrado|A configuracao publica do voucher ainda nao foi concluida/i);
    expect(dialogs).toHaveLength(0);
  });
});
