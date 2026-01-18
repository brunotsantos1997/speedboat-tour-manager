// src/core/repositories/EventRepository.ts
import { v4 as uuidv4 } from 'uuid';
import type { Event } from '../domain/types';
import { MOCK_CLIENTS, AVAILABLE_PRODUCTS } from '../data/mocks';
import { boatRepository } from './BoatRepository';
import { MockBoardingLocationRepository } from './MockBoardingLocationRepository';

export interface IEventRepository {
  getById(eventId: string): Promise<Event | undefined>;
  getEventsByDate(date: string): Promise<Event[]>;
  getEventsByClient(clientId: string): Promise<Event[]>;
  add(event: Omit<Event, 'id'>): Promise<Event>;
  updateEvent(event: Event): Promise<Event>;
}

class MockEventRepository implements IEventRepository {
  private static readonly STORAGE_KEY = 'events';
  private events: Event[] = [];
  private initializationPromise: Promise<void>;

  constructor() {
    this.initializationPromise = this.loadEvents();
  }

  private async loadEvents(): Promise<void> {
    const storedEvents = localStorage.getItem(MockEventRepository.STORAGE_KEY);
    if (storedEvents) {
      this.events = JSON.parse(storedEvents);
    } else {
      await this.initializeMocks();
      this.saveEvents();
    }
  }

  private saveEvents(): void {
    localStorage.setItem(MockEventRepository.STORAGE_KEY, JSON.stringify(this.events));
  }

  private async initializeMocks(): Promise<void> {
    const boats = await boatRepository.getAll();
    const boardingLocations = await new MockBoardingLocationRepository().getAll();
    if (boats.length === 0 || boardingLocations.length === 0) return;

    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);
    const formatDate = (date: Date) => date.toISOString().split('T')[0];

    this.events = [
      {
        id: "event-1-id",
        date: formatDate(today),
        startTime: '10:00',
        endTime: '14:00',
        status: 'SCHEDULED',
        paymentStatus: 'PENDING',
        boat: boats[0],
        boardingLocation: boardingLocations[0],
        client: MOCK_CLIENTS[0],
        passengerCount: 5,
        products: [
          { ...AVAILABLE_PRODUCTS[1], isCourtesy: false },
          { ...AVAILABLE_PRODUCTS[2], isCourtesy: true },
        ],
        discount: { type: 'FIXED', value: 0 },
        subtotal: 2500,
        total: 2500,
      },
      {
        id: "event-2-id",
        date: formatDate(tomorrow),
        startTime: '14:00',
        endTime: '18:00',
        status: 'SCHEDULED',
        paymentStatus: 'PENDING',
        boat: boats[0],
        boardingLocation: boardingLocations[1],
        client: MOCK_CLIENTS[1],
        passengerCount: 8,
        products: [],
        discount: { type: 'FIXED', value: 0 },
        subtotal: 3000,
        total: 3000,
      },
    ];
  }

  async getById(eventId: string): Promise<Event | undefined> {
    await this.initializationPromise;
    return this.events.find(e => e.id === eventId);
  }

  async getEventsByDate(date: string): Promise<Event[]> {
    await this.initializationPromise;
    return this.events.filter(e => e.date === date);
  }

  async getEventsByClient(clientId: string): Promise<Event[]> {
    await this.initializationPromise;
    return this.events.filter(e => e.client.id === clientId);
  }

  private isTimeConflict(eventA: Omit<Event, 'id'>, eventB: Event): boolean {
    if (eventA.date !== eventB.date || eventA.boat.id !== eventB.boat.id) {
      return false;
    }

    const startA = eventA.startTime;
    const endA = eventA.endTime;
    const startB = eventB.startTime;
    const endB = eventB.endTime;

    return startA < endB && endA > startB;
  }

  async add(eventData: Omit<Event, 'id'>): Promise<Event> {
    await this.initializationPromise;

    const now = Date.now();
    const twentyFourHours = 24 * 60 * 60 * 1000;

    const conflictingEvents = this.events.filter(existingEvent =>
      this.isTimeConflict(eventData, existingEvent)
    );

    for (const conflict of conflictingEvents) {
      if (conflict.status === 'SCHEDULED') {
        throw new Error('Este horário já está agendado e confirmado.');
      }
      if (conflict.status === 'PRE_SCHEDULED' && conflict.preScheduledAt && (now - conflict.preScheduledAt < twentyFourHours)) {
        throw new Error('Este horário está pré-reservado. A vaga será liberada se o pagamento não for confirmado em 24h.');
      }
      if (conflict.status === 'PRE_SCHEDULED' && conflict.preScheduledAt && (now - conflict.preScheduledAt >= twentyFourHours)) {
        if (eventData.status === 'SCHEDULED') {
          conflict.status = 'CANCELLED';
        }
      }
    }

    const newEvent: Event = { ...eventData, id: uuidv4() };
    this.events.push(newEvent);
    this.saveEvents();
    return newEvent;
  }

  async updateEvent(updatedEvent: Event): Promise<Event> {
    await this.initializationPromise;
    const index = this.events.findIndex(e => e.id === updatedEvent.id);
    if (index === -1) throw new Error('Event not found');

    const now = Date.now();
    const twentyFourHours = 24 * 60 * 60 * 1000;

    const conflictingEvents = this.events.filter(existingEvent =>
      existingEvent.id !== updatedEvent.id && this.isTimeConflict(updatedEvent, existingEvent)
    );

    for (const conflict of conflictingEvents) {
      if (conflict.status === 'SCHEDULED') {
        throw new Error('Este horário já está agendado e confirmado por outro evento.');
      }
      if (conflict.status === 'PRE_SCHEDULED' && conflict.preScheduledAt && (now - conflict.preScheduledAt < twentyFourHours)) {
        throw new Error('Este horário está pré-reservado por outro evento.');
      }
    }

    this.events[index] = updatedEvent;
    this.saveEvents();
    return updatedEvent;
  }
}

export const eventRepository = new MockEventRepository();
