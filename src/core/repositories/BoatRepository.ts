// src/core/repositories/BoatRepository.ts
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
import type { Boat } from '../domain/types';
import { auditLogRepository } from './AuditLogRepository';

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
    });
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

    await auditLogRepository.log({
      userId: this.currentUser?.id || 'unknown',
      userName: this.currentUser?.name || 'Sistema',
      action: 'CREATE',
      collection: this.collectionName,
      docId: docRef.id,
      newData: newBoat,
    });

    return newBoat;
  }

  async update(updatedBoat: Boat): Promise<Boat> {
    this.checkAdminPermission();
    const { id, ...data } = updatedBoat;
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
      newData: updatedBoat,
    });

    return updatedBoat;
  }

  async remove(boatId: string): Promise<void> {
    this.checkAdminPermission();
    const docRef = doc(db, this.collectionName, boatId);

    const oldDoc = await getDoc(docRef);
    const oldData = oldDoc.exists() ? { ...oldDoc.data(), id: oldDoc.id } : null;

    await updateDoc(docRef, { isArchived: true });

    await auditLogRepository.log({
      userId: this.currentUser?.id || 'unknown',
      userName: this.currentUser?.name || 'Sistema',
      action: 'DELETE',
      collection: this.collectionName,
      docId: boatId,
      oldData,
      newData: { ...oldData, isArchived: true },
    });
  }
}

export const boatRepository = BoatRepositoryImpl.getInstance();
