import type { Step } from 'react-joyride';

export const tourTypesSteps: Step[] = [
  {
    target: 'body',
    placement: 'center',
    title: 'Tipos de Passeio',
    content: 'Categorize seus eventos para organizar melhor sua agenda e relatórios.',
  },
  {
    target: '[data-tour="btn-add-tour-type"]',
    title: 'Novo Tipo',
    content: 'Crie categorias como "Passeio Familiar", "Passeio de 4h" ou "Passeio de 8h".',
  },
  {
    target: '[data-tour="tour-types-list"]',
    title: 'Categorias Cadastradas',
    content: 'Aqui você vê todos os tipos criados.',
  },
  {
    target: '[data-tour="tour-type-color"]',
    title: 'Cores de Identificação',
    content: 'Cada tipo possui uma cor. Essa cor será usada no calendário do Dashboard para facilitar a identificação visual rápida.',
  }
];
