// src/viewmodels/dashboard/useDashboardState.ts
import { useState, useMemo, useCallback } from 'react';
import type { EventType, Payment } from '../../core/domain/types';
import { startOfDay, isWithinInterval, startOfWeek, endOfWeek, getMonth, isSameDay, format, startOfMonth, endOfMonth } from 'date-fns';

export const useDashboardState = () => {
  const [eventsForPeriod, setEventsForPeriod] = useState<EventType[]>([]);
  const [notificationEvents, setNotificationEvents] = useState<EventType[]>([]);
  const [allPayments, setAllPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date>(startOfDay(new Date()));

  // Period for filters: Current month
  const periodStart = useMemo(() => format(startOfMonth(selectedDate), 'yyyy-MM-dd'), [selectedDate]);
  const periodEnd = useMemo(() => format(endOfMonth(selectedDate), 'yyyy-MM-dd'), [selectedDate]);

  // Derived state calculations
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
    upcomingEvents.filter(event => isSameDay(new Date(event.date + 'T00:00'), selectedDate)),
    [upcomingEvents, selectedDate]
  );

  const eventsThisWeek = useMemo(() => {
    const start = startOfWeek(today);
    const end = endOfWeek(today);
    return upcomingEvents.filter(event => 
      isWithinInterval(new Date(event.date + 'T00:00'), { start, end })
    );
  }, [upcomingEvents, today]);

  const pendingPayments = useMemo(() =>
    upcomingEvents.filter(event => event.paymentStatus === 'PENDING'),
    [upcomingEvents]
  );

  const monthlyStats = useMemo(() => {
    const currentMonth = getMonth(today);
    const monthlyEvents = eventsForPeriod.filter(event =>
      getMonth(new Date(event.date + 'T00:00')) === currentMonth &&
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
    upcomingEvents.map(event => new Date(event.date + 'T00:00')),
    [upcomingEvents]
  );

  // State setters
  const setEventsData = useCallback((events: EventType[]) => {
    setEventsForPeriod(events);
    setIsLoading(false);
  }, []);

  const setNotificationsData = useCallback((events: EventType[]) => {
    setNotificationEvents(events);
  }, []);

  const setPaymentsData = useCallback((payments: Payment[]) => {
    setAllPayments(payments);
  }, []);

  const setLoading = useCallback((loading: boolean) => {
    setIsLoading(loading);
  }, []);

  return {
    // State
    eventsForPeriod,
    notificationEvents,
    allPayments,
    isLoading,
    selectedDate,
    periodStart,
    periodEnd,

    // Derived state
    upcomingEvents,
    eventsForSelectedDate,
    eventsThisWeek,
    pendingPayments,
    monthlyStats,
    calendarEvents,

    // Actions
    setSelectedDate,
    setEventsData,
    setNotificationsData,
    setPaymentsData,
    setLoading,
  };
};
