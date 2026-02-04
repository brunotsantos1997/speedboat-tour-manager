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
  type Unsubscribe
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import type { EventType } from '../domain/types';
import { auditLogRepository } from './AuditLogRepository';
import { timeToMinutes } from '../utils/timeUtils';

export interface IEventRepository {
  getById(eventId: string): Promise<EventType | undefined>;
  getEventsByDate(date: string): Promise<EventType[]>;
  getEventsByClient(clientId: string): Promise<EventType[]>;
  add(event: Omit<EventType, 'id'>): Promise<EventType>;
  updateEvent(event: EventType): Promise<EventType>;
  getAll(): Promise<EventType[]>;
  dispose(): void;
  initialize(user?: any): void;
}

class EventRepositoryImpl implements IEventRepository {
  private events: EventType[] = [];
  private collectionName = 'events';
  private unsubscribe: Unsubscribe | null = null;
  private isInitialized = false;
  private currentUser: any = null;

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
    return all.filter(e => e.date === date);
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
    if (eventA.date !== eventB.date || eventA.boat?.id !== eventB.boat?.id) {
      return false;
    }

    const orgTime = eventA.boat?.organizationTimeMinutes || 0;

    const startA = timeToMinutes(eventA.startTime);
    const endA = timeToMinutes(eventA.endTime);
    const startB = timeToMinutes(eventB.startTime);
    const endB = timeToMinutes(eventB.endTime);

    // Overlap considering organization time on both ends for both events
    // Busy window for A: [startA - orgTime, endA + orgTime]
    // Busy window for B: [startB - orgTime, endB + orgTime]
    return (startA - orgTime) < (endB + orgTime) && (endA + orgTime) > (startB - orgTime);
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

    await auditLogRepository.log({
      userId: this.currentUser?.id || 'unknown',
      userName: this.currentUser?.name || 'Sistema',
      action: 'CREATE',
      collection: this.collectionName,
      docId: docRef.id,
      newData: newEvent,
    });

    return newEvent;
  }

  async updateEvent(updatedEvent: EventType): Promise<EventType> {
    if (!this.currentUser) {
      throw new Error('Você deve estar logado para atualizar eventos.');
    }
    if (!updatedEvent.id || !updatedEvent.boat?.id || !updatedEvent.client?.id) {
      throw new Error('Dados incompletos para atualização do passeio.');
    }
    if (this.currentUser.role !== 'OWNER' && this.currentUser.role !== 'SUPER_ADMIN' && updatedEvent.createdByUserId !== this.currentUser.id) {
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

    const oldDoc = await getDoc(docRef);
    const oldData = oldDoc.exists() ? { ...oldDoc.data(), id: oldDoc.id } : null;

    await updateDoc(docRef, data as any);

    await auditLogRepository.log({
      userId: this.currentUser?.id || 'unknown',
      userName: this.currentUser?.name || 'Sistema',
      action: 'UPDATE',
      collection: this.collectionName,
      docId: id,
      oldData,
      newData: updatedEvent,
    });

    return updatedEvent;
  }
}

export const eventRepository = new EventRepositoryImpl();
