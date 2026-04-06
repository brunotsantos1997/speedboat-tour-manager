// src/viewmodels/client/useClientEventsState.ts
import { useState, useEffect, useCallback } from 'react';
import type { EventType, ClientProfile } from '../../core/domain/types';
import { eventRepository } from '../../core/repositories/EventRepository';
import { useEventSync } from '../useEventSync';
import { logger } from '../../core/common/Logger';

export const useClientEventsState = (selectedClient: ClientProfile | null) => {
  const { syncEvent } = useEventSync();
  const [clientEvents, setClientEvents] = useState<EventType[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const processAutoCancel = useCallback(async (events: EventType[]) => {
    const now = Date.now();
    const twentyFourHours = 24 * 60 * 60 * 1000;
    const processedEvents: EventType[] = [];

    for (const event of events) {
      if (event.status === 'PRE_SCHEDULED' && event.preScheduledAt && (now - event.preScheduledAt > twentyFourHours)) {
        try {
          const cancelledEvent = { ...event, status: 'CANCELLED' as const, autoCancelled: true };
          const savedEvent = await eventRepository.updateEvent(cancelledEvent);
          await syncEvent(savedEvent);
          processedEvents.push(savedEvent);

          logger.info('Auto-cancelled client event', {
            eventId: event.id,
            preScheduledAt: event.preScheduledAt,
            cancelledAt: now
          });
        } catch (error) {
          logger.error('Failed to auto-cancel client event', error as Error, { 
            eventId: event.id, 
            operation: 'auto-cancel' 
          });
        }
      }
    }

    return processedEvents;
  }, [syncEvent]);

  useEffect(() => {
    if (!selectedClient) {
      setTimeout(() => setClientEvents([]), 0);
      return;
    }

    setTimeout(() => setIsLoading(true), 0);

    // Initial fetch for auto-cancel check
    eventRepository.getEventsByClient(selectedClient.id).then(async (events) => {
      await processAutoCancel(events);
      setTimeout(() => setIsLoading(false), 0);
    });

    const unsubscribe = eventRepository.subscribeToClientEvents(selectedClient.id, (events) => {
      setTimeout(() => {
        const sorted = [...events].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setClientEvents(sorted);
        setIsLoading(false);
      }, 0);
    });

    return unsubscribe;
  }, [selectedClient, processAutoCancel]);

  return {
    clientEvents,
    isLoading,
    setClientEvents,
  };
};
