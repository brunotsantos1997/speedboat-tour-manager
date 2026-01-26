// src/viewmodels/useRentalPricesViewModel.ts
import { useState, useEffect } from 'react';
import { PriceRepository } from '../core/repositories/PriceRepository';
import type { RentalPrices } from '../core/repositories/PriceRepository';

export const useRentalPricesViewModel = () => {
  const [prices, setPrices] = useState<RentalPrices>({ hourlyRate: 0, halfHourRate: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const repository = new PriceRepository();

  useEffect(() => {
    repository.getPrices().then((data) => {
      setPrices(data);
      setIsLoading(false);
    });
  }, []);

  const savePrices = async (newPrices: RentalPrices) => {
    await repository.savePrices(newPrices);
    setPrices(newPrices);
  };

  return {
    prices,
    isLoading,
    savePrices,
  };
};
