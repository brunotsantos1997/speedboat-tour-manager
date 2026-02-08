// src/viewmodels/useCashBookViewModel.ts
import { useState, useEffect, useMemo, useCallback } from 'react';
import type { EventType, Expense, Payment, Income, Boat } from '../core/domain/types';
import { eventRepository } from '../core/repositories/EventRepository';
import { expenseRepository } from '../core/repositories/ExpenseRepository';
import { incomeRepository } from '../core/repositories/IncomeRepository';
import { paymentRepository } from '../core/repositories/PaymentRepository';
import { boatRepository } from '../core/repositories/BoatRepository';
import { timeToMinutes } from '../core/utils/timeUtils';
import { startOfMonth, endOfMonth, format } from 'date-fns';

export type CashBookEntry = {
    id: string;
    date: string;
    amount: number;
    description: string;
    type: 'INCOME' | 'EXPENSE' | 'PAYMENT';
    subType?: 'BOAT' | 'PRODUCT' | 'TAX' | 'GENERIC';
    timestamp: number;
    boatId?: string;
    clientId?: string;
    clientName?: string;
    eventId?: string;
};

export const useCashBookViewModel = () => {
    const [events, setEvents] = useState<EventType[]>([]);
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [payments, setPayments] = useState<Payment[]>([]);
    const [incomes, setIncomes] = useState<Income[]>([]);
    const [boats, setBoats] = useState<Boat[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDeleting, setIsDeleting] = useState(false);

    // Filter States
    const [startDate, setStartDate] = useState<Date>(startOfMonth(new Date()));
    const [endDate, setEndDate] = useState<Date>(endOfMonth(new Date()));
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState<'ALL' | 'ENTRANCE' | 'EXIT'>('ALL');
    const [filterBoatId, setFilterBoatId] = useState<string>('ALL');
    const [filterCategory, setFilterCategory] = useState<string>('ALL');

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const [allEvents, allExpenses, allPayments, allIncomes, allBoats] = await Promise.all([
                eventRepository.getAll(),
                expenseRepository.getAll(),
                paymentRepository.getAll(),
                incomeRepository.getAll(),
                boatRepository.getAll()
            ]);
            setEvents(allEvents);
            setExpenses(allExpenses.filter((e: any) => !e.isArchived));
            setPayments(allPayments);
            setIncomes(allIncomes);
            setBoats(allBoats);
        } catch (err) {
            console.error('Failed to load cash book data:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const cashBook = useMemo(() => {
        const entries: CashBookEntry[] = [
            ...incomes.map(i => ({
                id: i.id,
                date: i.date,
                amount: i.amount,
                description: i.description,
                type: 'INCOME' as const,
                subType: 'GENERIC' as const,
                timestamp: i.timestamp
            })),
            ...expenses.map(e => ({
                id: e.id,
                date: e.date,
                amount: e.amount,
                description: e.description,
                type: 'EXPENSE' as const,
                subType: 'GENERIC' as const,
                timestamp: e.timestamp,
                boatId: e.boatId
            })),
            ...payments.flatMap(p => {
                const event = events.find(ev => ev.id === p.eventId);
                if (!event) {
                    return [{
                        id: p.id,
                        date: p.date,
                        amount: p.amount,
                        description: `Pagamento de Evento`,
                        type: 'PAYMENT' as const,
                        timestamp: p.timestamp,
                        eventId: p.eventId
                    }];
                }

                const ratio = p.amount / event.total;
                const pEntries: CashBookEntry[] = [];
                const paymentRatioPct = (ratio * 100).toLocaleString('pt-BR', { maximumFractionDigits: 1 }) + '%';

                // Boat Rental
                const boatNet = event.rentalRevenue || 0;
                const boatAmount = boatNet * ratio;
                if (boatAmount > 0) {
                    pEntries.push({
                        id: `${p.id}-boat`,
                        date: p.date,
                        amount: boatAmount,
                        description: `Passeio (${event.boat.name}) [${paymentRatioPct}]: ${event.client.name}`,
                        type: 'PAYMENT' as const,
                        subType: 'BOAT' as const,
                        timestamp: p.timestamp,
                        boatId: event.boat.id,
                        eventId: p.eventId,
                        clientId: event.client.id,
                        clientName: event.client.name
                    });
                }

                // Products
                event.products.forEach((prod, idx) => {
                    if (prod.isCourtesy) return;
                    let prodGross = prod.pricingType === 'PER_PERSON' ? (prod.price || 0) * event.passengerCount : (prod.price || 0);
                    if (prod.pricingType === 'HOURLY' && prod.startTime && prod.endTime && prod.hourlyPrice) {
                        prodGross = ((timeToMinutes(prod.endTime) - timeToMinutes(prod.startTime)) / 60) * prod.hourlyPrice;
                    }

                    let prodNet = prodGross;
                    if (prod.discount) {
                        if (prod.discount.type === 'FIXED') prodNet -= prod.discount.value;
                        else prodNet -= (prodGross * (prod.discount.value / 100));
                    }

                    const prodAmount = prodNet * ratio;
                    if (prodAmount > 0) {
                        pEntries.push({
                            id: `${p.id}-prod-${prod.id}-${idx}`,
                            date: p.date,
                            amount: prodAmount,
                            description: `Produto (${prod.name}) [${paymentRatioPct}]: ${event.client.name}`,
                            type: 'PAYMENT' as const,
                            subType: 'PRODUCT' as const,
                            timestamp: p.timestamp,
                            boatId: event.boat.id,
                            eventId: p.eventId,
                            clientId: event.client.id,
                            clientName: event.client.name
                        });
                    }
                });

                // Taxes
                const taxNet = event.tax || 0;
                const taxAmount = taxNet * ratio;
                if (taxAmount > 0) {
                    pEntries.push({
                        id: `${p.id}-tax`,
                        date: p.date,
                        amount: taxAmount,
                        description: `Taxa (${event.taxDescription || 'Adicional'}) [${paymentRatioPct}]: ${event.client.name}`,
                        type: 'PAYMENT' as const,
                        subType: 'TAX' as const,
                        timestamp: p.timestamp,
                        boatId: event.boat.id,
                        eventId: p.eventId,
                        clientId: event.client.id,
                        clientName: event.client.name
                    });
                }

                return pEntries;
            })
        ];

        // Apply Filters
        const startStr = format(startDate, 'yyyy-MM-dd');
        const endStr = format(endDate, 'yyyy-MM-dd');

        return entries.filter(entry => {
            const dateMatch = entry.date >= startStr && entry.date <= endStr;
            const typeMatch = filterType === 'ALL' || (filterType === 'ENTRANCE' && (entry.type === 'INCOME' || entry.type === 'PAYMENT')) || (filterType === 'EXIT' && entry.type === 'EXPENSE');
            const boatMatch = filterBoatId === 'ALL' || entry.boatId === filterBoatId;
            const categoryMatch = filterCategory === 'ALL' ||
                (filterCategory === 'BOAT' && entry.subType === 'BOAT') ||
                (filterCategory === 'PRODUCT' && entry.subType === 'PRODUCT') ||
                (filterCategory === 'TAX' && entry.subType === 'TAX') ||
                (filterCategory === 'INCOME' && entry.type === 'INCOME') ||
                (filterCategory === 'EXPENSE' && entry.type === 'EXPENSE');

            const searchLower = searchTerm.toLowerCase();
            const searchMatch = !searchTerm ||
                entry.description.toLowerCase().includes(searchLower) ||
                (entry.clientName && entry.clientName.toLowerCase().includes(searchLower));

            return dateMatch && typeMatch && boatMatch && categoryMatch && searchMatch;
        }).sort((a, b) => {
            if (b.date !== a.date) return b.date.localeCompare(a.date);
            return b.timestamp - a.timestamp;
        });
    }, [events, expenses, payments, incomes, startDate, endDate, searchTerm, filterType, filterBoatId, filterCategory]);

    const deleteEntry = async (id: string, type: 'INCOME' | 'EXPENSE' | 'PAYMENT') => {
        if (!window.confirm('Tem certeza que deseja excluir este registro financeiro?')) return;
        setIsDeleting(true);
        try {
            if (type === 'INCOME') {
                await incomeRepository.remove(id);
            } else if (type === 'EXPENSE') {
                await expenseRepository.remove(id);
            } else if (type === 'PAYMENT') {
                const originalId = id.split('-')[0];
                const payment = payments.find(p => p.id === originalId);
                if (payment) {
                    await paymentRepository.remove(originalId);
                    const event = await eventRepository.getById(payment.eventId);
                    if (event) {
                        const remainingPayments = await paymentRepository.getByEventId(event.id);
                        const totalPaid = remainingPayments.reduce((acc, p) => acc + p.amount, 0);
                        const reservationFee = event.total * 0.3;
                        let updatedEvent = { ...event };
                        if (totalPaid < event.total) updatedEvent.paymentStatus = 'PENDING';
                        if (totalPaid < reservationFee && updatedEvent.status === 'SCHEDULED') {
                            updatedEvent.status = 'PRE_SCHEDULED';
                            updatedEvent.preScheduledAt = Date.now();
                        }
                        await eventRepository.updateEvent(updatedEvent);
                    }
                }
            }
            await loadData();
        } catch (err) {
            console.error('Failed to delete entry:', err);
            alert('Erro ao excluir registro.');
        } finally {
            setIsDeleting(false);
        }
    };

    return {
        loading,
        isDeleting,
        boats,
        startDate,
        setStartDate,
        endDate,
        setEndDate,
        searchTerm,
        setSearchTerm,
        filterType,
        setFilterType,
        filterBoatId,
        setFilterBoatId,
        filterCategory,
        setFilterCategory,
        cashBook,
        deleteEntry,
        refresh: loadData
    };
};
