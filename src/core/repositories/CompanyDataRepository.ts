// src/core/repositories/CompanyDataRepository.ts
import { doc, getDoc, setDoc, onSnapshot, type Unsubscribe } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import type { CompanyData, DayOfWeek } from '../domain/types';

export class CompanyDataRepository {
  private static instance: CompanyDataRepository;
  private docId = 'default';
  private collectionName = 'company_data';
  private data: CompanyData | null = null;
  private unsubscribe: Unsubscribe | null = null;
  private currentUser: any = null;
  private listeners: ((data: CompanyData | null) => void)[] = [];

  private constructor() {}

  public static getInstance(): CompanyDataRepository {
    if (!CompanyDataRepository.instance) {
      CompanyDataRepository.instance = new CompanyDataRepository();
    }
    return CompanyDataRepository.instance;
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
        const fetchedData = { ...docSnap.data() as CompanyData, id: docSnap.id };
        // Ensure all business hours are present
        if (!fetchedData.businessHours) {
          fetchedData.businessHours = {} as any;
        }
        const days: DayOfWeek[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        days.forEach(day => {
          if (!fetchedData.businessHours[day]) {
            fetchedData.businessHours[day] = { startTime: '08:00', endTime: '18:00', isClosed: day === 'sunday' || day === 'saturday' };
          }
        });
        this.data = fetchedData;
      } else {
        this.data = null;
      }
      this.notifyListeners();
    });
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.data));
  }

  subscribe(listener: (data: CompanyData | null) => void) {
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

  async get(): Promise<CompanyData | undefined> {
    if (this.data) return this.data;

    const docRef = doc(db, this.collectionName, this.docId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const fetchedData = { ...docSnap.data() as CompanyData, id: docSnap.id };
      // Ensure all business hours are present even if partially saved
      if (!fetchedData.businessHours) {
        fetchedData.businessHours = {} as any;
      }
      const days: DayOfWeek[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      days.forEach(day => {
        if (!fetchedData.businessHours[day]) {
          fetchedData.businessHours[day] = { startTime: '08:00', endTime: '18:00', isClosed: day === 'sunday' || day === 'saturday' };
        }
      });
      this.data = fetchedData;
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
      commissionBasis: 'RENTAL_ONLY',
    };

    this.data = defaultData;
    this.notifyListeners();

    return defaultData;
  }

  async update(updatedData: CompanyData): Promise<CompanyData> {
    if (!this.currentUser || (this.currentUser.role !== 'OWNER' && this.currentUser.role !== 'SUPER_ADMIN')) {
      throw new Error('Você não tem permissão para alterar as configurações da empresa.');
    }
    const { id, ...data } = updatedData;
    const docRef = doc(db, this.collectionName, this.docId);

    await setDoc(docRef, data, { merge: true });

    this.data = updatedData;
    return updatedData;
  }
}

export const companyDataRepository = CompanyDataRepository.getInstance();
