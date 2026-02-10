// src/viewmodels/useFinanceViewModel.ts
import { useState, useEffect, useMemo } from 'react';
import type { EventType, Expense, Payment, Income } from '../core/domain/types';
import { eventRepository } from '../core/repositories/EventRepository';
import { expenseRepository } from '../core/repositories/ExpenseRepository';
import { incomeRepository } from '../core/repositories/IncomeRepository';
import { paymentRepository } from '../core/repositories/PaymentRepository';
import { startOfMonth, endOfMonth, format, subMonths, eachDayOfInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const useFinanceViewModel = () => {
  const [events, setEvents] = useState<EventType[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState<Date>(startOfMonth(new Date()));
  const [endDate, setEndDate] = useState<Date>(endOfMonth(new Date()));

  useEffect(() => {
    setLoading(true);
    // Trigger backfill for events missing financial data
    eventRepository.backfillFinancialData().finally(() => {
      // Also ensure initial load from repositories
      Promise.all([
        eventRepository.getAll(),
        expenseRepository.getAll(),
        paymentRepository.getAll(),
        incomeRepository.getAll()
      ]).finally(() => setLoading(false));
    });

    const unsubEvents = eventRepository.subscribe(setEvents);
    const unsubExpenses = expenseRepository.subscribe((data) => setExpenses(data.filter(e => !e.isArchived)));
    const unsubPayments = paymentRepository.subscribe(setPayments);
    const unsubIncomes = incomeRepository.subscribe(setIncomes);

    return () => {
      unsubEvents();
      unsubExpenses();
      unsubPayments();
      unsubIncomes();
    };
  }, []);

  const filteredData = useMemo(() => {
    const startStr = format(startDate, 'yyyy-MM-dd');
    const endStr = format(endDate, 'yyyy-MM-dd');

    const confirmedStatuses = ['SCHEDULED', 'COMPLETED', 'ARCHIVED_COMPLETED'];
    const filteredEvents = events.filter(e => e.date >= startStr && e.date <= endStr && confirmedStatuses.includes(e.status));
    const filteredExpenses = expenses.filter(e => e.date >= startStr && e.date <= endStr && e.status === 'PAID');
    const filteredPayments = payments.filter(p => p.date >= startStr && p.date <= endStr);
    const filteredIncomes = incomes.filter(i => i.date >= startStr && i.date <= endStr);

    return { filteredEvents, filteredExpenses, filteredPayments, filteredIncomes };
  }, [events, expenses, payments, incomes, startDate, endDate]);

  const stats = useMemo(() => {
    const { filteredEvents, filteredExpenses, filteredIncomes } = filteredData;

    const totalExpenses = filteredExpenses.reduce((acc, e) => acc + e.amount, 0);

    // Calculate Realized vs Pending for events in the period
    let realizedFromEvents = 0;
    let pendingFromEvents = 0;
    let boatRentalRealized = 0;
    let productsRealized = 0;
    let totalEventsValue = 0;

    filteredEvents.forEach(event => {
        totalEventsValue += event.total;
        // We need ALL payments for this event to know how much is realized
        const eventPayments = payments.filter(p => p.eventId === event.id);
        const totalPaidForEvent = eventPayments.reduce((acc, p) => acc + p.amount, 0);

        const realized = Math.min(event.total, totalPaidForEvent);
        const pending = Math.max(0, event.total - totalPaidForEvent);

        realizedFromEvents += realized;
        pendingFromEvents += pending;

        if (event.total > 0) {
            const ratio = realized / event.total;
            boatRentalRealized += (event.rentalRevenue || 0) * ratio;
            productsRealized += (event.productsRevenue || 0) * ratio;
        }
    });

    const otherRevenue = filteredIncomes.reduce((acc, i) => acc + i.amount, 0);
    const totalRealizedRevenue = realizedFromEvents + otherRevenue;

    return {
      totalRevenue: totalRealizedRevenue,
      projectedRevenue: pendingFromEvents,
      averageProjectedValue: filteredEvents.length > 0 ? totalEventsValue / filteredEvents.length : 0,
      totalExpenses,
      netProfit: totalRealizedRevenue - totalExpenses,
      boatRentalRevenue: boatRentalRealized,
      productsRevenue: productsRealized,
      otherRevenue,
      eventCount: filteredEvents.length,
      expenseCount: filteredExpenses.length
    };
  }, [filteredData, payments]);

  const cashFlowData = useMemo(() => {
    // Generate last 6 months of data
    const data = [];
    const projectedStatuses = ['SCHEDULED', 'COMPLETED', 'ARCHIVED_COMPLETED', 'PRE_SCHEDULED'];

    for (let i = 5; i >= 0; i--) {
      const monthDate = subMonths(new Date(), i);
      const mStart = format(startOfMonth(monthDate), 'yyyy-MM-dd');
      const mEnd = format(endOfMonth(monthDate), 'yyyy-MM-dd');

      const monthEvents = events.filter(e => e.date >= mStart && e.date <= mEnd && projectedStatuses.includes(e.status));
      const monthExpenses = expenses.filter(e => e.date >= mStart && e.date <= mEnd && e.status === 'PAID');
      const monthIncomes = incomes.filter(i => i.date >= mStart && i.date <= mEnd);

      let realized = monthIncomes.reduce((acc, i) => acc + i.amount, 0);
      let pending = 0;

      monthEvents.forEach(e => {
          const ePayments = payments.filter(p => p.eventId === e.id);
          const ePaid = ePayments.reduce((acc, p) => acc + p.amount, 0);
          realized += Math.min(e.total, ePaid);
          pending += Math.max(0, e.total - ePaid);
      });

      data.push({
        month: format(monthDate, 'MMM', { locale: ptBR }),
        projected: pending,
        realized: realized,
        expenses: monthExpenses.reduce((acc, e) => acc + e.amount, 0),
      });
    }
    return data;
  }, [events, expenses, incomes, payments]);

  const dailyCashFlow = useMemo(() => {
    const days = eachDayOfInterval({ start: startDate, end: endDate });
    const projectedStatuses = ['SCHEDULED', 'COMPLETED', 'ARCHIVED_COMPLETED', 'PRE_SCHEDULED'];

    // Limit to 31 days to avoid messy charts
    const displayDays = days.slice(-31);

    return displayDays.map(date => {
      const dStr = format(date, 'yyyy-MM-dd');

      const dayEvents = events.filter(e => e.date === dStr && projectedStatuses.includes(e.status));
      const dayIncomes = incomes.filter(i => i.date === dStr);
      const dayExpenses = expenses.filter(e => e.date === dStr && e.status === 'PAID');

      let dayRealized = dayIncomes.reduce((acc, i) => acc + i.amount, 0);
      let dayPending = 0;

      dayEvents.forEach(e => {
          const ePayments = payments.filter(p => p.eventId === e.id);
          const ePaid = ePayments.reduce((acc, p) => acc + p.amount, 0);
          dayRealized += Math.min(e.total, ePaid);
          dayPending += Math.max(0, e.total - ePaid);
      });

      const exp = dayExpenses.reduce((acc, e) => acc + e.amount, 0);

      return {
        day: format(date, 'dd/MM'),
        projected: dayPending,
        realized: dayRealized,
        expenses: exp,
      };
    });
  }, [events, expenses, incomes, payments, startDate, endDate]);

  return {
    loading,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    stats,
    cashFlowData,
    dailyCashFlow,
    refresh: () => {}
  };
};
