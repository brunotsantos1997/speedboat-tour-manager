// src/core/repositories/VoucherTermsRepository.ts
import type { VoucherTerms } from '../domain/types';
import { v4 as uuidv4 } from 'uuid';

const STORAGE_KEY = 'voucherTerms';
const DEFAULT_TERMS = `
1. O cancelamento com reembolso de 100% do sinal é permitido apenas se feito com 7 dias de antecedência. Após este período, o sinal não é reembolsável.
2. Condições climáticas adversas (chuva forte, ventos perigosos) podem levar ao reagendamento do passeio sem custo adicional, a ser combinado entre as partes.
3. Danos causados à embarcação por mau uso dos passageiros são de responsabilidade do contratante.
4. O embarque ocorrerá na Marina da Glória, portão B. É recomendado chegar com 15 minutos de antecedência. Tolerância de atraso de 10 minutos.
`.trim();

export class VoucherTermsRepository {
  private static instance: VoucherTermsRepository;
  private data: VoucherTerms;

  private constructor() {
    const storedData = localStorage.getItem(STORAGE_KEY);
    if (storedData) {
      this.data = JSON.parse(storedData);
    } else {
      this.data = {
        id: uuidv4(),
        terms: DEFAULT_TERMS,
      };
      this.saveToLocalStorage();
    }
  }

  public static getInstance(): VoucherTermsRepository {
    if (!VoucherTermsRepository.instance) {
      VoucherTermsRepository.instance = new VoucherTermsRepository();
    }
    return VoucherTermsRepository.instance;
  }

  private saveToLocalStorage(): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
  }

  async get(): Promise<VoucherTerms> {
    return Promise.resolve(this.data);
  }

  async update(updatedData: Partial<VoucherTerms>): Promise<VoucherTerms> {
    this.data = { ...this.data, ...updatedData };
    this.saveToLocalStorage();
    return Promise.resolve(this.data);
  }
}
