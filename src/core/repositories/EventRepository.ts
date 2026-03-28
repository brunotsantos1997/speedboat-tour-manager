// src/core/repositories/EventRepository.ts
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  onSnapshot,
  query,
  getDoc,
  deleteDoc,
  type Unsubscribe,
  where
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import type { EventType } from '../domain/types';
import { timeToMinutes } from '../utils/timeUtils';

export interface IEventRepository {
  getById(eventId: string): Promise<EventType | undefined>;
  getEventsByDate(date: string): Promise<EventType[]>;
  getEventsByClient(clientId: string): Promise<EventType[]>;
  add(event: Omit<EventType, 'id'>): Promise<EventType>;
  updateEvent(event: EventType): Promise<EventType>;
  remove(eventId: string): Promise<void>;
  getAll(): Promise<EventType[]>;
  backfillFinancialData(): Promise<void>;
  dispose(): void;
  initialize(user?: any): void;
}

class EventRepositoryImpl implements IEventRepository {
  private events: EventType[] = [];
  private collectionName = 'events';
  private unsubscribe: Unsubscribe | null = null;
  private isInitialized = false;
  private currentUser: any = null;
  private listeners: ((data: EventType[]) => void)[] = [];

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
      this.events = snapshot.docs.map(doc => ({
        ...doc.data() as EventType,
        id: doc.id
      }));
      this.isInitialized = true;
      this.notifyListeners();
    });
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.events));
  }

  subscribe(listener: (data: EventType[]) => void) {
    this.listeners.push(listener);
    if (this.isInitialized) {
      listener(this.events);
    }
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  subscribeToId(id: string, callback: (data: EventType | undefined) => void) {
    const docRef = doc(db, this.collectionName, id);
    return onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        callback({ ...docSnap.data() as EventType, id: docSnap.id });
      } else {
        callback(undefined);
      }
    });
  }

  subscribeToClientEvents(clientId: string, callback: (data: EventType[]) => void) {
    const q = query(collection(db, this.collectionName), where('client.id', '==', clientId));
    return onSnapshot(q, (snapshot) => {
      const events = snapshot.docs.map(doc => ({
        ...doc.data() as EventType,
        id: doc.id
      }));
      callback(events);
    });
  }

  dispose() {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
    this.isInitialized = false;
    this.events = [];
    this.currentUser = null;
  }

  async getById(eventId: string): Promise<EventType | undefined> {
    const docRef = doc(db, this.collectionName, eventId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { ...docSnap.data() as EventType, id: docSnap.id };
    }
    return undefined;
  }

  async getEventsByDate(date: string): Promise<EventType[]> {
    const all = await this.getAll();
    return all.filter(e => {
        // Event spans across multiple days: date is between date and endDate inclusive
        const endDate = e.endDate || e.date;
        return date >= e.date && date <= endDate;
    });
  }

  async getEventsByClient(clientId: string): Promise<EventType[]> {
    const all = await this.getAll();
    return all.filter((e: EventType) => e.client?.id === clientId);
  }

  async getAll(): Promise<EventType[]> {
    if (!this.isInitialized) {
      const querySnapshot = await getDocs(collection(db, this.collectionName));
      this.events = querySnapshot.docs.map(doc => ({
        ...doc.data() as EventType,
        id: doc.id
      }));
      this.isInitialized = true;
    }
    return this.events;
  }

  private isTimeConflict(eventA: Omit<EventType, 'id'>, eventB: EventType): boolean {
    if (eventA.boat?.id !== eventB.boat?.id) {
      return false;
    }

    const orgTime = eventA.boat?.organizationTimeMinutes || 0;

    const startDateTimeA = new Date(`${eventA.date}T${eventA.startTime}:00`).getTime();
    const endDateTimeA = new Date(`${eventA.endDate || eventA.date}T${eventA.endTime}:00`).getTime();
    const startDateTimeB = new Date(`${eventB.date}T${eventB.startTime}:00`).getTime();
    const endDateTimeB = new Date(`${eventB.endDate || eventB.date}T${eventB.endTime}:00`).getTime();

    const orgTimeMs = orgTime * 60 * 1000;

    // Busy window for A: [startA - orgTime, endA + orgTime]
    // Busy window for B: [startB - orgTime, endB + orgTime]
    return (startDateTimeA - orgTimeMs) < (endDateTimeB + orgTimeMs) && (endDateTimeA + orgTimeMs) > (startDateTimeB - orgTimeMs);
  }

  async add(eventData: Omit<EventType, 'id'>): Promise<EventType> {
    if (!this.currentUser) {
      throw new Error('Você deve estar logado para agendar eventos.');
    }
    if (!eventData.boat?.id || !eventData.client?.id || !eventData.boardingLocation?.id) {
      throw new Error('Dados incompletos para criação do passeio.');
    }
    const allEvents = await this.getAll();
    const now = Date.now();
    const twentyFourHours = 24 * 60 * 60 * 1000;

    const conflictingEvents = allEvents.filter(existingEvent =>
      existingEvent.status !== 'CANCELLED' &&
      existingEvent.status !== 'ARCHIVED_CANCELLED' &&
      existingEvent.status !== 'REFUNDED' &&
      existingEvent.status !== 'PENDING_REFUND' &&
      this.isTimeConflict(eventData, existingEvent)
    );

    for (const conflict of conflictingEvents) {
      if (conflict.status === 'SCHEDULED') {
        throw new Error('Este horário já está agendado e confirmado.');
      }
      if (conflict.status === 'PRE_SCHEDULED' && conflict.preScheduledAt && (now - conflict.preScheduledAt < twentyFourHours)) {
        throw new Error('Este horário está pré-reservado. A vaga será liberada se o pagamento não for confirmado em 24h.');
      }
      // Expired pre-reservations are ignored for conflict purposes
    }

    const docRef = await addDoc(collection(db, this.collectionName), eventData);
    const newEvent = { ...eventData, id: docRef.id };

    return newEvent;
  }

  async updateEvent(updatedEvent: EventType): Promise<EventType> {
    if (!this.currentUser) {
      throw new Error('Você deve estar logado para atualizar eventos.');
    }
    if (!updatedEvent.id || !updatedEvent.boat?.id || !updatedEvent.client?.id) {
      throw new Error('Dados incompletos para atualização do passeio.');
    }
    if (this.currentUser.role !== 'OWNER' && this.currentUser.role !== 'SUPER_ADMIN' && this.currentUser.role !== 'ADMIN' && updatedEvent.createdByUserId !== this.currentUser.id) {
      throw new Error('Você não tem permissão para alterar este evento.');
    }
    const allEvents = await this.getAll();
    const now = Date.now();
    const twentyFourHours = 24 * 60 * 60 * 1000;

    const conflictingEvents = allEvents.filter(existingEvent =>
      existingEvent.id !== updatedEvent.id &&
      existingEvent.status !== 'CANCELLED' &&
      existingEvent.status !== 'ARCHIVED_CANCELLED' &&
      existingEvent.status !== 'REFUNDED' &&
      existingEvent.status !== 'PENDING_REFUND' &&
      this.isTimeConflict(updatedEvent, existingEvent)
    );

    for (const conflict of conflictingEvents) {
      if (conflict.status === 'SCHEDULED') {
        throw new Error('Este horário já está agendado e confirmado por outro evento.');
      }
      if (conflict.status === 'PRE_SCHEDULED' && conflict.preScheduledAt && (now - conflict.preScheduledAt < twentyFourHours)) {
        throw new Error('Este horário está pré-reservado por outro evento.');
      }
    }

    const { id, ...data } = updatedEvent;
    const docRef = doc(db, this.collectionName, id);

    await updateDoc(docRef, data as any);

    return updatedEvent;
  }

  async remove(eventId: string): Promise<void> {
    const docRef = doc(db, this.collectionName, eventId);
    await deleteDoc(docRef);
  }

  async backfillFinancialData(): Promise<void> {
    const events = await this.getAll();
    const confirmedEvents = events.filter(e =>
      (e.status === 'SCHEDULED' || e.status === 'COMPLETED' || e.status === 'ARCHIVED_COMPLETED') &&
      (e.rentalRevenue === undefined || e.productsRevenue === undefined)
    );

    if (confirmedEvents.length === 0) return;

    for (const event of confirmedEvents) {
      try {
        const startDateTime = new Date(`${event.date}T${event.startTime}:00`).getTime();
        const endDateTime = new Date(`${event.endDate || event.date}T${event.endTime}:00`).getTime();
        const durationInMinutes = (endDateTime - startDateTime) / (60 * 1000);

        let rentalRevenue = 0;
        const hours = durationInMinutes > 0 ? Math.floor(durationInMinutes / 60) : 0;
        const remainingMinutes = durationInMinutes > 0 ? durationInMinutes % 60 : 0;

        if (durationInMinutes > 0 && event.boat) {
          rentalRevenue = hours * (event.boat.pricePerHour || 0);
          if (remainingMinutes >= 30) {
            rentalRevenue += (event.boat.pricePerHalfHour || 0);
          }
        }

        const productsGross = (event.products || []).reduce((acc, p) => {
          if (p.isCourtesy) return acc;
          if (p.pricingType === 'PER_PERSON') return acc + (p.price || 0) * event.passengerCount;
          if (p.pricingType === 'HOURLY' && p.startTime && p.endTime && p.hourlyPrice) {
            const d = (timeToMinutes(p.endTime) - timeToMinutes(p.startTime)) / 60;
            return acc + (d > 0 ? d * p.hourlyPrice : 0);
          }
          return acc + (p.price || 0);
        }, 0);

        // Calculate Costs for backfill
        const rentalCost = hours * (event.boat?.costPerHour || 0) + (remainingMinutes >= 30 ? (event.boat?.costPerHalfHour || 0) : 0);
        const productsCost = (event.products || []).reduce((acc, p) => {
          if (p.isCourtesy) return acc;
          if (p.pricingType === 'PER_PERSON') return acc + (p.cost || 0) * event.passengerCount;
          if (p.pricingType === 'HOURLY' && p.startTime && p.endTime && p.hourlyCost) {
            const d = (timeToMinutes(p.endTime) - timeToMinutes(p.startTime)) / 60;
            return acc + (d > 0 ? d * p.hourlyCost : 0);
          }
          return acc + (p.cost || 0);
        }, 0);

        // Apply discount proportionally to keep consistency with event.total (which is NET)
        const totalGross = rentalRevenue + productsGross;
        let finalRentalRevenue = rentalRevenue;
        let finalProductsRevenue = productsGross;

        if (totalGross > 0 && event.total !== totalGross) {
          const ratio = event.total / totalGross;
          finalRentalRevenue = rentalRevenue * ratio;
          finalProductsRevenue = productsGross * ratio;
        }

        await this.updateEvent({
          ...event,
          rentalRevenue: finalRentalRevenue,
          productsRevenue: finalProductsRevenue,
          rentalGross: rentalRevenue,
          productsGross: productsGross,
          rentalCost,
          productsCost
        });
      } catch (err) {
        console.error(`Failed to backfill event ${event.id}:`, err);
      }
    }
  }
}

export const eventRepository = new EventRepositoryImpl();
