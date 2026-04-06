// src/viewmodels/client/useClientEventActions.ts
import { useCallback } from 'react';
import type { EventType, PaymentMethod, PaymentType } from '../../core/domain/types';
import { eventRepository } from '../../core/repositories/EventRepository';
import { paymentRepository } from '../../core/repositories/PaymentRepository';
import { useEventSync } from '../useEventSync';
import { useModal } from '../../ui/contexts/modal/useModal';
import { useToast } from '../../ui/contexts/toast/useToast';
import { format } from 'date-fns';
import { logger } from '../../core/common/Logger';

export const useClientEventActions = () => {
  const { syncEvent, deleteFromGoogle } = useEventSync();
  const { confirm } = useModal();
  const { showToast } = useToast();

  const initiatePayment = useCallback(async (
    eventId: string,
    type: 'DOWN_PAYMENT' | 'BALANCE' | 'FULL',
    events: EventType[],
    onOpenPaymentModal: (event: EventType, type: 'DOWN_PAYMENT' | 'BALANCE' | 'FULL', amount: number) => void
  ) => {
    const event = events.find(e => e.id === eventId);
    if (!event) return;

    try {
      const payments = await paymentRepository.getByEventId(eventId);
      const totalPaid = payments.reduce((acc, p) => acc + p.amount, 0);

      let suggested = 0;
      if (type === 'DOWN_PAYMENT') {
        suggested = Math.max(0, (event.total * 0.3) - totalPaid);
      } else {
        suggested = Math.max(0, event.total - totalPaid);
      }

      onOpenPaymentModal(event, type, suggested);
    } catch (error) {
      logger.error('Failed to initiate payment', error as Error, { eventId, type });
      showToast('Erro ao iniciar pagamento.', 'error');
    }
  }, [showToast]);

  const confirmPayment = useCallback(async (
    eventId: string,
    amount: number,
    method: PaymentMethod,
    type: PaymentType,
    onUpdateEvent: (event: EventType) => Promise<void>
  ) => {
    try {
      // Add payment
      await paymentRepository.add({
        eventId,
        amount,
        method,
        type,
        date: format(new Date(), 'yyyy-MM-dd'),
        timestamp: Date.now()
      });

      // Update event status based on payment
      const event = await eventRepository.getById(eventId);
      if (!event) return;

      const payments = await paymentRepository.getByEventId(eventId);
      const totalPaid = payments.reduce((acc, p) => acc + p.amount, 0);

      const updatedEvent = { ...event };
      if (totalPaid > 0 && updatedEvent.status === 'PRE_SCHEDULED') {
        updatedEvent.status = 'SCHEDULED';
      }

      if (totalPaid >= updatedEvent.total) {
        updatedEvent.paymentStatus = 'CONFIRMED';
      } else {
        updatedEvent.paymentStatus = 'PENDING';
      }

      await eventRepository.updateEvent(updatedEvent);
      await syncEvent(updatedEvent);
      await onUpdateEvent(updatedEvent);

      showToast('Pagamento confirmado com sucesso!');
    } catch (error: unknown) {
      logger.error('Failed to confirm payment', error as Error, { eventId, amount, method, type });
      showToast(error instanceof Error ? error.message : 'Erro ao confirmar pagamento.', 'error');
      throw error;
    }
  }, [syncEvent, showToast]);

  const cancelEvent = useCallback(async (
    eventId: string,
    events: EventType[],
    onUpdateEvent: (event: EventType) => Promise<void>
  ) => {
    const event = events.find(e => e.id === eventId);
    if (!event) return;

    const confirmed = await confirm(
      'Cancelar Evento',
      `Deseja cancelar o evento de ${event.date}? Esta ação não pode ser desfeita.`
    );

    if (!confirmed) return;

    try {
      const cancelledEvent = { ...event, status: 'CANCELLED' as const, cancelledAt: Date.now() };
      const savedEvent = await eventRepository.updateEvent(cancelledEvent);
      await syncEvent(savedEvent);
      await onUpdateEvent(savedEvent);

      showToast('Evento cancelado com sucesso!');
    } catch (error: unknown) {
      logger.error('Failed to cancel event', error as Error, { eventId });
      showToast('Erro ao cancelar evento.', 'error');
      throw error;
    }
  }, [confirm, syncEvent, showToast]);

  const revertCancellation = useCallback(async (
    eventId: string,
    events: EventType[],
    onUpdateEvent: (event: EventType) => Promise<void>
  ) => {
    const event = events.find(e => e.id === eventId);
    if (!event) return;

    try {
      const revertedEvent = { ...event, status: 'SCHEDULED' as const, autoCancelled: false };
      const savedEvent = await eventRepository.updateEvent(revertedEvent);
      await syncEvent(savedEvent);
      await onUpdateEvent(savedEvent);

      showToast('Cancelamento revertido com sucesso!');
    } catch (error: unknown) {
      logger.error('Failed to revert cancellation', error as Error, { eventId });
      showToast('Erro ao reverter cancelamento.', 'error');
      throw error;
    }
  }, [syncEvent, showToast]);

  const deleteEvent = useCallback(async (
    eventId: string,
    events: EventType[],
    onUpdateEvent: () => Promise<void>
  ) => {
    const event = events.find(e => e.id === eventId);
    if (!event) return;

    const confirmed = await confirm(
      'Excluir Evento',
      `Deseja excluir permanentemente o evento de ${event.date}? Esta ação não pode ser desfeita.`
    );

    if (!confirmed) return;

    try {
      // Delete from Google Calendar first
      await deleteFromGoogle(eventId);
      
      // Delete from database
      await eventRepository.remove(eventId);
      await onUpdateEvent();

      showToast('Evento excluído com sucesso!');
    } catch (error: unknown) {
      logger.error('Failed to delete event', error as Error, { eventId });
      showToast('Erro ao excluir evento.', 'error');
      throw error;
    }
  }, [confirm, deleteFromGoogle, showToast]);

  return {
    initiatePayment,
    confirmPayment,
    cancelEvent,
    revertCancellation,
    deleteEvent,
  };
};
