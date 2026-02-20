import type { Step } from 'react-joyride';

export const boardingLocationsSteps: Step[] = [
  {
    target: 'body',
    placement: 'center',
    title: 'Locais de Embarque',
    content: 'Cadastre os pontos de encontro onde os clientes devem ir para iniciar o passeio.',
  },
  {
    target: '[data-tour="btn-add-location"]',
    title: 'Adicionar Local',
    content: 'Registre um novo ponto de embarque. Você pode dar um nome e incluir um link do Google Maps.',
  },
  {
    target: '[data-tour="locations-list"]',
    title: 'Lista de Locais',
    content: 'Aqui você vê todos os locais cadastrados. O link do Google Maps é importante pois ele aparece no voucher do cliente.',
  }
];
