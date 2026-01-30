// src/core/repositories/CompanyDataRepository.ts
import { doc, getDoc, setDoc, onSnapshot, type Unsubscribe } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import type { CompanyData } from '../domain/types';

export class CompanyDataRepository {
  private static instance: CompanyDataRepository;
  private docId = 'default';
  private collectionName = 'company_data';
  private data: CompanyData | null = null;
  private unsubscribe: Unsubscribe | null = null;

  private constructor() {}

  public static getInstance(): CompanyDataRepository {
    if (!CompanyDataRepository.instance) {
      CompanyDataRepository.instance = new CompanyDataRepository();
    }
    return CompanyDataRepository.instance;
  }

  initialize() {
    if (this.unsubscribe) return;
    this.initListener();
  }

  private initListener() {
    const docRef = doc(db, this.collectionName, this.docId);
    this.unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        this.data = { ...docSnap.data() as CompanyData, id: docSnap.id };
      }
    });
  }

  dispose() {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
    this.data = null;
  }

  async get(): Promise<CompanyData | undefined> {
    if (this.data) return this.data;

    const docRef = doc(db, this.collectionName, this.docId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      this.data = { ...docSnap.data() as CompanyData, id: docSnap.id };
      return this.data;
    }

    const defaultData: CompanyData = {
      id: this.docId,
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
    return defaultData;
  }

  async update(updatedData: CompanyData): Promise<CompanyData> {
    const { id, ...data } = updatedData;
    const docRef = doc(db, this.collectionName, this.docId);
    await setDoc(docRef, data, { merge: true });
    this.data = updatedData;
    return updatedData;
  }
}
