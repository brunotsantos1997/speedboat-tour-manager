// src/viewmodels/useDashboardViewModel.ts
import { useState, useEffect, useMemo, useCallback } from 'react';
import type { Event } from '../core/domain/types';
import { eventRepository } from '../core/repositories/EventRepository';
import { startOfDay, isToday, isWithinInterval, addDays, startOfWeek, endOfWeek, getMonth } from 'date-fns';

export const useDashboardViewModel = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = useCallback(async () => {
    setIsLoading(true);
    try {
      // This is not efficient, but it's for mock data. A real API would have a better method.
      const datePromises: Promise<Event[]>[] = [];
      for (let i = 0; i < 60; i++) {
        const date = addDays(new Date(), i);
        const dateString = date.toISOString().split('T')[0];
        datePromises.push(eventRepository.getEventsByDate(dateString));
      }
      const eventsPerDay = await Promise.all(datePromises);
      const allEvents = eventsPerDay.flat();
      setEvents(allEvents.filter(event => event.status === 'SCHEDULED'));
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

  const confirmPayment = useCallback(async (eventId: string) => {
    if (window.confirm('Confirmar o pagamento da reserva?')) {
      await eventRepository.updatePaymentStatus(eventId, 'CONFIRMED');
      fetchEvents(); // Re-fetch to update the UI
    }
  }, [fetchEvents]);

  const today = startOfDay(new Date());

  const eventsToday = useMemo(() =>
    events.filter(event => isToday(new Date(event.date))),
    [events]
  );

  const eventsThisWeek = useMemo(() => {
    const start = startOfWeek(today);
    const end = endOfWeek(today);
    return events.filter(event => isWithinInterval(new Date(event.date), { start, end }));
  }, [events, today]);

  const pendingPayments = useMemo(() =>
    events.filter(event => event.paymentStatus === 'PENDING'),
    [events]
  );

  const monthlyStats = useMemo(() => {
    const currentMonth = getMonth(today);
    const monthlyEvents = events.filter(event => getMonth(new Date(event.date)) === currentMonth);

    const totalRevenue = monthlyEvents.reduce((acc, event) => acc + event.total, 0);
    const totalEvents = monthlyEvents.length;

    return { totalRevenue, totalEvents };
  }, [events, today]);

  const calendarEvents = useMemo(() =>
    events.map(event => new Date(event.date)),
  [events]);

  return {
    isLoading,
    error,
    eventsToday,
    eventsThisWeek,
    pendingPayments,
    monthlyStats,
    calendarEvents,
    confirmPayment,
  };
};
