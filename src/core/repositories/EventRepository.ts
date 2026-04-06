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
  where,
  orderBy,
  limit,
  startAt,
  endAt
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import type { EventType } from '../domain/types';
import { timeToMinutes } from '../utils/timeUtils';

export interface IEventRepository {
  getById(eventId: string): Promise<EventType | undefined>;
  getEventsByDate(date: string): Promise<EventType[]>;
  getEventsByDateRange(startDate: string, endDate: string): Promise<EventType[]>;
  getEventsByClient(clientId: string): Promise<EventType[]>;
  add(event: Omit<EventType, 'id'>): Promise<EventType>;
  updateEvent(event: EventType): Promise<EventType>;
  remove(eventId: string): Promise<void>;
  getAll(limitCount?: number): Promise<EventType[]>;
  backfillFinancialData(): Promise<void>;
  dispose(): void;
  initialize(user?: any): void;
  subscribeToDateRange(startDate: string, endDate: string, callback: (data: EventType[]) => void): Unsubscribe;
  subscribeToNotifications(callback: (data: EventType[]) => void): Unsubscribe;
}

class EventRepositoryImpl implements IEventRepository {
  private collectionName = 'events';
  private isInitialized = false;
  private currentUser: any = null;

  constructor() {}

  initialize(user?: any) {
    if (user) {
      this.currentUser = user;
    }
    this.isInitialized = true;
  }

  subscribeToDateRange(startDate: string, endDate: string, callback: (data: EventType[]) => void): Unsubscribe {
    const q = query(
      collection(db, this.collectionName),
      where('date', '>=', startDate),
      where('date', '<=', endDate),
      orderBy('date'),
      orderBy('startTime')
    );

    return onSnapshot(q, (snapshot) => {
      const events = snapshot.docs.map(doc => ({
        ...doc.data() as EventType,
        id: doc.id
      }));
      callback(events);
    });
  }

  subscribeToNotifications(callback: (data: EventType[]) => void): Unsubscribe {
    const q = query(
      collection(db, this.collectionName),
      where('status', 'in', ['COMPLETED', 'CANCELLED', 'PENDING_REFUND'])
    );

    return onSnapshot(q, (snapshot) => {
      const events = snapshot.docs.map(doc => ({
        ...doc.data() as EventType,
        id: doc.id
      }));
      callback(events);
    });
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
    this.isInitialized = false;
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
    const q = query(
      collection(db, this.collectionName),
      where('date', '==', date)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      ...doc.data() as EventType,
      id: doc.id
    }));
  }

  async getEventsByDateRange(startDate: string, endDate: string): Promise<EventType[]> {
    const q = query(
      collection(db, this.collectionName),
      where('date', '>=', startDate),
      where('date', '<=', endDate)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      ...doc.data() as EventType,
      id: doc.id
    }));
  }

  async getEventsByClient(clientId: string): Promise<EventType[]> {
    const q = query(collection(db, this.collectionName), where('client.id', '==', clientId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      ...doc.data() as EventType,
      id: doc.id
    }));
  }

  async getAll(limitCount: number = 100): Promise<EventType[]> {
    const q = query(
      collection(db, this.collectionName),
      orderBy('date', 'desc'),
      limit(limitCount)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      ...doc.data() as EventType,
      id: doc.id
    }));
  }

  private isTimeConflict(eventA: Omit<EventType, 'id'>, eventB: EventType): boolean {
    if (eventA.date !== eventB.date || eventA.boat?.id !== eventB.boat?.id) {
      return false;
    }

    const orgTime = eventA.boat?.organizationTimeMinutes || 0;

    const startA = timeToMinutes(eventA.startTime);
    const endA = timeToMinutes(eventA.endTime);
    const startB = timeToMinutes(eventB.startTime);
    const endB = timeToMinutes(eventB.endTime);

    return (startA - orgTime) < (endB + orgTime) && (endA + orgTime) > (startB - orgTime);
  }

  async add(eventData: Omit<EventType, 'id'>): Promise<EventType> {
    if (!this.currentUser) {
      throw new Error('Você deve estar logado para agendar eventos.');
    }
    if (!eventData.boat?.id || !eventData.client?.id || !eventData.boardingLocation?.id) {
      throw new Error('Dados incompletos para criação do passeio.');
    }
    
    // Optimized conflict check: only check same day and same boat
    const conflictingEvents = await this.getEventsByDate(eventData.date);
    const now = Date.now();
    const twentyFourHours = 24 * 60 * 60 * 1000;

    const boatConflicts = conflictingEvents.filter(existingEvent =>
      existingEvent.boat?.id === eventData.boat.id &&
      existingEvent.status !== 'CANCELLED' &&
      existingEvent.status !== 'ARCHIVED_CANCELLED' &&
      existingEvent.status !== 'REFUNDED' &&
      existingEvent.status !== 'PENDING_REFUND' &&
      this.isTimeConflict(eventData, existingEvent)
    );

    for (const conflict of boatConflicts) {
      if (conflict.status === 'SCHEDULED') {
        throw new Error('Este horário já está agendado e confirmado.');
      }
      if (conflict.status === 'PRE_SCHEDULED' && conflict.preScheduledAt && (now - conflict.preScheduledAt < twentyFourHours)) {
        throw new Error('Este horário está pré-reservado. A vaga será liberada se o pagamento não for confirmado em 24h.');
      }
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

    const conflictingEvents = await this.getEventsByDate(updatedEvent.date);
    const now = Date.now();
    const twentyFourHours = 24 * 60 * 60 * 1000;

    const boatConflicts = conflictingEvents.filter(existingEvent =>
      existingEvent.id !== updatedEvent.id &&
      existingEvent.boat?.id === updatedEvent.boat.id &&
      existingEvent.status !== 'CANCELLED' &&
      existingEvent.status !== 'ARCHIVED_CANCELLED' &&
      existingEvent.status !== 'REFUNDED' &&
      existingEvent.status !== 'PENDING_REFUND' &&
      this.isTimeConflict(updatedEvent, existingEvent)
    );

    for (const conflict of boatConflicts) {
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
    // Note: This method was designed for a batch process.
    // For large collections, this should be a cloud function.
    // Limiting to 50 for safety in client-side context.
    const q = query(
      collection(db, this.collectionName),
      where('status', 'in', ['SCHEDULED', 'COMPLETED', 'ARCHIVED_COMPLETED']),
      limit(50)
    );
    const snapshot = await getDocs(q);
    const confirmedEvents = snapshot.docs
      .map(d => ({ ...d.data() as EventType, id: d.id }))
      .filter(e => e.rentalRevenue === undefined || e.productsRevenue === undefined);

    if (confirmedEvents.length === 0) return;

    for (const event of confirmedEvents) {
      try {
        const startMin = timeToMinutes(event.startTime);
        const endMin = timeToMinutes(event.endTime);
        const durationInMinutes = endMin - startMin;

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
