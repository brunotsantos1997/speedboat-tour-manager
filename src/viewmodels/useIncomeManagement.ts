// src/viewmodels/useIncomeManagement.ts
import { useState, useCallback } from 'react';
import { incomeRepository } from '../core/repositories/IncomeRepository';
import { useToast } from '../ui/contexts/toast/useToast';

export const useIncomeManagement = () => {
  const { showToast } = useToast();
  const [isIncomeModalOpen, setIsIncomeModalOpen] = useState(false);
  const [incomeAmount, setIncomeAmount] = useState(0);
  const [incomeDesc, setIncomeDesc] = useState('');
  const [incomeDate, setIncomeDate] = useState(new Date().toISOString().split('T')[0]);

  const openIncomeModal = useCallback(() => {
    setIsIncomeModalOpen(true);
    setIncomeAmount(0);
    setIncomeDesc('');
    setIncomeDate(new Date().toISOString().split('T')[0]);
  }, []);

  const closeIncomeModal = useCallback(() => {
    setIsIncomeModalOpen(false);
    setIncomeAmount(0);
    setIncomeDesc('');
  }, []);

  const handleAddIncome = useCallback(async (onSuccess?: () => void) => {
    if (!incomeDesc || incomeAmount <= 0) {
      showToast('Por favor, preencha descrição e valor.', 'error');
      return;
    }

    try {
      await incomeRepository.add({
        description: incomeDesc,
        amount: incomeAmount,
        date: incomeDate,
        paymentMethod: 'PIX',
        timestamp: Date.now()
      });
      
      showToast('Receita avulsa registrada com sucesso!');
      closeIncomeModal();
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Failed to add income:', error);
      showToast('Erro ao salvar receita.', 'error');
    }
  }, [incomeDesc, incomeAmount, incomeDate, showToast, closeIncomeModal]);

  return {
    // State
    isIncomeModalOpen,
    incomeAmount,
    incomeDesc,
    incomeDate,

    // Actions
    openIncomeModal,
    closeIncomeModal,
    handleAddIncome,

    // Setters
    setIncomeAmount,
    setIncomeDesc,
    setIncomeDate,
  };
};
