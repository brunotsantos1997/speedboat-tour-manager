import type { Step } from 'react-joyride';

export const dashboardSteps: Step[] = [
  {
    target: 'body',
    placement: 'center',
    title: 'Bem-vindo ao Dashboard!',
    content: 'Aqui você tem uma visão geral de toda a sua operação náutica. Vamos conhecer as principais funções.',
  },
  {
    target: '[data-tour="stat-revenue"]',
    title: 'Faturamento Mensal',
    content: 'Aqui você vê o quanto já faturou no mês atual e qual a projeção de valores a receber.',
  },
  {
    target: '[data-tour="stat-events"]',
    title: 'Total de Passeios',
    content: 'Contagem total de passeios realizados e agendados para este mês.',
  },
  {
    target: '[data-tour="btn-create-event"]',
    title: 'Novo Passeio',
    content: 'Clique aqui para registrar um novo agendamento de lancha.',
  },
  {
    target: '[data-tour="btn-shared-event"]',
    title: 'Passeio Compartilhado',
    content: 'Use esta opção para vender vagas individuais em um passeio com data fixa.',
  },
  {
    target: '[data-tour="btn-search-client"]',
    title: 'Histórico de Clientes',
    content: 'Busque por clientes para ver o histórico de passeios e preferências de cada um.',
  },
  {
    target: '[data-tour="pending-payments"]',
    title: 'Pagamentos Pendentes',
    content: 'Fique de olho nos passeios que ainda possuem saldo a pagar ou reservas não confirmadas.',
  },
  {
    target: '[data-tour="week-events"]',
    title: 'Agenda da Semana',
    content: 'Uma lista rápida de todos os passeios confirmados para os próximos 7 dias.',
  },
  {
    target: '[data-tour="calendar"]',
    title: 'Calendário Interativo',
    content: 'Selecione qualquer data para ver os passeios agendados. Os dias com marcação possuem eventos confirmados.',
  }
];
