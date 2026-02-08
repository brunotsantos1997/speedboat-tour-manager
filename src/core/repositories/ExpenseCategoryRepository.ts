// src/core/repositories/ExpenseCategoryRepository.ts
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
import type { ExpenseCategory } from '../domain/types';
import { auditLogRepository } from './AuditLogRepository';

export interface IExpenseCategoryRepository {
  getAll(): Promise<ExpenseCategory[]>;
  add(categoryData: Omit<ExpenseCategory, 'id'>): Promise<ExpenseCategory>;
  update(updatedCategory: ExpenseCategory): Promise<ExpenseCategory>;
  remove(categoryId: string): Promise<void>;
  dispose(): void;
  initialize(user?: any): void;
}

class ExpenseCategoryRepositoryImpl implements IExpenseCategoryRepository {
  private static instance: ExpenseCategoryRepositoryImpl;
  private categories: ExpenseCategory[] = [];
  private collectionName = 'expense_categories';
  private unsubscribe: Unsubscribe | null = null;
  private isInitialized = false;
  private currentUser: any = null;
  private listeners: ((data: ExpenseCategory[]) => void)[] = [];

  private constructor() {}

  public static getInstance(): ExpenseCategoryRepositoryImpl {
    if (!ExpenseCategoryRepositoryImpl.instance) {
      ExpenseCategoryRepositoryImpl.instance = new ExpenseCategoryRepositoryImpl();
    }
    return ExpenseCategoryRepositoryImpl.instance;
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
      this.categories = snapshot.docs.map(doc => ({
        ...doc.data() as ExpenseCategory,
        id: doc.id
      }));
      this.isInitialized = true;
      this.notifyListeners();
    });
  }

  private notifyListeners() {
    const activeCategories = this.categories.filter(c => !c.isArchived);
    this.listeners.forEach(listener => listener(activeCategories));
  }

  subscribe(listener: (data: ExpenseCategory[]) => void) {
    this.listeners.push(listener);
    if (this.isInitialized) {
      listener(this.categories.filter(c => !c.isArchived));
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
    this.categories = [];
    this.currentUser = null;
  }

  async getAll(): Promise<ExpenseCategory[]> {
    if (!this.isInitialized) {
      const querySnapshot = await getDocs(collection(db, this.collectionName));
      this.categories = querySnapshot.docs.map(doc => ({
        ...doc.data() as ExpenseCategory,
        id: doc.id
      }));
      this.isInitialized = true;
    }
    return this.categories.filter(c => !c.isArchived);
  }

  private checkAdminPermission() {
    if (!this.currentUser || (this.currentUser.role !== 'OWNER' && this.currentUser.role !== 'SUPER_ADMIN' && this.currentUser.role !== 'ADMIN')) {
      throw new Error('Você não tem permissão para realizar esta ação.');
    }
  }

  async add(categoryData: Omit<ExpenseCategory, 'id'>): Promise<ExpenseCategory> {
    this.checkAdminPermission();
    const docRef = await addDoc(collection(db, this.collectionName), categoryData);
    const newCategory = { id: docRef.id, ...categoryData };

    await auditLogRepository.log({
      userId: this.currentUser?.id || 'unknown',
      userName: this.currentUser?.name || 'Sistema',
      action: 'CREATE',
      collection: this.collectionName,
      docId: docRef.id,
      newData: newCategory,
    });

    return newCategory;
  }

  async update(updatedCategory: ExpenseCategory): Promise<ExpenseCategory> {
    this.checkAdminPermission();
    const { id, ...data } = updatedCategory;
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
      newData: updatedCategory,
    });

    return updatedCategory;
  }

  async remove(categoryId: string): Promise<void> {
    this.checkAdminPermission();
    const docRef = doc(db, this.collectionName, categoryId);

    const oldDoc = await getDoc(docRef);
    const oldData = oldDoc.exists() ? { ...oldDoc.data(), id: oldDoc.id } : null;

    await updateDoc(docRef, { isArchived: true });

    await auditLogRepository.log({
      userId: this.currentUser?.id || 'unknown',
      userName: this.currentUser?.name || 'Sistema',
      action: 'DELETE',
      collection: this.collectionName,
      docId: categoryId,
      oldData,
      newData: { ...oldData, isArchived: true },
    });
  }
}

export const expenseCategoryRepository = ExpenseCategoryRepositoryImpl.getInstance();
