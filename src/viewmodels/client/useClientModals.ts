// src/viewmodels/client/useClientModals.ts
import { useState, useCallback } from 'react';
import type { ClientProfile, EventType, Payment } from '../../core/domain/types';
import { clientRepository } from '../../core/repositories/ClientRepository';
import { useModal } from '../../ui/contexts/modal/useModal';
import { useToast } from '../../ui/contexts/toast/useToast';

export const useClientModals = () => {
  const { confirm, showAlert } = useModal();
  const { showToast } = useToast();

  // Client Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<ClientProfile | null>(null);
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');

  // Payment Modal State
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [activeEventForPayment, setActiveEventForPayment] = useState<EventType | null>(null);
  const [paymentType, setPaymentType] = useState<'DOWN_PAYMENT' | 'BALANCE' | 'FULL'>('BALANCE');
  const [defaultPaymentAmount, setDefaultPaymentAmount] = useState(0);

  // Shared Event Modal State
  const [isSharedModalOpen, setIsSharedModalOpen] = useState(false);
  const [selectedSharedEventId, setSelectedSharedEventId] = useState<string | null>(null);

  // Quick Edit Modal State
  const [isQuickEditModalOpen, setIsQuickEditModalOpen] = useState(false);
  const [activeEventForQuickEdit, setActiveEventForQuickEdit] = useState<EventType | null>(null);
  const [activeEventPayments, setActiveEventPayments] = useState<Payment[]>([]);

  // Client Modal Actions
  const openEditClientModal = useCallback((client: ClientProfile) => {
    setEditingClient(client);
    setClientName(client.name);
    setClientPhone(client.phone);
    setIsModalOpen(true);
  }, []);

  const closeEditClientModal = useCallback(() => {
    setIsModalOpen(false);
    setEditingClient(null);
    setClientName('');
    setClientPhone('');
  }, []);

  const saveClient = useCallback(async () => {
    if (!editingClient || !clientName || !clientPhone) return;

    try {
      const updatedClient = await clientRepository.update({
        ...editingClient,
        name: clientName,
        phone: clientPhone
      });
      showToast('Cliente atualizado com sucesso!');
      closeEditClientModal();
      return updatedClient;
    } catch (error) {
      console.error('Failed to update client:', error);
      showToast('Erro ao atualizar cliente.', 'error');
      throw error;
    }
  }, [editingClient, clientName, clientPhone, showToast, closeEditClientModal]);

  // Payment Modal Actions
  const openPaymentModal = useCallback((event: EventType, type: 'DOWN_PAYMENT' | 'BALANCE' | 'FULL', amount: number) => {
    setActiveEventForPayment(event);
    setPaymentType(type);
    setDefaultPaymentAmount(amount);
    setIsPaymentModalOpen(true);
  }, []);

  const closePaymentModal = useCallback(() => {
    setIsPaymentModalOpen(false);
    setActiveEventForPayment(null);
    setDefaultPaymentAmount(0);
  }, []);

  // Quick Edit Modal Actions
  const openQuickEditModal = useCallback((event: EventType, payments: Payment[]) => {
    setActiveEventForQuickEdit(event);
    setActiveEventPayments(payments);
    setIsQuickEditModalOpen(true);
  }, []);

  const closeQuickEditModal = useCallback(() => {
    setIsQuickEditModalOpen(false);
    setActiveEventForQuickEdit(null);
    setActiveEventPayments([]);
  }, []);

  // Shared Event Modal Actions
  const openSharedModal = useCallback((eventId: string) => {
    setSelectedSharedEventId(eventId);
    setIsSharedModalOpen(true);
  }, []);

  const closeSharedModal = useCallback(() => {
    setIsSharedModalOpen(false);
    setSelectedSharedEventId(null);
  }, []);

  return {
    // Client Modal
    isModalOpen,
    editingClient,
    clientName,
    clientPhone,
    openEditClientModal,
    closeEditClientModal,
    saveClient,
    setClientName,
    setClientPhone,

    // Payment Modal
    isPaymentModalOpen,
    activeEventForPayment,
    paymentType,
    defaultPaymentAmount,
    openPaymentModal,
    closePaymentModal,
    setPaymentType,

    // Quick Edit Modal
    isQuickEditModalOpen,
    activeEventForQuickEdit,
    activeEventPayments,
    openQuickEditModal,
    closeQuickEditModal,

    // Shared Event Modal
    isSharedModalOpen,
    selectedSharedEventId,
    openSharedModal,
    closeSharedModal,

    // Common Modal Actions
    confirm,
    showAlert,
  };
};
