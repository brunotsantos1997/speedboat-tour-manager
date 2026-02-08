// src/core/repositories/ProductRepository.ts
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
import type { Product } from '../domain/types';
import { auditLogRepository } from './AuditLogRepository';

export interface IProductRepository {
  getAll(): Promise<Product[]>;
  add(productData: Omit<Product, 'id'>): Promise<Product>;
  update(updatedProduct: Product): Promise<Product>;
  remove(productId: string): Promise<void>;
  dispose(): void;
  initialize(user?: any): void;
}

class ProductRepositoryImpl implements IProductRepository {
  private static instance: ProductRepositoryImpl;
  private products: Product[] = [];
  private collectionName = 'products';
  private unsubscribe: Unsubscribe | null = null;
  private isInitialized = false;
  private currentUser: any = null;
  private listeners: ((data: Product[]) => void)[] = [];

  private constructor() {}

  public static getInstance(): ProductRepositoryImpl {
    if (!ProductRepositoryImpl.instance) {
      ProductRepositoryImpl.instance = new ProductRepositoryImpl();
    }
    return ProductRepositoryImpl.instance;
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
      this.products = snapshot.docs.map(doc => ({
        ...doc.data() as Product,
        id: doc.id
      }));
      this.isInitialized = true;
      this.notifyListeners();
    });
  }

  private notifyListeners() {
    const activeProducts = this.products.filter(p => !p.isArchived);
    this.listeners.forEach(listener => listener(activeProducts));
  }

  subscribe(listener: (data: Product[]) => void) {
    this.listeners.push(listener);
    if (this.isInitialized) {
      listener(this.products.filter(p => !p.isArchived));
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
    this.products = [];
    this.currentUser = null;
  }

  async getAll(): Promise<Product[]> {
    if (!this.isInitialized) {
      const querySnapshot = await getDocs(collection(db, this.collectionName));
      this.products = querySnapshot.docs.map(doc => ({
        ...doc.data() as Product,
        id: doc.id
      }));
      this.isInitialized = true;
    }
    return this.products.filter(p => !p.isArchived);
  }

  private checkAdminPermission() {
    if (!this.currentUser || (this.currentUser.role !== 'OWNER' && this.currentUser.role !== 'SUPER_ADMIN' && this.currentUser.role !== 'ADMIN')) {
      throw new Error('Você não tem permissão para realizar esta ação.');
    }
  }

  async add(productData: Omit<Product, 'id'>): Promise<Product> {
    this.checkAdminPermission();
    const docRef = await addDoc(collection(db, this.collectionName), productData);
    const newProduct = { id: docRef.id, ...productData };

    await auditLogRepository.log({
      userId: this.currentUser?.id || 'unknown',
      userName: this.currentUser?.name || 'Sistema',
      action: 'CREATE',
      collection: this.collectionName,
      docId: docRef.id,
      newData: newProduct,
    });

    return newProduct;
  }

  async update(updatedProduct: Product): Promise<Product> {
    this.checkAdminPermission();
    const { id, ...data } = updatedProduct;
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
      newData: updatedProduct,
    });

    return updatedProduct;
  }

  async remove(productId: string): Promise<void> {
    this.checkAdminPermission();
    const docRef = doc(db, this.collectionName, productId);

    const oldDoc = await getDoc(docRef);
    const oldData = oldDoc.exists() ? { ...oldDoc.data(), id: oldDoc.id } : null;

    await updateDoc(docRef, { isArchived: true });

    await auditLogRepository.log({
      userId: this.currentUser?.id || 'unknown',
      userName: this.currentUser?.name || 'Sistema',
      action: 'DELETE',
      collection: this.collectionName,
      docId: productId,
      oldData,
      newData: { ...oldData, isArchived: true },
    });
  }
}

export const productRepository = ProductRepositoryImpl.getInstance();
