// src/viewmodels/dashboard/usePaymentManagement.ts
import { useState, useCallback } from 'react';
import type { EventType, PaymentMethod, PaymentType } from '../../core/domain/types';
import { paymentRepository } from '../../core/repositories/PaymentRepository';
import { format } from 'date-fns';
import { logger } from '../../core/common/Logger';
import { useToast } from '../../ui/contexts/toast/useToast';

export const usePaymentManagement = () => {
  const { showToast } = useToast();
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [activeEventForPayment, setActiveEventForPayment] = useState<EventType | null>(null);
  const [paymentType, setPaymentType] = useState<'DOWN_PAYMENT' | 'BALANCE' | 'FULL'>('DOWN_PAYMENT');
  const [defaultPaymentAmount, setDefaultPaymentAmount] = useState(0);

  const initiatePayment = useCallback(async (eventId: string, type: 'DOWN_PAYMENT' | 'BALANCE' | 'FULL', events: EventType[]) => {
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

      setActiveEventForPayment(event);
      setPaymentType(type);
      setDefaultPaymentAmount(suggested);
      setIsPaymentModalOpen(true);
    } catch (error) {
      logger.error('Failed to initiate payment', error as Error, { eventId, type });
      showToast('Erro ao iniciar pagamento.', 'error');
    }
  }, [showToast]);

  const confirmPaymentRecord = useCallback(async (
    amount: number, 
    method: PaymentMethod, 
    type: PaymentType,
    onUpdateEvent: (event: EventType) => Promise<EventType>,
    onSyncEvent: (event: EventType) => Promise<void>
  ) => {
    if (!activeEventForPayment) return;

    try {
      const eventId = activeEventForPayment.id;
      
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
      const payments = await paymentRepository.getByEventId(eventId);
      const totalPaid = payments.reduce((acc, p) => acc + p.amount, 0);

      const updatedEvent = { ...activeEventForPayment };
      if (totalPaid > 0 && updatedEvent.status === 'PRE_SCHEDULED') {
        updatedEvent.status = 'SCHEDULED';
      }

      if (totalPaid >= updatedEvent.total) {
        updatedEvent.paymentStatus = 'CONFIRMED';
      } else {
        updatedEvent.paymentStatus = 'PENDING';
      }

      const finalEvent = await onUpdateEvent(updatedEvent);
      await onSyncEvent(finalEvent);

      setIsPaymentModalOpen(false);
      setActiveEventForPayment(null);
      showToast('Pagamento confirmado com sucesso!');
      
      return finalEvent;
    } catch (error: unknown) {
      logger.error('Failed to confirm payment', error as Error, { 
        eventId: activeEventForPayment?.id, 
        amount, 
        method, 
        type 
      });
      showToast(error instanceof Error ? error.message : 'Erro ao confirmar pagamento.', 'error');
      throw error;
    }
  }, [activeEventForPayment, showToast]);

  const closePaymentModal = useCallback(() => {
    setIsPaymentModalOpen(false);
    setActiveEventForPayment(null);
    setDefaultPaymentAmount(0);
  }, []);

  return {
    // State
    isPaymentModalOpen,
    activeEventForPayment,
    paymentType,
    defaultPaymentAmount,

    // Actions
    initiatePayment,
    confirmPaymentRecord,
    closePaymentModal,
    setPaymentType,
  };
};
