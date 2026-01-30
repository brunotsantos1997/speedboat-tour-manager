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
  initialize(): void;
}

class BoatRepositoryImpl implements IBoatRepository {
  private static instance: BoatRepositoryImpl;
  private boats: Boat[] = [];
  private collectionName = 'boats';
  private unsubscribe: Unsubscribe | null = null;
  private isInitialized = false;

  private constructor() {}

  public static getInstance(): BoatRepositoryImpl {
    if (!BoatRepositoryImpl.instance) {
      BoatRepositoryImpl.instance = new BoatRepositoryImpl();
    }
    return BoatRepositoryImpl.instance;
  }

  initialize() {
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
    });
  }

  dispose() {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
    this.isInitialized = false;
    this.boats = [];
  }

  async getAll(): Promise<Boat[]> {
    if (!this.isInitialized) {
      this.initialize();
      const querySnapshot = await getDocs(collection(db, this.collectionName));
      this.boats = querySnapshot.docs.map(doc => ({
        ...doc.data() as Boat,
        id: doc.id
      }));
      this.isInitialized = true;
    }
    return this.boats.filter(b => !b.isArchived);
  }

  async add(boatData: Omit<Boat, 'id'>): Promise<Boat> {
    const docRef = await addDoc(collection(db, this.collectionName), boatData);
    return { id: docRef.id, ...boatData };
  }

  async update(updatedBoat: Boat): Promise<Boat> {
    const { id, ...data } = updatedBoat;
    const docRef = doc(db, this.collectionName, id);
    await updateDoc(docRef, data as any);
    return updatedBoat;
  }

  async remove(boatId: string): Promise<void> {
    const docRef = doc(db, this.collectionName, boatId);
    await updateDoc(docRef, { isArchived: true });
  }
}

export const boatRepository = BoatRepositoryImpl.getInstance();
