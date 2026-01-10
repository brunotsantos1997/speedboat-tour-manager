// src/core/repositories/EventRepository.ts
import { v4 as uuidv4 } from 'uuid';
import type { Event, EventStatus } from '../domain/types';
import { MOCK_CLIENTS } from '../data/mocks';
import { boatRepository } from './BoatRepository';

export interface IEventRepository {
  getEventsByDate(date: string): Promise<Event[]>;
  getEventsByClient(clientId: string): Promise<Event[]>;
  add(event: Omit<Event, 'id'>): Promise<Event>;
  update(event: Event): Promise<Event>;
  updateStatus(eventId: string, status: EventStatus): Promise<Event>;
}

class MockEventRepository implements IEventRepository {
  private events: Event[] = [];

  constructor() {
    // Initialize with some mock events for demonstration
    this.initializeMocks();
  }

  private async initializeMocks() {
    const boats = await boatRepository.getAll();
    if (boats.length === 0) return;

    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);

    const formatDate = (date: Date) => date.toISOString().split('T')[0];

    this.events.push({
      id: uuidv4(),
      date: formatDate(today),
      time: '10:00',
      status: 'SCHEDULED',
      boat: boats[0],
      client: MOCK_CLIENTS[0],
      passengerCount: 5,
      products: [],
      discount: { type: 'FIXED', value: 0 },
      subtotal: 2500,
      total: 2500,
    });

    this.events.push({
      id: uuidv4(),
      date: formatDate(tomorrow),
      time: '14:00',
      status: 'SCHEDULED',
      boat: boats[0],
      client: MOCK_CLIENTS[1],
      passengerCount: 8,
      products: [],
      discount: { type: 'FIXED', value: 0 },
      subtotal: 3000,
      total: 3000,
    });
  }

  async getEventsByDate(date: string): Promise<Event[]> {
    return this.events.filter(e => e.date === date);
  }

  async getEventsByClient(clientId: string): Promise<Event[]> {
    return this.events.filter(e => e.client.id === clientId);
  }

  async add(eventData: Omit<Event, 'id'>): Promise<Event> {
    const newEvent: Event = { ...eventData, id: uuidv4() };
    this.events.push(newEvent);
    return newEvent;
  }

  async update(updatedEvent: Event): Promise<Event> {
    const index = this.events.findIndex(e => e.id === updatedEvent.id);
    if (index === -1) throw new Error('Event not found');
    this.events[index] = updatedEvent;
    return updatedEvent;
  }

  async updateStatus(eventId: string, status: EventStatus): Promise<Event> {
    const index = this.events.findIndex(e => e.id === eventId);
    if (index === -1) throw new Error('Event not found');
    this.events[index].status = status;
    return this.events[index];
  }
}

export const eventRepository = new MockEventRepository();
