// src/viewmodels/useDashboardViewModel.ts
import { useState, useEffect, useMemo, useCallback } from 'react';
import type { Event } from '../core/domain/types';
import { eventRepository } from '../core/repositories/EventRepository';
import { startOfDay, isToday, isWithinInterval, addDays, startOfWeek, endOfWeek, getMonth, isSameDay } from 'date-fns';
import { useToastContext } from '../ui/contexts/ToastContext';

export const useDashboardViewModel = () => {
  const [allEvents, setAllEvents] = useState<Event[]>([]);
  const { showToast } = useToastContext();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(startOfDay(new Date()));

  const fetchEvents = useCallback(async () => {
    setIsLoading(true);
    try {
      // In a real app, this would be a single API call.
      const datePromises = Array.from({ length: 60 }, (_, i) => {
        const date = addDays(new Date(), i);
        const dateString = date.toISOString().split('T')[0];
        return eventRepository.getEventsByDate(dateString);
      });
      const eventsPerDay = await Promise.all(datePromises);
      setAllEvents(eventsPerDay.flat());
    } catch (err) {
      setError('Failed to fetch events.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // --- Actions ---
  const confirmPayment = useCallback(async (eventId: string) => {
    try {
      const eventToUpdate = allEvents.find(e => e.id === eventId);
      if (!eventToUpdate) return;

      const updatedEvent = { ...eventToUpdate, paymentStatus: 'CONFIRMED' as const };

      if (updatedEvent.status === 'PRE_SCHEDULED') {
        updatedEvent.status = 'SCHEDULED';
      }

      await eventRepository.updateEvent(updatedEvent);

      setAllEvents(prev =>
        prev.map(event =>
          event.id === eventId ? updatedEvent : event
        )
      );
      showToast('Pagamento confirmado com sucesso!');
    } catch (error) {
      console.error('Failed to confirm payment:', error);
      showToast('Erro ao confirmar o pagamento.');
    }
  }, [allEvents, showToast]);

  const processNotification = useCallback(async (eventId: string) => {
    try {
      const eventToUpdate = allEvents.find(e => e.id === eventId);
      if (!eventToUpdate) return;

      let updatedEvent: Event;
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

      await eventRepository.updateEvent(updatedEvent);

      setAllEvents(prev =>
        prev.map(event =>
          event.id === eventId ? updatedEvent : event
        )
      );
      showToast(toastMessage);
    } catch (error) {
      console.error('Failed to process notification:', error);
      showToast('Erro ao processar a notificação.');
    }
  }, [allEvents, showToast]);


  // --- Derived State ---
  const today = startOfDay(new Date());

  const upcomingEvents = useMemo(() => {
    const now = new Date();
    return allEvents.filter(event => {
      if (event.status !== 'SCHEDULED' && event.status !== 'PRE_SCHEDULED') return false;

      const [year, month, day] = event.date.split('-').map(Number);
      const [hours, minutes] = event.endTime.split(':').map(Number);
      const eventEndTime = new Date(year, month - 1, day, hours, minutes);

      return eventEndTime > now;
    });
  }, [allEvents]);

  const notificationEvents = useMemo(() =>
    allEvents.filter(event =>
      (event.status === 'COMPLETED' || event.status === 'CANCELLED' || event.status === 'PENDING_REFUND')
    ), [allEvents]);

  const eventsForSelectedDate = useMemo(() =>
    upcomingEvents.filter(event => isSameDay(new Date(event.date), selectedDate)),
    [upcomingEvents, selectedDate]
  );

  const eventsThisWeek = useMemo(() => {
    const start = startOfWeek(today);
    const end = endOfWeek(today);
    return upcomingEvents.filter(event => isWithinInterval(new Date(event.date), { start, end }));
  }, [upcomingEvents, today]);

  const pendingPayments = useMemo(() =>
    upcomingEvents.filter(event => event.paymentStatus === 'PENDING'),
    [upcomingEvents]
  );

  const monthlyStats = useMemo(() => {
    const currentMonth = getMonth(today);
    const monthlyEvents = allEvents.filter(event =>
      getMonth(new Date(event.date)) === currentMonth &&
      event.status === 'COMPLETED'
    );

    const totalRevenue = monthlyEvents.reduce((acc, event) => acc + event.total, 0);
    const totalEvents = monthlyEvents.length;

    return { totalRevenue, totalEvents };
  }, [allEvents, today]);

  const calendarEvents = useMemo(() =>
    upcomingEvents.map(event => new Date(event.date)),
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
    confirmPayment,
    processNotification,
  };
};
