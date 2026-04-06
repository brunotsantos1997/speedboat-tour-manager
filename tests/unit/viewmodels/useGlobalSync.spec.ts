import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { EventType } from '../../../src/core/domain/types';
import { useGlobalSync } from '../../../src/viewmodels/useGlobalSync';

const mockSyncEvent = vi.fn();
const mockDeleteFromGoogle = vi.fn();
const mockSubscribe = vi.fn();
const mockLoggerError = vi.fn();

let authState: {
  currentUser: {
    id: string;
    calendarSettings?: {
      autoSync: boolean;
      calendarId?: string;
    };
  } | null;
} = {
  currentUser: {
    id: 'user-1',
    calendarSettings: {
      autoSync: true,
      calendarId: 'calendar-123',
    },
  },
};

let subscriptionCallback: ((events: EventType[]) => void) | null = null;

vi.mock('../../../src/contexts/auth/useAuth', () => ({
  useAuth: () => authState,
}));

vi.mock('../../../src/viewmodels/useEventSync', () => ({
  useEventSync: () => ({
    syncEvent: mockSyncEvent,
    deleteFromGoogle: mockDeleteFromGoogle,
  }),
}));

vi.mock('../../../src/core/repositories/EventRepository', () => ({
  eventRepository: {
    subscribe: (callback: (events: EventType[]) => void) => mockSubscribe(callback),
  },
}));

vi.mock('../../../src/core/common/Logger', () => ({
  logger: {
    error: (...args: unknown[]) => mockLoggerError(...args),
  },
}));

const createEvent = (overrides: Partial<EventType> = {}): EventType =>
  ({
    id: 'event-1',
    date: '2026-04-07',
    startTime: '09:00',
    endTime: '11:00',
    status: 'SCHEDULED',
    paymentStatus: 'PENDING',
    boat: { id: 'boat-1', name: 'Speedboat' },
    client: { id: 'client-1', name: 'Cliente Teste', phone: '21999999999' },
    boardingLocation: { id: 'loc-1', name: 'Marina' },
    tourType: { id: 'tour-1', name: 'Passeio', color: '#000000', isArchived: false },
    products: [],
    passengerCount: 4,
    total: 1000,
    subtotal: 1000,
    observations: '',
    rentalDiscount: { type: 'FIXED', value: 0 },
    discount: { type: 'FIXED', value: 0 },
    productsDiscount: { type: 'FIXED', value: 0 },
    ...overrides,
  }) as EventType;

describe('useGlobalSync', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-06T10:00:00Z'));
    vi.clearAllMocks();

    authState = {
      currentUser: {
        id: 'user-1',
        calendarSettings: {
          autoSync: true,
          calendarId: 'calendar-123',
        },
      },
    };

    subscriptionCallback = null;
    mockSubscribe.mockImplementation((callback: (events: EventType[]) => void) => {
      subscriptionCallback = callback;
      return vi.fn();
    });
    mockSyncEvent.mockResolvedValue(undefined);
    mockDeleteFromGoogle.mockResolvedValue(undefined);
  });

  it('nao assina eventos quando autosync nao esta configurado', async () => {
    authState = {
      currentUser: {
        id: 'user-1',
        calendarSettings: {
          autoSync: false,
          calendarId: 'calendar-123',
        },
      },
    };

    renderHook(() => useGlobalSync());

    expect(mockSubscribe).not.toHaveBeenCalled();
  });

  it('sincroniza eventos futuros na primeira carga com fila atrasada', async () => {
    const event = createEvent();

    renderHook(() => useGlobalSync());

    expect(subscriptionCallback).toBeTypeOf('function');

    act(() => {
      subscriptionCallback?.([event]);
    });

    expect(mockSyncEvent).not.toHaveBeenCalled();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000);
    });

    expect(mockSyncEvent).toHaveBeenCalledWith(event);
  });

  it('remove evento do Google quando ele desaparece da assinatura local', async () => {
    const event = createEvent({
      googleCalendarEventIds: {
        'user-1': 'google-event-1',
      },
    });

    renderHook(() => useGlobalSync());

    act(() => {
      subscriptionCallback?.([event]);
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000);
    });

    expect(mockSyncEvent).toHaveBeenCalledTimes(1);

    act(() => {
      subscriptionCallback?.([]);
    });

    expect(mockDeleteFromGoogle).toHaveBeenCalledWith('google-event-1');
  });

  it('reprocessa alteracoes relevantes depois da janela de debounce', async () => {
    const event = createEvent();
    const updatedEvent = createEvent({
      observations: 'Atualizado depois do debounce',
    });

    renderHook(() => useGlobalSync());

    act(() => {
      subscriptionCallback?.([event]);
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000);
    });

    expect(mockSyncEvent).toHaveBeenCalledTimes(1);

    act(() => {
      subscriptionCallback?.([updatedEvent]);
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000);
    });

    expect(mockSyncEvent).toHaveBeenCalledTimes(1);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(6000);
      subscriptionCallback?.([updatedEvent]);
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000);
    });

    expect(mockSyncEvent).toHaveBeenCalledTimes(2);
    expect(mockSyncEvent).toHaveBeenLastCalledWith(updatedEvent);
  });

  it('faz retry automatico quando um item da fila falha', async () => {
    const event = createEvent();
    mockSyncEvent.mockRejectedValueOnce(new Error('google failed')).mockResolvedValueOnce(undefined);

    renderHook(() => useGlobalSync());

    act(() => {
      subscriptionCallback?.([event]);
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000);
    });

    expect(mockSyncEvent).toHaveBeenCalledTimes(2);
    expect(mockLoggerError).toHaveBeenCalled();
  });
});
