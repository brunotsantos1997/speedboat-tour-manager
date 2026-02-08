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
  type Unsubscribe
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import type { Expense } from '../domain/types';
import { auditLogRepository } from './AuditLogRepository';

export interface IExpenseRepository {
  getAll(): Promise<Expense[]>;
  getByDateRange(startDate: string, endDate: string): Promise<Expense[]>;
  add(expenseData: Omit<Expense, 'id'>): Promise<Expense>;
  update(updatedExpense: Expense): Promise<Expense>;
  remove(expenseId: string): Promise<void>;
  dispose(): void;
  initialize(user?: any): void;
}

class ExpenseRepositoryImpl implements IExpenseRepository {
  private static instance: ExpenseRepositoryImpl;
  private expenses: Expense[] = [];
  private collectionName = 'expenses';
  private unsubscribe: Unsubscribe | null = null;
  private isInitialized = false;
  private currentUser: any = null;
  private listeners: ((data: Expense[]) => void)[] = [];

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
    if (this.unsubscribe) return;
    this.initListener();
  }

  private initListener() {
    const q = query(collection(db, this.collectionName));
    this.unsubscribe = onSnapshot(q, (snapshot) => {
      this.expenses = snapshot.docs
        .map(doc => ({
          ...doc.data() as Expense,
          id: doc.id
        }))
        .sort((a, b) => b.date.localeCompare(a.date));
      this.isInitialized = true;
      this.notifyListeners();
    });
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.expenses));
  }

  subscribe(listener: (data: Expense[]) => void) {
    this.listeners.push(listener);
    if (this.isInitialized) {
      listener(this.expenses);
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
    this.isInitialized = false;
    this.expenses = [];
    this.currentUser = null;
  }

  async getAll(): Promise<Expense[]> {
    if (!this.isInitialized) {
      const q = query(collection(db, this.collectionName));
      const querySnapshot = await getDocs(q);
      this.expenses = querySnapshot.docs
        .map(doc => ({
          ...doc.data() as Expense,
          id: doc.id
        }))
        .sort((a, b) => b.date.localeCompare(a.date));
      this.isInitialized = true;
    }
    return this.expenses;
  }

  async getByDateRange(startDate: string, endDate: string): Promise<Expense[]> {
    const all = await this.getAll();
    return all.filter(e => e.date >= startDate && e.date <= endDate);
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

    // Hard delete for expenses as they are not usually "archived" like domain entities,
    // but follow the pattern if needed. Here I'll do a simple delete for now, or use isArchived.
    // The user didn't specify, but for financial records, archiving might be safer.
    // Let's use isArchived to stay consistent.
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
