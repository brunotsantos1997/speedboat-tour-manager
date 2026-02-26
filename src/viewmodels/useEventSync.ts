import { useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { googleCalendarRepository } from '../core/repositories/GoogleCalendarRepository';
import { eventRepository } from '../core/repositories/EventRepository';
import type { EventType } from '../core/domain/types';

export const useEventSync = () => {
  const { currentUser, googleAccessToken } = useAuth();

  const deleteFromGoogle = useCallback(async (googleEventId: string) => {
    if (
      !currentUser?.calendarSettings?.autoSync ||
      !currentUser?.calendarSettings?.calendarId ||
      !googleAccessToken
    ) {
      return;
    }

    try {
      await googleCalendarRepository.deleteEvent(
        googleAccessToken,
        currentUser.calendarSettings.calendarId,
        googleEventId
      );
    } catch (error) {
      console.error('Google Calendar Deletion failed:', error);
    }
  }, [currentUser, googleAccessToken]);

  const syncEvent = useCallback(async (event: EventType) => {
    if (
      !currentUser?.calendarSettings?.autoSync ||
      !currentUser?.calendarSettings?.calendarId ||
      !googleAccessToken
    ) {
      return;
    }

    try {
      const existingGoogleId = event.googleCalendarEventIds?.[currentUser.id];
      const isCancelled = ['CANCELLED', 'ARCHIVED_CANCELLED', 'REFUNDED', 'PENDING_REFUND'].includes(event.status);

      if (isCancelled) {
        if (existingGoogleId) {
          await googleCalendarRepository.deleteEvent(
            googleAccessToken,
            currentUser.calendarSettings.calendarId,
            existingGoogleId
          );

          // Remove the ID from the event to avoid future sync attempts
          const { [currentUser.id]: _, ...remainingIds } = event.googleCalendarEventIds || {};
          const updatedEvent = {
            ...event,
            googleCalendarEventIds: remainingIds
          };
          await eventRepository.updateEvent(updatedEvent);
        }
        return;
      }

      const googleId = await googleCalendarRepository.upsertEvent(
        googleAccessToken,
        currentUser.calendarSettings.calendarId,
        event,
        existingGoogleId
      );

      if (googleId !== existingGoogleId) {
        // Only update if the ID changed or was newly created
        const updatedEvent = {
          ...event,
          googleCalendarEventIds: {
            ...(event.googleCalendarEventIds || {}),
            [currentUser.id]: googleId
          }
        };
        // Use a flag or check to prevent infinite loops if we were using a listener,
        // but here we are calling it explicitly.
        await eventRepository.updateEvent(updatedEvent);
      }
    } catch (error) {
      console.error('Google Calendar Auto-sync failed:', error);
    }
  }, [currentUser, googleAccessToken]);

  return { syncEvent, deleteFromGoogle };
};
