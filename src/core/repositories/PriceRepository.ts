// src/core/repositories/PriceRepository.ts
import { CompanyDataRepository } from './CompanyDataRepository';

export interface RentalPrices {
  hourlyRate: number;
  halfHourRate: number;
}

// Default values as fallback
const DEFAULT_HOURLY_RATE = 2500;
const DEFAULT_HALF_HOUR_RATE = 1300;

export class PriceRepository {
  private companyDataRepository = CompanyDataRepository.getInstance();

  async getPrices(): Promise<RentalPrices> {
    const data = await this.companyDataRepository.get();
    return {
      hourlyRate: data?.rentalHourlyRate ?? DEFAULT_HOURLY_RATE,
      halfHourRate: data?.rentalHalfHourRate ?? DEFAULT_HALF_HOUR_RATE,
    };
  }

  async savePrices(prices: RentalPrices): Promise<void> {
    const data = await this.companyDataRepository.get();
    if (data) {
      await this.companyDataRepository.update({
        ...data,
        rentalHourlyRate: prices.hourlyRate,
        rentalHalfHourRate: prices.halfHourRate,
      });
    }
  }
}
