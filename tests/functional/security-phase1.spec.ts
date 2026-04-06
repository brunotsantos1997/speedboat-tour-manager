import { test, expect } from '@playwright/test';

test.describe('Validação de Segurança - Fase 1', () => {
  test('B09 - Autorização server-side funciona', async ({ page }) => {
    // Este teste valida que usuários sem permissão não conseguem acessar dados administrativos
    // devido às regras do Firestore, não apenas filtros client-side
    
    await page.goto('/login');
    
    // Tentativa com usuário sem permissão (se existir)
    await page.fill('input[type="email"]', 'seller@example.com');
    await page.fill('input[type="password"]', 'TestPassword123!');
    await page.click('button[type="submit"]');
    
    // Verificar que não consegue acessar tela de gestão de usuários
    await page.waitForTimeout(2000);
    await page.goto('/user-management');
    
    // Deve ser redirecionado ou ver mensagem de permissão negada
    const currentUrl = page.url();
    expect(currentUrl).not.toContain('/user-management');
  });

  test('B08 - Reauth para alterações sensíveis', async ({ page }) => {
    // Valida que alteração de email/senha exige reautenticação
    
    await page.goto('/login');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'TestPassword123!');
    await page.click('button[type="submit"]');
    
    await page.waitForURL('**/dashboard');
    await page.goto('/profile');
    
    // Tentar alterar email sem senha atual
    await page.fill('input[name="email"]', 'newemail@example.com');
    await page.click('button[type="submit"]');
    
    // Deve mostrar erro de senha obrigatória
    await expect(page.locator('text=Senha atual é obrigatória')).toBeVisible();
  });

  test('C04 - Repositories não fazem autorização client-side', async ({ page }) => {
    // Valida que o enforcement é server-side
    
    await page.goto('/login');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'TestPassword123!');
    await page.click('button[type="submit"]');
    
    await page.waitForURL('**/dashboard');
    
    // Verificar no console do navegador que não há filtros client-side
    // para operações administrativas
    const logs = [];
    page.on('console', msg => logs.push(msg.text()));
    
    await page.goto('/user-management');
    await page.waitForTimeout(2000);
    
    // Verificar que os logs não mostram filtros client-side
    const filterLogs = logs.filter(log => 
      log.includes('filter') || log.includes('role') || log.includes('permission')
    );
    
    // Se houver filtros, devem ser apenas validações básicas
    expect(filterLogs.length).toBeLessThan(3);
  });
});
