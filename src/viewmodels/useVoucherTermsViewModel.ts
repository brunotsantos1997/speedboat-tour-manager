// src/viewmodels/useVoucherTermsViewModel.ts
import { useState, useEffect } from 'react';
import { VoucherTermsRepository } from '../core/repositories/VoucherTermsRepository';

export const useVoucherTermsViewModel = () => {
  const [terms, setTerms] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const repository = VoucherTermsRepository.getInstance();

  useEffect(() => {
    setIsLoading(true);
    repository.get().catch(err => console.error("Error loading voucher terms:", err));

    const unsubscribe = repository.subscribe((data) => {
      if (data) {
        setTerms(data.terms);
      }
      setIsLoading(false);
    });

    return unsubscribe;
  }, [repository]);

  const saveTerms = async (content: string) => {
    try {
      await repository.update({ id: 'default', terms: content });
      setTerms(content);
    } catch (error) {
      console.error("Error saving voucher terms:", error);
      throw error;
    }
  };

  return {
    terms,
    isLoading,
    saveTerms,
  };
};
