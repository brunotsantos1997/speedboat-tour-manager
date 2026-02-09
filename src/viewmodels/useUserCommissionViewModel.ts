// src/viewmodels/useUserCommissionViewModel.ts
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import type { User, UserCommissionSettings } from '../core/domain/User';

export const useUserCommissionViewModel = () => {
  const { getAllUsers, updateUserCommissionSettings, currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const allUsers = await getAllUsers();
      // Filter out current user and owner if needed, though management usually includes them
      // For commission, usually we manage sellers and admins.
      setUsers(allUsers.filter(u => u.id !== currentUser?.id));
      setError(null);
    } catch (err) {
      setError('Falha ao carregar usuários.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [getAllUsers, currentUser]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const updateCommission = async (userId: string, settings: UserCommissionSettings) => {
    try {
      await updateUserCommissionSettings(userId, settings);
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, commissionSettings: settings } : u));
    } catch (err) {
      setError('Falha ao atualizar comissão.');
      throw err;
    }
  };

  return {
    users,
    isLoading,
    error,
    updateCommission,
    refreshUsers: fetchUsers
  };
};
