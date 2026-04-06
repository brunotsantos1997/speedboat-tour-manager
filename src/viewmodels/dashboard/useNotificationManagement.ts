// src/viewmodels/dashboard/useNotificationManagement.ts
import { useCallback } from 'react';
import type { EventType } from '../../core/domain/types';
import { eventRepository } from '../../core/repositories/EventRepository';
import { useEventSync } from '../useEventSync';
import { useToast } from '../../ui/contexts/toast/useToast';
import { logger } from '../../core/common/Logger';

export const useNotificationManagement = () => {
  const { syncEvent } = useEventSync();
  const { showToast } = useToast();

  const processNotification = useCallback(async (eventId: string, notificationEvents: EventType[]) => {
    try {
      const eventToUpdate = notificationEvents.find(e => e.id === eventId);
      if (!eventToUpdate) return;

      let updatedEvent: EventType;
      let toastMessage = '';

      if (eventToUpdate.status === 'COMPLETED') {
        updatedEvent = { ...eventToUpdate, status: 'ARCHIVED_COMPLETED' };
        toastMessage = 'Conclusão de passeio arquivada.';
      } else if (eventToUpdate.status === 'CANCELLED') {
        updatedEvent = { ...eventToUpdate, status: 'ARCHIVED_CANCELLED' };
        toastMessage = 'Cancelamento arquivado.';
      } else if (eventToUpdate.status === 'PENDING_REFUND') {
        updatedEvent = { ...eventToUpdate, status: 'REFUNDED' };
        toastMessage = 'Estorno confirmado.';
      } else {
        return;
      }

      const savedEvent = await eventRepository.updateEvent(updatedEvent);
      await syncEvent(savedEvent);
      showToast(toastMessage);

      return savedEvent;
    } catch (error: unknown) {
      logger.error('Failed to process notification', error as Error, { eventId });
      showToast('Erro ao processar a notificação.', 'error');
      throw error;
    }
  }, [syncEvent, showToast]);

  const revertCancellation = useCallback(async (eventId: string, notificationEvents: EventType[]) => {
    try {
      const eventToUpdate = notificationEvents.find(e => e.id === eventId);
      if (!eventToUpdate) return;

      const updatedEvent: EventType = {
        ...eventToUpdate,
        status: 'SCHEDULED',
        autoCancelled: false
      };

      const savedEvent = await eventRepository.updateEvent(updatedEvent);
      await syncEvent(savedEvent);
      showToast('Cancelamento revertido e reserva confirmada!');

      return savedEvent;
    } catch (error: unknown) {
      logger.error('Failed to revert cancellation', error as Error, { eventId });
      showToast('Erro ao reverter cancelamento.', 'error');
      throw error;
    }
  }, [syncEvent, showToast]);

  return {
    processNotification,
    revertCancellation,
  };
};
