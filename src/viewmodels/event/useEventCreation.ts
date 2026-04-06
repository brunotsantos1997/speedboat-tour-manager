// src/viewmodels/event/useEventCreation.ts
import { useCallback } from 'react';
import type { EventType, SelectedProduct, ClientProfile, Boat, BoardingLocation, TourType } from '../../core/domain/types';
import { eventRepository } from '../../core/repositories/EventRepository';
import { tourTypeRepository } from '../../core/repositories/TourTypeRepository';
import { sanitizeObject } from '../../core/utils/objectUtils';
import { format } from 'date-fns';
import { useEventSync } from '../useEventSync';
import { useAuth } from '../../contexts/auth/useAuth';
import { logger } from '../../core/common/Logger';

interface EventCreationData {
  selectedDate: Date | undefined;
  startTime: string;
  endTime: string;
  selectedBoat: Boat | null;
  selectedBoardingLocation: BoardingLocation | null;
  selectedTourType: TourType | null;
  selectedProducts: SelectedProduct[];
  rentalDiscount: any;
  passengerCount: number;
  observations: string;
  tax: number;
  taxDescription: string;
  isPreScheduled: boolean;
  selectedClient: ClientProfile | null;
  calculations: {
    rentalGross: number;
    rentalRevenue: number;
    productsGross: number;
    productsRevenue: number;
    taxCost: number;
    subtotal: number;
    total: number;
  };
}

export const useEventCreation = (editingEventId?: string | null) => {
  const { currentUser } = useAuth();
  const { syncEvent } = useEventSync();

  const createEvent = useCallback(async (data: EventCreationData) => {
    const {
      selectedDate,
      startTime,
      endTime,
      selectedBoat,
      selectedBoardingLocation,
      selectedTourType,
      selectedProducts,
      rentalDiscount,
      passengerCount,
      observations,
      tax,
      taxDescription,
      isPreScheduled,
      selectedClient,
      calculations
    } = data;

    // Validation
    if (!selectedDate || !selectedBoat || !selectedBoardingLocation || !selectedClient) {
      throw new Error('Dados obrigatórios faltando: data, barco, local de embarque ou cliente.');
    }

    if (!currentUser) {
      throw new Error('Usuário não autenticado.');
    }

    try {
      logger.info('Creating event', {
        date: format(selectedDate, 'yyyy-MM-dd'),
        boatId: selectedBoat.id,
        clientId: selectedClient.id,
        total: calculations.total
      });

      const eventData: Omit<EventType, 'id'> = {
        date: format(selectedDate, 'yyyy-MM-dd'),
        startTime,
        endTime,
        status: isPreScheduled ? 'PRE_SCHEDULED' : 'SCHEDULED',
        paymentStatus: 'PENDING',
        boat: selectedBoat,
        boardingLocation: selectedBoardingLocation,
        tourType: selectedTourType || undefined,
        products: selectedProducts,
        rentalDiscount,
        client: selectedClient,
        passengerCount,
        subtotal: calculations.subtotal,
        total: calculations.total,
        observations,
        rentalRevenue: calculations.rentalRevenue,
        productsRevenue: calculations.productsRevenue,
        rentalGross: calculations.rentalGross,
        productsGross: calculations.productsGross,
        rentalCost: 0,
        productsCost: 0,
        taxCost: calculations.taxCost,
        tax,
        taxDescription,
        additionalCosts: [],
        createdByUserId: currentUser.id,
        ...(isPreScheduled && { preScheduledAt: Date.now() })
      };

      const newEvent = await eventRepository.add(sanitizeObject(eventData));
      
      // Sync with Google Calendar if enabled
      await syncEvent(newEvent);

      logger.info('Event created successfully', {
        eventId: newEvent.id,
        date: newEvent.date,
        total: newEvent.total
      });

      return newEvent;

    } catch (error) {
      logger.error('Failed to create event', error as Error, {
        date: format(selectedDate, 'yyyy-MM-dd'),
        boatId: selectedBoat.id,
        clientId: selectedClient.id
      });
      throw error;
    }
  }, [currentUser, syncEvent]);

  const updateEvent = useCallback(async (data: EventCreationData) => {
    if (!editingEventId) {
      throw new Error('ID do evento não fornecido para atualização.');
    }

    const {
      selectedDate,
      startTime,
      endTime,
      selectedBoat,
      selectedBoardingLocation,
      selectedTourType,
      selectedProducts,
      rentalDiscount,
      passengerCount,
      observations,
      tax,
      taxDescription,
      isPreScheduled,
      selectedClient,
      calculations
    } = data;

    // Validation
    if (!selectedDate || !selectedBoat || !selectedBoardingLocation || !selectedClient) {
      throw new Error('Dados obrigatórios faltando: data, barco, local de embarque ou cliente.');
    }

    if (!currentUser) {
      throw new Error('Usuário não autenticado.');
    }

    try {
      logger.info('Updating event', {
        eventId: editingEventId,
        date: format(selectedDate, 'yyyy-MM-dd'),
        boatId: selectedBoat.id,
        clientId: selectedClient.id,
        total: calculations.total
      });

      // Get existing event
      const existingEvent = await eventRepository.getById(editingEventId);
      if (!existingEvent) {
        throw new Error('Evento não encontrado.');
      }

      const updatedEventData: Partial<EventType> = {
        date: format(selectedDate, 'yyyy-MM-dd'),
        startTime,
        endTime,
        boat: selectedBoat,
        boardingLocation: selectedBoardingLocation,
        tourType: selectedTourType || undefined,
        products: selectedProducts,
        rentalDiscount,
        client: selectedClient,
        passengerCount,
        subtotal: calculations.subtotal,
        total: calculations.total,
        observations,
        rentalRevenue: calculations.rentalRevenue,
        productsRevenue: calculations.productsRevenue,
        rentalGross: calculations.rentalGross,
        productsGross: calculations.productsGross,
        taxCost: calculations.taxCost,
        tax,
        taxDescription,
        additionalCosts: existingEvent.additionalCosts,
        // Preserve status logic
        status: isPreScheduled && existingEvent.status === 'SCHEDULED' ? 'PRE_SCHEDULED' : existingEvent.status,
        // Don't change payment status on update unless explicitly needed
      };

      const updatedEvent = await eventRepository.updateEvent({
        ...existingEvent,
        ...updatedEventData
      });
      
      // Sync with Google Calendar if enabled
      await syncEvent(updatedEvent);

      logger.info('Event updated successfully', {
        eventId: updatedEvent.id,
        date: updatedEvent.date,
        total: updatedEvent.total
      });

      return updatedEvent;

    } catch (error) {
      logger.error('Failed to update event', error as Error, {
        eventId: editingEventId,
        date: format(selectedDate, 'yyyy-MM-dd'),
        boatId: selectedBoat.id
      });
      throw error;
    }
  }, [editingEventId, currentUser, syncEvent]);

  const saveTourType = useCallback(async (name: string, color: string) => {
    try {
      const newTourType = await tourTypeRepository.add({ name, color, isArchived: false });
      logger.info('Tour type created successfully', { tourTypeId: newTourType.id, name });
      return newTourType;
    } catch (error) {
      logger.error('Failed to create tour type', error as Error, { name });
      throw error;
    }
  }, []);

  return {
    createEvent,
    updateEvent,
    saveTourType,
  };
};
