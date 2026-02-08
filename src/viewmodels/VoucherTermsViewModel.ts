// src/viewmodels/VoucherTermsViewModel.ts
import { useState, useEffect, useCallback } from 'react';
import type { VoucherTerms } from '../core/domain/types';
import { VoucherTermsRepository } from '../core/repositories/VoucherTermsRepository';

export const useVoucherTermsViewModel = () => {
  const [voucherTerms, setVoucherTerms] = useState<VoucherTerms | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const repository = VoucherTermsRepository.getInstance();

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const data = await repository.get();
        setVoucherTerms(data || null);
      } catch {
        setError('Falha ao carregar termos do voucher.');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [repository]);

  const updateVoucherTerms = useCallback(
    async (terms: string) => {
      if (!voucherTerms) return;

      try {
        const updatedData: VoucherTerms = { ...voucherTerms, terms };
        await repository.update(updatedData);
        setVoucherTerms(updatedData);
        return updatedData;
      } catch (e) {
        setError('Falha ao atualizar termos do voucher.');
        throw e;
      }
    },
    [voucherTerms, repository]
  );

  return {
    voucherTerms,
    isLoading,
    error,
    updateVoucherTerms,
  };
};
