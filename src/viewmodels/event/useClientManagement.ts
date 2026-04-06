// src/viewmodels/event/useClientManagement.ts
import { useState, useCallback } from 'react';
import type { ClientProfile } from '../../core/domain/types';
import { clientRepository } from '../../core/repositories/ClientRepository';
import { useModal } from '../../ui/contexts/modal/useModal';
import { useToast } from '../../ui/contexts/toast/useToast';

export const useClientManagement = (initialClient?: ClientProfile | null) => {
  const { confirm } = useModal();
  const { showToast } = useToast();
  
  // Client Management State
  const [selectedClient, setSelectedClient] = useState<ClientProfile | null>(initialClient || null);
  const [clientSearchTerm, setClientSearchTerm] = useState(initialClient?.name || '');
  const [clientSearchResults, setClientSearchResults] = useState<ClientProfile[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [loyaltySuggestion, setLoyaltySuggestion] = useState<string | null>(null);

  // New Client Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<ClientProfile | null>(null);
  const [newClientName, setNewClientName] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');

  // Client search
  const handleClientSearch = useCallback(async (term: string) => {
    setClientSearchTerm(term);
    if (term.length > 2) {
      setIsSearching(true);
      try {
        const results = await clientRepository.search(term);
        setClientSearchResults(results);
        
        // Check for loyalty suggestion
        const existingClient = results.find(c => 
          c.name.toLowerCase().includes(term.toLowerCase())
        );
        if (existingClient && existingClient.totalTrips > 0) {
          setLoyaltySuggestion(`Cliente fiel! Já realizou ${existingClient.totalTrips} passeios.`);
        } else {
          setLoyaltySuggestion(null);
        }
      } catch (error) {
        console.error('Failed to search clients:', error);
        setClientSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    } else {
      setClientSearchResults([]);
      setLoyaltySuggestion(null);
    }
  }, []);

  // Client selection
  const selectClient = useCallback((client: ClientProfile) => {
    setSelectedClient(client);
    setClientSearchTerm(client.name);
    setClientSearchResults([]);
    setLoyaltySuggestion(null);
  }, []);

  const clearClientSelection = useCallback(() => {
    setSelectedClient(null);
    setClientSearchTerm('');
    setClientSearchResults([]);
    setLoyaltySuggestion(null);
  }, []);

  // New client modal
  const openNewClientModal = useCallback(() => {
    setEditingClient(null);
    setNewClientName('');
    setNewClientPhone('');
    setIsModalOpen(true);
  }, []);

  const openEditClientModal = useCallback((client: ClientProfile) => {
    setEditingClient(client);
    setNewClientName(client.name);
    setNewClientPhone(client.phone);
    setIsModalOpen(true);
  }, []);

  const closeClientModal = useCallback(() => {
    setIsModalOpen(false);
    setEditingClient(null);
    setNewClientName('');
    setNewClientPhone('');
  }, []);

  const handleSaveClient = useCallback(async () => {
    if (!newClientName || !newClientPhone) {
      showToast('Por favor, preencha nome e telefone.', 'error');
      return;
    }

    try {
      if (editingClient) {
        // Update existing client
        const updatedClient = { ...editingClient, name: newClientName, phone: newClientPhone };
        await clientRepository.update(updatedClient);
        setSelectedClient(updatedClient);
        setClientSearchTerm(updatedClient.name);
        showToast('Cliente atualizado com sucesso!');
      } else {
        // Create new client
        const newClient = await clientRepository.add({
          name: newClientName,
          phone: newClientPhone
        });
        setSelectedClient(newClient);
        setClientSearchTerm(newClient.name);
        setClientSearchResults([]);
        showToast('Cliente criado com sucesso!');
      }
      closeClientModal();
    } catch (error) {
      console.error('Failed to save client:', error);
      showToast('Erro ao salvar cliente.', 'error');
    }
  }, [editingClient, newClientName, newClientPhone, showToast, closeClientModal]);

  const handleDeleteClient = useCallback(async (client: ClientProfile) => {
    if (!await confirm('Tem certeza que deseja excluir este cliente?', 'Esta ação é irreversível.')) {
      return;
    }

    try {
      await clientRepository.delete(client.id);
      if (selectedClient?.id === client.id) {
        clearClientSelection();
      }
      showToast('Cliente excluído com sucesso!');
    } catch (error) {
      console.error('Failed to delete client:', error);
      showToast('Erro ao excluir cliente.', 'error');
    }
  }, [selectedClient, clearClientSelection, confirm]);

  return {
    // State
    selectedClient,
    clientSearchTerm,
    clientSearchResults,
    isSearching,
    loyaltySuggestion,
    isModalOpen,
    editingClient,
    newClientName,
    newClientPhone,

    // Actions
    handleClientSearch,
    selectClient,
    clearClientSelection,
    openNewClientModal,
    openEditClientModal,
    closeClientModal,
    handleSaveClient,
    handleDeleteClient,

    // Setters
    setNewClientName,
    setNewClientPhone,
  };
};
