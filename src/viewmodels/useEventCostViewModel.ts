// src/viewmodels/useEventCostViewModel.ts
import { useState, useCallback } from 'react';
import type { EventType, SelectedProduct, EventCostItem } from '../core/domain/types';
import { eventRepository } from '../core/repositories/EventRepository';
import { expenseRepository } from '../core/repositories/ExpenseRepository';
import { expenseCategoryRepository } from '../core/repositories/ExpenseCategoryRepository';
import { v4 as uuidv4 } from 'uuid';

export const useEventCostViewModel = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [event, setEvent] = useState<EventType | null>(null);
  const [rentalCost, setRentalCost] = useState(0);
  const [products, setProducts] = useState<SelectedProduct[]>([]);
  const [additionalCosts, setAdditionalCosts] = useState<EventCostItem[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const openModal = useCallback((targetEvent: EventType) => {
    setEvent(targetEvent);
    setRentalCost(targetEvent.rentalCost || 0);
    setProducts(targetEvent.products || []);
    setAdditionalCosts(targetEvent.additionalCosts || []);
    setIsModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    setEvent(null);
  }, []);

  const updateProductCost = useCallback((productId: string, cost: number) => {
    setProducts(prev => prev.map(p => p.id === productId ? { ...p, snapshotCost: cost } : p));
  }, []);

  const addAdditionalCost = useCallback(() => {
    setAdditionalCosts(prev => [
      ...prev,
      { id: uuidv4(), name: '', amount: 0, category: 'OTHER' }
    ]);
  }, []);

  const updateAdditionalCost = useCallback((id: string, updates: Partial<EventCostItem>) => {
    setAdditionalCosts(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item));
  }, []);

  const removeAdditionalCost = useCallback((id: string) => {
    setAdditionalCosts(prev => prev.filter(item => item.id !== id));
  }, []);

  const saveCosts = useCallback(async () => {
    if (!event) return;
    setIsSaving(true);
    try {
      const calculatedProductsCost = products.reduce((acc, p) => acc + (p.snapshotCost || 0), 0);
      const totalAdditionalCost = additionalCosts.reduce((acc, item) => acc + item.amount, 0);

      const updatedEvent: EventType = {
        ...event,
        rentalCost,
        products,
        productsCost: calculatedProductsCost,
        additionalCosts,
        taxCost: totalAdditionalCost
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

      // Additional Costs Expenses
      for (const item of additionalCosts) {
        if (item.amount > 0) {
          await expenseRepository.add({
            ...commonData,
            amount: item.amount,
            description: `${item.name || 'Custo Adicional'} - Passeio ${event.client.name}`
          });
        }
      }

      closeModal();
    } catch (error) {
      console.error('Failed to save costs:', error);
      throw error;
    } finally {
      setIsSaving(false);
    }
  }, [event, rentalCost, products, additionalCosts, closeModal]);

  return {
    isModalOpen,
    event,
    rentalCost,
    products,
    additionalCosts,
    isSaving,
    setRentalCost,
    addAdditionalCost,
    updateAdditionalCost,
    removeAdditionalCost,
    updateProductCost,
    openModal,
    closeModal,
    saveCosts
  };
};
