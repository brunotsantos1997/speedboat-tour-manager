// src/core/repositories/ClientRepository.ts
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  onSnapshot,
  query,
  deleteDoc,
  type Unsubscribe
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import type { ClientProfile } from '../domain/types';

export interface IClientRepository {
  search(term: string): Promise<ClientProfile[]>;
  add(newClient: Omit<ClientProfile, 'id' | 'totalTrips'>): Promise<ClientProfile>;
  update(client: ClientProfile): Promise<ClientProfile>;
  delete(clientId: string): Promise<void>;
  getAll(): Promise<ClientProfile[]>;
  dispose(): void;
  initialize(): void;
}

class ClientRepositoryImpl implements IClientRepository {
  private clients: ClientProfile[] = [];
  private collectionName = 'clients';
  private unsubscribe: Unsubscribe | null = null;
  private isInitialized = false;

  constructor() {}

  initialize() {
    if (this.unsubscribe) return;
    this.initListener();
  }

  private initListener() {
    const q = query(collection(db, this.collectionName));
    this.unsubscribe = onSnapshot(q, (snapshot) => {
      this.clients = snapshot.docs.map(doc => ({
        ...doc.data() as ClientProfile,
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
    this.clients = [];
  }

  async getAll(): Promise<ClientProfile[]> {
    if (!this.isInitialized) {
      this.initialize();
      const querySnapshot = await getDocs(collection(db, this.collectionName));
      this.clients = querySnapshot.docs.map(doc => ({
        ...doc.data() as ClientProfile,
        id: doc.id
      }));
      this.isInitialized = true;
    }
    return this.clients;
  }

  async search(term: string): Promise<ClientProfile[]> {
    const all = await this.getAll();
    if (!term) return [];
    const lowercasedTerm = term.toLowerCase();
    return all.filter(client =>
      client.name.toLowerCase().includes(lowercasedTerm) ||
      client.phone.includes(term)
    );
  }

  async add(newClientData: Omit<ClientProfile, 'id' | 'totalTrips'>): Promise<ClientProfile> {
    const data = {
      ...newClientData,
      totalTrips: 0,
    };
    const docRef = await addDoc(collection(db, this.collectionName), data);
    return { id: docRef.id, ...data };
  }

  async update(updatedClient: ClientProfile): Promise<ClientProfile> {
    const { id, ...data } = updatedClient;
    const docRef = doc(db, this.collectionName, id);
    await updateDoc(docRef, data as any);
    return updatedClient;
  }

  async delete(clientId: string): Promise<void> {
    const docRef = doc(db, this.collectionName, clientId);
    await deleteDoc(docRef);
  }
}

export const clientRepository = new ClientRepositoryImpl();
