// src/viewmodels/useBoardingLocationsViewModel.ts
import { useState, useEffect } from 'react';
import type { BoardingLocation } from '../core/domain/types';
import { boardingLocationRepository } from '../core/repositories/BoardingLocationRepository';

export const useBoardingLocationsViewModel = () => {
  const [locations, setLocations] = useState<BoardingLocation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const repository = boardingLocationRepository;

  useEffect(() => {
    setIsLoading(true);
    repository.getAll().then(() => setIsLoading(false));

    const unsubscribe = repository.subscribe((data) => {
      setLocations(data);
      setIsLoading(false);
    });

    return unsubscribe;
  }, [repository]);

  const addLocation = async (location: Omit<BoardingLocation, 'id'>) => {
    try {
      await repository.add(location);
      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Erro ao adicionar local.' };
    }
  };

  const updateLocation = async (location: BoardingLocation) => {
    try {
      await repository.update(location);
      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Erro ao atualizar local.' };
    }
  };

  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [locationToDeleteId, setLocationToDeleteId] = useState<string | null>(null);

  const openConfirmDeleteModal = (locationId: string) => {
    setLocationToDeleteId(locationId);
    setIsConfirmModalOpen(true);
  };

  const closeConfirmDeleteModal = () => {
    setLocationToDeleteId(null);
    setIsConfirmModalOpen(false);
  };

  const confirmDelete = async () => {
    if (locationToDeleteId) {
      try {
        await repository.delete(locationToDeleteId);
        closeConfirmDeleteModal();
        return { success: true };
      } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Erro ao excluir local.' };
      }
    }
    return { success: false, error: 'ID do local não encontrado.' };
  };

  const deleteLocation = async (id: string) => {
    openConfirmDeleteModal(id);
  };

  return {
    locations,
    isLoading,
    addLocation,
    updateLocation,
    deleteLocation,
    isConfirmModalOpen,
    confirmDelete,
    closeConfirmDeleteModal,
  };
};
