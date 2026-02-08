// src/core/repositories/VoucherTermsRepository.ts
import { doc, getDoc, setDoc, onSnapshot, type Unsubscribe } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import type { VoucherTerms } from '../domain/types';
import { auditLogRepository } from './AuditLogRepository';

export class VoucherTermsRepository {
  private static instance: VoucherTermsRepository;
  private docId = 'default';
  private collectionName = 'voucher_terms';
  private data: VoucherTerms | null = null;
  private unsubscribe: Unsubscribe | null = null;
  private currentUser: any = null;
  private listeners: ((data: VoucherTerms | null) => void)[] = [];

  private constructor() {}

  public static getInstance(): VoucherTermsRepository {
    if (!VoucherTermsRepository.instance) {
      VoucherTermsRepository.instance = new VoucherTermsRepository();
    }
    return VoucherTermsRepository.instance;
  }

  initialize(user?: any) {
    if (user) {
      this.currentUser = user;
    }
    if (this.unsubscribe) return;
    this.initListener();
  }

  private initListener() {
    const docRef = doc(db, this.collectionName, this.docId);
    this.unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        this.data = { ...docSnap.data() as VoucherTerms, id: docSnap.id };
      } else {
        this.data = null;
      }
      this.notifyListeners();
    });
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.data));
  }

  subscribe(listener: (data: VoucherTerms | null) => void) {
    this.listeners.push(listener);
    if (this.data) {
      listener(this.data);
    }
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  dispose() {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
    this.data = null;
    this.currentUser = null;
  }

  async get(): Promise<VoucherTerms> {
    if (this.data) return this.data;

    const docRef = doc(db, this.collectionName, this.docId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      this.data = { ...docSnap.data() as VoucherTerms, id: docSnap.id };
      return this.data;
    }

    const defaultData = {
      id: this.docId,
      terms: `
        <h2>Termos e Condições</h2>
        <p><strong>1. Cancelamento e Reembolso:</strong> O cancelamento com reembolso de 100% do sinal é permitido apenas se feito com 7 dias de antecedência. Após este período, o sinal não é reembolsável.</p>
        <p><strong>2. Condições Climáticas:</strong> Condições climáticas adversas (chuva forte, ventos perigosos) podem levar ao reagendamento do passeio sem custo adicional, a ser combinado entre as partes.</p>
        <p><strong>3. Responsabilidade:</strong> Danos causados à embarcação por mau uso dos passageiros são de responsabilidade do contratante.</p>
        <p><strong>4. Embarque:</strong> O embarque ocorrerá no local e horário combinados. É recomendado chegar com 15 minutos de antecedência. A tolerância de atraso é de 10 minutos.</p>
      `.trim()
    };

    // Try to save default data to server
    try {
      const { id, ...dataToSave } = defaultData;
      await setDoc(docRef, dataToSave);
      this.data = defaultData;
      this.notifyListeners();
    } catch (e) {
      console.warn("Could not save default voucher terms data to server:", e);
    }

    return defaultData;
  }

  async update(updatedData: VoucherTerms): Promise<VoucherTerms> {
    if (!this.currentUser || (this.currentUser.role !== 'OWNER' && this.currentUser.role !== 'SUPER_ADMIN')) {
      throw new Error('Você não tem permissão para alterar os termos do voucher.');
    }
    const { id, ...data } = updatedData;
    const docRef = doc(db, this.collectionName, this.docId);

    const oldSnap = await getDoc(docRef);
    const oldData = oldSnap.exists() ? { ...oldSnap.data(), id: oldSnap.id } : null;

    await setDoc(docRef, data, { merge: true });

    await auditLogRepository.log({
      userId: this.currentUser.id,
      userName: this.currentUser.name,
      action: 'UPDATE',
      collection: this.collectionName,
      docId: this.docId,
      oldData,
      newData: updatedData,
    });

    this.data = updatedData;
    return updatedData;
  }
}
