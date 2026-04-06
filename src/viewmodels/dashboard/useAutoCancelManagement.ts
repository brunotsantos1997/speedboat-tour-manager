// src/viewmodels/dashboard/useAutoCancelManagement.ts
import { useCallback } from 'react';
import type { EventType } from '../../core/domain/types';
import { eventRepository } from '../../core/repositories/EventRepository';
import { useEventSync } from '../useEventSync';
import { logger } from '../../core/common/Logger';

export const useAutoCancelManagement = () => {
  const { syncEvent } = useEventSync();

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

          logger.info('Auto-cancelled event', {
            eventId: event.id,
            preScheduledAt: event.preScheduledAt,
            cancelledAt: now
          });
        } catch (error) {
          logger.error('Failed to auto-cancel event', error as Error, { 
            eventId: event.id, 
            operation: 'auto-cancel' 
          });
        }
      }
    }

    return processedEvents;
  }, [syncEvent]);

  return {
    processAutoCancel,
  };
};
