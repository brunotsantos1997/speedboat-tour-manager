import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SharedEventService, type SharedEventDraft } from '../../../src/core/domain/SharedEventService';
import type { BoardingLocation, Boat, EventType } from '../../../src/core/domain/types';

vi.mock('../../../src/core/repositories/EventRepository', () => ({
  eventRepository: {
    getEventsByDate: vi.fn(),
    getEventsByDateRange: vi.fn()
  }
}));

vi.mock('../../../src/core/common/Logger', () => ({
  logger: {
    error: vi.fn()
  }
}));

const boardingLocation: BoardingLocation = {
  id: 'boarding-1',
  name: 'Marina Central'
};

const boat: Boat = {
  id: 'boat-1',
  name: 'Lancha Azul',
  capacity: 10,
  size: 30,
  pricePerHour: 100,
  pricePerHalfHour: 60,
  organizationTimeMinutes: 30,
  isArchived: false
};

const buildSharedEvent = (overrides: Partial<EventType> = {}): EventType => ({
  id: 'event-1',
  date: '2026-04-07',
  startTime: '09:00',
  endTime: '11:00',
  status: 'SCHEDULED',
  paymentStatus: 'CONFIRMED',
  boat,
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

describe('SharedEventService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('expoe cliente e tipo de passeio virtuais para shared event', () => {
    expect(SharedEventService.getSharedClient()).toEqual({
      id: 'shared-event-client',
      name: 'Passeio Compartilhado',
      phone: 'shared-event',
      totalTrips: 0
    });

    expect(SharedEventService.getSharedTourType()).toEqual({
      id: 'shared-event-tour',
      name: 'Compartilhado',
      color: '#6B7280',
      isArchived: false
    });
  });

  it('identifica shared events sem depender de entidades sentinela persistidas', () => {
    expect(SharedEventService.isSharedEvent(buildSharedEvent())).toBe(true);

    expect(SharedEventService.isSharedEvent(buildSharedEvent({
      client: { id: 'client-1', name: 'Cliente Real', phone: '11999999999', totalTrips: 0 },
      tourType: { id: 'tour-1', name: 'Compartilhado', color: '#000000' }
    }))).toBe(true);

    expect(SharedEventService.isSharedEvent(buildSharedEvent({
      client: { id: 'client-1', name: 'Cliente Real', phone: '11999999999', totalTrips: 0 },
      tourType: { id: 'tour-1', name: 'Privado', color: '#000000' }
    }))).toBe(false);
  });

  it('exige local de embarque explicito', () => {
    expect(() => SharedEventService.requireBoardingLocation(null)).toThrow(
      'Selecione um local de embarque para o passeio compartilhado.'
    );

    expect(SharedEventService.requireBoardingLocation(boardingLocation)).toEqual(boardingLocation);
  });

  it('valida configuracao usando apenas barcos ativos', () => {
    const errors = SharedEventService.validateSharedEventConfig(
      { minPassengers: 8, maxPassengers: 6 },
      [boat]
    );
    expect(errors).toContain('Minimum passengers cannot be greater than maximum passengers');

    const noSuitableBoatErrors = SharedEventService.validateSharedEventConfig(
      { minPassengers: 11, maxPassengers: 12 },
      [
        boat,
        { ...boat, id: 'boat-archived', capacity: 12, isArchived: true }
      ]
    );
    expect(noSuitableBoatErrors).toContain('No boats available for passenger range 11-12');

    const validErrors = SharedEventService.validateSharedEventConfig(
      { minPassengers: 4, maxPassengers: 10 },
      [
        boat,
        { ...boat, id: 'boat-archived', capacity: 10, isArchived: true }
      ]
    );
    expect(validErrors).toEqual([]);
  });

  it('detecta conflito apenas para shared events ativos no mesmo barco e horario', async () => {
    const { eventRepository } = await import('../../../src/core/repositories/EventRepository');
    vi.mocked(eventRepository.getEventsByDate).mockResolvedValue([
      buildSharedEvent(),
      buildSharedEvent({ id: 'event-cancelled', status: 'CANCELLED' }),
      buildSharedEvent({
        id: 'event-private',
        client: { id: 'client-2', name: 'Cliente Real', phone: '11999999999', totalTrips: 0 },
        tourType: { id: 'tour-private', name: 'Privado', color: '#000000' }
      })
    ]);

    await expect(
      SharedEventService.checkSharedEventConflict('2026-04-07', '09:00', 'boat-1')
    ).resolves.toMatchObject({ id: 'event-1' });

    await expect(
      SharedEventService.checkSharedEventConflict('2026-04-07', '09:00', 'boat-1', 'event-1')
    ).resolves.toBeNull();
  });

  it('retorna null em conflito quando o repository falha', async () => {
    const { eventRepository } = await import('../../../src/core/repositories/EventRepository');
    const { logger } = await import('../../../src/core/common/Logger');
    vi.mocked(eventRepository.getEventsByDate).mockRejectedValue(new Error('db down'));

    await expect(
      SharedEventService.checkSharedEventConflict('2026-04-07', '09:00', 'boat-1')
    ).resolves.toBeNull();

    expect(logger.error).toHaveBeenCalled();
  });

  it('monta os dados do evento compartilhado com contrato explicito', () => {
    const draft: SharedEventDraft = {
      date: '2026-04-07',
      startTime: '09:00',
      endTime: '11:00',
      boat,
      boardingLocation,
      passengerCount: 5,
      subtotal: 500,
      total: 450,
      totalDiscount: 50,
      observations: 'Grupo de teste',
      createdByUserId: 'user-1'
    };

    const eventData = SharedEventService.buildEventData(draft);

    expect(eventData.client).toEqual(SharedEventService.getSharedClient());
    expect(eventData.tourType).toEqual(SharedEventService.getSharedTourType());
    expect(eventData.boardingLocation).toEqual(boardingLocation);
    expect(eventData.paymentStatus).toBe('CONFIRMED');
    expect(eventData.rentalDiscount).toEqual({ type: 'FIXED', value: 50 });
    expect(eventData.createdByUserId).toBe('user-1');
  });

  it('atualiza shared event preservando o id original', () => {
    const original = buildSharedEvent();
    const updated = SharedEventService.buildUpdatedSharedEvent(original, {
      date: '2026-04-08',
      startTime: '10:00',
      endTime: '12:00',
      boat,
      boardingLocation,
      passengerCount: 6,
      subtotal: 600,
      total: 540,
      totalDiscount: 60,
      observations: 'Atualizado'
    });

    expect(updated.id).toBe(original.id);
    expect(updated.date).toBe('2026-04-08');
    expect(updated.total).toBe(540);
    expect(updated.client.id).toBe(SharedEventService.SHARED_CLIENT_ID);
  });

  it('agrega grupo a evento compartilhado existente sem exceder capacidade', () => {
    const merged = SharedEventService.mergeIntoExistingEvent(buildSharedEvent(), {
      boardingLocation,
      passengerCount: 3,
      subtotal: 300,
      total: 270,
      totalDiscount: 30,
      observations: 'Segundo grupo'
    });

    expect(merged.passengerCount).toBe(7);
    expect(merged.subtotal).toBe(700);
    expect(merged.total).toBe(650);
    expect(merged.rentalDiscount).toEqual({ type: 'FIXED', value: 50 });
    expect(merged.observations).toContain('Segundo grupo');
  });

  it('bloqueia merge com local diferente ou capacidade excedida', () => {
    expect(() =>
      SharedEventService.mergeIntoExistingEvent(buildSharedEvent(), {
        boardingLocation: { id: 'boarding-2', name: 'Outro Pier' },
        passengerCount: 1,
        subtotal: 100,
        total: 100,
        totalDiscount: 0
      })
    ).toThrow('Ja existe um passeio compartilhado nesse horario com outro local de embarque.');

    expect(() =>
      SharedEventService.mergeIntoExistingEvent(buildSharedEvent({ passengerCount: 9 }), {
        boardingLocation,
        passengerCount: 2,
        subtotal: 200,
        total: 200,
        totalDiscount: 0
      })
    ).toThrow('A capacidade maxima da embarcacao seria excedida ao adicionar este grupo.');
  });

  it('lista apenas shared events no periodo e lida com erro', async () => {
    const { eventRepository } = await import('../../../src/core/repositories/EventRepository');
    vi.mocked(eventRepository.getEventsByDateRange).mockResolvedValue([
      buildSharedEvent({ id: 'shared-1' }),
      buildSharedEvent({
        id: 'private-1',
        client: { id: 'client-9', name: 'Cliente Real', phone: '11999999999', totalTrips: 0 },
        tourType: { id: 'tour-9', name: 'Privado', color: '#000000' }
      })
    ]);

    await expect(
      SharedEventService.getSharedEvents('2026-04-01', '2026-04-30')
    ).resolves.toHaveLength(1);

    vi.mocked(eventRepository.getEventsByDateRange).mockRejectedValueOnce(new Error('query error'));
    await expect(
      SharedEventService.getSharedEvents('2026-04-01', '2026-04-30')
    ).resolves.toEqual([]);
  });

  it('calcula o preco compartilhado por pessoa', () => {
    expect(SharedEventService.calculateSharedEventPricing(99.9, 3)).toEqual({
      pricePerPerson: 99.9,
      totalPrice: 299.70000000000005
    });
  });
});
