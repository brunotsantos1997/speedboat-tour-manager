import type { Step } from 'react-joyride';

export const userManagementSteps: Step[] = [
  {
    target: 'body',
    placement: 'center',
    title: 'Gestão da Equipe',
    content: 'Aqui você controla quem tem acesso ao sistema e quais funções cada pessoa pode exercer.',
  },
  {
    target: '[data-tour="users-table"]',
    title: 'Lista de Colaboradores',
    content: 'Veja todos os usuários cadastrados, seus e-mails e níveis de acesso.',
  },
  {
    target: '[data-tour="user-status"]',
    title: 'Status do Usuário',
    content: 'Novos cadastros aparecem como PENDING. Você precisa aprová-los para que consigam entrar no sistema.',
  },
  {
    target: '[data-tour="user-role"]',
    title: 'Cargos e Permissões',
    content: 'Defina se o usuário é um Vendedor, Administrador ou Super Admin. Cada cargo libera diferentes telas e ações.',
  },
  {
    target: '[data-tour="user-actions"]',
    title: 'Ações Rápidas',
    content: 'Aprove, rejeite ou desative usuários por aqui. Também é por aqui que você aprova pedidos de redefinição de senha.',
  }
];
