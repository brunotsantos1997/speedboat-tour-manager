import type { Step } from 'react-joyride';

export const googleSyncSteps: Step[] = [
  {
    target: 'body',
    placement: 'center',
    title: 'Sincronização com Google',
    content: 'Mantenha sua agenda do Google Calendar sempre atualizada com os passeios registrados no sistema.',
  },
  {
    target: '[data-tour="google-calendar-select"]',
    title: 'Escolha o Calendário',
    content: 'Selecione em qual das suas agendas do Google os passeios devem ser salvos.',
  },
  {
    target: '[data-tour="google-auto-sync"]',
    title: 'Auto Sincronização',
    content: 'Ative esta opção para que cada novo passeio criado no sistema seja enviado automaticamente para sua agenda Google.',
  },
  {
    target: '[data-tour="btn-save-google-settings"]',
    title: 'Salvar Configurações',
    content: 'Clique aqui para aplicar as escolhas de calendário e sincronização automática.',
  },
  {
    target: '[data-tour="btn-sync-existing"]',
    title: 'Sincronizar Passados',
    content: 'Se você já tem passeios cadastrados e quer enviá-los agora para o Google, use este botão para uma sincronização em massa.',
  }
];
