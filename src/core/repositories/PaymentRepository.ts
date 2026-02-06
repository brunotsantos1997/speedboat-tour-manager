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
  where,
  orderBy,
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
    const q = query(collection(db, this.collectionName), orderBy('timestamp', 'desc'));
    this.unsubscribe = onSnapshot(q, (snapshot) => {
      this.payments = snapshot.docs.map(doc => ({
        ...doc.data() as Payment,
        id: doc.id
      }));
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
      const q = query(collection(db, this.collectionName), orderBy('timestamp', 'desc'));
      const querySnapshot = await getDocs(q);
      this.payments = querySnapshot.docs.map(doc => ({
        ...doc.data() as Payment,
        id: doc.id
      }));
      this.isInitialized = true;
    }
    return this.payments;
  }

  async getByEventId(eventId: string): Promise<Payment[]> {
    const q = query(
      collection(db, this.collectionName),
      where('eventId', '==', eventId),
      orderBy('timestamp', 'asc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      ...doc.data() as Payment,
      id: doc.id
    }));
  }

  async getByDateRange(startDate: string, endDate: string): Promise<Payment[]> {
    const q = query(
      collection(db, this.collectionName),
      where('date', '>=', startDate),
      where('date', '<=', endDate),
      orderBy('date', 'asc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      ...doc.data() as Payment,
      id: doc.id
    }));
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
