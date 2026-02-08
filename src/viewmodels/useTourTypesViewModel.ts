// src/viewmodels/useTourTypesViewModel.ts
import { useState, useEffect, useCallback } from 'react';
import { tourTypeRepository } from '../core/repositories/TourTypeRepository';
import type { TourType } from '../core/domain/types';

export const useTourTypesViewModel = () => {
  const [tourTypes, setTourTypes] = useState<TourType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTourTypes = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await tourTypeRepository.getAll();
      setTourTypes(data);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar tipos de passeio');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTourTypes();
  }, [fetchTourTypes]);

  const addTourType = async (name: string, color: string) => {
    try {
      await tourTypeRepository.add({ name, color, isArchived: false });
      await fetchTourTypes();
    } catch (err: any) {
      setError(err.message || 'Erro ao adicionar tipo de passeio');
    }
  };

  const updateTourType = async (tourType: TourType) => {
    try {
      await tourTypeRepository.update(tourType);
      await fetchTourTypes();
    } catch (err: any) {
      setError(err.message || 'Erro ao atualizar tipo de passeio');
    }
  };

  const deleteTourType = async (id: string) => {
    try {
      await tourTypeRepository.delete(id);
      await fetchTourTypes();
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
    refresh: fetchTourTypes,
  };
};
