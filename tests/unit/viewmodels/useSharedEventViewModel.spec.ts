import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SharedEventService } from '../../../src/core/domain/SharedEventService';
import { useSharedEventViewModel } from '../../../src/viewmodels/useSharedEventViewModel';

const mocks = vi.hoisted(() => ({
  syncEvent: vi.fn(),
  showToast: vi.fn(),
  createEventWithPayment: vi.fn(),
  updateEventWithPayment: vi.fn(),
  boatGetAll: vi.fn(),
  eventGetById: vi.fn(),
  eventGetEventsByDate: vi.fn(),
  eventUpdateEvent: vi.fn(),
  boardingLocationGetAll: vi.fn()
}));

vi.mock('../../../src/contexts/auth/useAuth', () => ({
  useAuth: () => ({
    currentUser: { id: 'user-1', name: 'Admin' }
  })
}));

vi.mock('../../../src/viewmodels/useEventSync', () => ({
  useEventSync: () => ({
    syncEvent: mocks.syncEvent
  })
}));

vi.mock('../../../src/ui/contexts/toast/useToast', () => ({
  useToast: () => ({
    showToast: mocks.showToast
  })
}));

vi.mock('../../../src/core/repositories/BoatRepository', () => ({
  boatRepository: {
    getAll: mocks.boatGetAll
  }
}));

vi.mock('../../../src/core/repositories/EventRepository', () => ({
  eventRepository: {
    getById: mocks.eventGetById,
    getEventsByDate: mocks.eventGetEventsByDate,
    updateEvent: mocks.eventUpdateEvent
  }
}));

vi.mock('../../../src/core/repositories/BoardingLocationRepository', () => ({
  boardingLocationRepository: {
    getAll: mocks.boardingLocationGetAll
  }
}));

vi.mock('../../../src/core/domain/TransactionService', () => ({
  TransactionService: {
    createEventWithPayment: mocks.createEventWithPayment,
    updateEventWithPayment: mocks.updateEventWithPayment
  }
}));

vi.mock('../../../src/core/common/Logger', () => ({
  logger: {
    error: vi.fn()
  }
}));

const activeBoat = {
  id: 'boat-1',
  name: 'Lancha Azul',
  capacity: 10,
  size: 30,
  pricePerHour: 100,
  pricePerHalfHour: 60,
  organizationTimeMinutes: 15,
  isArchived: false
};

const archivedBoat = {
  ...activeBoat,
  id: 'boat-2',
  name: 'Lancha Arquivada',
  isArchived: true
};

const boardingLocation = {
  id: 'boarding-1',
  name: 'Pier Central'
};

const buildSharedEvent = (overrides: Record<string, unknown> = {}) => ({
  id: 'shared-1',
  date: '2026-04-07',
  startTime: '09:00',
  endTime: '10:00',
  status: 'SCHEDULED',
  paymentStatus: 'CONFIRMED',
  boat: activeBoat,
  boardingLocation,
  tourType: SharedEventService.getSharedTourType(),
  products: [],
  rentalDiscount: { type: 'FIXED', value: 20 },
  client: SharedEventService.getSharedClient(),
  passengerCount: 4,
  subtotal: 400,
  total: 380,
  observations: 'Grupo inicial compartilhado.',
  rentalRevenue: 380,
  productsRevenue: 0,
  rentalGross: 400,
  productsGross: 0,
  rentalCost: 0,
  productsCost: 0,
  taxCost: 0,
  additionalCosts: [],
  ...overrides
});

describe('useSharedEventViewModel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.boatGetAll.mockResolvedValue([activeBoat, archivedBoat]);
    mocks.boardingLocationGetAll.mockResolvedValue([boardingLocation]);
    mocks.eventGetById.mockResolvedValue(null);
    mocks.eventGetEventsByDate.mockResolvedValue([]);
    mocks.eventUpdateEvent.mockResolvedValue(buildSharedEvent());
    mocks.createEventWithPayment.mockResolvedValue({ success: true, eventId: 'created-1' });
    mocks.updateEventWithPayment.mockResolvedValue({ success: true, eventId: 'shared-1' });
    mocks.syncEvent.mockResolvedValue(undefined);
  });

  it('carrega barcos ativos e locais de embarque no estado inicial', async () => {
    const { result } = renderHook(() => useSharedEventViewModel());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
      expect(result.current.availableBoats).toEqual([activeBoat]);
      expect(result.current.selectedBoat?.id).toBe('boat-1');
      expect(result.current.availableBoardingLocations).toEqual([boardingLocation]);
      expect(result.current.availableTimeSlots.length).toBeGreaterThan(0);
    });
  });

  it('bloqueia criacao sem local de embarque explicito', async () => {
    const { result } = renderHook(() => useSharedEventViewModel());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    let created = false;
    await act(async () => {
      created = await result.current.createSharedEvent();
    });

    expect(created).toBe(false);
    expect(mocks.showToast).toHaveBeenCalledWith('Selecione barco, horario e local de embarque.');
    expect(mocks.createEventWithPayment).not.toHaveBeenCalled();
  });

  it('cria um novo passeio compartilhado quando nao ha conflito existente', async () => {
    mocks.eventGetById.mockImplementation(async (eventId: string) => {
      if (eventId === 'created-1') {
        return buildSharedEvent({ id: 'created-1', passengerCount: 3, subtotal: 300, total: 270 });
      }

      return null;
    });

    const { result } = renderHook(() => useSharedEventViewModel());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      result.current.setSelectedBoardingLocation(boardingLocation);
      result.current.setPassengerCount(3);
      result.current.setCostPerPerson(100);
      result.current.setDiscountPerPerson(10);
    });

    let created = false;
    await act(async () => {
      created = await result.current.createSharedEvent();
    });

    expect(created).toBe(true);
    expect(mocks.createEventWithPayment).toHaveBeenCalledTimes(1);
    expect(mocks.syncEvent).toHaveBeenCalled();
    expect(mocks.showToast).toHaveBeenCalledWith('Passeio compartilhado criado com sucesso!');
  });

  it('faz merge com passeio compartilhado existente no mesmo horario', async () => {
    mocks.eventGetEventsByDate.mockResolvedValue([
      buildSharedEvent()
    ]);
    mocks.eventGetById.mockImplementation(async (eventId: string) => {
      if (eventId === 'shared-1') {
        return buildSharedEvent({ passengerCount: 6, subtotal: 600, total: 570 });
      }

      return null;
    });

    const { result } = renderHook(() => useSharedEventViewModel());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
      expect(result.current.existingSharedEvent?.id).toBe('shared-1');
    });

    act(() => {
      result.current.setSelectedBoardingLocation(boardingLocation);
      result.current.setPassengerCount(2);
      result.current.setCostPerPerson(100);
      result.current.setGeneralDiscount(10);
    });

    let created = false;
    await act(async () => {
      created = await result.current.createSharedEvent();
    });

    expect(created).toBe(true);
    expect(mocks.updateEventWithPayment).toHaveBeenCalledTimes(1);
    expect(mocks.createEventWithPayment).not.toHaveBeenCalled();
    expect(mocks.syncEvent).toHaveBeenCalled();
    expect(mocks.showToast).toHaveBeenCalledWith('Passageiros adicionados ao passeio compartilhado existente!');
  });
});
