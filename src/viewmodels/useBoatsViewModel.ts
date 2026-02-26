// src/viewmodels/useBoatsViewModel.ts
import { useState, useEffect } from 'react';
import type { Boat } from '../core/domain/types';
import { boatRepository } from '../core/repositories/BoatRepository';

export const useBoatsViewModel = () => {
  const [boats, setBoats] = useState<Boat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBoat, setEditingBoat] = useState<Partial<Boat> | null>(null);

  useEffect(() => {
    setIsLoading(true);
    boatRepository.getAll().then(() => setIsLoading(false));

    const unsubscribe = boatRepository.subscribe((data) => {
      setBoats(data);
      setIsLoading(false);
    });

    return unsubscribe;
  }, []);

  const openNewBoatModal = () => {
    setEditingBoat({
      name: '',
      capacity: 10,
      size: 30,
      pricePerHour: 0,
      pricePerHalfHour: 0,
      organizationTimeMinutes: 0,
    });
    setIsModalOpen(true);
  };

  const openEditBoatModal = (boat: Boat) => {
    setEditingBoat({ ...boat });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingBoat(null);
  };

  const handleSave = async () => {
    if (!editingBoat) return;

    try {
      if (editingBoat.id) {
        await boatRepository.update(editingBoat as Boat);
      } else {
        await boatRepository.add(editingBoat as Omit<Boat, 'id'>);
      }

      closeModal();
      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Erro ao salvar lancha.' };
    }
  };

  const confirmDeleteExternal = async (boatId: string) => {
    try {
      await boatRepository.remove(boatId);
      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Erro ao excluir lancha.' };
    }
  };

  const updateEditingBoat = (field: keyof Boat, value: any) => {
    setEditingBoat(prev => (prev ? { ...prev, [field]: value } : null));
  };

  return {
    boats,
    isLoading,
    isModalOpen,
    editingBoat,
    openNewBoatModal,
    openEditBoatModal,
    closeModal,
    handleSave,
    confirmDeleteExternal,
    updateEditingBoat,
  };
};
