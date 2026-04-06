// src/core/repositories/ExpenseRepository.ts
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  getDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
  type Unsubscribe
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import type { Expense } from '../domain/types';
import { auditLogRepository } from './AuditLogRepository';

export interface IExpenseRepository {
  getAll(limitCount?: number): Promise<Expense[]>;
  getByDateRange(startDate: string, endDate: string): Promise<Expense[]>;
  add(expenseData: Omit<Expense, 'id'>): Promise<Expense>;
  update(updatedExpense: Expense): Promise<Expense>;
  remove(expenseId: string): Promise<void>;
  dispose(): void;
  initialize(user?: any): void;
  subscribe(callback: (data: Expense[]) => Unsubscribe): Unsubscribe;
  subscribeByDateRange(startDate: string, endDate: string, callback: (data: Expense[]) => void): Unsubscribe;
}

class ExpenseRepositoryImpl implements IExpenseRepository {
  private static instance: ExpenseRepositoryImpl;
  private collectionName = 'expenses';
  private currentUser: any = null;

  private constructor() {}

  public static getInstance(): ExpenseRepositoryImpl {
    if (!ExpenseRepositoryImpl.instance) {
      ExpenseRepositoryImpl.instance = new ExpenseRepositoryImpl();
    }
    return ExpenseRepositoryImpl.instance;
  }

  initialize(user?: any) {
    if (user) {
      this.currentUser = user;
    }
  }

  subscribe(callback: (data: Expense[]) => void): Unsubscribe {
    const q = query(
      collection(db, this.collectionName),
      orderBy('date', 'desc'),
      limit(100)
    );
    return onSnapshot(q, (snapshot) => {
      const expenses = snapshot.docs.map(doc => ({
        ...doc.data() as Expense,
        id: doc.id
      }));
      callback(expenses);
    });
  }

  subscribeByDateRange(startDate: string, endDate: string, callback: (data: Expense[]) => void): Unsubscribe {
    const q = query(
      collection(db, this.collectionName),
      where('date', '>=', startDate),
      where('date', '<=', endDate),
      orderBy('date', 'desc')
    );
    return onSnapshot(q, (snapshot) => {
      const expenses = snapshot.docs.map(doc => ({
        ...doc.data() as Expense,
        id: doc.id
      }));
      callback(expenses);
    });
  }

  dispose() {
    this.currentUser = null;
  }

  async getAll(limitCount: number = 100): Promise<Expense[]> {
    const q = query(
      collection(db, this.collectionName),
      orderBy('date', 'desc'),
      limit(limitCount)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      ...doc.data() as Expense,
      id: doc.id
    }));
  }

  async getByDateRange(startDate: string, endDate: string): Promise<Expense[]> {
    const q = query(
      collection(db, this.collectionName),
      where('date', '>=', startDate),
      where('date', '<=', endDate),
      orderBy('date', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      ...doc.data() as Expense,
      id: doc.id
    }));
  }

  private checkAdminPermission() {
    if (!this.currentUser || (this.currentUser.role !== 'OWNER' && this.currentUser.role !== 'SUPER_ADMIN' && this.currentUser.role !== 'ADMIN')) {
      throw new Error('Você não tem permissão para realizar esta ação.');
    }
  }

  async add(expenseData: Omit<Expense, 'id'>): Promise<Expense> {
    this.checkAdminPermission();
    const docRef = await addDoc(collection(db, this.collectionName), expenseData);
    const newExpense = { id: docRef.id, ...expenseData };

    await auditLogRepository.log({
      userId: this.currentUser?.id || 'unknown',
      userName: this.currentUser?.name || 'Sistema',
      action: 'CREATE',
      collection: this.collectionName,
      docId: docRef.id,
      newData: newExpense,
    });

    return newExpense;
  }

  async update(updatedExpense: Expense): Promise<Expense> {
    this.checkAdminPermission();
    const { id, ...data } = updatedExpense;
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
      newData: updatedExpense,
    });

    return updatedExpense;
  }

  async remove(expenseId: string): Promise<void> {
    this.checkAdminPermission();
    const docRef = doc(db, this.collectionName, expenseId);

    const oldDoc = await getDoc(docRef);
    const oldData = oldDoc.exists() ? { ...oldDoc.data(), id: oldDoc.id } : null;

    await updateDoc(docRef, { isArchived: true });

    await auditLogRepository.log({
      userId: this.currentUser?.id || 'unknown',
      userName: this.currentUser?.name || 'Sistema',
      action: 'DELETE',
      collection: this.collectionName,
      docId: expenseId,
      oldData,
      newData: { ...oldData, isArchived: true },
    });
  }
}

export const expenseRepository = ExpenseRepositoryImpl.getInstance();
