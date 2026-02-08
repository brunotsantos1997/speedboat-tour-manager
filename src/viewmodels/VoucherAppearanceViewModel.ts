// src/viewmodels/VoucherAppearanceViewModel.ts
import { useState, useEffect, useCallback } from 'react';
import type { VoucherAppearanceData } from '../core/repositories/VoucherAppearanceRepository';
import { VoucherAppearanceRepository } from '../core/repositories/VoucherAppearanceRepository';

export const useVoucherAppearanceViewModel = () => {
  const [appearanceData, setAppearanceData] = useState<VoucherAppearanceData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const repository = VoucherAppearanceRepository.getInstance();

  useEffect(() => {
    setIsLoading(true);
    repository.get().catch(() => setError('Falha ao carregar aparência do voucher.'));

    const unsubscribe = repository.subscribe((data) => {
      setAppearanceData(data);
      setIsLoading(false);
    });

    return unsubscribe;
  }, [repository]);

  const updateWatermark = useCallback(
    async (file: File) => {
      if (!appearanceData) return;

      return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = async () => {
          try {
            const base64Image = reader.result as string;
            const updatedData: VoucherAppearanceData = { ...appearanceData, watermarkImage: base64Image };
            await repository.update(updatedData);
            setAppearanceData(updatedData);
            resolve(base64Image);
          } catch (e) {
            setError('Falha ao atualizar marca d\'água.');
            reject(e);
          }
        };
        reader.onerror = (error) => {
          setError('Falha ao ler arquivo.');
          reject(error);
        };
      });
    },
    [appearanceData, repository]
  );

  return {
    appearanceData,
    isLoading,
    error,
    updateWatermark,
  };
};
