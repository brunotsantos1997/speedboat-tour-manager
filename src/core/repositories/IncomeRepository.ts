// src/core/repositories/IncomeRepository.ts
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
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
import type { Income } from '../domain/types';
import { auditLogRepository } from './AuditLogRepository';

export interface IIncomeRepository {
  getAll(): Promise<Income[]>;
  getByDateRange(startDate: string, endDate: string): Promise<Income[]>;
  add(incomeData: Omit<Income, 'id'>): Promise<Income>;
  update(updatedIncome: Income): Promise<Income>;
  remove(incomeId: string): Promise<void>;
  dispose(): void;
  initialize(user?: any): void;
}

class IncomeRepositoryImpl implements IIncomeRepository {
  private static instance: IncomeRepositoryImpl;
  private incomes: Income[] = [];
  private collectionName = 'incomes';
  private unsubscribe: Unsubscribe | null = null;
  private isInitialized = false;
  private currentUser: any = null;

  private constructor() {}

  public static getInstance(): IncomeRepositoryImpl {
    if (!IncomeRepositoryImpl.instance) {
      IncomeRepositoryImpl.instance = new IncomeRepositoryImpl();
    }
    return IncomeRepositoryImpl.instance;
  }

  initialize(user?: any) {
    if (user) {
      this.currentUser = user;
    }
    if (this.unsubscribe) return;
    this.initListener();
  }

  private initListener() {
    const q = query(collection(db, this.collectionName), orderBy('date', 'desc'));
    this.unsubscribe = onSnapshot(q, (snapshot) => {
      this.incomes = snapshot.docs.map(doc => ({
        ...doc.data() as Income,
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
    this.incomes = [];
    this.currentUser = null;
  }

  async getAll(): Promise<Income[]> {
    if (!this.isInitialized) {
      const q = query(collection(db, this.collectionName), orderBy('date', 'desc'));
      const querySnapshot = await getDocs(q);
      this.incomes = querySnapshot.docs.map(doc => ({
        ...doc.data() as Income,
        id: doc.id
      }));
      this.isInitialized = true;
    }
    return this.incomes;
  }

  async getByDateRange(startDate: string, endDate: string): Promise<Income[]> {
    const q = query(
      collection(db, this.collectionName),
      where('date', '>=', startDate),
      where('date', '<=', endDate),
      orderBy('date', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      ...doc.data() as Income,
      id: doc.id
    }));
  }

  private checkAdminPermission() {
    if (!this.currentUser || (this.currentUser.role !== 'OWNER' && this.currentUser.role !== 'SUPER_ADMIN' && this.currentUser.role !== 'ADMIN')) {
      throw new Error('Você não tem permissão para realizar esta ação.');
    }
  }

  async add(incomeData: Omit<Income, 'id'>): Promise<Income> {
    this.checkAdminPermission();
    const docRef = await addDoc(collection(db, this.collectionName), incomeData);
    const newIncome = { id: docRef.id, ...incomeData };

    await auditLogRepository.log({
      userId: this.currentUser?.id || 'unknown',
      userName: this.currentUser?.name || 'Sistema',
      action: 'CREATE',
      collection: this.collectionName,
      docId: docRef.id,
      newData: newIncome,
    });

    return newIncome;
  }

  async update(updatedIncome: Income): Promise<Income> {
    this.checkAdminPermission();
    const { id, ...data } = updatedIncome;
    const docRef = doc(db, this.collectionName, id);

    const oldDoc = await getDoc(docRef);
    const oldData = oldDoc.exists() ? { ...oldDoc.data(), id: oldDoc.id } : null;

    await updateDoc(docRef, data as any);

    await auditLogRepository.log({
      userId: this.currentUser?.id || 'unknown',
      userName: this.currentUser?.name || 'Sistema',
      action: 'UPDATE',
      collection: this.collectionName,
      docId: id,
      oldData,
      newData: updatedIncome,
    });

    return updatedIncome;
  }

  async remove(incomeId: string): Promise<void> {
    this.checkAdminPermission();
    const docRef = doc(db, this.collectionName, incomeId);

    const oldDoc = await getDoc(docRef);
    const oldData = oldDoc.exists() ? { ...oldDoc.data(), id: oldDoc.id } : null;

    await deleteDoc(docRef);

    await auditLogRepository.log({
      userId: this.currentUser?.id || 'unknown',
      userName: this.currentUser?.name || 'Sistema',
      action: 'DELETE',
      collection: this.collectionName,
      docId: incomeId,
      oldData,
    });
  }
}

export const incomeRepository = IncomeRepositoryImpl.getInstance();
