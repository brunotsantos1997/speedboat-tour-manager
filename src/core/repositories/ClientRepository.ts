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
  getDoc,
  where,
  limit,
  orderBy,
  type Unsubscribe
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import type { ClientProfile } from '../domain/types';

export interface IClientRepository {
  search(term: string): Promise<ClientProfile[]>;
  add(newClient: Omit<ClientProfile, 'id' | 'totalTrips'>): Promise<ClientProfile>;
  update(client: ClientProfile): Promise<ClientProfile>;
  delete(clientId: string): Promise<void>;
  getById(clientId: string): Promise<ClientProfile | null>;
  getAll(limitCount?: number): Promise<ClientProfile[]>;
  dispose(): void;
  initialize(user?: any): void;
}

class ClientRepositoryImpl implements IClientRepository {
  private collectionName = 'clients';
  private isInitialized = false;
  private currentUser: any = null;

  constructor() {}

  initialize(user?: any) {
    if (user) {
      this.currentUser = user;
    }
    this.isInitialized = true;
  }

  dispose() {
    this.isInitialized = false;
    this.currentUser = null;
  }

  async getAll(limitCount: number = 50): Promise<ClientProfile[]> {
    try {
      const q = query(
        collection(db, this.collectionName),
        orderBy('name'),
        limit(limitCount)
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        ...doc.data() as ClientProfile,
        id: doc.id
      }));
    } catch (error) {
      console.error("Error fetching clients:", error);
      return [];
    }
  }

  async search(term: string): Promise<ClientProfile[]> {
    if (!term) return [];
    
    // Firestore doesn't support full-text search directly without 3rd party
    // or complex prefixes. For simple search, we use a range query for prefix
    // or just fetch with a limit and filter in memory if the term is small.
    // Here we implement a compromise: search by name prefix if possible,
    // otherwise fallback to a limited fetch.
    
    try {
      const termUpper = term.charAt(0).toUpperCase() + term.slice(1);
      const q = query(
        collection(db, this.collectionName),
        where('name', '>=', term),
        where('name', '<=', term + '\uf8ff'),
        limit(20)
      );
      
      const querySnapshot = await getDocs(q);
      let results = querySnapshot.docs.map(doc => ({
        ...doc.data() as ClientProfile,
        id: doc.id
      }));

      // If no prefix results, try a broader limited search or search by phone
      if (results.length === 0 && /^\d+$/.test(term)) {
        const qPhone = query(
          collection(db, this.collectionName),
          where('phone', '>=', term),
          where('phone', '<=', term + '\uf8ff'),
          limit(20)
        );
        const phoneSnapshot = await getDocs(qPhone);
        results = phoneSnapshot.docs.map(doc => ({
          ...doc.data() as ClientProfile,
          id: doc.id
        }));
      }

      return results;
    } catch (error) {
      console.error("Error searching clients:", error);
      return [];
    }
  }

  async getById(clientId: string): Promise<ClientProfile | null> {
    try {
      const docRef = doc(db, this.collectionName, clientId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return { ...docSnap.data() as ClientProfile, id: docSnap.id };
      }
    } catch (error) {
      console.error("Error fetching client by id:", error);
    }
    return null;
  }

  private checkPermission() {
    if (!this.currentUser) {
      throw new Error('Você deve estar logado.');
    }
  }

  async add(newClientData: Omit<ClientProfile, 'id' | 'totalTrips'>): Promise<ClientProfile> {
    this.checkPermission();
    if (!newClientData.name || !newClientData.phone) {
      throw new Error('Nome e telefone são obrigatórios.');
    }
    const data = {
      ...newClientData,
      totalTrips: 0,
    };
    const docRef = await addDoc(collection(db, this.collectionName), data);
    return { id: docRef.id, ...data };
  }

  async update(updatedClient: ClientProfile): Promise<ClientProfile> {
    this.checkPermission();
    if (!updatedClient.id || !updatedClient.name || !updatedClient.phone) {
      throw new Error('Dados do cliente inválidos para atualização.');
    }
    const { id, ...data } = updatedClient;
    const docRef = doc(db, this.collectionName, id);

    await updateDoc(docRef, data as any);

    return updatedClient;
  }

  async delete(clientId: string): Promise<void> {
    if (!this.currentUser || (this.currentUser.role !== 'OWNER' && this.currentUser.role !== 'SUPER_ADMIN' && this.currentUser.role !== 'ADMIN')) {
      throw new Error('Você não tem permissão para excluir clientes.');
    }
    const docRef = doc(db, this.collectionName, clientId);

    await deleteDoc(docRef);
  }
}

export const clientRepository = new ClientRepositoryImpl();
