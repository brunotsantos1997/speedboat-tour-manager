// src/core/domain/SharedEventService.ts
import type { EventType, Boat, ClientProfile, TourType, BoardingLocation } from './types';
import { clientRepository } from '../repositories/ClientRepository';
import { boatRepository } from '../repositories/BoatRepository';
import { tourTypeRepository } from '../repositories/TourTypeRepository';
import { boardingLocationRepository } from '../repositories/BoardingLocationRepository';
import { eventRepository } from '../repositories/EventRepository';
import { logger } from '../common/Logger';

export interface SharedEventConfig {
  requiredClientType: 'SHARED' | 'ANY';
  requiredTourType: 'SHARED' | 'ANY';
  defaultBoardingLocation?: string;
  minPassengers?: number;
  maxPassengers?: number;
}

export class SharedEventService {
  private static readonly SHARED_CLIENT_NAME = 'Compartilhado';
  private static readonly SHARED_TOUR_NAME = 'Compartilhado';

  /**
   * Get or create shared client (replaces sentinel entity)
   */
  static async getOrCreateSharedClient(): Promise<ClientProfile> {
    try {
      // Try to find existing shared client
      const existingClients = await clientRepository.search(this.SHARED_CLIENT_NAME);
      const sharedClient = existingClients.find(c => c.name === this.SHARED_CLIENT_NAME);

      if (sharedClient) {
        logger.debug('Found existing shared client', { clientId: sharedClient.id });
        return sharedClient;
      }

      // Create new shared client
      const newSharedClient: Omit<ClientProfile, 'id'> = {
        name: this.SHARED_CLIENT_NAME,
        phone: '0000000000', // Placeholder phone for shared events
        totalTrips: 0
      };

      const createdClient = await clientRepository.add(newSharedClient);
      logger.info('Created new shared client', { clientId: createdClient.id });

      return createdClient;

    } catch (error) {
      logger.error('Failed to get or create shared client', error as Error);
      throw new Error('Unable to setup shared event client');
    }
  }

  /**
   * Get or create shared tour type (replaces sentinel entity)
   */
  static async getOrCreateSharedTourType(): Promise<TourType> {
    try {
      // Try to find existing shared tour type
      const existingTypes = await tourTypeRepository.getAll();
      const sharedType = existingTypes.find(t => t.name === this.SHARED_TOUR_NAME);

      if (sharedType) {
        logger.debug('Found existing shared tour type', { typeId: sharedType.id });
        return sharedType;
      }

      // Create new shared tour type
      const newSharedType: Omit<TourType, 'id'> = {
        name: this.SHARED_TOUR_NAME,
        color: '#6B7280', // Gray color for shared tours
        isArchived: false
      };

      const createdType = await tourTypeRepository.add(newSharedType);
      logger.info('Created new shared tour type', { typeId: createdType.id });

      return createdType;

    } catch (error) {
      logger.error('Failed to get or create shared tour type', error as Error);
      throw new Error('Unable to setup shared event tour type');
    }
  }

  /**
   * Get default boarding location (replaces implicit "first location")
   */
  static async getDefaultBoardingLocation(): Promise<BoardingLocation | null> {
    try {
      const locations = await boardingLocationRepository.getAll();
      const activeLocations = locations.filter(l => !l.isArchived);

      if (activeLocations.length === 0) {
        logger.warn('No active boarding locations found');
        return null;
      }

      // Return first active location (explicit, not implicit)
      const defaultLocation = activeLocations[0];
      logger.debug('Using default boarding location', { 
        locationId: defaultLocation.id,
        locationName: defaultLocation.name 
      });

      return defaultLocation;

    } catch (error) {
      logger.error('Failed to get default boarding location', error as Error);
      return null;
    }
  }

  /**
   * Validate shared event configuration
   */
  static validateSharedEventConfig(
    config: SharedEventConfig,
    availableBoats: Boat[]
  ): string[] {
    const errors: string[] = [];

    // Validate passenger limits
    if (config.minPassengers && config.maxPassengers) {
      if (config.minPassengers > (config.maxPassengers || 0)) {
        errors.push('Minimum passengers cannot be greater than maximum passengers');
      }
    }

    // Validate boat capacity
    if (config.maxPassengers) {
      const suitableBoats = availableBoats.filter(boat => 
        boat.capacity >= (config.minPassengers || 0) && 
        boat.capacity <= (config.maxPassengers || 999)
      );

      if (suitableBoats.length === 0) {
        errors.push(`No boats available for passenger range ${(config.minPassengers || 0)}-${(config.maxPassengers || 999)}`);
      }
    }

    return errors;
  }

