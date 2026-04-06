import { describe, it, expect, vi, beforeEach } from 'vitest'
import { EventStatusService } from '../../../src/core/domain/EventStatusService'
import type { EventType, Payment } from '../../../src/core/domain/types'

// Mock do Logger
vi.mock('../../../src/core/common/Logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn()
  }
}))

describe('EventStatusService - Testes Unitários', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('shouldAutoCancel', () => {
    it('deve cancelar eventos PRE_SCHEDULED após 24 horas', () => {
      const now = Date.now()
      const twentyFiveHoursAgo = now - (25 * 60 * 60 * 1000)
      
      const event: EventType = {
        id: 'event-1',
        status: 'PRE_SCHEDULED',
        preScheduledAt: twentyFiveHoursAgo,
        date: '2024-04-06',
        startTime: '09:00',
        endTime: '11:00',
        boat: { id: 'boat-1', name: 'Boat 1', capacity: 10 },
        boardingLocation: { id: 'loc-1', name: 'Marina' },
        client: { id: 'client-1', name: 'João', phone: '11999999999', totalTrips: 1 },
        passengerCount: 4,
        subtotal: 500,
        total: 500,
        products: []
      }

      const shouldCancel = EventStatusService.shouldAutoCancel(event)
      expect(shouldCancel).toBe(true)
    })

    it('não deve cancelar eventos PRE_SCHEDULED com menos de 24 horas', () => {
      const now = Date.now()
      const twentyThreeHoursAgo = now - (23 * 60 * 60 * 1000)
      
      const event: EventType = {
        id: 'event-2',
        status: 'PRE_SCHEDULED',
        preScheduledAt: twentyThreeHoursAgo,
        date: '2024-04-06',
        startTime: '09:00',
        endTime: '11:00',
        boat: { id: 'boat-1', name: 'Boat 1', capacity: 10 },
        boardingLocation: { id: 'loc-1', name: 'Marina' },
        client: { id: 'client-1', name: 'João', phone: '11999999999', totalTrips: 1 },
        passengerCount: 4,
        subtotal: 500,
        total: 500,
        products: []
      }

      const shouldCancel = EventStatusService.shouldAutoCancel(event)
      expect(shouldCancel).toBe(false)
    })

    it('não deve cancelar eventos com status diferente de PRE_SCHEDULED', () => {
      const now = Date.now()
      const twentyFiveHoursAgo = now - (25 * 60 * 60 * 1000)
      
      const event: EventType = {
        id: 'event-3',
        status: 'SCHEDULED',
        preScheduledAt: twentyFiveHoursAgo,
        date: '2024-04-06',
        startTime: '09:00',
        endTime: '11:00',
        boat: { id: 'boat-1', name: 'Boat 1', capacity: 10 },
        boardingLocation: { id: 'loc-1', name: 'Marina' },
        client: { id: 'client-1', name: 'João', phone: '11999999999', totalTrips: 1 },
        passengerCount: 4,
        subtotal: 500,
        total: 500,
        products: []
      }

      const shouldCancel = EventStatusService.shouldAutoCancel(event)
      expect(shouldCancel).toBe(false)
    })

    it('não deve cancelar eventos PRE_SCHEDULED sem preScheduledAt', () => {
      const event: EventType = {
        id: 'event-4',
        status: 'PRE_SCHEDULED',
        date: '2024-04-06',
        startTime: '09:00',
        endTime: '11:00',
        boat: { id: 'boat-1', name: 'Boat 1', capacity: 10 },
        boardingLocation: { id: 'loc-1', name: 'Marina' },
        client: { id: 'client-1', name: 'João', phone: '11999999999', totalTrips: 1 },
        passengerCount: 4,
        subtotal: 500,
        total: 500,
        products: []
      }

      const shouldCancel = EventStatusService.shouldAutoCancel(event)
      expect(shouldCancel).toBe(false)
    })
  })

  describe('updateStatusFromPayment', () => {
    it('deve mover PRE_SCHEDULED para SCHEDULED com primeiro pagamento', () => {
      const event: EventType = {
        id: 'event-1',
        status: 'PRE_SCHEDULED',
        total: 1000,
        date: '2024-04-06',
        startTime: '09:00',
        endTime: '11:00',
        boat: { id: 'boat-1', name: 'Boat 1', capacity: 10 },
        boardingLocation: { id: 'loc-1', name: 'Marina' },
        client: { id: 'client-1', name: 'João', phone: '11999999999', totalTrips: 1 },
        passengerCount: 4,
        subtotal: 1000,
        products: []
      }

      const payments: Payment[] = [
        { eventId: 'event-1', amount: 500, date: '2024-04-06', timestamp: Date.now() }
      ]

      const updatedEvent = EventStatusService.updateStatusFromPayment(event, 500, payments)
      expect(updatedEvent.status).toBe('SCHEDULED')
      expect(updatedEvent.paymentStatus).toBe('PENDING')
    })

    it('deve manter status SCHEDULED se já for SCHEDULED', () => {
      const event: EventType = {
        id: 'event-2',
        status: 'SCHEDULED',
        total: 1000,
        date: '2024-04-06',
        startTime: '09:00',
        endTime: '11:00',
        boat: { id: 'boat-1', name: 'Boat 1', capacity: 10 },
        boardingLocation: { id: 'loc-1', name: 'Marina' },
        client: { id: 'client-1', name: 'João', phone: '11999999999', totalTrips: 1 },
        passengerCount: 4,
        subtotal: 1000,
        products: []
      }

      const payments: Payment[] = [
        { eventId: 'event-2', amount: 500, date: '2024-04-06', timestamp: Date.now() }
      ]

      const updatedEvent = EventStatusService.updateStatusFromPayment(event, 500, payments)
      expect(updatedEvent.status).toBe('SCHEDULED')
      expect(updatedEvent.paymentStatus).toBe('PENDING')
    })

    it('deve marcar como CONFIRMED quando pagamento total for alcançado', () => {
      const event: EventType = {
        id: 'event-3',
        status: 'SCHEDULED',
        total: 1000,
        date: '2024-04-06',
        startTime: '09:00',
        endTime: '11:00',
        boat: { id: 'boat-1', name: 'Boat 1', capacity: 10 },
        boardingLocation: { id: 'loc-1', name: 'Marina' },
        client: { id: 'client-1', name: 'João', phone: '11999999999', totalTrips: 1 },
        passengerCount: 4,
        subtotal: 1000,
        products: []
      }

      const payments: Payment[] = [
        { eventId: 'event-3', amount: 1000, date: '2024-04-06', timestamp: Date.now() }
      ]

      const updatedEvent = EventStatusService.updateStatusFromPayment(event, 1000, payments)
      expect(updatedEvent.status).toBe('SCHEDULED')
      expect(updatedEvent.paymentStatus).toBe('CONFIRMED')
    })

    it('deve marcar como PENDING quando pagamento for parcial', () => {
      const event: EventType = {
        id: 'event-4',
        status: 'SCHEDULED',
        total: 1000,
        date: '2024-04-06',
        startTime: '09:00',
        endTime: '11:00',
        boat: { id: 'boat-1', name: 'Boat 1', capacity: 10 },
        boardingLocation: { id: 'loc-1', name: 'Marina' },
        client: { id: 'client-1', name: 'João', phone: '11999999999', totalTrips: 1 },
        passengerCount: 4,
        subtotal: 1000,
        products: []
      }

      const payments: Payment[] = [
        { eventId: 'event-4', amount: 800, date: '2024-04-06', timestamp: Date.now() }
      ]

      const updatedEvent = EventStatusService.updateStatusFromPayment(event, 800, payments)
      expect(updatedEvent.status).toBe('SCHEDULED')
      expect(updatedEvent.paymentStatus).toBe('PENDING')
    })
  })

  describe('archiveEvent', () => {
    it('deve arquivar eventos COMPLETED como ARCHIVED_COMPLETED', () => {
      const event: EventType = {
        id: 'event-1',
        status: 'COMPLETED',
        date: '2024-04-06',
        startTime: '09:00',
        endTime: '11:00',
        boat: { id: 'boat-1', name: 'Boat 1', capacity: 10 },
        boardingLocation: { id: 'loc-1', name: 'Marina' },
        client: { id: 'client-1', name: 'João', phone: '11999999999', totalTrips: 1 },
        passengerCount: 4,
        subtotal: 500,
        total: 500,
        products: []
      }

      const archivedEvent = EventStatusService.archiveEvent(event)
      expect(archivedEvent.status).toBe('ARCHIVED_COMPLETED')
    })

    it('deve arquivar eventos CANCELLED como ARCHIVED_CANCELLED', () => {
      const event: EventType = {
        id: 'event-2',
        status: 'CANCELLED',
        date: '2024-04-06',
        startTime: '09:00',
        endTime: '11:00',
        boat: { id: 'boat-1', name: 'Boat 1', capacity: 10 },
        boardingLocation: { id: 'loc-1', name: 'Marina' },
        client: { id: 'client-1', name: 'João', phone: '11999999999', totalTrips: 1 },
        passengerCount: 4,
        subtotal: 500,
        total: 500,
        products: []
      }

      const archivedEvent = EventStatusService.archiveEvent(event)
      expect(archivedEvent.status).toBe('ARCHIVED_CANCELLED')
    })

    it('deve marcar eventos PENDING_REFUND como REFUNDED', () => {
      const event: EventType = {
        id: 'event-3',
        status: 'PENDING_REFUND',
        date: '2024-04-06',
        startTime: '09:00',
        endTime: '11:00',
        boat: { id: 'boat-1', name: 'Boat 1', capacity: 10 },
        boardingLocation: { id: 'loc-1', name: 'Marina' },
        client: { id: 'client-1', name: 'João', phone: '11999999999', totalTrips: 1 },
        passengerCount: 4,
        subtotal: 500,
        total: 500,
        products: []
      }

      const archivedEvent = EventStatusService.archiveEvent(event)
      expect(archivedEvent.status).toBe('REFUNDED')
    })

    it('deve lançar erro para status que não podem ser arquivados', () => {
      const event: EventType = {
        id: 'event-4',
        status: 'SCHEDULED',
        date: '2024-04-06',
        startTime: '09:00',
        endTime: '11:00',
        boat: { id: 'boat-1', name: 'Boat 1', capacity: 10 },
        boardingLocation: { id: 'loc-1', name: 'Marina' },
        client: { id: 'client-1', name: 'João', phone: '11999999999', totalTrips: 1 },
        passengerCount: 4,
        subtotal: 500,
        total: 500,
        products: []
      }

      expect(() => EventStatusService.archiveEvent(event)).toThrow('Cannot archive event with status: SCHEDULED')
    })
  })

  describe('canEditEvent', () => {
    it('deve permitir que OWNER edite qualquer evento', () => {
      const event: EventType = {
        id: 'event-1',
        status: 'SCHEDULED',
        createdByUserId: 'user-2',
        date: '2024-04-06',
        startTime: '09:00',
        endTime: '11:00',
        boat: { id: 'boat-1', name: 'Boat 1', capacity: 10 },
        boardingLocation: { id: 'loc-1', name: 'Marina' },
        client: { id: 'client-1', name: 'João', phone: '11999999999', totalTrips: 1 },
        passengerCount: 4,
        subtotal: 500,
        total: 500,
        products: []
      }

      const canEdit = EventStatusService.canEditEvent(event, 'OWNER', 'user-1')
      expect(canEdit).toBe(true)
    })

    it('deve permitir que SUPER_ADMIN edite qualquer evento', () => {
      const event: EventType = {
        id: 'event-2',
        status: 'SCHEDULED',
        createdByUserId: 'user-2',
        date: '2024-04-06',
        startTime: '09:00',
        endTime: '11:00',
        boat: { id: 'boat-1', name: 'Boat 1', capacity: 10 },
        boardingLocation: { id: 'loc-1', name: 'Marina' },
        client: { id: 'client-1', name: 'João', phone: '11999999999', totalTrips: 1 },
        passengerCount: 4,
        subtotal: 500,
        total: 500,
        products: []
      }

      const canEdit = EventStatusService.canEditEvent(event, 'SUPER_ADMIN', 'user-1')
      expect(canEdit).toBe(true)
    })

    it('deve permitir que ADMIN edite qualquer evento', () => {
      const event: EventType = {
        id: 'event-3',
        status: 'SCHEDULED',
        createdByUserId: 'user-2',
        date: '2024-04-06',
        startTime: '09:00',
        endTime: '11:00',
        boat: { id: 'boat-1', name: 'Boat 1', capacity: 10 },
        boardingLocation: { id: 'loc-1', name: 'Marina' },
        client: { id: 'client-1', name: 'João', phone: '11999999999', totalTrips: 1 },
        passengerCount: 4,
        subtotal: 500,
        total: 500,
        products: []
      }

      const canEdit = EventStatusService.canEditEvent(event, 'ADMIN', 'user-1')
      expect(canEdit).toBe(true)
    })

    it('deve permitir que usuário edite seu próprio evento', () => {
      const event: EventType = {
        id: 'event-4',
        status: 'SCHEDULED',
        createdByUserId: 'user-1',
        date: '2024-04-06',
        startTime: '09:00',
        endTime: '11:00',
        boat: { id: 'boat-1', name: 'Boat 1', capacity: 10 },
        boardingLocation: { id: 'loc-1', name: 'Marina' },
        client: { id: 'client-1', name: 'João', phone: '11999999999', totalTrips: 1 },
        passengerCount: 4,
        subtotal: 500,
        total: 500,
        products: []
      }

      const canEdit = EventStatusService.canEditEvent(event, 'SELLER', 'user-1')
      expect(canEdit).toBe(true)
    })

    it('não deve permitir que usuário edite evento de outro usuário', () => {
      const event: EventType = {
        id: 'event-5',
        status: 'SCHEDULED',
        createdByUserId: 'user-2',
        date: '2024-04-06',
        startTime: '09:00',
        endTime: '11:00',
        boat: { id: 'boat-1', name: 'Boat 1', capacity: 10 },
        boardingLocation: { id: 'loc-1', name: 'Marina' },
        client: { id: 'client-1', name: 'João', phone: '11999999999', totalTrips: 1 },
        passengerCount: 4,
        subtotal: 500,
        total: 500,
        products: []
      }

      const canEdit = EventStatusService.canEditEvent(event, 'SELLER', 'user-1')
      expect(canEdit).toBe(false)
    })
  })

  describe('getConfirmedStatuses', () => {
    it('deve retornar statuses confirmados', () => {
      const confirmedStatuses = EventStatusService.getConfirmedStatuses()
      expect(confirmedStatuses).toEqual(['SCHEDULED', 'COMPLETED', 'ARCHIVED_COMPLETED'])
      expect(confirmedStatuses).toHaveLength(3)
    })
  })

  describe('getActiveStatuses', () => {
    it('deve retornar statuses ativos', () => {
      const activeStatuses = EventStatusService.getActiveStatuses()
      expect(activeStatuses).toEqual(['PRE_SCHEDULED', 'SCHEDULED', 'COMPLETED'])
      expect(activeStatuses).toHaveLength(3)
    })
  })

  it('deve validar estrutura básica do serviço', () => {
    expect(EventStatusService).toBeDefined()
    expect(typeof EventStatusService.shouldAutoCancel).toBe('function')
    expect(typeof EventStatusService.updateStatusFromPayment).toBe('function')
    expect(typeof EventStatusService.archiveEvent).toBe('function')
    expect(typeof EventStatusService.canEditEvent).toBe('function')
    expect(typeof EventStatusService.getConfirmedStatuses).toBe('function')
    expect(typeof EventStatusService.getActiveStatuses).toBe('function')
  })
})
