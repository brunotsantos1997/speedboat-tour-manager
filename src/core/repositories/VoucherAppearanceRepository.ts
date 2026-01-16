// src/core/repositories/VoucherAppearanceRepository.ts
import { v4 as uuidv4 } from 'uuid';

const STORAGE_KEY = 'voucherAppearance';

export interface VoucherAppearanceData {
  id: string;
  watermarkImage: string | null;
}

export class VoucherAppearanceRepository {
  private static instance: VoucherAppearanceRepository;
  private data: VoucherAppearanceData;

  private constructor() {
    const storedData = localStorage.getItem(STORAGE_KEY);
    if (storedData) {
      this.data = JSON.parse(storedData);
    } else {
      this.data = {
        id: uuidv4(),
        watermarkImage: null,
      };
      this.saveToLocalStorage();
    }
  }

  public static getInstance(): VoucherAppearanceRepository {
    if (!VoucherAppearanceRepository.instance) {
      VoucherAppearanceRepository.instance = new VoucherAppearanceRepository();
    }
    return VoucherAppearanceRepository.instance;
  }

  private saveToLocalStorage(): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
  }

  async get(): Promise<VoucherAppearanceData> {
    return Promise.resolve(this.data);
  }

  async update(updatedData: Partial<VoucherAppearanceData>): Promise<VoucherAppearanceData> {
    this.data = { ...this.data, ...updatedData };
    this.saveToLocalStorage();
    return Promise.resolve(this.data);
  }
}
