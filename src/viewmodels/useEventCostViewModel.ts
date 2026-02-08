// src/viewmodels/useEventCostViewModel.ts
import { useState, useCallback } from 'react';
import type { EventType, SelectedProduct } from '../core/domain/types';
import { eventRepository } from '../core/repositories/EventRepository';
import { expenseRepository } from '../core/repositories/ExpenseRepository';
import { expenseCategoryRepository } from '../core/repositories/ExpenseCategoryRepository';

export const useEventCostViewModel = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [event, setEvent] = useState<EventType | null>(null);
  const [rentalCost, setRentalCost] = useState(0);
  const [products, setProducts] = useState<SelectedProduct[]>([]);
  const [taxCost, setTaxCost] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  const openModal = useCallback((targetEvent: EventType) => {
    setEvent(targetEvent);
    setRentalCost(targetEvent.rentalCost || 0);
    setProducts(targetEvent.products || []);
    setTaxCost(targetEvent.taxCost || 0);
    setIsModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    setEvent(null);
  }, []);

  const updateProductCost = useCallback((productId: string, cost: number) => {
    setProducts(prev => prev.map(p => p.id === productId ? { ...p, snapshotCost: cost } : p));
  }, []);

  const saveCosts = useCallback(async () => {
    if (!event) return;
    setIsSaving(true);
    try {
      const calculatedProductsCost = products.reduce((acc, p) => acc + (p.snapshotCost || 0), 0);

      const updatedEvent: EventType = {
        ...event,
        rentalCost,
        products,
        productsCost: calculatedProductsCost,
        taxCost
      };

      await eventRepository.updateEvent(updatedEvent);

      // Manage Expenses in Livro Caixa
      // 1. Find and archive existing expenses for this event
      const allExpenses = await expenseRepository.getAll();
      const existingExpenses = allExpenses.filter(e => e.eventId === event.id && !e.isArchived);
      for (const exp of existingExpenses) {
        await expenseRepository.remove(exp.id);
      }

      // 2. Create new expenses
      const categories = await expenseCategoryRepository.getAll();
      let category = categories.find(c => c.name === 'Custos de Passeio');
      if (!category) {
        category = await expenseCategoryRepository.add({ name: 'Custos de Passeio', isArchived: false });
      }

      const commonData = {
        date: event.date,
        categoryId: category.id,
        categoryName: category.name,
        status: 'PAID' as const,
        paymentMethod: 'OTHER' as const,
        timestamp: Date.now(),
        eventId: event.id,
        boatId: event.boat.id,
        boatName: event.boat.name
      };

      // Rental Expense
      if (rentalCost > 0) {
        await expenseRepository.add({
          ...commonData,
          amount: rentalCost,
          description: `Custo Lancha: ${event.boat.name} - Passeio ${event.client.name}`
        });
      }

      // Products Expenses
      for (const p of products) {
        if ((p.snapshotCost || 0) > 0) {
          await expenseRepository.add({
            ...commonData,
            amount: p.snapshotCost || 0,
            description: `Custo Produto: ${p.name} - Passeio ${event.client.name}`
          });
        }
      }

      // Tax Expense
      if (taxCost > 0) {
        await expenseRepository.add({
          ...commonData,
          amount: taxCost,
          description: `Custo Taxa/Adicional - Passeio ${event.client.name}`
        });
      }

      closeModal();
    } catch (error) {
      console.error('Failed to save costs:', error);
      throw error;
    } finally {
      setIsSaving(false);
    }
  }, [event, rentalCost, products, taxCost, closeModal]);

  return {
    isModalOpen,
    event,
    rentalCost,
    products,
    taxCost,
    isSaving,
    setRentalCost,
    setTaxCost,
    updateProductCost,
    openModal,
    closeModal,
    saveCosts
  };
};
