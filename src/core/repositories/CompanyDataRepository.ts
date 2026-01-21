// src/core/repositories/CompanyDataRepository.ts
import type { CompanyData } from '../domain/types';
import { v4 as uuidv4 } from 'uuid';

const STORAGE_KEY = 'companyData';

export class CompanyDataRepository {
  private static instance: CompanyDataRepository;
  private data: CompanyData;

  private constructor() {
    const defaultData: CompanyData = {
      id: uuidv4(),
      cnpj: '00.000.000/0001-00',
      phone: '(00) 00000-0000',
      appName: 'BoatManager',
      reservationFeePercentage: 30,
      businessHours: {
        sunday: { startTime: '08:00', endTime: '18:00', isClosed: true },
        monday: { startTime: '08:00', endTime: '18:00', isClosed: false },
        tuesday: { startTime: '08:00', endTime: '18:00', isClosed: false },
        wednesday: { startTime: '08:00', endTime: '18:00', isClosed: false },
        thursday: { startTime: '08:00', endTime: '18:00', isClosed: false },
        friday: { startTime: '08:00', endTime: '18:00', isClosed: false },
        saturday: { startTime: '08:00', endTime: '18:00', isClosed: true },
      },
      eventIntervalMinutes: 30,
    };

    const storedData = localStorage.getItem(STORAGE_KEY);
    let loadedData = defaultData;

    if (storedData) {
      try {
        const parsedData = JSON.parse(storedData);
        // Ensure parsedData is a valid object before merging
        if (parsedData && typeof parsedData === 'object') {
          loadedData = {
            ...defaultData,
            ...parsedData,
            businessHours: {
              ...defaultData.businessHours,
              ...(parsedData.businessHours || {}),
            },
          };
        }
      } catch (error) {
        console.error('Failed to parse company data from localStorage, falling back to default.', error);
        // If parsing fails, we stick with the default data
        loadedData = defaultData;
      }
    }

    this.data = loadedData;
    this.saveToLocalStorage();
  }

  public static getInstance(): CompanyDataRepository {
    if (!CompanyDataRepository.instance) {
      CompanyDataRepository.instance = new CompanyDataRepository();
    }
    return CompanyDataRepository.instance;
  }

  private saveToLocalStorage(): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
  }

  async get(): Promise<CompanyData> {
    return Promise.resolve(this.data);
  }

  async update(updatedData: Partial<CompanyData>): Promise<CompanyData> {
    this.data = { ...this.data, ...updatedData };
    this.saveToLocalStorage();
    return Promise.resolve(this.data);
  }
}
