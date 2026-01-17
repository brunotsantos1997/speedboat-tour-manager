// src/viewmodels/useBoatsViewModel.ts
import { useState, useEffect, useCallback } from 'react';
import type { Boat } from '../core/domain/types';
import { boatRepository } from '../core/repositories/BoatRepository';

export const useBoatsViewModel = () => {
  const [boats, setBoats] = useState<Boat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBoat, setEditingBoat] = useState<Partial<Boat> | null>(null);

  const fetchBoats = useCallback(async () => {
    setIsLoading(true);
    const fetchedBoats = await boatRepository.getAll();
    setBoats(fetchedBoats);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchBoats();
  }, [fetchBoats]);

  const openNewBoatModal = () => {
    setEditingBoat({
      name: '',
      capacity: 10,
      size: 30,
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

    if (editingBoat.id) {
      await boatRepository.update(editingBoat as Boat);
    } else {
      await boatRepository.add(editingBoat as Omit<Boat, 'id'>);
    }

    closeModal();
    await fetchBoats();
  };

  const handleDelete = async (boatId: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta lancha?')) {
      await boatRepository.remove(boatId);
      await fetchBoats();
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
    handleDelete,
    updateEditingBoat,
  };
};
