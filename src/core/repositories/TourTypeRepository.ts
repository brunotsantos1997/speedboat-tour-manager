// src/core/repositories/TourTypeRepository.ts
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
import type { TourType } from '../domain/types';
import { auditLogRepository } from './AuditLogRepository';

export class TourTypeRepository {
  private static instance: TourTypeRepository;
  private tourTypes: TourType[] = [];
  private collectionName = 'tour_types';
  private unsubscribe: Unsubscribe | null = null;
  private isInitialized = false;
  private currentUser: any = null;
  private listeners: ((data: TourType[]) => void)[] = [];

  private constructor() {}

  public static getInstance(): TourTypeRepository {
    if (!TourTypeRepository.instance) {
      TourTypeRepository.instance = new TourTypeRepository();
    }
    return TourTypeRepository.instance;
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
      this.tourTypes = snapshot.docs.map(doc => ({
        ...doc.data() as TourType,
        id: doc.id
      }));
      this.isInitialized = true;
      this.notifyListeners();
    });
  }

  private notifyListeners() {
    const activeTourTypes = this.tourTypes.filter(t => !t.isArchived);
    this.listeners.forEach(listener => listener(activeTourTypes));
  }

  subscribe(listener: (data: TourType[]) => void) {
    this.listeners.push(listener);
    if (this.isInitialized) {
      listener(this.tourTypes.filter(t => !t.isArchived));
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
    this.tourTypes = [];
    this.currentUser = null;
  }

  async getAll(): Promise<TourType[]> {
    if (!this.isInitialized) {
      const querySnapshot = await getDocs(collection(db, this.collectionName));
      this.tourTypes = querySnapshot.docs.map(doc => ({
        ...doc.data() as TourType,
        id: doc.id
      }));
      this.isInitialized = true;
    }

    return this.tourTypes.filter(t => !t.isArchived);
  }

  async add(tourType: Omit<TourType, 'id'>): Promise<TourType> {
    const docRef = await addDoc(collection(db, this.collectionName), tourType);
    const newTourType = { id: docRef.id, ...tourType };

    await auditLogRepository.log({
      userId: this.currentUser?.id || 'unknown',
      userName: this.currentUser?.name || 'Sistema',
      action: 'CREATE',
      collection: this.collectionName,
      docId: docRef.id,
      newData: newTourType,
    });

    return newTourType;
  }

  async update(tourType: TourType): Promise<TourType> {
    const { id, ...data } = tourType;
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
      newData: tourType,
    });

    return tourType;
  }

  async delete(id: string): Promise<void> {
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

export const tourTypeRepository = TourTypeRepository.getInstance();
