// src/viewmodels/CompanyDataViewModel.ts
import { useState, useEffect, useCallback } from 'react';
import type { CompanyData } from '../core/domain/types';
import { CompanyDataRepository } from '../core/repositories/CompanyDataRepository';

export const useCompanyDataViewModel = () => {
  const [companyData, setCompanyData] = useState<CompanyData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const repository = CompanyDataRepository.getInstance();

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const data = await repository.get();
        setCompanyData(data || null);
      } catch {
        setError('Failed to load company data.');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [repository]);

  const updateCompanyData = useCallback(
    async (data: Partial<Omit<CompanyData, 'id'>>) => {
      if (!companyData) return;

      try {
        const updatedData: CompanyData = { ...companyData, ...data };
        await repository.update(updatedData);
        setCompanyData(updatedData);
        return updatedData;
      } catch (e) {
        setError('Failed to update company data.');
        throw e;
      }
    },
    [companyData, repository]
  );

  return {
    companyData,
    isLoading,
    error,
    updateCompanyData,
  };
};
