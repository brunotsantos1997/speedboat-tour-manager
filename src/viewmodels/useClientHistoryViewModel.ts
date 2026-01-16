// src/viewmodels/useClientHistoryViewModel.ts
import { useState, useCallback } from 'react';
import type { ClientProfile, Event as EventType } from '../core/domain/types';
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
    if (window.confirm('Tem certeza que deseja cancelar este evento?')) {
      await eventRepository.updateStatus(eventId, 'CANCELLED');
      if(selectedClient) {
        selectClient(selectedClient);
      }
    }
  }, [selectedClient, selectClient]);

  const confirmPayment = useCallback(async (eventId: string) => {
    if (window.confirm('Tem certeza que deseja confirmar o pagamento da reserva?')) {
      await eventRepository.updatePaymentStatus(eventId, 'CONFIRMED');
      if(selectedClient) {
        // Re-fetch events to update the UI
        selectClient(selectedClient);
      }
    }
  }, [selectedClient, selectClient]);

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

    // Refresh selected client data
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
