// src/viewmodels/useDashboardViewModel.ts
import { useState, useEffect, useMemo, useCallback } from 'react';
import type { EventType, PaymentMethod, PaymentType, Payment } from '../core/domain/types';
import { logger } from '../core/common/Logger';
import { eventRepository } from '../core/repositories/EventRepository';
import { paymentRepository } from '../core/repositories/PaymentRepository';
import { startOfDay, isWithinInterval, startOfWeek, endOfWeek, getMonth, isSameDay, format, startOfMonth, endOfMonth } from 'date-fns';
import { useToast } from '../ui/contexts/toast/useToast';
import { useEventSync } from './useEventSync';

const parseLocalDate = (dateString: string) => new Date(`${dateString}T00:00`);

export const useDashboardViewModel = () => {
  const [eventsForPeriod, setEventsForPeriod] = useState<EventType[]>([]);
  const [notificationEvents, setNotificationEvents] = useState<EventType[]>([]);
  const [allPayments, setAllPayments] = useState<Payment[]>([]);
  const { syncEvent } = useEventSync();
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [activeEventForPayment, setActiveEventForPayment] = useState<EventType | null>(null);
  const [paymentType, setPaymentType] = useState<'DOWN_PAYMENT' | 'BALANCE' | 'FULL'>('DOWN_PAYMENT');
  const [defaultPaymentAmount, setDefaultPaymentAmount] = useState(0);
  const [error] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(startOfDay(new Date()));

  // Derived period for listeners: Current month
  const periodStart = useMemo(() => format(startOfMonth(selectedDate), 'yyyy-MM-dd'), [selectedDate]);
  const periodEnd = useMemo(() => format(endOfMonth(selectedDate), 'yyyy-MM-dd'), [selectedDate]);

  useEffect(() => {
    
    // 1. Subscribe to events in the current visible period (month)
    const unsubscribeEvents = eventRepository.subscribeToDateRange(
      periodStart,
      periodEnd,
      (events) => {
        setEventsForPeriod(events);
        setIsLoading(false);
        
        // Auto-cancel logic for PRE_SCHEDULED events in this period
        const now = Date.now();
        const twentyFourHours = 24 * 60 * 60 * 1000;
        events.forEach(async (event) => {
          if (event.status === 'PRE_SCHEDULED' && event.preScheduledAt && (now - event.preScheduledAt > twentyFourHours)) {
            const cancelledEvent = { ...event, status: 'CANCELLED' as const, autoCancelled: true };
            try {
              const savedEvent = await eventRepository.updateEvent(cancelledEvent);
              await syncEvent(savedEvent);
            } catch (error) {
              console.error(`Failed to auto-cancel event ${event.id}:`, error);
            }
          }
        });
      }
    );

    // 2. Subscribe to notifications (cancelled, completed, pending refund)
    const unsubscribeNotifications = eventRepository.subscribeToNotifications(setNotificationEvents);

    // 3. Subscribe to payments (limited to latest 100 for global context)
    const unsubscribePayments = paymentRepository.subscribe(setAllPayments);

    return () => {
      unsubscribeEvents();
      unsubscribeNotifications();
      unsubscribePayments();
    };
  }, [periodStart, periodEnd, syncEvent]);

  const initiatePayment = useCallback(async (eventId: string, type: 'DOWN_PAYMENT' | 'BALANCE' | 'FULL') => {
    const event = eventsForPeriod.find(e => e.id === eventId);
    if (event) {
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
    }
  }, [eventsForPeriod]);

  const confirmPaymentRecord = useCallback(async (amount: number, method: PaymentMethod, type: PaymentType) => {
    if (!activeEventForPayment) return;

    try {
      const eventId = activeEventForPayment.id;
      await paymentRepository.add({
        eventId,
        amount,
        method,
        type,
        date: format(new Date(), 'yyyy-MM-dd'),
        timestamp: Date.now()
      });

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

      const savedEvent = await eventRepository.updateEvent(updatedEvent);
      await syncEvent(savedEvent);

      setIsPaymentModalOpen(false);
      setActiveEventForPayment(null);
    } catch (error: unknown) {
      logger.error('Failed to confirm payment', error as Error, { eventId: activeEventForPayment?.id, amount, method, type, operation: 'confirmPaymentRecord' });
      showToast(error instanceof Error ? error.message : 'Erro ao confirmar pagamento.');
    }
  }, [activeEventForPayment, syncEvent, showToast]);

  const processNotification = useCallback(async (eventId: string) => {
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
    } catch (error) {
      console.error('Failed to process notification:', error);
      showToast('Erro ao processar a notificação.');
    }
  }, [notificationEvents, showToast, syncEvent]);

  const revertCancellation = useCallback(async (eventId: string) => {
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
    } catch (error: unknown) {
      logger.error('Failed to confirm payment', error as Error, { 
        eventId: activeEventForPayment?.id, 
        operation: 'confirmPaymentRecord' 
      });
      showToast(error instanceof Error ? error.message : 'Erro ao confirmar pagamento.');
    }
  }, [notificationEvents, showToast, syncEvent, activeEventForPayment?.id]);

  // --- Derived State ---
  const today = startOfDay(new Date());

  const upcomingEvents = useMemo(() => {
    const now = new Date();
    return eventsForPeriod.filter(event => {
      if (event.status !== 'SCHEDULED' && event.status !== 'PRE_SCHEDULED') return false;
      const eventEndTime = new Date(`${event.date}T${event.endTime}`);
      return eventEndTime > now;
    });
  }, [eventsForPeriod]);

  const eventsForSelectedDate = useMemo(() =>
    upcomingEvents.filter(event => isSameDay(parseLocalDate(event.date), selectedDate)),
    [upcomingEvents, selectedDate]
  );

  const eventsThisWeek = useMemo(() => {
    const start = startOfWeek(today);
    const end = endOfWeek(today);
    return upcomingEvents.filter(event => isWithinInterval(parseLocalDate(event.date), { start, end }));
  }, [upcomingEvents, today]);

  const pendingPayments = useMemo(() =>
    upcomingEvents.filter(event => event.paymentStatus === 'PENDING'),
    [upcomingEvents]
  );

  const monthlyStats = useMemo(() => {
    const currentMonth = getMonth(today);
    const monthlyEvents = eventsForPeriod.filter(event =>
      getMonth(parseLocalDate(event.date)) === currentMonth &&
      (event.status === 'SCHEDULED' || event.status === 'COMPLETED' || event.status === 'ARCHIVED_COMPLETED')
    );

    let realizedRevenue = 0;
    let pendingRevenue = 0;

    monthlyEvents.forEach(event => {
      const eventPayments = allPayments.filter(p => p.eventId === event.id);
      const totalPaid = eventPayments.reduce((acc, p) => acc + p.amount, 0);

      realizedRevenue += Math.min(event.total, totalPaid);
      pendingRevenue += Math.max(0, event.total - totalPaid);
    });

    return { realizedRevenue, pendingRevenue, totalEvents: monthlyEvents.length };
  }, [eventsForPeriod, allPayments, today]);

  const calendarEvents = useMemo(() =>
    upcomingEvents.map(event => parseLocalDate(event.date)),
  [upcomingEvents]);

  return {
    isLoading,
    error,
    upcomingEvents,
    notificationEvents,
    eventsForSelectedDate,
    eventsThisWeek,
    pendingPayments,
    monthlyStats,
    calendarEvents,
    selectedDate,
    setSelectedDate,
    isPaymentModalOpen,
    setIsPaymentModalOpen,
    activeEventForPayment,
    paymentType,
    defaultPaymentAmount,
    initiatePayment,
    confirmPaymentRecord,
    processNotification,
    revertCancellation,
  };
};
