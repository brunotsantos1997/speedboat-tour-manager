
import { describe, it, expect, vi, beforeEach } from 'vitest';
// Mock firebase
vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  getDocs: vi.fn(),
  addDoc: vi.fn(),
  updateDoc: vi.fn(),
  doc: vi.fn(),
  onSnapshot: vi.fn(),
  query: vi.fn(),
  deleteDoc: vi.fn(),
  getDoc: vi.fn(),
}));

// Mock repositories that use firebase
vi.mock('../../lib/firebase', () => ({
  db: {}
}));

import { clientRepository } from './ClientRepository';

describe('ClientRepository', () => {
  it('should search clients correctly', async () => {
    // Mock getAll
    vi.spyOn(clientRepository, 'getAll').mockResolvedValue([
      { id: '1', name: 'Bruno Santos', phone: '123', totalTrips: 0 },
      { id: '2', name: 'Maria Silva', phone: '456', totalTrips: 0 },
    ]);

    const results = await clientRepository.search('Bruno');
    expect(results).toHaveLength(1);
    expect(results[0].name).toBe('Bruno Santos');

    const results2 = await clientRepository.search('123');
    expect(results2).toHaveLength(1);
    expect(results2[0].id).toBe('1');
  });

  it('should get by id correctly', async () => {
     vi.spyOn(clientRepository, 'getAll').mockResolvedValue([
      { id: '1', name: 'Bruno Santos', phone: '123', totalTrips: 0 },
    ]);

    const client = await clientRepository.getById('1');
    expect(client?.name).toBe('Bruno Santos');
  });
});
