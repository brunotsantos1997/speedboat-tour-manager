// src/viewmodels/client/useClientSearchState.ts
import { useState, useCallback } from 'react';
import type { ClientProfile } from '../../core/domain/types';
import { clientRepository } from '../../core/repositories/ClientRepository';

export const useClientSearchState = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<ClientProfile[]>([]);
  const [selectedClient, setSelectedClient] = useState<ClientProfile | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = useCallback(async (term: string) => {
    setSearchTerm(term);
    if (term.length > 2) {
      setIsSearching(true);
      try {
        const results = await clientRepository.search(term);
        setSearchResults(results);
      } catch (error) {
        console.error('Failed to search clients:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    } else {
      setSearchResults([]);
    }
  }, []);

  const selectClient = useCallback((client: ClientProfile) => {
    setSelectedClient(client);
    setSearchTerm(client.name);
    setSearchResults([]);
  }, []);

  const clearClientSelection = useCallback(() => {
    setSelectedClient(null);
    setSearchTerm('');
    setSearchResults([]);
  }, []);

  return {
    searchTerm,
    searchResults,
    selectedClient,
    isSearching,
    handleSearch,
    selectClient,
    clearClientSelection,
    setSearchTerm,
  };
};
