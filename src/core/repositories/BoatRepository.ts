// src/core/repositories/BoatRepository.ts
import { v4 as uuidv4 } from 'uuid';
import type { Boat } from '../domain/types';

export interface IBoatRepository {
  getAll(): Promise<Boat[]>;
  add(boat: Omit<Boat, 'id'>): Promise<Boat>;
  update(boat: Boat): Promise<Boat>;
  remove(boatId: string): Promise<void>;
}

class MockBoatRepository implements IBoatRepository {
  private boats: Boat[] = [
    {
      id: 'boat-1',
      name: 'Focker 30 Pés',
      capacity: 10,
      size: 30,
      pricePerHour: 700,
      pricePerHalfHour: 400,
    },
  ];

  async getAll(): Promise<Boat[]> {
    return [...this.boats];
  }

  async add(boatData: Omit<Boat, 'id'>): Promise<Boat> {
    const newBoat: Boat = { ...boatData, id: uuidv4() };
    this.boats.push(newBoat);
    return newBoat;
  }

  async update(updatedBoat: Boat): Promise<Boat> {
    const index = this.boats.findIndex(b => b.id === updatedBoat.id);
    if (index === -1) throw new Error('Boat not found');
    this.boats[index] = updatedBoat;
    return updatedBoat;
  }

  async remove(boatId: string): Promise<void> {
    this.boats = this.boats.filter(b => b.id !== boatId);
  }
}

export const boatRepository = new MockBoatRepository();
