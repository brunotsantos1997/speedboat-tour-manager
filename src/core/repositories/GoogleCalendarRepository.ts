// src/core/repositories/GoogleCalendarRepository.ts
import type { EventType } from '../domain/types';

export interface GoogleCalendar {
  id: string;
  summary: string;
  description?: string;
  primary?: boolean;
}

class GoogleCalendarRepository {
  private baseUrl = 'https://www.googleapis.com/calendar/v3';

  async listCalendars(accessToken: string): Promise<GoogleCalendar[]> {
    const response = await fetch(`${this.baseUrl}/users/me/calendarList`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      if (response.status === 401) throw new Error('UNAUTHORIZED');
      throw new Error('Failed to fetch calendars');
    }

    const data = await response.json();
    return data.items || [];
  }

  async upsertEvent(
    accessToken: string,
    calendarId: string,
    event: EventType,
    googleEventId?: string
  ): Promise<string> {
    const url = googleEventId
      ? `${this.baseUrl}/calendars/${calendarId}/events/${googleEventId}`
      : `${this.baseUrl}/calendars/${calendarId}/events`;

    const method = googleEventId ? 'PUT' : 'POST';

    const googleEvent = this.convertToGoogleEvent(event);

    const response = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(googleEvent),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Google Calendar Error:', errorData);
      if (response.status === 401) throw new Error('UNAUTHORIZED');
      throw new Error(errorData.error?.message || 'Failed to sync event');
    }

    const data = await response.json();
    return data.id;
  }

  async deleteEvent(accessToken: string, calendarId: string, googleEventId: string): Promise<void> {
    const response = await fetch(
      `${this.baseUrl}/calendars/${calendarId}/events/${googleEventId}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok && response.status !== 404) {
      if (response.status === 401) throw new Error('UNAUTHORIZED');
      throw new Error('Failed to delete event');
    }
  }

  private convertToGoogleEvent(event: EventType) {
    const startDateTime = `${event.date}T${event.startTime}:00`;
    const endDateTime = `${event.date}T${event.endTime}:00`;

    // Try to determine timezone from browser or use default
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Sao_Paulo';

    let description = `Lancha: ${event.boat.name}\n`;
    description += `Local: ${event.boardingLocation.name}\n`;
    description += `Passageiros: ${event.passengerCount}\n`;
    if (event.tourType) description += `Tipo: ${event.tourType.name}\n`;
    if (event.observations) description += `Obs: ${event.observations}\n`;
    description += `Status: ${event.status}\n`;

    return {
      summary: `Passeio - ${event.client.name}${event.tourType ? ` (${event.tourType.name})` : ''}`,
      description,
      location: event.boardingLocation.name,
      start: {
        dateTime: startDateTime,
        timeZone,
      },
      end: {
        dateTime: endDateTime,
        timeZone,
      },
      status: event.status === 'CANCELLED' || event.status === 'ARCHIVED_CANCELLED' || event.status === 'REFUNDED' ? 'cancelled' : 'confirmed',
    };
  }
}

export const googleCalendarRepository = new GoogleCalendarRepository();
