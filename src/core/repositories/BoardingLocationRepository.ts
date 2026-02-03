// src/core/repositories/BoardingLocationRepository.ts
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
import type { BoardingLocation } from '../domain/types';
import { auditLogRepository } from './AuditLogRepository';

export class BoardingLocationRepository {
  private static instance: BoardingLocationRepository;
  private locations: BoardingLocation[] = [];
  private collectionName = 'boarding_locations';
  private unsubscribe: Unsubscribe | null = null;
  private isInitialized = false;
  private currentUser: any = null;

  private constructor() {}

  public static getInstance(): BoardingLocationRepository {
    if (!BoardingLocationRepository.instance) {
      BoardingLocationRepository.instance = new BoardingLocationRepository();
    }
    return BoardingLocationRepository.instance;
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
      this.locations = snapshot.docs.map(doc => ({
        ...doc.data() as BoardingLocation,
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
    this.locations = [];
    this.currentUser = null;
  }

  async getAll(): Promise<BoardingLocation[]> {
    if (!this.isInitialized) {
      // Initial fetch to ensure data is available immediately
      const querySnapshot = await getDocs(collection(db, this.collectionName));
      this.locations = querySnapshot.docs.map(doc => ({
        ...doc.data() as BoardingLocation,
        id: doc.id
      }));
      this.isInitialized = true;
    }
    return this.locations.filter(l => !l.isArchived);
  }

  private checkAdminPermission() {
    if (!this.currentUser || (this.currentUser.role !== 'OWNER' && this.currentUser.role !== 'SUPER_ADMIN' && this.currentUser.role !== 'ADMIN')) {
      throw new Error('Você não tem permissão para realizar esta ação.');
    }
  }

  async add(location: Omit<BoardingLocation, 'id'>): Promise<BoardingLocation> {
    this.checkAdminPermission();
    const docRef = await addDoc(collection(db, this.collectionName), location);
    const newLocation = { id: docRef.id, ...location };

    await auditLogRepository.log({
      userId: this.currentUser?.id || 'unknown',
      userName: this.currentUser?.name || 'Sistema',
      action: 'CREATE',
      collection: this.collectionName,
      docId: docRef.id,
      newData: newLocation,
    });

    return newLocation;
  }

  async update(location: BoardingLocation): Promise<BoardingLocation> {
    this.checkAdminPermission();
    const { id, ...data } = location;
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
      newData: location,
    });

    return location;
  }

  async delete(id: string): Promise<void> {
    this.checkAdminPermission();
    const docRef = doc(db, this.collectionName, id);

    const oldDoc = await getDoc(docRef);
    const oldData = oldDoc.exists() ? { ...oldDoc.data(), id: oldDoc.id } : null;

    await updateDoc(docRef, { isArchived: true });

    await auditLogRepository.log({
      userId: this.currentUser?.id || 'unknown',
      userName: this.currentUser?.name || 'Sistema',
      action: 'DELETE',
      collection: this.collectionName,
      docId: id,
      oldData,
      newData: { ...oldData, isArchived: true },
    });
  }
}

export const boardingLocationRepository = BoardingLocationRepository.getInstance();
