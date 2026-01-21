import { test, expect } from '@playwright/test';

test.describe('Layout Verification', () => {
  test.use({
    storageState: 'e2e/.auth/user.json',
  });

  test('should display the layout correctly on commission report and user management pages', async ({ page }) => {
    // Navigate to Commission Report page and take a screenshot
    await page.goto('/commission-report');
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('heading', { name: 'Relatório de Comissão' })).toBeVisible();
    await page.screenshot({ path: 'e2e/screenshots/commission-report-layout-fixed.png' });

    // Verify there is only one sidebar
    const sidebars = await page.locator('aside').count();
    expect(sidebars).toBe(1);

    // Navigate to User Management page and take a screenshot
    await page.goto('/admin/users');
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('heading', { name: 'Gerenciamento de Usuários' })).toBeVisible();
    await page.screenshot({ path: 'e2e/screenshots/user-management-layout-fixed.png' });

    // Verify there is only one sidebar
    const sidebars2 = await page.locator('aside').count();
    expect(sidebars2).toBe(1);
  });
});
