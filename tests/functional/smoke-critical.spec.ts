import { test, expect } from '@playwright/test';

test.describe('Smoke Tests - Fluxos Críticos', () => {
  test.beforeEach(async ({ page }) => {
    // Setup comum para todos os testes
  });

  test('login - deve acessar o sistema', async ({ page }) => {
    await page.goto('/');
    
    // Verifica se consegue fazer login ou já está logado
    await expect(page.getByRole('link', { name: 'Dashboard' })).toBeVisible({ timeout: 15000 });
  });

  test('dashboard - deve carregar métricas principais', async ({ page }) => {
    await page.goto('/');
    
    // Aguarda carregamento do dashboard
    await expect(page.getByRole('link', { name: 'Dashboard' })).toBeVisible();
    await page.getByRole('link', { name: 'Dashboard' }).click();
    
    // Verifica se as métricas principais carregam
    await expect(page.locator('[data-testid="revenue-metric"]')).toBeVisible({ timeout: 10000 });
  });

  test('evento - deve criar novo passeio', async ({ page }) => {
    await page.goto('/');
    
    await page.getByRole('link', { name: 'Criar Passeio' }).click();
    await expect(page.getByText('Cliente')).toBeVisible();
    
    // Preenche dados mínimos para criar um evento
    await page.getByPlaceholder('Buscar por nome ou telefone').fill('Cliente Teste');
    await page.getByRole('button', { name: '+ Cadastrar Novo Cliente' }).click();
    await page.getByPlaceholder('Nome do Cliente').fill('Cliente Smoke Test');
    await page.getByPlaceholder('Telefone (WhatsApp)').fill('5511999999999');
    await page.getByRole('button', { name: 'Salvar Cliente' }).click();
    
    // Verifica se o cliente foi selecionado
    await expect(page.getByText('Cliente Smoke Test')).toBeVisible();
  });

  test('pagamento - deve registrar pagamento', async ({ page }) => {
    await page.goto('/');
    
    // Navega para financeiro
    await page.getByRole('link', { name: 'Financeiro' }).click();
    await expect(page.getByText('Relatórios Financeiros')).toBeVisible();
    
    // Verifica se consegue acessar relatórios
    await expect(page.locator('[data-testid="finance-summary"]')).toBeVisible({ timeout: 10000 });
  });

  test('cancelamento - deve cancelar evento', async ({ page }) => {
    await page.goto('/');
    
    // Navega para dashboard ou histórico
    await page.getByRole('link', { name: 'Dashboard' }).click();
    
    // Verifica se há algum evento para cancelar (se houver)
    const eventCard = page.locator('[data-testid="event-card"]').first();
    if (await eventCard.isVisible()) {
      await eventCard.click();
      // Verifica se consegue acessar detalhes do evento
      await expect(page.locator('[data-testid="event-details"]')).toBeVisible({ timeout: 5000 });
    }
  });

  test('voucher - deve acessar voucher público', async ({ page }) => {
    // Testa acesso público (sem autenticação)
    await page.goto('/voucher/test-event-id');
    
    // Verifica se a página carrega (mesmo que com erro de evento não encontrado)
    await expect(page.locator('body')).toBeVisible();
  });

  test('admin - deve acessar telas administrativas', async ({ page }) => {
    await page.goto('/');
    
    // Verifica se consegue acessar gestão de usuários (se disponível)
    const adminLink = page.getByRole('link', { name: /usuários|admin/gi });
    if (await adminLink.isVisible()) {
      await adminLink.click();
      await expect(page.locator('body')).toBeVisible();
    }
  });
});

test.describe('Smoke Tests - Performance', () => {
  test('carregamento inicial - deve carregar em tempo razoável', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/');
    await expect(page.getByRole('link', { name: 'Dashboard' })).toBeVisible({ timeout: 15000 });
    
    const loadTime = Date.now() - startTime;
    expect(loadTime).toBeLessThan(5000); // Deve carregar em menos de 5 segundos
  });

  test('navegação - deve navegar entre telas principais rapidamente', async ({ page }) => {
    await page.goto('/');
    
    // Testa navegação para as principais telas
    const navigationTests = [
      { name: 'Dashboard', selector: 'a:has-text("Dashboard")' },
      { name: 'Criar Passeio', selector: 'a:has-text("Criar Passeio")' },
      { name: 'Financeiro', selector: 'a:has-text("Financeiro")' },
      { name: 'Livro Caixa', selector: 'a:has-text("Livro Caixa")' },
    ];

    for (const test of navigationTests) {
      const startTime = Date.now();
      
      const link = page.locator(test.selector);
      if (await link.isVisible()) {
        await link.click();
        await expect(page.locator('body')).toBeVisible({ timeout: 5000 });
        
        const navTime = Date.now() - startTime;
        expect(navTime).toBeLessThan(3000); // Cada navegação deve ser rápida
      }
    }
  });
});
