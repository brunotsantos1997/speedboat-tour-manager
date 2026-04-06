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
  subscribe(callback: (data: Boat[]) => void): Unsubscribe;
}

class BoatRepositoryImpl implements IBoatRepository {
  private static instance: BoatRepositoryImpl;
  private collectionName = 'boats';
  private currentUser: any = null;

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
  }

  subscribe(callback: (data: Boat[]) => void): Unsubscribe {
    const q = query(collection(db, this.collectionName));
    return onSnapshot(q, (snapshot) => {
      const boats = snapshot.docs.map(doc => ({
        ...doc.data() as Boat,
        id: doc.id
      }));
      callback(boats.filter(b => !b.isArchived));
    });
  }

  dispose() {
    this.currentUser = null;
  }

  async getAll(): Promise<Boat[]> {
    const querySnapshot = await getDocs(collection(db, this.collectionName));
    return querySnapshot.docs
      .map(doc => ({
        ...doc.data() as Boat,
        id: doc.id
      }))
      .filter(b => !b.isArchived);
  }

  private checkAdminPermission() {
    if (!this.currentUser || (this.currentUser.role !== 'OWNER' && this.currentUser.role !== 'SUPER_ADMIN' && this.currentUser.role !== 'ADMIN')) {
      throw new Error('Você não tem permissão para realizar esta ação.');
    }
  }

  async add(boatData: Omit<Boat, 'id'>): Promise<Boat> {
    this.checkAdminPermission();
    const docRef = await addDoc(collection(db, this.collectionName), boatData);
    return { id: docRef.id, ...boatData };
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
