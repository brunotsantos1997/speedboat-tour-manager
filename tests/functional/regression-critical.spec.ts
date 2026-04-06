import { test, expect } from '@playwright/test';
import { createTestFixtures, setupTestData, cleanupTestData } from '../fixtures/test-data';

test.describe('Regressão - Reset de Senha', () => {
  test.beforeEach(async ({ page }) => {
    // Setup test data if needed
    const fixtures = createTestFixtures();
    await setupTestData(fixtures);
  });

  test.afterEach(async ({ page }) => {
    // Cleanup test data
    const fixtures = createTestFixtures();
    await cleanupTestData(fixtures);
  });

  test('fluxo de esqueci minha senha deve funcionar corretamente', async ({ page }) => {
    await page.goto('/');
    
    // Navega para esqueci senha
    await page.getByRole('link', { name: /esqueci senha/i }).click();
    
    // Verifica se está na tela de forgot password
    await expect(page.getByText('Recuperar Senha')).toBeVisible();
    
    // Preenche email válido
    await page.getByPlaceholder('Email').fill('test@example.com');
    
    // Clica em recuperar
    await page.getByRole('button', { name: 'Recuperar' }).click();
    
    // Verifica mensagem de sucesso
    await expect(page.getByText(/email enviado/i)).toBeVisible({ timeout: 10000 });
  });

  test('não deve permitir reset com email inválido', async ({ page }) => {
    await page.goto('/forgot-password');
    
    // Tenta com email inválido
    await page.getByPlaceholder('Email').fill('email-invalido');
    await page.getByRole('button', { name: 'Recuperar' }).click();
    
    // Verifica mensagem de erro
    await expect(page.getByText(/email inválido/i)).toBeVisible();
  });
});

test.describe('Regressão - Perfil do Usuário', () => {
  test.beforeEach(async ({ page }) => {
    // Login antes dos testes de perfil
    await page.goto('/');
    await expect(page.getByRole('link', { name: 'Dashboard' })).toBeVisible({ timeout: 15000 });
  });

  test('deve atualizar perfil com sucesso', async ({ page }) => {
    // Navega para perfil
    await page.getByRole('link', { name: /perfil/i }).click();
    
    // Verifica se está na tela de perfil
    await expect(page.getByText('Meu Perfil')).toBeVisible();
    
    // Atualiza nome
    await page.getByPlaceholder('Nome').fill('Usuário Teste Atualizado');
    
    // Salva alterações
    await page.getByRole('button', { name: 'Salvar' }).click();
    
    // Verifica mensagem de sucesso
    await expect(page.getByText(/perfil atualizado/i)).toBeVisible();
    
    // Verifica se o nome foi atualizado
    await expect(page.getByPlaceholder('Nome')).toHaveValue('Usuário Teste Atualizado');
  });

  test('deve validar campos obrigatórios', async ({ page }) => {
    await page.goto('/profile');
    
    // Limpa campo nome
    await page.getByPlaceholder('Nome').fill('');
    await page.getByRole('button', { name: 'Salvar' }).click();
    
    // Verifica mensagem de erro
    await expect(page.getByText(/nome é obrigatório/i)).toBeVisible();
  });
});

test.describe('Regressão - Comissão', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('link', { name: 'Dashboard' })).toBeVisible({ timeout: 15000 });
  });

  test('relatório de comissão deve calcular valores corretamente', async ({ page }) => {
    // Navega para relatório de comissão
    await page.getByRole('link', { name: /comissão/i }).click();
    
    // Verifica se está na tela de comissão
    await expect(page.getByText('Relatório de Comissões')).toBeVisible();
    
    // Seleciona período
    await page.getByLabel('Período').selectOption('Últimos 30 dias');
    
    // Clica em gerar relatório
    await page.getByRole('button', { name: 'Gerar Relatório' }).click();
    
    // Verifica se o relatório foi gerado
    await expect(page.locator('[data-testid="commission-report"]')).toBeVisible({ timeout: 10000 });
    
    // Verifica se há dados no relatório
    await expect(page.locator('[data-testid="commission-total"]')).not.toHaveText('R$ 0,00');
  });

  test('deve filtrar comissão por guia', async ({ page }) => {
    await page.goto('/commission-report');
    
    // Seleciona um guia específico
    await page.getByLabel('Guia').selectOption({ index: 1 });
    
    // Gera relatório
    await page.getByRole('button', { name: 'Gerar Relatório' }).click();
    
    // Verifica se o filtro foi aplicado
    await expect(page.locator('[data-testid="commission-guide"]')).toBeVisible();
  });
});

