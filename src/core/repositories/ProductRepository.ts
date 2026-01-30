// src/core/repositories/ProductRepository.ts
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  onSnapshot,
  query,
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
  initialize(): void;
}

class ProductRepositoryImpl implements IProductRepository {
  private static instance: ProductRepositoryImpl;
  private products: Product[] = [];
  private collectionName = 'products';
  private unsubscribe: Unsubscribe | null = null;
  private isInitialized = false;

  private constructor() {}

  public static getInstance(): ProductRepositoryImpl {
    if (!ProductRepositoryImpl.instance) {
      ProductRepositoryImpl.instance = new ProductRepositoryImpl();
    }
    return ProductRepositoryImpl.instance;
  }

  initialize() {
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
    });
  }

  dispose() {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
    this.isInitialized = false;
    this.products = [];
  }

  async getAll(): Promise<Product[]> {
    if (!this.isInitialized) {
      this.initialize();
      const querySnapshot = await getDocs(collection(db, this.collectionName));
      this.products = querySnapshot.docs.map(doc => ({
        ...doc.data() as Product,
        id: doc.id
      }));
      this.isInitialized = true;
    }
    return this.products.filter(p => !p.isArchived);
  }

  async add(productData: Omit<Product, 'id'>): Promise<Product> {
    const docRef = await addDoc(collection(db, this.collectionName), productData);
    return { id: docRef.id, ...productData };
  }

  async update(updatedProduct: Product): Promise<Product> {
    const { id, ...data } = updatedProduct;
    const docRef = doc(db, this.collectionName, id);
    await updateDoc(docRef, data as any);
    return updatedProduct;
  }

  async remove(productId: string): Promise<void> {
    const docRef = doc(db, this.collectionName, productId);
    await updateDoc(docRef, { isArchived: true });
  }
}

export const productRepository = ProductRepositoryImpl.getInstance();
