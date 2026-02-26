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
  const { syncEvent, deleteFromGoogle } = useEventSync();
  const lastSyncedRef = useRef<Record<string, { data: string; googleId?: string }>>({});
  const isFirstLoad = useRef(true);

  useEffect(() => {
    // Only run if autoSync is enabled and configured
    if (!currentUser?.calendarSettings?.autoSync || !currentUser?.calendarSettings?.calendarId) {
      lastSyncedRef.current = {};
      return;
    }

    const unsubscribe = eventRepository.subscribe((events) => {
      const currentIds = new Set(events.map(e => e.id));

      // 1. Handle Deletions
      Object.keys(lastSyncedRef.current).forEach(id => {
        if (!currentIds.has(id)) {
          const { googleId } = lastSyncedRef.current[id];
          if (googleId) {
            deleteFromGoogle(googleId);
          }
          delete lastSyncedRef.current[id];
        }
      });

      // 2. Handle Updates and Additions
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
          tourTypeName: event.tourType?.name,
          products: event.products?.map(p => ({ name: p.name, isCourtesy: p.isCourtesy }))
        });

        const prev = lastSyncedRef.current[event.id];
        const googleId = event.googleCalendarEventIds?.[currentUser.id];

        if (isFirstLoad.current) {
          // On startup, sync upcoming events (next 30 days) to catch up with changes made offline
          const eventDate = new Date(event.date + 'T00:00');
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const thirtyDaysFromNow = new Date();
          thirtyDaysFromNow.setDate(today.getDate() + 30);

          if (eventDate >= today && eventDate <= thirtyDaysFromNow) {
            syncEvent(event);
          }
        } else if (!prev) {
          // New event appeared while the system is open
          syncEvent(event);
        } else if (prev.data !== relevantData) {
          // Relevant data changed while the system is open
          syncEvent(event);
        }

        // Always update the ref with latest state
        lastSyncedRef.current[event.id] = { data: relevantData, googleId };
      });

      isFirstLoad.current = false;
    });

    return () => {
      unsubscribe();
    };
  }, [
    currentUser?.id,
    currentUser?.calendarSettings?.autoSync,
    currentUser?.calendarSettings?.calendarId,
    syncEvent,
    deleteFromGoogle
  ]);
};
