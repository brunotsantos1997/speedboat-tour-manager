// src/core/repositories/ProductRepository.ts
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  onSnapshot,
  query,
  where,
  type Unsubscribe
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import type { Product } from '../domain/types';

export interface IProductRepository {
  getAll(): Promise<Product[]>;
  add(productData: Omit<Product, 'id'>): Promise<Product>;
  update(updatedProduct: Product): Promise<Product>;
  remove(productId: string): Promise<void>;
  dispose(): void;
  initialize(user?: any): void;
  subscribe(callback: (data: Product[]) => void): Unsubscribe;
}

class ProductRepositoryImpl implements IProductRepository {
  private static instance: ProductRepositoryImpl;
  private collectionName = 'products';
  private currentUser: any = null;

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
  }

  subscribe(callback: (data: Product[]) => void): Unsubscribe {
    const q = query(collection(db, this.collectionName));
    return onSnapshot(q, (snapshot) => {
      const products = snapshot.docs.map(doc => ({
        ...doc.data() as Product,
        id: doc.id
      }));
      callback(products.filter(p => !p.isArchived));
    });
  }

  dispose() {
    this.currentUser = null;
  }

  async getAll(): Promise<Product[]> {
    const querySnapshot = await getDocs(collection(db, this.collectionName));
    return querySnapshot.docs
      .map(doc => ({
        ...doc.data() as Product,
        id: doc.id
      }))
      .filter(p => !p.isArchived);
  }

  private checkAdminPermission() {
    if (!this.currentUser || (this.currentUser.role !== 'OWNER' && this.currentUser.role !== 'SUPER_ADMIN' && this.currentUser.role !== 'ADMIN')) {
      throw new Error('Você não tem permissão para realizar esta ação.');
    }
  }

  async add(productData: Omit<Product, 'id'>): Promise<Product> {
    this.checkAdminPermission();
    const docRef = await addDoc(collection(db, this.collectionName), productData);
    return { id: docRef.id, ...productData };
  }

  async update(updatedProduct: Product): Promise<Product> {
    this.checkAdminPermission();
    const { id, ...data } = updatedProduct;
    const docRef = doc(db, this.collectionName, id);

    await updateDoc(docRef, data as any);

    return updatedProduct;
  }

  async remove(productId: string): Promise<void> {
    this.checkAdminPermission();
    const docRef = doc(db, this.collectionName, productId);

    await updateDoc(docRef, { isArchived: true });
  }
}

export const productRepository = ProductRepositoryImpl.getInstance();
