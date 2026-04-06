// src/core/repositories/PaymentRepository.ts
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  onSnapshot,
  query,
  where,
  limit,
  orderBy,
  type Unsubscribe
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import type { Payment } from '../domain/types';

export interface IPaymentRepository {
  getByEventId(eventId: string): Promise<Payment[]>;
  subscribeToEventPayments(eventId: string, callback: (data: Payment[]) => void): Unsubscribe;
  add(paymentData: Omit<Payment, 'id'>): Promise<Payment>;
  getAll(limitCount?: number): Promise<Payment[]>;
  dispose(): void;
  initialize(user?: any): void;
}

class PaymentRepositoryImpl implements IPaymentRepository {
  private static instance: PaymentRepositoryImpl;
  private collectionName = 'payments';
  private currentUser: any = null;

  private constructor() {}

  public static getInstance(): PaymentRepositoryImpl {
    if (!PaymentRepositoryImpl.instance) {
      PaymentRepositoryImpl.instance = new PaymentRepositoryImpl();
    }
    return PaymentRepositoryImpl.instance;
  }

  initialize(user?: any) {
    if (user) {
      this.currentUser = user;
    }
  }

  subscribe(callback: (data: Payment[]) => void): Unsubscribe {
    // Limited global listener for dashboard/summary, latest 100 payments
    const q = query(
      collection(db, this.collectionName),
      orderBy('timestamp', 'desc'),
      limit(100)
    );
    return onSnapshot(q, (snapshot) => {
      callback(snapshot.docs.map(doc => ({ ...doc.data() as Payment, id: doc.id })));
    });
  }

  subscribeToEventPayments(eventId: string, callback: (data: Payment[]) => void): Unsubscribe {
    const q = query(collection(db, this.collectionName), where('eventId', '==', eventId));
    return onSnapshot(q, (snapshot) => {
      const payments = snapshot.docs.map(doc => ({
        ...doc.data() as Payment,
        id: doc.id
      }));
      callback(payments);
    });
  }

  dispose() {
    this.currentUser = null;
  }

  async getAll(limitCount: number = 100): Promise<Payment[]> {
    const q = query(
      collection(db, this.collectionName),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      ...doc.data() as Payment,
      id: doc.id
    }));
  }

  async getByEventId(eventId: string): Promise<Payment[]> {
    const q = query(collection(db, this.collectionName), where('eventId', '==', eventId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      ...doc.data() as Payment,
      id: doc.id
    }));
  }

  private checkAdminPermission() {
    if (!this.currentUser || (this.currentUser.role !== 'OWNER' && this.currentUser.role !== 'SUPER_ADMIN' && this.currentUser.role !== 'ADMIN')) {
      throw new Error('Você não tem permissão para realizar esta ação.');
    }
  }

  async add(paymentData: Omit<Payment, 'id'>): Promise<Payment> {
    this.checkAdminPermission();
    const docRef = await addDoc(collection(db, this.collectionName), paymentData);
    return { id: docRef.id, ...paymentData };
  }
}

export const paymentRepository = PaymentRepositoryImpl.getInstance();
