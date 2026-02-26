// src/viewmodels/useExpenseViewModel.ts
import { useState, useEffect } from 'react';
import type { Expense, ExpenseCategory, Boat } from '../core/domain/types';
import { expenseRepository } from '../core/repositories/ExpenseRepository';
import { expenseCategoryRepository } from '../core/repositories/ExpenseCategoryRepository';
import { boatRepository } from '../core/repositories/BoatRepository';
import { useToastContext } from '../ui/contexts/ToastContext';
import { useModalContext } from '../ui/contexts/ModalContext';

export const useExpenseViewModel = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [boats, setBoats] = useState<Boat[]>([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToastContext();
  const { confirm } = useModalContext();

  useEffect(() => {
    setLoading(true);
    Promise.all([
      expenseRepository.getAll(),
      expenseCategoryRepository.getAll(),
      boatRepository.getAll()
    ]).finally(() => setLoading(false));

    const unsubExpenses = expenseRepository.subscribe((data) => setExpenses(data.filter((e: any) => !e.isArchived)));
    const unsubCategories = expenseCategoryRepository.subscribe(setCategories);
    const unsubBoats = boatRepository.subscribe(setBoats);

    return () => {
      unsubExpenses();
      unsubCategories();
      unsubBoats();
    };
  }, []);

  const addExpense = async (expenseData: Omit<Expense, 'id' | 'timestamp'>) => {
    try {
      const category = categories.find(c => c.id === expenseData.categoryId);
      const boat = boats.find(b => b.id === expenseData.boatId);

      const newExpense = await expenseRepository.add({
        ...expenseData,
        categoryName: category?.name,
        boatName: boat?.name,
        timestamp: Date.now()
      });
      showToast('Despesa cadastrada com sucesso!');
      return newExpense;
    } catch (err: any) {
      showToast('Erro ao cadastrar despesa: ' + err.message);
      throw err;
    }
  };

  const updateExpense = async (expense: Expense) => {
    try {
      const category = categories.find(c => c.id === expense.categoryId);
      const boat = boats.find(b => b.id === expense.boatId);

      const updatedExpense = await expenseRepository.update({
        ...expense,
        categoryName: category?.name,
        boatName: boat?.name
      });
      showToast('Despesa atualizada com sucesso!');
      return updatedExpense;
    } catch (err: any) {
      showToast('Erro ao atualizar despesa: ' + err.message);
      throw err;
    }
  };

  const removeExpense = async (expenseId: string) => {
    if (!await confirm('Confirmar Exclusão', 'Tem certeza que deseja excluir esta despesa?')) return;
    try {
      await expenseRepository.remove(expenseId);
      showToast('Despesa excluída com sucesso!');
    } catch (err: any) {
      showToast('Erro ao excluir despesa: ' + err.message);
    }
  };

  const addCategory = async (name: string) => {
    try {
      const newCategory = await expenseCategoryRepository.add({ name });
      showToast('Categoria criada com sucesso!');
      return newCategory;
    } catch (err: any) {
      showToast('Erro ao criar categoria: ' + err.message);
    }
  };

  const updateCategory = async (category: ExpenseCategory) => {
    try {
      await expenseCategoryRepository.update(category);
      showToast('Categoria atualizada com sucesso!');
    } catch (err: any) {
      showToast('Erro ao atualizar categoria: ' + err.message);
    }
  };

  const removeCategory = async (categoryId: string) => {
    if (!await confirm('Confirmar Exclusão', 'Tem certeza que deseja excluir esta categoria?')) return;
    try {
      await expenseCategoryRepository.remove(categoryId);
      showToast('Categoria excluída com sucesso!');
    } catch (err: any) {
      showToast('Erro ao excluir categoria: ' + err.message);
    }
  };

  return {
    expenses,
    categories,
    boats,
    loading,
    addExpense,
    updateExpense,
    removeExpense,
    addCategory,
    updateCategory,
    removeCategory,
    refresh: () => {}
  };
};
