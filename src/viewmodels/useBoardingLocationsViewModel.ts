// src/viewmodels/useBoardingLocationsViewModel.ts
import { useState, useEffect } from 'react';
import type { BoardingLocation } from '../core/domain/types';
import { MockBoardingLocationRepository } from '../core/repositories/MockBoardingLocationRepository';

export const useBoardingLocationsViewModel = () => {
  const [locations, setLocations] = useState<BoardingLocation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const repository = new MockBoardingLocationRepository();

  useEffect(() => {
    repository.getAll().then((data) => {
      setLocations(data);
      setIsLoading(false);
    });
  }, []);

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

  const deleteLocation = async (id: string) => {
    await repository.delete(id);
    setLocations(locations.filter((l) => l.id !== id));
  };

  return {
    locations,
    isLoading,
    addLocation,
    updateLocation,
    deleteLocation,
  };
};
