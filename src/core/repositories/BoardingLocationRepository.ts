// src/core/repositories/BoardingLocationRepository.ts
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
import type { BoardingLocation } from '../domain/types';

export class BoardingLocationRepository {
  private static instance: BoardingLocationRepository;
  private locations: BoardingLocation[] = [];
  private collectionName = 'boarding_locations';
  private unsubscribe: Unsubscribe | null = null;
  private isInitialized = false;
  private currentUser: any = null;
  private listeners: ((data: BoardingLocation[]) => void)[] = [];

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
      this.notifyListeners();
    });
  }

  private notifyListeners() {
    const activeLocations = this.locations.filter(l => !l.isArchived);
    this.listeners.forEach(listener => listener(activeLocations));
  }

  subscribe(listener: (data: BoardingLocation[]) => void) {
    this.listeners.push(listener);
    if (this.isInitialized) {
      listener(this.locations.filter(l => !l.isArchived));
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

    return newLocation;
  }

  async update(location: BoardingLocation): Promise<BoardingLocation> {
    this.checkAdminPermission();
    const { id, ...data } = location;
    const docRef = doc(db, this.collectionName, id);

    await updateDoc(docRef, data as any);

    return location;
  }

  async delete(id: string): Promise<void> {
    this.checkAdminPermission();
    const docRef = doc(db, this.collectionName, id);

    await updateDoc(docRef, { isArchived: true });
  }
}

export const boardingLocationRepository = BoardingLocationRepository.getInstance();
