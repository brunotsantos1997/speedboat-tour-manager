// src/viewmodels/useCreateEventViewModel.ts
import { useState, useMemo, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import {
  Combo,
  Discount,
  SelectedCombo,
  ClientProfile,
  LoyaltyRule,
} from '../core/domain/types';
import {
  AVAILABLE_COMBOS,
  MOCK_CLIENTS,
  LOYALTY_RULES,
} from '../core/data/mocks';

export const useCreateEventViewModel = () => {
  // State Management
  const [selectedCombos, setSelectedCombos] = useState<SelectedCombo[]>([]);
  const [discount, setDiscount] = useState<Discount>({ type: 'FIXED', value: 0 });
  const [clientPhone, setClientPhone] = useState('');
  const [loyaltySuggestion, setLoyaltySuggestion] = useState<string | null>(null);

  // Business Logic: Handlers
  const toggleCombo = useCallback((combo: Combo) => {
    setSelectedCombos((prev) => {
      const isSelected = prev.some((c) => c.id === combo.id);
      if (isSelected) {
        return prev.filter((c) => c.id !== combo.id);
      } else {
        return [...prev, { ...combo, isCourtesy: false }];
      }
    });
  }, []);

  const toggleCourtesy = useCallback((comboId: string) => {
    setSelectedCombos((prev) =>
      prev.map((c) =>
        c.id === comboId ? { ...c, isCourtesy: !c.isCourtesy } : c
      )
    );
  }, []);

  const updateDiscountType = useCallback((type: 'FIXED' | 'PERCENTAGE') => {
    setDiscount((prev) => ({ ...prev, type }));
  }, []);

  const updateDiscountValue = useCallback((value: number) => {
    const sanitizedValue = isNaN(value) || value < 0 ? 0 : value;
    setDiscount((prev) => ({ ...prev, value: sanitizedValue }));
  }, []);

  const updateClientPhone = useCallback((phone: string) => {
    setClientPhone(phone);
  }, []);

  // Derived State: Calculations
  const subtotal = useMemo(() => {
    return selectedCombos.reduce(
      (acc, combo) => (combo.isCourtesy ? acc : acc + combo.price),
      0
    );
  }, [selectedCombos]);

  const totalDiscount = useMemo(() => {
    if (discount.type === 'FIXED') {
      return discount.value;
    }
    if (discount.type === 'PERCENTAGE') {
      return subtotal * (discount.value / 100);
    }
    return 0;
  }, [subtotal, discount]);

  const total = useMemo(() => {
    const finalTotal = subtotal - totalDiscount;
    return Math.max(0, finalTotal);
  }, [subtotal, totalDiscount]);

  // Side Effects: Loyalty Checks
  useEffect(() => {
    const client = MOCK_CLIENTS.find((c) => c.phone === clientPhone);
    let suggestion: string | null = null;

    // Rule 1: Recurrence
    if (client) {
      const recurrenceRule = LOYALTY_RULES.find(r => r.type === 'RECURRENCE');
      if (recurrenceRule && recurrenceRule.threshold && (client.totalTrips + 1) % recurrenceRule.threshold === 0) {
        suggestion = recurrenceRule.message;
      }
    }

    // Rule 2: Special Date
    const today = new Date().toISOString().split('T')[0];
    const specialDateRule = LOYALTY_RULES.find(r => r.type === 'SPECIAL_DATE' && r.date === today);
    if (specialDateRule) {
      suggestion = specialDateRule.message;
    }

    setLoyaltySuggestion(suggestion);

  }, [clientPhone]);

  return {
    // State & Derived State
    availableCombos: AVAILABLE_COMBOS,
    selectedCombos,
    discount,
    clientPhone,
    loyaltySuggestion,
    subtotal,
    totalDiscount,
    total,
    // Handlers
    toggleCombo,
    toggleCourtesy,
    updateDiscountType,
    updateDiscountValue,
    updateClientPhone,
  };
};
