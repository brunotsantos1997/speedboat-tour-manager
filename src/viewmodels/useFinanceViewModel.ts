// src/viewmodels/useFinanceViewModel.ts
import { useState, useEffect, useMemo, useCallback } from 'react';
import type { EventType, Expense, Payment } from '../core/domain/types';
import { eventRepository } from '../core/repositories/EventRepository';
import { expenseRepository } from '../core/repositories/ExpenseRepository';
import { paymentRepository } from '../core/repositories/PaymentRepository';
import { startOfMonth, endOfMonth, format, subMonths } from 'date-fns';

export const useFinanceViewModel = () => {
  const [events, setEvents] = useState<EventType[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState<Date>(startOfMonth(new Date()));
  const [endDate, setEndDate] = useState<Date>(endOfMonth(new Date()));

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [allEvents, allExpenses, allPayments] = await Promise.all([
        eventRepository.getAll(),
        expenseRepository.getAll(),
        paymentRepository.getAll()
      ]);
      setEvents(allEvents);
      setExpenses(allExpenses.filter((e: any) => !e.isArchived));
      setPayments(allPayments);
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

    const filteredEvents = events.filter(e => e.date >= startStr && e.date <= endStr && e.status !== 'CANCELLED' && e.status !== 'ARCHIVED_CANCELLED');
    const filteredExpenses = expenses.filter(e => e.date >= startStr && e.date <= endStr && e.status === 'PAID');
    const filteredPayments = payments.filter(p => p.date >= startStr && p.date <= endStr);

    return { filteredEvents, filteredExpenses, filteredPayments };
  }, [events, expenses, payments, startDate, endDate]);

  const stats = useMemo(() => {
    const { filteredEvents, filteredExpenses, filteredPayments } = filteredData;

    const totalRevenue = filteredPayments.reduce((acc, p) => acc + p.amount, 0);
    const totalExpenses = filteredExpenses.reduce((acc, e) => acc + e.amount, 0);

    // Granular revenue from events in this period
    let boatRentalRevenue = 0;
    let productsRevenue = 0;

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

    return {
      totalRevenue,
      totalExpenses,
      netProfit: totalRevenue - totalExpenses,
      boatRentalRevenue,
      productsRevenue,
      eventCount: filteredEvents.length,
      expenseCount: filteredExpenses.length
    };
  }, [filteredData]);

  const cashFlowData = useMemo(() => {
    // Generate last 6 months of data
    const data = [];
    for (let i = 5; i >= 0; i--) {
      const monthDate = subMonths(new Date(), i);
      const mStart = format(startOfMonth(monthDate), 'yyyy-MM-dd');
      const mEnd = format(endOfMonth(monthDate), 'yyyy-MM-dd');

      const monthPayments = payments.filter(p => p.date >= mStart && p.date <= mEnd);
      const monthExpenses = expenses.filter(e => e.date >= mStart && e.date <= mEnd && e.status === 'PAID');

      data.push({
        month: format(monthDate, 'MMM', { locale: undefined }), // Simplified for now
        revenue: monthPayments.reduce((acc, p) => acc + p.amount, 0),
        expenses: monthExpenses.reduce((acc, e) => acc + e.amount, 0),
      });
    }
    return data;
  }, [payments, expenses]);

  return {
    loading,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    stats,
    cashFlowData,
    refresh: loadData
  };
};
