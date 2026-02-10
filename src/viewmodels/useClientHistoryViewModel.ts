// src/viewmodels/useClientHistoryViewModel.ts
import { useState, useCallback, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { ClientProfile, EventType } from '../core/domain/types';
import { clientRepository } from '../core/repositories/ClientRepository';
import { eventRepository } from '../core/repositories/EventRepository';
import { paymentRepository } from '../core/repositories/PaymentRepository';
import { format } from 'date-fns';
import { useEventSync } from './useEventSync';

export const useClientHistoryViewModel = () => {
  const [searchParams] = useSearchParams();
  const clientIdParam = searchParams.get('clientId');
  const [searchTerm, setSearchTerm] = useState('');
  const { syncEvent } = useEventSync();
  const [searchResults, setSearchResults] = useState<ClientProfile[]>([]);
  const [selectedClient, setSelectedClient] = useState<ClientProfile | null>(null);
  const [clientEvents, setClientEvents] = useState<EventType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  // Modal State for Editing Client
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<ClientProfile | null>(null);
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');

  // Payment Modal State
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [activeEventForPayment, setActiveEventForPayment] = useState<EventType | null>(null);
  const [paymentType, setPaymentType] = useState<'DOWN_PAYMENT' | 'BALANCE' | 'FULL'>('BALANCE');
  const [defaultPaymentAmount, setDefaultPaymentAmount] = useState(0);

  const handleSearch = useCallback(async (term: string) => {
    setSearchTerm(term);
    if (term.length > 2) {
      setIsSearching(true);
      const results = await clientRepository.search(term);
      setSearchResults(results);
      setIsSearching(false);
    } else {
      setSearchResults([]);
    }
  }, []);

  const selectClient = useCallback(async (client: ClientProfile) => {
    setSelectedClient(client);
    setSearchTerm(client.name);
    setSearchResults([]);
  }, []);

  useEffect(() => {
    if (!selectedClient) {
      setClientEvents([]);
      return;
    }

    setIsLoading(true);

    // Initial fetch for auto-cancel check
    eventRepository.getEventsByClient(selectedClient.id).then(async (events) => {
      const now = Date.now();
      const twentyFourHours = 24 * 60 * 60 * 1000;

      for (const event of events) {
        if (event.status === 'PRE_SCHEDULED' && event.preScheduledAt && (now - event.preScheduledAt > twentyFourHours)) {
          try {
            const savedEvent = await eventRepository.updateEvent({ ...event, status: 'CANCELLED', autoCancelled: true });
            await syncEvent(savedEvent);
          } catch (error) {
            console.error(`Failed to auto-cancel event ${event.id}:`, error);
          }
        }
      }
      setIsLoading(false);
    });

    const unsubscribe = eventRepository.subscribeToClientEvents(selectedClient.id, (events) => {
      const sorted = [...events].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setClientEvents(sorted);
      setIsLoading(false);
    });

    return unsubscribe;
  }, [selectedClient, syncEvent]);

  const clearSelection = () => {
    setSelectedClient(null);
    setClientEvents([]);
    setSearchTerm('');
    setSearchResults([]);
  };

  const cancelEvent = useCallback(async (eventId: string) => {
    const eventToUpdate = clientEvents.find(e => e.id === eventId);
    if (!eventToUpdate) return;

    const message = eventToUpdate.paymentStatus === 'CONFIRMED'
      ? 'Este evento já foi pago. Ao cancelar, o status será alterado para "Pendente de Reembolso". Deseja continuar?'
      : 'Tem certeza que deseja cancelar este evento?';

    if (window.confirm(message)) {
      const newStatus = eventToUpdate.paymentStatus === 'CONFIRMED' ? 'PENDING_REFUND' : 'CANCELLED';
      const updatedEvent = { ...eventToUpdate, status: newStatus as EventType['status'] };
      const savedEvent = await eventRepository.updateEvent(updatedEvent);
      await syncEvent(savedEvent);
    }
  }, [clientEvents, selectedClient, selectClient]);

  const initiatePayment = useCallback(async (eventId: string, type: 'DOWN_PAYMENT' | 'BALANCE' | 'FULL') => {
    const event = clientEvents.find(e => e.id === eventId);
    if (event) {
        const payments = await paymentRepository.getByEventId(eventId);
        const totalPaid = payments.reduce((acc, p) => acc + p.amount, 0);

        let suggested = 0;
        if (type === 'DOWN_PAYMENT') {
          suggested = Math.max(0, (event.total * 0.3) - totalPaid);
        } else {
          suggested = Math.max(0, event.total - totalPaid);
        }

        setActiveEventForPayment(event);
        setPaymentType(type);
        setDefaultPaymentAmount(suggested);
        setIsPaymentModalOpen(true);
    }
  }, [clientEvents]);

  const confirmPaymentRecord = useCallback(async (amount: number, method: any, type: any) => {
    if (!activeEventForPayment) return;

    try {
        const eventId = activeEventForPayment.id;

        await paymentRepository.add({
            eventId,
            amount,
            method,
            type,
            date: format(new Date(), 'yyyy-MM-dd'),
            timestamp: Date.now()
        });

        let updatedEvent = { ...activeEventForPayment };
        const payments = await paymentRepository.getByEventId(eventId);
        const totalPaid = payments.reduce((acc, p) => acc + p.amount, 0);

        if (totalPaid > 0 && updatedEvent.status === 'PRE_SCHEDULED') {
            updatedEvent.status = 'SCHEDULED';
        }

        if (totalPaid >= updatedEvent.total) {
            updatedEvent.paymentStatus = 'CONFIRMED';
        } else {
            updatedEvent.paymentStatus = 'PENDING';
        }

        const savedEvent = await eventRepository.updateEvent(updatedEvent);
        await syncEvent(savedEvent);

        setIsPaymentModalOpen(false);
        setActiveEventForPayment(null);
    } catch (error) {
        console.error('Failed to record payment:', error);
        throw error;
    }
  }, [activeEventForPayment, selectedClient, selectClient]);

  const revertCancellation = useCallback(async (eventId: string) => {
    try {
      const eventToUpdate = clientEvents.find(e => e.id === eventId);
      if (!eventToUpdate) return;

      const updatedEvent: EventType = {
        ...eventToUpdate,
        status: 'SCHEDULED',
        autoCancelled: false
      };

      const savedEvent = await eventRepository.updateEvent(updatedEvent);
      await syncEvent(savedEvent);
    } catch (error: any) {
      console.error('Failed to revert cancellation:', error);
      throw error;
    }
  }, [clientEvents, selectedClient, selectClient]);

  // --- Client Edit Handlers ---
  const openEditModal = () => {
    if (!selectedClient) return;
    setEditingClient(selectedClient);
    setClientName(selectedClient.name);
    setClientPhone(selectedClient.phone);
    setIsModalOpen(true);
  };

  const closeEditModal = () => {
    setIsModalOpen(false);
    setEditingClient(null);
    setClientName('');
    setClientPhone('');
  };

  const handleSaveChanges = useCallback(async () => {
    if (!editingClient || !clientName || !clientPhone) return;

    const updatedClient = { ...editingClient, name: clientName, phone: clientPhone };
    await clientRepository.update(updatedClient);

    setSelectedClient(updatedClient);
    setSearchTerm(updatedClient.name);

    closeEditModal();
  }, [editingClient, clientName, clientPhone]);

  useEffect(() => {
    const loadClientFromParams = async () => {
      if (clientIdParam && !selectedClient) {
        setIsLoading(true);
        const client = await clientRepository.getById(clientIdParam);
        if (client) {
          await selectClient(client);
        }
        setIsLoading(false);
      }
    };
    loadClientFromParams();
  }, [clientIdParam, selectedClient, selectClient]);

  return {
    searchTerm,
    searchResults,
    selectedClient,
    clientEvents,
    isLoading,
    isSearching,
    isModalOpen,
    editingClient,
    clientName,
    clientPhone,
    setClientName,
    setClientPhone,
    handleSearch,
    selectClient,
    clearSelection,
    cancelEvent,
    openEditModal,
    closeEditModal,
    handleSaveChanges,
    isPaymentModalOpen,
    setIsPaymentModalOpen,
    activeEventForPayment,
    paymentType,
    defaultPaymentAmount,
    initiatePayment,
    confirmPaymentRecord,
    revertCancellation
  };
};
