// src/core/repositories/ClientRepository.ts
import { v4 as uuidv4 } from 'uuid';
import type { ClientProfile } from '../domain/types';
import { MOCK_CLIENTS } from '../data/mocks';

// The repository interface defines the contract for data operations.
export interface IClientRepository {
  search(term: string): Promise<ClientProfile[]>;
  getById(clientId: string): Promise<ClientProfile | null>;
  add(newClient: Omit<ClientProfile, 'id' | 'totalTrips'>): Promise<ClientProfile>;
  update(client: ClientProfile): Promise<ClientProfile>;
  delete(clientId: string): Promise<void>;
}

/**
 * A mock implementation of the client repository that operates on an in-memory array.
 * Simulates asynchronous operations.
 */
class MockClientRepository implements IClientRepository {
  private clients: ClientProfile[] = MOCK_CLIENTS;

  async search(term: string): Promise<ClientProfile[]> {
    if (!term) {
      return [];
    }

    const lowercasedTerm = term.toLowerCase();
    const results = this.clients.filter(
      (client) =>
        client.name.toLowerCase().includes(lowercasedTerm) ||
        client.phone.includes(term)
    );

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 300));

    return results;
  }

  async getById(clientId: string): Promise<ClientProfile | null> {
    const client = this.clients.find(c => c.id === clientId);
    return client || null;
  }

  async add(newClientData: Omit<ClientProfile, 'id' | 'totalTrips'>): Promise<ClientProfile> {
    const newClient: ClientProfile = {
      id: uuidv4(),
      ...newClientData,
      totalTrips: 0,
    };

    this.clients.push(newClient);

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));

    return newClient;
  }

  async update(updatedClient: ClientProfile): Promise<ClientProfile> {
    const index = this.clients.findIndex(c => c.id === updatedClient.id);
    if (index === -1) {
      throw new Error("Client not found");
    }

    this.clients[index] = updatedClient;

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 300));

    return updatedClient;
  }

  async delete(clientId: string): Promise<void> {
    const index = this.clients.findIndex(c => c.id === clientId);
    if (index === -1) {
      throw new Error("Client not found");
    }

    this.clients.splice(index, 1);

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 300));
  }
}

// Export a singleton instance of the mock repository.
export const clientRepository = new MockClientRepository();
