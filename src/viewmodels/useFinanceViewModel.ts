// src/viewmodels/useFinanceViewModel.ts
import { useState, useEffect, useMemo, useCallback } from 'react';
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

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // Trigger backfill for events missing financial data
      await eventRepository.backfillFinancialData();

      const [allEvents, allExpenses, allPayments, allIncomes] = await Promise.all([
        eventRepository.getAll(),
        expenseRepository.getAll(),
        paymentRepository.getAll(),
        incomeRepository.getAll()
      ]);
      setEvents(allEvents);
      setExpenses(allExpenses.filter((e: any) => !e.isArchived));
      setPayments(allPayments);
      setIncomes(allIncomes);
    } catch (err) {
      console.error('Failed to load financial data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

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

    // Granular revenue from events in this period
    let boatRentalRevenue = 0;
    let productsRevenue = 0;
    const otherRevenue = filteredIncomes.reduce((acc, i) => acc + i.amount, 0);

    filteredEvents.forEach(event => {
        // If we have stored breakdown, use it, otherwise approximate
        if (event.rentalRevenue !== undefined && event.productsRevenue !== undefined) {
            boatRentalRevenue += event.rentalRevenue;
            productsRevenue += event.productsRevenue;
        } else {
            // Fallback calculation logic if not stored
            const boatCost = event.boat ? event.total * 0.7 : 0; // Rough estimate
            boatRentalRevenue += boatCost;
            productsRevenue += (event.total - boatCost);
        }
    });

    const totalRevenue = boatRentalRevenue + productsRevenue + otherRevenue;

    return {
      totalRevenue,
      totalExpenses,
      netProfit: totalRevenue - totalExpenses,
      boatRentalRevenue,
      productsRevenue,
      otherRevenue,
      eventCount: filteredEvents.length,
      expenseCount: filteredExpenses.length
    };
  }, [filteredData]);

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
    refresh: loadData
  };
};
