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
  private collectionName = 'boarding_locations';
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
  }

  subscribe(callback: (data: BoardingLocation[]) => void): Unsubscribe {
    const q = query(collection(db, this.collectionName));
    return onSnapshot(q, (snapshot) => {
      const locations = snapshot.docs.map(doc => ({
        ...doc.data() as BoardingLocation,
        id: doc.id
      }));
      callback(locations.filter(l => !l.isArchived));
    });
  }

  dispose() {
    this.currentUser = null;
  }

  async getAll(): Promise<BoardingLocation[]> {
    const querySnapshot = await getDocs(collection(db, this.collectionName));
    return querySnapshot.docs
      .map(doc => ({
        ...doc.data() as BoardingLocation,
        id: doc.id
      }))
      .filter(l => !l.isArchived);
  }

  private checkAdminPermission() {
    if (!this.currentUser || (this.currentUser.role !== 'OWNER' && this.currentUser.role !== 'SUPER_ADMIN' && this.currentUser.role !== 'ADMIN')) {
      throw new Error('Você não tem permissão para realizar esta ação.');
    }
  }

  async add(location: Omit<BoardingLocation, 'id'>): Promise<BoardingLocation> {
    this.checkAdminPermission();
    const docRef = await addDoc(collection(db, this.collectionName), location);
    return { id: docRef.id, ...location };
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
