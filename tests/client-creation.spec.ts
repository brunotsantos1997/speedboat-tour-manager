import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  // Set TEST_MODE to true in localStorage before navigating
  await page.addInitScript(() => {
    window.localStorage.setItem('TEST_MODE', 'true');
  });
});

test('deve criar um novo cliente com sucesso na tela de criar passeio', async ({ page }) => {
  await page.goto('/');

  // Aguarda o login automático do modo de teste
  await expect(page.getByRole('link', { name: 'Dashboard' })).toBeVisible();

  // Navega para Criar Passeio
  await page.getByRole('link', { name: 'Criar Passeio' }).click();

  // Verifica se estamos na tela correta
  await expect(page.getByText('Cliente')).toBeVisible();

  // Digita um nome que não existe para forçar a opção de cadastro
  await page.getByPlaceholder('Buscar por nome ou telefone').fill('Cliente Inexistente');

  // Clica em cadastrar novo cliente
  await page.getByRole('button', { name: '+ Cadastrar Novo Cliente' }).click();

  // Preenche o modal
  await page.getByPlaceholder('Nome do Cliente').fill('Novo Cliente Teste');
  await page.getByPlaceholder('Telefone (WhatsApp)').fill('5511999999999');

  // Clica em Salvar
  await page.getByRole('button', { name: 'Salvar Cliente' }).click();

  // Verifica se o modal fechou e o cliente foi selecionado
  // O nome do cliente deve aparecer no resumo de seleção
  await expect(page.getByText('Novo Cliente Teste')).toBeVisible();

  // Verifica se o telefone formatado aparece (opcional, dependendo de como o componente exibe)
  // Como implementei máscara manual: +55 (11) 99999-9999
  await expect(page.getByText('+55 (11) 99999-9999')).toBeVisible();
});
