import type { Step } from 'react-joyride';

export const commissionReportSteps: Step[] = [
  {
    target: 'body',
    placement: 'center',
    title: 'Relatório de Comissões',
    content: 'Controle o que deve ser pago para cada vendedor com base nos passeios realizados.',
  },
  {
    target: '[data-tour="commission-filters"]',
    title: 'Período do Relatório',
    content: 'Filtre as comissões por data de início e fim para fechar o pagamento da semana ou do mês.',
  },
  {
    target: '[data-tour="commission-user-filter"]',
    title: 'Filtro por Vendedor',
    content: 'Você pode ver as comissões de todos ou selecionar um colaborador específico.',
  },
  {
    target: '[data-tour="commission-table"]',
    title: 'Detalhamento das Vendas',
    content: 'Aqui você vê cada passeio, quem vendeu, o valor total e quanto aquele vendedor deve receber de comissão.',
  }
];
