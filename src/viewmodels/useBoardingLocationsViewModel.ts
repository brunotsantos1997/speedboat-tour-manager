// src/viewmodels/useBoardingLocationsViewModel.ts
import { useState, useEffect } from 'react';
import type { BoardingLocation } from '../core/domain/types';
import { boardingLocationRepository } from '../core/repositories/BoardingLocationRepository';

export const useBoardingLocationsViewModel = () => {
  const [locations, setLocations] = useState<BoardingLocation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const repository = boardingLocationRepository;

  useEffect(() => {
    repository.getAll().then((data) => {
      setLocations(data);
      setIsLoading(false);
    });
  }, [repository]);

  const addLocation = async (location: Omit<BoardingLocation, 'id'>) => {
    const newLocation = await repository.add(location);
    setLocations([...locations, newLocation]);
  };

  const updateLocation = async (location: BoardingLocation) => {
    const updatedLocation = await repository.update(location);
    setLocations(
      locations.map((l) => (l.id === updatedLocation.id ? updatedLocation : l))
    );
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
      await repository.delete(locationToDeleteId);
      setLocations(locations.filter((l) => l.id !== locationToDeleteId));
      closeConfirmDeleteModal();
    }
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