  /**
   * Check for existing shared event conflicts
   */
  static async checkSharedEventConflict(
    date: string,
    startTime: string,
    boatId: string,
    excludeEventId?: string
  ): Promise<EventType | null> {
    try {
      const dayEvents = await eventRepository.getEventsByDate(date);
      
      const conflictingEvent = dayEvents.find(event =>
        event.id !== excludeEventId && // Exclude current event if editing
        event.boat.id === boatId &&
        event.startTime === startTime &&
        event.tourType?.name.toLowerCase() === 'compartilhado' &&
        event.status !== 'CANCELLED' &&
        event.status !== 'ARCHIVED_CANCELLED'
      );

      if (conflictingEvent) {
        logger.debug('Found shared event conflict', {
          conflictingEventId: conflictingEvent.id,
          date,
          startTime,
          boatId
        });
      }

      return conflictingEvent || null;

    } catch (error) {
      logger.error('Failed to check shared event conflict', error as Error);
      return null;
    }
  }

  /**
   * Create shared event with explicit dependencies
   */
  static async createSharedEvent(
    eventData: Omit<EventType, 'id' | 'client' | 'tourType' | 'boardingLocation'>,
    config: SharedEventConfig = { requiredClientType: 'ANY', requiredTourType: 'ANY' }
  ): Promise<EventType> {
    try {
      logger.info('Creating shared event with explicit dependencies', {
        date: eventData.date,
        startTime: eventData.startTime,
        passengerCount: eventData.passengerCount
      });

      // Step 1: Get explicit dependencies
      const [sharedClient, sharedTourType, defaultLocation] = await Promise.all([
        this.getOrCreateSharedClient(),
        this.getOrCreateSharedTourType(),
        config.defaultBoardingLocation ? 
        (await boardingLocationRepository.getAll()).find(l => l.id === config.defaultBoardingLocation) : 
        this.getDefaultBoardingLocation()
      ]);

      if (!defaultLocation) {
        throw new Error('No boarding location available for shared event');
      }

      // Step 2: Validate configuration
      const availableBoats = await boatRepository.getAll();
      const validationErrors = this.validateSharedEventConfig(config, availableBoats);
      if (validationErrors.length > 0) {
        throw new Error(`Invalid shared event configuration: ${validationErrors.join(', ')}`);
      }

      // Step 3: Build complete event data
      const completeEventData: Omit<EventType, 'id'> = {
        ...eventData,
        client: sharedClient,
        tourType: sharedTourType,
        boardingLocation: defaultLocation
      };

      // Step 4: Create event
      const createdEvent = await eventRepository.add(completeEventData);

      logger.info('Shared event created successfully', {
        eventId: createdEvent.id,
        clientId: sharedClient.id,
        tourTypeId: sharedTourType.id,
        locationId: defaultLocation.id
      });

      return createdEvent;

    } catch (error) {
      logger.error('Failed to create shared event', error as Error);
      throw error;
    }
  }

  /**
   * Get shared events for a date range
   */
  static async getSharedEvents(startDate: string, endDate: string): Promise<EventType[]> {
    try {
      const events = await eventRepository.getEventsByDateRange(startDate, endDate);
      
      const sharedEvents = events.filter(event =>
        event.tourType?.name.toLowerCase() === 'compartilhado'
      );

      logger.debug(`Found ${sharedEvents.length} shared events in range`, {
        startDate,
        endDate
      });

      return sharedEvents;

    } catch (error) {
      logger.error('Failed to get shared events', error as Error);
      return [];
    }
  }

  /**
   * Calculate shared event pricing
   */
  static calculateSharedEventPricing(
    basePrice: number,
    passengerCount: number
  ): { totalPrice: number; pricePerPerson: number } {
    // Simple per-person pricing for shared events
    const pricePerPerson = basePrice;
    const totalPrice = pricePerPerson * passengerCount;

    logger.debug('Calculated shared event pricing', {
      basePrice,
      passengerCount,
      pricePerPerson,
      totalPrice
    });

    return { totalPrice, pricePerPerson };
  }
}
