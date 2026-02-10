import { useEffect, useRef } from 'react';
import { useEventSync } from './useEventSync';
import { useAuth } from '../contexts/AuthContext';
import { eventRepository } from '../core/repositories/EventRepository';

/**
 * Hook to automatically synchronize Google Calendar when events are updated by other users.
 * It listens to the global events stream and compares the current state with the last known state.
 */
export const useGlobalSync = () => {
  const { currentUser } = useAuth();
  const { syncEvent } = useEventSync();
  const lastSyncedRef = useRef<Record<string, string>>({});

  useEffect(() => {
    // Only run if autoSync is enabled and configured
    if (!currentUser?.calendarSettings?.autoSync || !currentUser?.calendarSettings?.calendarId) {
      lastSyncedRef.current = {};
      return;
    }

    const unsubscribe = eventRepository.subscribe((events) => {
      events.forEach((event) => {
        // Data that affects the calendar event content
        const relevantData = JSON.stringify({
          date: event.date,
          startTime: event.startTime,
          endTime: event.endTime,
          status: event.status,
          boatName: event.boat?.name,
          clientName: event.client?.name,
          locationName: event.boardingLocation?.name,
          observations: event.observations,
          passengerCount: event.passengerCount,
          tourTypeName: event.tourType?.name
        });

        const prevData = lastSyncedRef.current[event.id];

        // On first load or when a new event appears, just record its state
        if (prevData === undefined) {
          lastSyncedRef.current[event.id] = relevantData;
          return;
        }

        // If the relevant data changed, synchronize it
        if (prevData !== relevantData) {
          lastSyncedRef.current[event.id] = relevantData;
          syncEvent(event);
        }
      });
    });

    return () => {
      unsubscribe();
    };
  }, [
    currentUser?.id,
    currentUser?.calendarSettings?.autoSync,
    currentUser?.calendarSettings?.calendarId,
    syncEvent
  ]);
};
