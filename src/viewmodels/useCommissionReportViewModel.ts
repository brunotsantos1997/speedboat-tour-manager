// src/viewmodels/useCommissionReportViewModel.ts
import { useState, useEffect, useCallback } from 'react';
import { commissionRepository } from '../core/repositories/CommissionRepository';
import type { CommissionReportEntry } from '../core/domain/types';
import type { User } from '../core/domain/User';
import { useAuth } from '../contexts/AuthContext';
import { subMonths, endOfDay } from 'date-fns';

export const useCommissionReportViewModel = () => {
  const { currentUser, getAllUsers } = useAuth();

  const [reportData, setReportData] = useState<CommissionReportEntry[]>([]);
  const [usersForFilter, setUsersForFilter] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Default date range: last month to today
  const [startDate, setStartDate] = useState<Date>(subMonths(new Date(), 1));
  const [endDate, setEndDate] = useState<Date>(endOfDay(new Date()));
  const [selectedUserId, setSelectedUserId] = useState<string | undefined>(undefined);

  const fetchReport = useCallback(async () => {
    if (!currentUser || (currentUser.role !== 'OWNER' && currentUser.role !== 'ADMIN')) {
      setError('Acesso negado. Você não tem permissão para ver este relatório.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await commissionRepository.getCommissionReport(startDate, endDate, selectedUserId);
      setReportData(data);
    } catch (err) {
      setError('Falha ao buscar o relatório de comissões.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, selectedUserId, currentUser]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  useEffect(() => {
    const fetchUsers = async () => {
      if (currentUser && (currentUser.role === 'OWNER' || currentUser.role === 'ADMIN')) {
        try {
          const users = await getAllUsers();
          setUsersForFilter(users);
        } catch (err) {
          console.error('Failed to fetch users for filter:', err);
        }
      }
    };
    fetchUsers();
  }, [currentUser, getAllUsers]);

  return {
    reportData,
    loading,
    error,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    selectedUserId,
    setSelectedUserId,
    usersForFilter,
    currentUser,
  };
};
