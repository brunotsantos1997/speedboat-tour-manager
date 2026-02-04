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
      pricePerHour: 0,
      pricePerHalfHour: 0,
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
      await fetchBoats();
      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Erro ao salvar lancha.' };
    }
  };

  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [boatToDeleteId, setBoatToDeleteId] = useState<string | null>(null);

  const openConfirmDeleteModal = (boatId: string) => {
    setBoatToDeleteId(boatId);
    setIsConfirmModalOpen(true);
  };

  const closeConfirmDeleteModal = () => {
    setBoatToDeleteId(null);
    setIsConfirmModalOpen(false);
  };

  const confirmDelete = async () => {
    if (boatToDeleteId) {
      try {
        await boatRepository.remove(boatToDeleteId);
        await fetchBoats();
        closeConfirmDeleteModal();
        return { success: true };
      } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Erro ao excluir lancha.' };
      }
    }
    return { success: false, error: 'ID da lancha não encontrado.' };
  };

  const handleDelete = async (boatId: string) => {
    openConfirmDeleteModal(boatId);
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
    isConfirmModalOpen,
    confirmDelete,
    closeConfirmDeleteModal,
  };
};
