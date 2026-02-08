// src/core/repositories/BoatRepository.ts
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
import type { Boat } from '../domain/types';

export interface IBoatRepository {
  getAll(): Promise<Boat[]>;
  add(boat: Omit<Boat, 'id'>): Promise<Boat>;
  update(boat: Boat): Promise<Boat>;
  remove(boatId: string): Promise<void>;
  dispose(): void;
  initialize(user?: any): void;
}

class BoatRepositoryImpl implements IBoatRepository {
  private static instance: BoatRepositoryImpl;
  private boats: Boat[] = [];
  private collectionName = 'boats';
  private unsubscribe: Unsubscribe | null = null;
  private isInitialized = false;
  private currentUser: any = null;
  private listeners: ((data: Boat[]) => void)[] = [];

  private constructor() {}

  public static getInstance(): BoatRepositoryImpl {
    if (!BoatRepositoryImpl.instance) {
      BoatRepositoryImpl.instance = new BoatRepositoryImpl();
    }
    return BoatRepositoryImpl.instance;
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
      this.boats = snapshot.docs.map(doc => ({
        ...doc.data() as Boat,
        id: doc.id
      }));
      this.isInitialized = true;
      this.notifyListeners();
    });
  }

  private notifyListeners() {
    const activeBoats = this.boats.filter(b => !b.isArchived);
    this.listeners.forEach(listener => listener(activeBoats));
  }

  subscribe(listener: (data: Boat[]) => void) {
    this.listeners.push(listener);
    if (this.isInitialized) {
      listener(this.boats.filter(b => !b.isArchived));
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
    this.boats = [];
    this.currentUser = null;
  }

  async getAll(): Promise<Boat[]> {
    if (!this.isInitialized) {
      const querySnapshot = await getDocs(collection(db, this.collectionName));
      this.boats = querySnapshot.docs.map(doc => ({
        ...doc.data() as Boat,
        id: doc.id
      }));
      this.isInitialized = true;
    }
    return this.boats.filter(b => !b.isArchived);
  }

  private checkAdminPermission() {
    if (!this.currentUser || (this.currentUser.role !== 'OWNER' && this.currentUser.role !== 'SUPER_ADMIN' && this.currentUser.role !== 'ADMIN')) {
      throw new Error('Você não tem permissão para realizar esta ação.');
    }
  }

  async add(boatData: Omit<Boat, 'id'>): Promise<Boat> {
    this.checkAdminPermission();
    const docRef = await addDoc(collection(db, this.collectionName), boatData);
    const newBoat = { id: docRef.id, ...boatData };

    return newBoat;
  }

  async update(updatedBoat: Boat): Promise<Boat> {
    this.checkAdminPermission();
    const { id, ...data } = updatedBoat;
    const docRef = doc(db, this.collectionName, id);

    await updateDoc(docRef, data as any);

    return updatedBoat;
  }

  async remove(boatId: string): Promise<void> {
    this.checkAdminPermission();
    const docRef = doc(db, this.collectionName, boatId);

    await updateDoc(docRef, { isArchived: true });
  }
}

export const boatRepository = BoatRepositoryImpl.getInstance();
