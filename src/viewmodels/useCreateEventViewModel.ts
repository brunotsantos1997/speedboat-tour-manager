// src/viewmodels/useCreateEventViewModel.ts
import { useState, useMemo, useEffect, useCallback } from 'react';
import type { Combo, Discount, SelectedCombo, ClientProfile } from '../core/domain/types';
import { AVAILABLE_COMBOS, LOYALTY_RULES } from '../core/data/mocks';
import { clientRepository } from '../core/repositories/ClientRepository';

export const useCreateEventViewModel = () => {
  // Core State
  const [selectedCombos, setSelectedCombos] = useState<SelectedCombo[]>([]);
  const [discount, setDiscount] = useState<Discount>({ type: 'FIXED', value: 0 });
  const [passengerCount, setPassengerCount] = useState(1);

  // Client Management State
  const [selectedClient, setSelectedClient] = useState<ClientProfile | null>(null);
  const [clientSearchTerm, setClientSearchTerm] = useState('');
  const [clientSearchResults, setClientSearchResults] = useState<ClientProfile[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [loyaltySuggestion, setLoyaltySuggestion] = useState<string | null>(null);

  // New Client Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');

  // Handlers for Combos, Discount, Passengers
  const toggleCombo = useCallback((combo: Combo) => {
    setSelectedCombos(prev =>
      prev.some(c => c.id === combo.id)
        ? prev.filter(c => c.id !== combo.id)
        : [...prev, { ...combo, isCourtesy: false }]
    );
  }, []);

  const toggleCourtesy = useCallback((comboId: string) => {
    setSelectedCombos(prev =>
      prev.map(c => c.id === comboId ? { ...c, isCourtesy: !c.isCourtesy } : c)
    );
  }, []);

  const updateDiscountType = useCallback((type: 'FIXED' | 'PERCENTAGE') => {
    setDiscount(prev => ({ ...prev, type }));
  }, []);

  const updateDiscountValue = useCallback((value: number) => {
    setDiscount(prev => ({ ...prev, value: isNaN(value) || value < 0 ? 0 : value }));
  }, []);

  const updatePassengerCount = useCallback((count: number) => {
    setPassengerCount(Math.max(1, count)); // Ensure at least 1 passenger
  }, []);

  // Handlers for Client Management
  const handleClientSearch = useCallback(async (term: string) => {
    setClientSearchTerm(term);
    if (term.length > 2) {
      setIsSearching(true);
      const results = await clientRepository.search(term);
      setClientSearchResults(results);
      setIsSearching(false);
    } else {
      setClientSearchResults([]);
    }
  }, []);

  const selectClient = useCallback((client: ClientProfile) => {
    setSelectedClient(client);
    setClientSearchTerm(client.name);
    setClientSearchResults([]);
  }, []);

  const clearClientSelection = useCallback(() => {
    setSelectedClient(null);
    setClientSearchTerm('');
  }, []);

  const handleAddNewClient = useCallback(async () => {
    if (!newClientName || !newClientPhone) return;

    const newClient = await clientRepository.add({ name: newClientName, phone: newClientPhone });
    selectClient(newClient);

    // Reset and close modal
    setIsModalOpen(false);
    setNewClientName('');
    setNewClientPhone('');
  }, [newClientName, newClientPhone, selectClient]);


  // Derived State: Calculations
  const subtotal = useMemo(() => {
    return selectedCombos.reduce((acc, combo) => (combo.isCourtesy ? acc : acc + combo.price), 0);
  }, [selectedCombos]);

  const totalDiscount = useMemo(() => {
    if (discount.type === 'FIXED') return discount.value;
    return subtotal * (discount.value / 100);
  }, [subtotal, discount]);

  const total = useMemo(() => Math.max(0, subtotal - totalDiscount), [subtotal, totalDiscount]);

  // Side Effects: Loyalty Checks
  useEffect(() => {
    if (!selectedClient) {
      setLoyaltySuggestion(null);
      return;
    }

    let suggestion: string | null = null;
    const recurrenceRule = LOYALTY_RULES.find(r => r.type === 'RECURRENCE');
    if (recurrenceRule && recurrenceRule.threshold && (selectedClient.totalTrips + 1) % recurrenceRule.threshold === 0) {
      suggestion = recurrenceRule.message;
    }

    // NOTE: Special date check is kept for demonstration, though it's not client-specific.
    const today = new Date().toISOString().split('T')[0];
    const specialDateRule = LOYALTY_RULES.find(r => r.type === 'SPECIAL_DATE' && r.date === today);
    if (specialDateRule) {
      suggestion = suggestion ? `${suggestion} ${specialDateRule.message}` : specialDateRule.message;
    }

    setLoyaltySuggestion(suggestion);
  }, [selectedClient]);

  return {
    // State & Derived State
    availableCombos: AVAILABLE_COMBOS,
    selectedCombos,
    discount,
    passengerCount,
    subtotal,
    totalDiscount,
    total,
    // Client state
    selectedClient,
    clientSearchTerm,
    clientSearchResults,
    isSearching,
    loyaltySuggestion,
    // Modal state
    isModalOpen,
    newClientName,
    newClientPhone,
    // Handlers
    toggleCombo,
    toggleCourtesy,
    updateDiscountType,
    updateDiscountValue,
    updatePassengerCount,
    handleClientSearch,
    selectClient,
    clearClientSelection,
    setIsModalOpen,
    setNewClientName,
    setNewClientPhone,
    handleAddNewClient,
  };
};
