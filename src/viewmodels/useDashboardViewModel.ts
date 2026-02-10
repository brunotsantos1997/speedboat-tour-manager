// src/viewmodels/useDashboardViewModel.ts
import { useState, useEffect, useMemo, useCallback } from 'react';
import type { EventType } from '../core/domain/types';
import { eventRepository } from '../core/repositories/EventRepository';
import { paymentRepository } from '../core/repositories/PaymentRepository';
import { startOfDay, isWithinInterval, startOfWeek, endOfWeek, getMonth, isSameDay, format } from 'date-fns';
import { useToastContext } from '../ui/contexts/ToastContext';
import { useEventSync } from './useEventSync';

// Helper to parse date string as local time to avoid timezone issues.
// '2023-10-25' would be parsed as UTC midnight, which can be the previous day in some timezones.
// Appending T00:00 makes it parse as local midnight.
const parseLocalDate = (dateString: string) => new Date(`${dateString}T00:00`);

export const useDashboardViewModel = () => {
  const [allEvents, setAllEvents] = useState<EventType[]>([]);
  const [allPayments, setAllPayments] = useState<any[]>([]);
  const { syncEvent } = useEventSync();
  const { showToast } = useToastContext();
  const [isLoading, setIsLoading] = useState(true);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [activeEventForPayment, setActiveEventForPayment] = useState<EventType | null>(null);
  const [paymentType, setPaymentType] = useState<'DOWN_PAYMENT' | 'BALANCE' | 'FULL'>('DOWN_PAYMENT');
  const [defaultPaymentAmount, setDefaultPaymentAmount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(startOfDay(new Date()));

  useEffect(() => {
    setIsLoading(true);
    eventRepository.getAll()
      .then(async (allFetchedEvents) => {
        // Auto-cancel logic remains, but we can do it asynchronously and let onSnapshot handle the update
        const now = Date.now();
        const twentyFourHours = 24 * 60 * 60 * 1000;

        for (const event of allFetchedEvents) {
          if (event.status === 'PRE_SCHEDULED' && event.preScheduledAt && (now - event.preScheduledAt > twentyFourHours)) {
            const cancelledEvent = { ...event, status: 'CANCELLED' as const, autoCancelled: true };
            try {
              const savedEvent = await eventRepository.updateEvent(cancelledEvent);
              await syncEvent(savedEvent);
            } catch (error) {
              console.error(`Failed to auto-cancel event ${event.id}:`, error);
            }
          }
        }
        setIsLoading(false);
      })
      .catch((err) => {
        setError('Falha ao buscar passeios.');
        console.error(err);
        setIsLoading(false);
      });

    const unsubscribeEvents = eventRepository.subscribe((events) => {
      setAllEvents(events);
      setIsLoading(false);
    });

    const unsubscribePayments = paymentRepository.subscribe((payments) => {
      setAllPayments(payments);
    });

    return () => {
      unsubscribeEvents();
      unsubscribePayments();
    };
  }, [syncEvent]);

  // --- Actions ---
  const initiatePayment = useCallback(async (eventId: string, type: 'DOWN_PAYMENT' | 'BALANCE' | 'FULL') => {
    const event = allEvents.find(e => e.id === eventId);
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
  }, [allEvents]);

  const confirmPaymentRecord = useCallback(async (amount: number, method: any, type: any) => {
    if (!activeEventForPayment) return;

    try {
      const eventId = activeEventForPayment.id;

      // Record the payment
      await paymentRepository.add({
        eventId,
        amount,
        method,
        type,
        date: format(new Date(), 'yyyy-MM-dd'),
        timestamp: Date.now()
      });

      // Update event status/paymentStatus if necessary
      let updatedEvent = { ...activeEventForPayment };

      // Calculate total paid including the new payment
      const payments = await paymentRepository.getByEventId(eventId);
      const totalPaid = payments.reduce((acc, p) => acc + p.amount, 0);

      // Logic: If any amount is paid, confirm the reservation
      if (totalPaid > 0 && updatedEvent.status === 'PRE_SCHEDULED') {
        updatedEvent.status = 'SCHEDULED';
      }

      // Check if fully paid
      if (totalPaid >= updatedEvent.total) {
        updatedEvent.paymentStatus = 'CONFIRMED';
      } else {
        updatedEvent.paymentStatus = 'PENDING';
      }

      const savedEvent = await eventRepository.updateEvent(updatedEvent);
      await syncEvent(savedEvent);

      showToast('Pagamento registrado com sucesso!');
      setIsPaymentModalOpen(false);
      setActiveEventForPayment(null);
    } catch (error) {
      console.error('Failed to record payment:', error);
      showToast('Erro ao registrar o pagamento.');
      throw error;
    }
  }, [activeEventForPayment, showToast]);

  const processNotification = useCallback(async (eventId: string) => {
    try {
      const eventToUpdate = allEvents.find(e => e.id === eventId);
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
  }, [allEvents, showToast]);

  const revertCancellation = useCallback(async (eventId: string) => {
    try {
      const eventToUpdate = allEvents.find(e => e.id === eventId);
      if (!eventToUpdate) return;

      const updatedEvent: EventType = {
        ...eventToUpdate,
        status: 'SCHEDULED',
        autoCancelled: false
      };

      const savedEvent = await eventRepository.updateEvent(updatedEvent);
      await syncEvent(savedEvent);
      showToast('Cancelamento revertido e reserva confirmada!');
    } catch (error: any) {
      console.error('Failed to revert cancellation:', error);
      showToast(error.message || 'Erro ao reverter cancelamento.');
    }
  }, [allEvents, showToast]);


  // --- Derived State ---
  const today = startOfDay(new Date());

  const upcomingEvents = useMemo(() => {
    const now = new Date();
    return allEvents.filter(event => {
      if (event.status !== 'SCHEDULED' && event.status !== 'PRE_SCHEDULED') return false;

      // Combine date and time correctly into a local Date object
      const eventEndDateTimeString = `${event.date}T${event.endTime}`;
      const eventEndTime = new Date(eventEndDateTimeString);

      return eventEndTime > now;
    });
  }, [allEvents]);

  const notificationEvents = useMemo(() =>
    allEvents.filter(event =>
      (event.status === 'COMPLETED' || event.status === 'CANCELLED' || event.status === 'PENDING_REFUND')
    ), [allEvents]);

  const eventsForSelectedDate = useMemo(() =>
    upcomingEvents.filter(event => isSameDay(parseLocalDate(event.date), selectedDate)),
    [upcomingEvents, selectedDate]
  );

  const eventsThisWeek = useMemo(() => {
    const start = startOfWeek(today); // Sunday is the default
    const end = endOfWeek(today);
    return upcomingEvents.filter(event => isWithinInterval(parseLocalDate(event.date), { start, end }));
  }, [upcomingEvents, today]);

  const pendingPayments = useMemo(() =>
    upcomingEvents.filter(event => event.paymentStatus === 'PENDING'),
    [upcomingEvents]
  );

  const monthlyStats = useMemo(() => {
    const currentMonth = getMonth(today);
    const monthlyEvents = allEvents.filter(event =>
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

    const totalEvents = monthlyEvents.length;

    return { realizedRevenue, pendingRevenue, totalEvents };
  }, [allEvents, allPayments, today]);

  const calendarEvents = useMemo(() =>
    upcomingEvents.map(event => parseLocalDate(event.date)),
  [upcomingEvents]);

  return {
    isLoading,
    error,
    upcomingEvents, // Renamed from 'events' for clarity
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
