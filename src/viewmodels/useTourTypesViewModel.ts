// src/viewmodels/useTourTypesViewModel.ts
import { useState, useEffect } from 'react';
import { tourTypeRepository } from '../core/repositories/TourTypeRepository';
import type { TourType } from '../core/domain/types';

export const useTourTypesViewModel = () => {
  const [tourTypes, setTourTypes] = useState<TourType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    tourTypeRepository.getAll().catch((err: any) => {
      setError(err.message || 'Erro ao carregar tipos de passeio');
    });

    const unsubscribe = tourTypeRepository.subscribe((data) => {
      setTourTypes(data);
      setIsLoading(false);
    });

    return unsubscribe;
  }, []);

  const addTourType = async (name: string, color: string) => {
    try {
      await tourTypeRepository.add({ name, color, isArchived: false });
    } catch (err: any) {
      setError(err.message || 'Erro ao adicionar tipo de passeio');
    }
  };

  const updateTourType = async (tourType: TourType) => {
    try {
      await tourTypeRepository.update(tourType);
    } catch (err: any) {
      setError(err.message || 'Erro ao atualizar tipo de passeio');
    }
  };

  const deleteTourType = async (id: string) => {
    try {
      await tourTypeRepository.delete(id);
    } catch (err: any) {
      setError(err.message || 'Erro ao excluir tipo de passeio');
    }
  };

  return {
    tourTypes,
    isLoading,
    error,
    addTourType,
    updateTourType,
    deleteTourType,
    refresh: () => {},
  };
};
