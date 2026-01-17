// src/core/repositories/EventRepository.ts
import { v4 as uuidv4 } from 'uuid';
import type { Event, EventStatus, PaymentStatus } from '../domain/types';
import { MOCK_CLIENTS, AVAILABLE_PRODUCTS } from '../data/mocks';
import { boatRepository } from './BoatRepository';
import { MockBoardingLocationRepository } from './MockBoardingLocationRepository';

export interface IEventRepository {
  getById(eventId: string): Promise<Event | undefined>;
  getEventsByDate(date: string): Promise<Event[]>;
  getEventsByClient(clientId: string): Promise<Event[]>;
  add(event: Omit<Event, 'id'>): Promise<Event>;
  update(event: Event): Promise<Event>;
  updateStatus(eventId: string, status: EventStatus): Promise<Event>;
  updatePaymentStatus(eventId: string, paymentStatus: PaymentStatus): Promise<Event>;
}

class MockEventRepository implements IEventRepository {
  private events: Event[] = [];
  private initializationPromise: Promise<void>;

  constructor() {
    this.initializationPromise = this.initializeMocks();
  }

  private async initializeMocks(): Promise<void> {
    // Make sure we don't run initialization more than once.
    if (this.events.length > 0) {
        return;
    }
    const boats = await boatRepository.getAll();
    const boardingLocations = await new MockBoardingLocationRepository().getAll();
    if (boats.length === 0 || boardingLocations.length === 0) return;

    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);

    const formatDate = (date: Date) => date.toISOString().split('T')[0];

    this.events.push({
      id: "event-1-id", // Using a stable ID for testing
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
        { ...AVAILABLE_PRODUCTS[1], isCourtesy: false }, // Kit Churrasco
        { ...AVAILABLE_PRODUCTS[2], isCourtesy: true }, // Bebidas as courtesy
      ],
      discount: { type: 'FIXED', value: 0 },
      subtotal: 2500,
      total: 2500,
    });

    this.events.push({
      id: "event-2-id", // Using a stable ID for testing
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
    });
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

  async add(eventData: Omit<Event, 'id'>): Promise<Event> {
    await this.initializationPromise;
    const newEvent: Event = { ...eventData, id: uuidv4() };
    this.events.push(newEvent);
    return newEvent;
  }

  async update(updatedEvent: Event): Promise<Event> {
    await this.initializationPromise;
    const index = this.events.findIndex(e => e.id === updatedEvent.id);
    if (index === -1) throw new Error('Event not found');
    this.events[index] = updatedEvent;
    return updatedEvent;
  }

  async updateStatus(eventId: string, status: EventStatus): Promise<Event> {
    await this.initializationPromise;
    const index = this.events.findIndex(e => e.id === eventId);
    if (index === -1) throw new Error('Event not found');
    this.events[index].status = status;
    return this.events[index];
  }

  async updatePaymentStatus(eventId: string, paymentStatus: PaymentStatus): Promise<Event> {
    await this.initializationPromise;
    const index = this.events.findIndex(e => e.id === eventId);
    if (index === -1) throw new Error('Event not found');
    this.events[index].paymentStatus = paymentStatus;
    return this.events[index];
  }
}

export const eventRepository = new MockEventRepository();
