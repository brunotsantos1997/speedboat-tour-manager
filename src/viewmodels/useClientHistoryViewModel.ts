// src/viewmodels/useClientHistoryViewModel.ts
import { useState, useCallback } from 'react';
import type { ClientProfile, EventType } from '../core/domain/types';
import { clientRepository } from '../core/repositories/ClientRepository';
import { eventRepository } from '../core/repositories/EventRepository';

export const useClientHistoryViewModel = () => {
  const [searchTerm, setSearchTerm] = useState('');
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
    setIsLoading(true);
    setSelectedClient(client);
    setSearchTerm(client.name);
    setSearchResults([]);
    const events = await eventRepository.getEventsByClient(client.id);
    events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setClientEvents(events);
    setIsLoading(false);
  }, []);

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
      await eventRepository.updateEvent(updatedEvent);
      if (selectedClient) {
        selectClient(selectedClient);
      }
    }
  }, [clientEvents, selectedClient, selectClient]);

  const confirmPayment = useCallback(async (eventId: string) => {
    if (window.confirm('Tem certeza que deseja confirmar o pagamento da reserva?')) {
      const eventToUpdate = clientEvents.find(e => e.id === eventId);
      if (!eventToUpdate) return;
      const updatedEvent = { ...eventToUpdate, paymentStatus: 'CONFIRMED' as const };
      if (updatedEvent.status === 'PRE_SCHEDULED') {
        updatedEvent.status = 'SCHEDULED';
      }
      await eventRepository.updateEvent(updatedEvent);
      if(selectedClient) {
        selectClient(selectedClient);
      }
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
    confirmPayment,
    openEditModal,
    closeEditModal,
    handleSaveChanges,
  };
};
