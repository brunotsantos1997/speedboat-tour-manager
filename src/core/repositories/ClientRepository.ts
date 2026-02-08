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
  getAll(): Promise<ClientProfile[]>;
  dispose(): void;
  initialize(user?: any): void;
}

class ClientRepositoryImpl implements IClientRepository {
  private clients: ClientProfile[] = [];
  private collectionName = 'clients';
  private unsubscribe: Unsubscribe | null = null;
  private isInitialized = false;
  private currentUser: any = null;
  private listeners: ((data: ClientProfile[]) => void)[] = [];

  constructor() {}

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
      this.clients = snapshot.docs.map(doc => ({
        ...doc.data() as ClientProfile,
        id: doc.id
      }));
      this.isInitialized = true;
      this.notifyListeners();
    });
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.clients));
  }

  subscribe(listener: (data: ClientProfile[]) => void) {
    this.listeners.push(listener);
    if (this.isInitialized) {
      listener(this.clients);
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
    this.clients = [];
    this.currentUser = null;
  }

  async getAll(): Promise<ClientProfile[]> {
    if (!this.isInitialized || (this.isInitialized && this.clients.length === 0)) {
      try {
        const querySnapshot = await getDocs(collection(db, this.collectionName));
        const fetchedClients = querySnapshot.docs.map(doc => ({
          ...doc.data() as ClientProfile,
          id: doc.id
        }));
        // Only update if we actually got results or if we are not initialized
        if (fetchedClients.length > 0 || !this.isInitialized) {
          this.clients = fetchedClients;
          this.isInitialized = true;
        }
      } catch (error) {
        console.error("Error fetching all clients:", error);
      }
    }
    return this.clients;
  }

  async search(term: string): Promise<ClientProfile[]> {
    const all = await this.getAll();
    if (!term) return [];
    const lowercasedTerm = term.toLowerCase();
    return all.filter(client =>
      (client.name || '').toLowerCase().includes(lowercasedTerm) ||
      (client.phone || '').includes(term)
    );
  }

  async getById(clientId: string): Promise<ClientProfile | null> {
    const all = await this.getAll();
    const found = all.find(c => c.id === clientId);
    if (found) return found;

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
    const newClient = { id: docRef.id, ...data };

    return newClient;
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
