import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { googleCalendarRepository, type GoogleCalendar } from '../core/repositories/GoogleCalendarRepository';
import { eventRepository } from '../core/repositories/EventRepository';

export const useGoogleSyncViewModel = () => {
  const {
    currentUser,
    googleAccessToken,
    setGoogleAccessToken,
    updateCalendarSettings,
    linkedProviders,
    linkGoogle,
    unlinkGoogle
  } = useAuth();
  const [calendars, setCalendars] = useState<GoogleCalendar[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [syncProgress, setSyncProgress] = useState<{ current: number; total: number } | null>(null);

  const isGoogleLinked = linkedProviders.includes('google.com');

  const fetchCalendars = useCallback(async () => {
    if (!googleAccessToken) return;
    setIsLoading(true);
    setError(null);
    try {
      const list = await googleCalendarRepository.listCalendars(googleAccessToken);
      setCalendars(list);
    } catch (err: any) {
      if (err.message === 'UNAUTHORIZED') {
        setGoogleAccessToken(null);
        localStorage.removeItem('google_access_token');
        setError('Sessão do Google expirada. Por favor, vincule novamente ou faça login com Google.');
      } else {
        setError('Falha ao buscar calendários.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [googleAccessToken, setGoogleAccessToken]);

  useEffect(() => {
    if (isGoogleLinked && googleAccessToken) {
      fetchCalendars();
    }
  }, [isGoogleLinked, googleAccessToken, fetchCalendars]);

  const saveSettings = async (calendarId: string, autoSync: boolean) => {
    if (!currentUser) return;
    setIsLoading(true);
    try {
      await updateCalendarSettings(currentUser.id, { calendarId, autoSync });
    } catch (err) {
      setError('Falha ao salvar configurações.');
    } finally {
      setIsLoading(false);
    }
  };

  const syncExistingEvents = async () => {
    if (!currentUser || !googleAccessToken || !currentUser.calendarSettings?.calendarId) {
      setError('Configurações incompletas para sincronização.');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const allEvents = await eventRepository.getAll();
      const futureEvents = allEvents.filter(e => {
        const eventDate = new Date(e.date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return eventDate >= today;
      });

      setSyncProgress({ current: 0, total: futureEvents.length });

      for (let i = 0; i < futureEvents.length; i++) {
        const event = futureEvents[i];
        const existingGoogleId = event.googleCalendarEventIds?.[currentUser.id];
        const isCancelled = ['CANCELLED', 'ARCHIVED_CANCELLED', 'REFUNDED', 'PENDING_REFUND'].includes(event.status);

        if (isCancelled) {
          if (existingGoogleId) {
            await googleCalendarRepository.deleteEvent(
              googleAccessToken,
              currentUser.calendarSettings.calendarId,
              existingGoogleId
            );
            const { [currentUser.id]: _, ...remainingIds } = event.googleCalendarEventIds || {};
            await eventRepository.updateEvent({ ...event, googleCalendarEventIds: remainingIds });
          }
          setSyncProgress({ current: i + 1, total: futureEvents.length });
          continue;
        }

        const googleId = await googleCalendarRepository.upsertEvent(
          googleAccessToken,
          currentUser.calendarSettings.calendarId,
          event,
          existingGoogleId
        );

        if (googleId !== existingGoogleId) {
          const updatedEvent = {
            ...event,
            googleCalendarEventIds: {
              ...(event.googleCalendarEventIds || {}),
              [currentUser.id]: googleId
            }
          };
          await eventRepository.updateEvent(updatedEvent);
        }
        setSyncProgress({ current: i + 1, total: futureEvents.length });
      }
    } catch (err: any) {
      setError('Falha durante a sincronização: ' + err.message);
    } finally {
      setIsLoading(false);
      setSyncProgress(null);
    }
  };

  return {
    currentUser,
    calendars,
    isLoading,
    error,
    isGoogleLinked,
    syncProgress,
    saveSettings,
    syncExistingEvents,
    fetchCalendars,
    linkGoogle,
    unlinkGoogle,
  };
};
