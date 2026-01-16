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
        setVoucherTerms(data);
      } catch (e) {
        setError('Failed to load voucher terms.');
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
        const updatedData = await repository.update({ terms });
        setVoucherTerms(updatedData);
        return updatedData;
      } catch (e) {
        setError('Failed to update voucher terms.');
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
