// src/core/repositories/PriceRepository.ts
export interface RentalPrices {
  hourlyRate: number;
  halfHourRate: number;
}

const HOURLY_RATE_KEY = 'rentalHourlyRate';
const HALF_HOUR_RATE_KEY = 'rentalHalfHourRate';

import { BOAT_HOURLY_RATE, BOAT_HALF_HOUR_RATE } from '../config';

export class PriceRepository {
  async getPrices(): Promise<RentalPrices> {
    const hourlyRate = localStorage.getItem(HOURLY_RATE_KEY);
    const halfHourRate = localStorage.getItem(HALF_HOUR_RATE_KEY);

    return Promise.resolve({
      hourlyRate: hourlyRate ? parseFloat(hourlyRate) : BOAT_HOURLY_RATE,
      halfHourRate: halfHourRate ? parseFloat(halfHourRate) : BOAT_HALF_HOUR_RATE,
    });
  }

  async savePrices(prices: RentalPrices): Promise<void> {
    localStorage.setItem(HOURLY_RATE_KEY, prices.hourlyRate.toString());
    localStorage.setItem(HALF_HOUR_RATE_KEY, prices.halfHourRate.toString());
    return Promise.resolve();
  }
}
