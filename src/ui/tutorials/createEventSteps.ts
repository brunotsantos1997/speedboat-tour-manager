import type { Step } from 'react-joyride';

export const createEventSteps: Step[] = [
  {
    target: 'body',
    placement: 'center',
    title: 'Agendando um Passeio',
    content: 'Nesta tela você registra todos os detalhes de um novo agendamento. É rápido e prático!',
  },
  {
    target: '[data-tour="client-section"]',
    title: 'Identifique o Cliente',
    content: 'Busque por um cliente existente ou cadastre um novo na hora. O histórico dele ficará salvo.',
  },
  {
    target: '[data-tour="passengers-section"]',
    title: 'Número de Pessoas',
    content: 'Informe quantos passageiros irão ao passeio. O sistema avisará se ultrapassar a capacidade da lancha.',
  },
  {
    target: '[data-tour="schedule-section"]',
    title: 'Data e Horário',
    content: 'Selecione o dia e os horários de início e término. Datas com marcações vermelhas já possuem outros passeios.',
  },
  {
    target: '[data-tour="boat-section"]',
    title: 'Escolha a Lancha',
    content: 'Selecione qual embarcação será utilizada neste passeio.',
  },
  {
    target: '[data-tour="location-section"]',
    title: 'Local de Embarque',
    content: 'Onde o cliente deverá se apresentar para iniciar o passeio.',
  },
  {
    target: '[data-tour="tour-type-section"]',
    title: 'Tipo de Passeio',
    content: 'Categorize o passeio (Ex: Passeio de 4h, Pôr do Sol, etc). Isso ajuda na organização e relatórios.',
  },
  {
    target: '[data-tour="discount-section"]',
    title: 'Desconto no Aluguel',
    content: 'Se precisar dar um desconto no valor fixo da lancha, você pode fazer isso aqui por valor (R$) ou porcentagem (%).',
  },
  {
    target: '[data-tour="products-section"]',
    title: 'Produtos e Serviços',
    content: 'Selecione bebidas, comidas ou outros serviços adicionais contratados para o passeio.',
  },
  {
    target: '[data-tour="taxes-section"]',
    title: 'Taxas Adicionais',
    content: 'Use para cobrar taxas extras como limpeza ou rolha, com uma descrição personalizada.',
  },
  {
    target: '[data-tour="save-section"]',
    title: 'Finalizar Agendamento',
    content: 'Confira o valor total e clique em "Agendar Passeio" para salvar. O cliente será notificado e o voucher será gerado.',
  }
];
