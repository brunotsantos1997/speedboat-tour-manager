import type { Step } from 'react-joyride';

export const financeSteps: Step[] = [
  {
    target: 'body',
    placement: 'center',
    title: 'Gestão Financeira',
    content: 'Acompanhe as receitas, despesas e a lucratividade do seu negócio em tempo real.',
  },
  {
    target: '[data-tour="finance-period"]',
    title: 'Filtro por Período',
    content: 'Escolha o intervalo de datas que deseja analisar. Todos os números abaixo serão atualizados automaticamente.',
  },
  {
    target: '[data-tour="btn-cash-book"]',
    title: 'Livro Caixa',
    content: 'Acesse o registro detalhado de todas as entradas e saídas de dinheiro do sistema.',
  },
  {
    target: '[data-tour="stat-finance-revenue"]',
    title: 'Receita Realizada',
    content: 'Total de dinheiro que já entrou em caixa (pagamentos confirmados).',
  },
  {
    target: '[data-tour="stat-finance-expenses"]',
    title: 'Despesas Totais',
    content: 'Soma de todos os custos operacionais e gastos registrados no período.',
  },
  {
    target: '[data-tour="stat-finance-profit"]',
    title: 'Lucro Líquido',
    content: 'O que sobra para o negócio após subtrair as despesas das receitas.',
  },
  {
    target: '[data-tour="btn-add-income"]',
    title: 'Registrar Ganho',
    content: 'Use para registrar entradas que não vêm de passeios (Ex: Venda de um item da loja).',
  },
  {
    target: '[data-tour="btn-add-expense"]',
    title: 'Registrar Despesa',
    content: 'Lançamentos de custos como combustível, manutenção, limpeza ou salários.',
  },
  {
    target: '[data-tour="revenue-origin"]',
    title: 'Origem da Receita',
    content: 'Entenda de onde vem seu dinheiro: Aluguel de lanchas ou venda de produtos.',
  },
  {
    target: '[data-tour="finance-charts"]',
    title: 'Gráficos de Fluxo',
    content: 'Visualize a saúde financeira dia a dia e a comparação dos últimos meses.',
  }
];
