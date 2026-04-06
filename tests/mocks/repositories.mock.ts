import { vi } from 'vitest'
import type { EventType, Payment, PaymentMethod, PaymentType, ClientProfile, Boat, BoardingLocation } from '../../src/core/domain/types'

// Mock data helpers
const createMockClient = (): ClientProfile => ({
  id: 'client-1',
  name: 'João Silva',
  phone: '11999999999',
  totalTrips: 5
})

const createMockBoat = (): Boat => ({
  id: 'boat-1',
  name: 'Speedboat Alpha',
  capacity: 10,
  isActive: true
})

const createMockBoardingLocation = (): BoardingLocation => ({
  id: 'location-1',
  name: 'Marina Central',
  isActive: true
})

// Mock do EventRepository
export const mockEventRepository = {
  events: [] as EventType[],
  listeners: new Map(),

  subscribeToDateRange: vi.fn((startDate: string, endDate: string, callback: (events: EventType[]) => void) => {
    // Simular eventos mockados
    const mockEvents: EventType[] = [
      {
        id: 'event-1',
        date: '2024-04-06',
        startTime: '09:00',
        endTime: '11:00',
        status: 'SCHEDULED',
        paymentStatus: 'PENDING',
        boat: createMockBoat(),
        boardingLocation: createMockBoardingLocation(),
        client: createMockClient(),
        passengerCount: 4,
        subtotal: 500,
        total: 500,
        products: []
      },
      {
        id: 'event-2',
        date: '2024-04-07',
        startTime: '14:00',
        endTime: '16:00',
        status: 'COMPLETED',
        paymentStatus: 'CONFIRMED',
        boat: createMockBoat(),
        boardingLocation: createMockBoardingLocation(),
        client: createMockClient(),
        passengerCount: 6,
        subtotal: 800,
        total: 800,
        products: []
      }
    ]
    callback(mockEvents)
    
    return vi.fn(() => {
      // Mock unsubscribe
    })
  }),

  subscribeToNotifications: vi.fn((callback: (events: EventType[]) => void) => {
    const mockNotifications: EventType[] = [
      {
        id: 'event-3',
        date: '2024-04-05',
        startTime: '10:00',
        endTime: '12:00',
        status: 'CANCELLED',
        paymentStatus: 'PENDING',
        boat: createMockBoat(),
        boardingLocation: createMockBoardingLocation(),
        client: createMockClient(),
        passengerCount: 2,
        subtotal: 300,
        total: 300,
        products: []
      }
    ]
    callback(mockNotifications)
    
    return vi.fn(() => {
      // Mock unsubscribe
    })
  }),

  updateEvent: vi.fn(async (event: EventType) => {
    return { ...event }
  }),

  getById: vi.fn(async (id: string) => {
    return mockEventRepository.events.find(e => e.id === id) || null
  })
}

// Mock do PaymentRepository
export const mockPaymentRepository = {
  payments: [] as Payment[],

  subscribe: vi.fn((callback: (payments: Payment[]) => void) => {
    const mockPayments: Payment[] = [
      {
        id: 'payment-1',
        eventId: 'event-1',
        amount: 150,
        method: 'PIX' as PaymentMethod,
        type: 'DOWN_PAYMENT' as PaymentType,
        date: '2024-04-06',
        timestamp: Date.now()
      },
      {
        id: 'payment-2',
        eventId: 'event-2',
        amount: 800,
        method: 'CASH' as PaymentMethod,
        type: 'FULL' as PaymentType,
        date: '2024-04-07',
        timestamp: Date.now()
      }
    ]
    callback(mockPayments)
    
    return vi.fn(() => {
      // Mock unsubscribe
    })
  }),

  getByEventId: vi.fn(async (eventId: string) => {
    return mockPaymentRepository.payments.filter(p => p.eventId === eventId)
  }),

  add: vi.fn(async (payment: Omit<Payment, 'id'>) => {
    const newPayment: Payment = {
      ...payment,
      id: `payment-${Date.now()}`
    }
    mockPaymentRepository.payments.push(newPayment)
    return newPayment
  })
}

// Mock do useEventSync
export const mockUseEventSync = () => ({
  syncEvent: vi.fn(async (event: EventType) => {
    return event
  })
})

// Mock do useToast
export const mockUseToast = () => ({
  showToast: vi.fn()
})