test.describe('Regressão - Financeiro', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('link', { name: 'Dashboard' })).toBeVisible({ timeout: 15000 });
  });

  test('dashboard financeiro deve exibir métricas corretas', async ({ page }) => {
    // Navega para financeiro
    await page.getByRole('link', { name: 'Financeiro' }).click();
    
    // Verifica se está na tela financeira
    await expect(page.getByText('Relatórios Financeiros')).toBeVisible();
    
    // Verifica métricas principais
    await expect(page.locator('[data-testid="total-revenue"]')).toBeVisible();
    await expect(page.locator('[data-testid="total-expenses"]')).toBeVisible();
    await expect(page.locator('[data-testid="net-profit"]')).toBeVisible();
    
    // Verifica se os valores são numéricos (formato BRL)
    const revenueText = await page.locator('[data-testid="total-revenue"]').textContent();
    expect(revenueText).toMatch(/R\$ \d+,\d{2}/);
  });

  test('gráfico mensal deve exibir dados dos últimos 6 meses', async ({ page }) => {
    await page.goto('/finance');
    
    // Verifica se o gráfico mensal está visível
    await expect(page.locator('[data-testid="monthly-chart"]')).toBeVisible({ timeout: 10000 });
    
    // Verifica se há 6 pontos de dados (meses)
    const chartPoints = await page.locator('[data-testid="chart-point"]').count();
    expect(chartPoints).toBe(6);
  });

  test('livro caixa deve registrar entradas e saídas', async ({ page }) => {
    // Navega para livro caixa
    await page.getByRole('link', { name: 'Livro Caixa' }).click();
    
    // Verifica se está no livro caixa
    await expect(page.getByText('Livro Caixa')).toBeVisible();
    
    // Adiciona uma entrada de teste
    await page.getByRole('button', { name: 'Adicionar Entrada' }).click();
    await page.getByPlaceholder('Descrição').fill('Entrada de teste');
    await page.getByPlaceholder('Valor').fill('100');
    await page.getByRole('button', { name: 'Salvar' }).click();
    
    // Verifica se a entrada foi adicionada
    await expect(page.getByText('Entrada de teste')).toBeVisible();
    await expect(page.getByText('R$ 100,00')).toBeVisible();
  });

  test('deve filtrar livro caixa por período', async ({ page }) => {
    await page.goto('/cash-book');
    
    // Define filtro de período
    await page.getByLabel('Data Inicial').fill('01/01/2024');
    await page.getByLabel('Data Final').fill('31/01/2024');
    
    // Aplica filtro
    await page.getByRole('button', { name: 'Filtrar' }).click();
    
    // Verifica se o filtro foi aplicado (pode verificar o período exibido)
    await expect(page.locator('[data-testid="period-display"]')).toContainText('01/01/2024');
    await expect(page.locator('[data-testid="period-display"]')).toContainText('31/01/2024');
  });
});

test.describe('Regressão - Pagamentos', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('link', { name: 'Dashboard' })).toBeVisible({ timeout: 15000 });
  });

  test('deve registrar pagamento com sucesso', async ({ page }) => {
    // Navega para um evento existente ou cria um novo
    await page.getByRole('link', { name: 'Dashboard' }).click();
    
    // Clica em um evento para registrar pagamento
    await page.locator('[data-testid="event-card"]').first().click();
    
    // Registra pagamento
    await page.getByRole('button', { name: 'Registrar Pagamento' }).click();
    await page.getByPlaceholder('Valor').fill('500');
    await page.getByLabel('Método').selectOption('PIX');
    await page.getByRole('button', { name: 'Confirmar' }).click();
    
    // Verifica se o pagamento foi registrado
    await expect(page.getByText(/pagamento registrado/i)).toBeVisible();
    await expect(page.locator('[data-testid="payment-status"]')).toContainText('PAGO');
  });

  test('deve validar valor mínimo de pagamento', async ({ page }) => {
    // Tenta registrar pagamento com valor inválido
    await page.goto('/events');
    await page.locator('[data-testid="event-card"]').first().click();
    await page.getByRole('button', { name: 'Registrar Pagamento' }).click();
    
    await page.getByPlaceholder('Valor').fill('0');
    await page.getByRole('button', { name: 'Confirmar' }).click();
    
    // Verifica mensagem de erro
    await expect(page.getByText(/valor mínimo/i)).toBeVisible();
  });
});
