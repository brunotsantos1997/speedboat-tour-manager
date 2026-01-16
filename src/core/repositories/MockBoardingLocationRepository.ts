// src/core/repositories/MockBoardingLocationRepository.ts
import type { BoardingLocation } from '../domain/types';
import { v4 as uuid } from 'uuid';

export class MockBoardingLocationRepository {
  private locations: BoardingLocation[] = [
    { id: uuid(), name: 'Marina da Glória', mapLink: 'https://maps.app.goo.gl/abcdef123' },
    { id: uuid(), name: 'Urca', mapLink: 'https://maps.app.goo.gl/ghijkl456' },
  ];

  async getAll(): Promise<BoardingLocation[]> {
    return Promise.resolve(this.locations);
  }

  async add(location: Omit<BoardingLocation, 'id'>): Promise<BoardingLocation> {
    const newLocation = { ...location, id: uuid() };
    this.locations.push(newLocation);
    return Promise.resolve(newLocation);
  }

  async update(location: BoardingLocation): Promise<BoardingLocation> {
    const index = this.locations.findIndex((l) => l.id === location.id);
    if (index !== -1) {
      this.locations[index] = location;
      return Promise.resolve(location);
    }
    throw new Error('Location not found');
  }

  async delete(id: string): Promise<void> {
    this.locations = this.locations.filter((l) => l.id !== id);
    return Promise.resolve();
  }
}
