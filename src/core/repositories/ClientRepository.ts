// src/core/repositories/ClientRepository.ts
import { v4 as uuidv4 } from 'uuid';
import type { ClientProfile } from '../domain/types';
import { MOCK_CLIENTS } from '../data/mocks';

// The repository interface defines the contract for data operations.
export interface IClientRepository {
  search(term: string): Promise<ClientProfile[]>;
  add(newClient: Omit<ClientProfile, 'id' | 'totalTrips'>): Promise<ClientProfile>;
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

  async add(newClientData: Omit<ClientProfile, 'totalTrips'>): Promise<ClientProfile> {
    const newClient: ClientProfile = {
      ...newClientData,
      totalTrips: 0,
    };

    this.clients.push(newClient);

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));

    return newClient;
  }
}

// Export a singleton instance of the mock repository.
export const clientRepository = new MockClientRepository();
