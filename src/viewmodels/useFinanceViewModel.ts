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
    const { filteredEvents, filteredExpenses, filteredIncomes, filteredPayments } = filteredData;

    const totalExpenses = filteredExpenses.reduce((acc, e) => acc + e.amount, 0);

    // Realized revenue (Cash Flow: payments and incomes actually received in the period)
    let boatRentalRevenue = 0;
    let productsRevenue = 0;
    let totalPaymentsAmount = 0;
    const otherRevenue = filteredIncomes.reduce((acc, i) => acc + i.amount, 0);

    filteredPayments.forEach(p => {
        totalPaymentsAmount += p.amount;
        const event = events.find(ev => ev.id === p.eventId);
        if (event && event.total > 0) {
            const ratio = p.amount / event.total;
            boatRentalRevenue += (event.rentalRevenue || 0) * ratio;
            productsRevenue += (event.productsRevenue || 0) * ratio;
        } else {
            // If no event found, attribute to boat rental as fallback or keep as is
            boatRentalRevenue += p.amount;
        }
    });

    const totalRealizedRevenue = totalPaymentsAmount + otherRevenue;

    // Projected revenue (Accrual: total value of events scheduled for the period)
    const totalEventsValue = filteredEvents.reduce((acc, e) => acc + (e.total || 0), 0);
    const projectedRevenue = totalEventsValue + otherRevenue;

    return {
      totalRevenue: totalRealizedRevenue,
      projectedRevenue,
      averageProjectedValue: filteredEvents.length > 0 ? totalEventsValue / filteredEvents.length : 0,
      totalExpenses,
      netProfit: totalRealizedRevenue - totalExpenses,
      boatRentalRevenue,
      productsRevenue,
      otherRevenue,
      eventCount: filteredEvents.length,
      expenseCount: filteredExpenses.length
    };
  }, [filteredData, events]);

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
      const monthPayments = payments.filter(p => p.date >= mStart && p.date <= mEnd);

      const projectedRevenue = monthEvents.reduce((acc, e) => acc + (e.total || 0), 0) + monthIncomes.reduce((acc, i) => acc + i.amount, 0);
      const realizedRevenue = monthPayments.reduce((acc, p) => acc + p.amount, 0) + monthIncomes.reduce((acc, i) => acc + i.amount, 0);

      data.push({
        month: format(monthDate, 'MMM', { locale: ptBR }),
        projected: projectedRevenue,
        realized: realizedRevenue,
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
      const dayPayments = payments.filter(p => p.date === dStr);

      const projected = dayEvents.reduce((acc, e) => acc + (e.total || 0), 0) + dayIncomes.reduce((acc, i) => acc + i.amount, 0);
      const realized = dayPayments.reduce((acc, p) => acc + p.amount, 0) + dayIncomes.reduce((acc, i) => acc + i.amount, 0);
      const exp = dayExpenses.reduce((acc, e) => acc + e.amount, 0);

      return {
        day: format(date, 'dd/MM'),
        projected,
        realized,
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
