import type { Step } from 'react-joyride';

export const boatsSteps: Step[] = [
  {
    target: 'body',
    placement: 'center',
    title: 'Gestão da Frota',
    content: 'Cadastre e gerencie as lanchas disponíveis para aluguel no seu negócio.',
  },
  {
    target: '[data-tour="btn-add-boat"]',
    title: 'Nova Lancha',
    content: 'Adicione uma nova embarcação informando nome, capacidade, tamanho e os preços de locação.',
  },
  {
    target: '[data-tour="boats-list"]',
    title: 'Suas Lanchas',
    content: 'Visualize aqui todas as lanchas da sua frota, com detalhes de capacidade e valores por hora.',
  },
  {
    target: '[data-tour="btn-edit-boat"]',
    title: 'Editar ou Remover',
    content: 'Use estes botões para atualizar as informações de uma lancha ou removê-la do sistema.',
  }
];
