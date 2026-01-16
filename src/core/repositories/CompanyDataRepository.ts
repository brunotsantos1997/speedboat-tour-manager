// src/core/repositories/CompanyDataRepository.ts
import type { CompanyData } from '../domain/types';
import { v4 as uuidv4 } from 'uuid';

const STORAGE_KEY = 'companyData';

export class CompanyDataRepository {
  private static instance: CompanyDataRepository;
  private data: CompanyData;

  private constructor() {
    const storedData = localStorage.getItem(STORAGE_KEY);
    if (storedData) {
      this.data = JSON.parse(storedData);
    } else {
      this.data = {
        id: uuidv4(),
        cnpj: '00.000.000/0001-00',
        phone: '(00) 00000-0000',
        appName: 'BoatManager',
      };
      this.saveToLocalStorage();
    }
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
