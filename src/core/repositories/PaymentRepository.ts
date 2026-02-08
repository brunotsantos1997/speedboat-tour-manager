// src/core/repositories/PaymentRepository.ts
import {
  collection,
  getDocs,
  addDoc,
  doc,
  getDoc,
  onSnapshot,
  query,
  type Unsubscribe,
  deleteDoc
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import type { Payment } from '../domain/types';
import { auditLogRepository } from './AuditLogRepository';

export interface IPaymentRepository {
  getAll(): Promise<Payment[]>;
  getByEventId(eventId: string): Promise<Payment[]>;
  getByDateRange(startDate: string, endDate: string): Promise<Payment[]>;
  add(paymentData: Omit<Payment, 'id'>): Promise<Payment>;
  remove(paymentId: string): Promise<void>;
  dispose(): void;
  initialize(user?: any): void;
}

class PaymentRepositoryImpl implements IPaymentRepository {
  private static instance: PaymentRepositoryImpl;
  private payments: Payment[] = [];
  private collectionName = 'payments';
  private unsubscribe: Unsubscribe | null = null;
  private isInitialized = false;
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
    if (this.unsubscribe) return;
    this.initListener();
  }

  private initListener() {
    const q = query(collection(db, this.collectionName));
    this.unsubscribe = onSnapshot(q, (snapshot) => {
      this.payments = snapshot.docs
        .map(doc => ({
          ...doc.data() as Payment,
          id: doc.id
        }))
        .sort((a, b) => b.timestamp - a.timestamp);
      this.isInitialized = true;
    });
  }

  dispose() {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
    this.isInitialized = false;
    this.payments = [];
    this.currentUser = null;
  }

  async getAll(): Promise<Payment[]> {
    if (!this.isInitialized) {
      const q = query(collection(db, this.collectionName));
      const querySnapshot = await getDocs(q);
      this.payments = querySnapshot.docs
        .map(doc => ({
          ...doc.data() as Payment,
          id: doc.id
        }))
        .sort((a, b) => b.timestamp - a.timestamp);
      this.isInitialized = true;
    }
    return this.payments;
  }

  async getByEventId(eventId: string): Promise<Payment[]> {
    const all = await this.getAll();
    return all
      .filter(p => p.eventId === eventId)
      .sort((a, b) => a.timestamp - b.timestamp);
  }

  async getByDateRange(startDate: string, endDate: string): Promise<Payment[]> {
    const all = await this.getAll();
    return all
      .filter(p => p.date >= startDate && p.date <= endDate)
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  async add(paymentData: Omit<Payment, 'id'>): Promise<Payment> {
    const docRef = await addDoc(collection(db, this.collectionName), paymentData);
    const newPayment = { id: docRef.id, ...paymentData };

    await auditLogRepository.log({
      userId: this.currentUser?.id || 'unknown',
      userName: this.currentUser?.name || 'Sistema',
      action: 'CREATE',
      collection: this.collectionName,
      docId: docRef.id,
      newData: newPayment,
    });

    return newPayment;
  }

  async remove(paymentId: string): Promise<void> {
    if (!this.currentUser || (this.currentUser.role !== 'OWNER' && this.currentUser.role !== 'SUPER_ADMIN' && this.currentUser.role !== 'ADMIN')) {
      throw new Error('Você não tem permissão para excluir pagamentos.');
    }

    const docRef = doc(db, this.collectionName, paymentId);
    const oldDoc = await getDoc(docRef);
    const oldData = oldDoc.exists() ? { ...oldDoc.data(), id: oldDoc.id } : null;

    await deleteDoc(docRef);

    await auditLogRepository.log({
      userId: this.currentUser?.id || 'unknown',
      userName: this.currentUser?.name || 'Sistema',
      action: 'DELETE',
      collection: this.collectionName,
      docId: paymentId,
      oldData,
    });
  }
}

export const paymentRepository = PaymentRepositoryImpl.getInstance();
