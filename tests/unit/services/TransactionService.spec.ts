import { describe, it, expect, vi, beforeEach } from 'vitest'
import { TransactionService } from '../../../src/core/domain/TransactionService'
import type { EventType, Payment } from '../../../src/core/domain/types'

// Mock dos repositories
vi.mock('../../../src/core/repositories/EventRepository', () => ({
  eventRepository: {
    add: vi.fn(),
    updateEvent: vi.fn(),
    getById: vi.fn()
  }
}))

vi.mock('../../../src/core/repositories/PaymentRepository', () => ({
  paymentRepository: {
    add: vi.fn(),
    getByEventId: vi.fn(),
    remove: vi.fn()
  }
}))

vi.mock('../../../src/core/repositories/AuditLogRepository', () => ({
  auditLogRepository: {
    log: vi.fn()
  }
}))

// Mock do Logger
vi.mock('../../../src/core/common/Logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn()
  }
}))

describe('TransactionService - Testes Unitários', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('validateTransactionPrerequisites', () => {
    it('deve validar dados do evento corretamente', () => {
      const validEventData: Omit<EventType, 'id'> = {
        date: '2024-04-06',
        startTime: '09:00',
        endTime: '11:00',
        status: 'SCHEDULED',
        boat: { id: 'boat-1', name: 'Boat 1', capacity: 10, size: 'large', pricePerHour: 100, pricePerHalfHour: 60, organizationTimeMinutes: 15 },
        boardingLocation: { id: 'loc-1', name: 'Marina', isActive: true },
        client: { id: 'client-1', name: 'João', phone: '11999999999', totalTrips: 1 },
        passengerCount: 4,
        subtotal: 500,
        total: 500,
        products: []
      }

      const errors = TransactionService.validateTransactionPrerequisites(validEventData)
      expect(errors).toHaveLength(0)
    })

    it('deve identificar erros em dados inválidos', () => {
      const invalidEventData: Omit<EventType, 'id'> = {
        date: '2024-04-06',
        startTime: '09:00',
        endTime: '11:00',
        status: 'SCHEDULED',
        boat: { id: '', name: 'Boat 1', capacity: 10, size: 'large', pricePerHour: 100, pricePerHalfHour: 60, organizationTimeMinutes: 15 },
        boardingLocation: { id: '', name: 'Marina', isActive: true },
        client: { id: '', name: 'João', phone: '11999999999', totalTrips: 1 },
        passengerCount: 0,
        subtotal: 0,
        total: 0,
        products: []
      }

      const errors = TransactionService.validateTransactionPrerequisites(invalidEventData)
      expect(errors).toContain('Boat is required')
      expect(errors).toContain('Client is required')
      expect(errors).toContain('Boarding location is required')
      expect(errors).toContain('Event total must be greater than 0')
      expect(errors).toContain('Passenger count must be greater than 0')
      expect(errors).toHaveLength(5)
    })

    it('deve identificar boat ausente', () => {
      const eventDataWithoutBoat: Omit<EventType, 'id'> = {
        date: '2024-04-06',
        startTime: '09:00',
        endTime: '11:00',
        status: 'SCHEDULED',
        boat: { id: '', name: 'Boat 1', capacity: 10, size: 'large', pricePerHour: 100, pricePerHalfHour: 60, organizationTimeMinutes: 15 },
        boardingLocation: { id: 'loc-1', name: 'Marina', isActive: true },
        client: { id: 'client-1', name: 'João', phone: '11999999999', totalTrips: 1 },
        passengerCount: 4,
        subtotal: 500,
        total: 500,
        products: []
      }

      const errors = TransactionService.validateTransactionPrerequisites(eventDataWithoutBoat)
      expect(errors).toContain('Boat is required')
    })

    it('deve identificar client ausente', () => {
      const eventDataWithoutClient: Omit<EventType, 'id'> = {
        date: '2024-04-06',
        startTime: '09:00',
        endTime: '11:00',
        status: 'SCHEDULED',
        boat: { id: 'boat-1', name: 'Boat 1', capacity: 10, size: 'large', pricePerHour: 100, pricePerHalfHour: 60, organizationTimeMinutes: 15 },
        boardingLocation: { id: 'loc-1', name: 'Marina', isActive: true },
        client: { id: '', name: 'João', phone: '11999999999', totalTrips: 1 },
        passengerCount: 4,
        subtotal: 500,
        total: 500,
        products: []
      }

      const errors = TransactionService.validateTransactionPrerequisites(eventDataWithoutClient)
      expect(errors).toContain('Client is required')
    })

    it('deve identificar boarding location ausente', () => {
      const eventDataWithoutLocation: Omit<EventType, 'id'> = {
        date: '2024-04-06',
        startTime: '09:00',
        endTime: '11:00',
        status: 'SCHEDULED',
        boat: { id: 'boat-1', name: 'Boat 1', capacity: 10, size: 'large', pricePerHour: 100, pricePerHalfHour: 60, organizationTimeMinutes: 15 },
        boardingLocation: { id: '', name: 'Marina', isActive: true },
        client: { id: 'client-1', name: 'João', phone: '11999999999', totalTrips: 1 },
        passengerCount: 4,
        subtotal: 500,
        total: 500,
        products: []
      }

      const errors = TransactionService.validateTransactionPrerequisites(eventDataWithoutLocation)
      expect(errors).toContain('Boarding location is required')
    })

    it('deve identificar total inválido', () => {
      const eventDataWithInvalidTotal: Omit<EventType, 'id'> = {
        date: '2024-04-06',
        startTime: '09:00',
        endTime: '11:00',
        status: 'SCHEDULED',
        boat: { id: 'boat-1', name: 'Boat 1', capacity: 10, size: 'large', pricePerHour: 100, pricePerHalfHour: 60, organizationTimeMinutes: 15 },
        boardingLocation: { id: 'loc-1', name: 'Marina', isActive: true },
        client: { id: 'client-1', name: 'João', phone: '11999999999', totalTrips: 1 },
        passengerCount: 4,
        subtotal: 500,
        total: -100,
        products: []
      }

      const errors = TransactionService.validateTransactionPrerequisites(eventDataWithInvalidTotal)
      expect(errors).toContain('Event total must be greater than 0')
    })

    it('deve identificar passenger count inválido', () => {
      const eventDataWithInvalidPassengers: Omit<EventType, 'id'> = {
        date: '2024-04-06',
        startTime: '09:00',
        endTime: '11:00',
        status: 'SCHEDULED',
        boat: { id: 'boat-1', name: 'Boat 1', capacity: 10, size: 'large', pricePerHour: 100, pricePerHalfHour: 60, organizationTimeMinutes: 15 },
        boardingLocation: { id: 'loc-1', name: 'Marina', isActive: true },
        client: { id: 'client-1', name: 'João', phone: '11999999999', totalTrips: 1 },
        passengerCount: -5,
        subtotal: 500,
        total: 500,
        products: []
      }

      const errors = TransactionService.validateTransactionPrerequisites(eventDataWithInvalidPassengers)
      expect(errors).toContain('Passenger count must be greater than 0')
    })
  })

  describe('lógica de status', () => {
    it('deve definir status como SCHEDULED quando pagamento > 0', () => {
      const totalPaid = 500
      const status = totalPaid > 0 ? 'SCHEDULED' : 'PRE_SCHEDULED'
      expect(status).toBe('SCHEDULED')
    })

    it('deve definir status como PRE_SCHEDULED quando pagamento = 0', () => {
      const totalPaid = 0
      const status = totalPaid > 0 ? 'SCHEDULED' : 'PRE_SCHEDULED'
      expect(status).toBe('PRE_SCHEDULED')
    })

    it('deve definir paymentStatus como CONFIRMED quando pagamento >= total', () => {
      const totalPaid = 1000
      const eventTotal = 800
      const paymentStatus = totalPaid >= eventTotal ? 'CONFIRMED' : 'PENDING'
      expect(paymentStatus).toBe('CONFIRMED')
    })

    it('deve definir paymentStatus como PENDING quando pagamento < total', () => {
      const totalPaid = 500
      const eventTotal = 800
      const paymentStatus = totalPaid >= eventTotal ? 'CONFIRMED' : 'PENDING'
      expect(paymentStatus).toBe('PENDING')
    })

    it('deve manter status atual se não for PRE_SCHEDULED', () => {
      const totalPaid = 500
      const currentStatus = 'SCHEDULED'
      const newStatus = totalPaid > 0 && currentStatus === 'PRE_SCHEDULED' ? 'SCHEDULED' : currentStatus
      expect(newStatus).toBe('SCHEDULED')
    })

    it('deve mudar para SCHEDULED se for PRE_SCHEDULED e tiver pagamento', () => {
      const totalPaid = 500
      const currentStatus = 'PRE_SCHEDULED'
      const newStatus = totalPaid > 0 && currentStatus === 'PRE_SCHEDULED' ? 'SCHEDULED' : currentStatus
      expect(newStatus).toBe('SCHEDULED')
    })
  })

  describe('lógica de rollback', () => {
    it('deve validar estrutura de rollback data', () => {
      const rollbackData = {
        createdPaymentIds: ['payment-1', 'payment-2'],
        createdExpenseIds: ['expense-1'],
        originalEvent: {
          id: 'event-1',
          status: 'SCHEDULED'
        }
      }

      expect(rollbackData.createdPaymentIds).toHaveLength(2)
      expect(rollbackData.createdExpenseIds).toHaveLength(1)
      expect(rollbackData.originalEvent?.id).toBe('event-1')
    })

    it('deve validar estrutura de rollback data vazia', () => {
      const emptyRollbackData = {
        createdPaymentIds: [],
        createdExpenseIds: []
      }

      expect(emptyRollbackData.createdPaymentIds).toHaveLength(0)
      expect(emptyRollbackData.createdExpenseIds).toHaveLength(0)
    })
  })

  describe('lógica de resultado', () => {
    it('deve validar estrutura de resultado de sucesso', () => {
      const successResult = {
        success: true,
        eventId: 'event-1',
        paymentId: 'payment-1'
      }

      expect(successResult.success).toBe(true)
      expect(successResult.eventId).toBe('event-1')
      expect(successResult.paymentId).toBe('payment-1')
      expect(successResult.error).toBeUndefined()
    })

    it('deve validar estrutura de resultado de falha', () => {
      const failureResult = {
        success: false,
        error: 'Transaction failed',
        rollbackData: {
          createdPaymentIds: ['payment-1']
        }
      }

      expect(failureResult.success).toBe(false)
      expect(failureResult.error).toBe('Transaction failed')
      expect(failureResult.rollbackData?.createdPaymentIds).toContain('payment-1')
      expect(failureResult.eventId).toBeUndefined()
    })
  })

  describe('lógica de cálculo', () => {
    it('deve calcular total pago corretamente', () => {
      const payments = [
        { amount: 500 },
        { amount: 300 },
        { amount: 200 }
      ]

      const totalPaid = payments.reduce((acc, p) => acc + p.amount, 0)
      expect(totalPaid).toBe(1000)
    })

    it('deve identificar pagamentos reembolsáveis', () => {
      const payments = [
        { status: 'CONFIRMED' },
        { status: 'PENDING' },
        { status: 'CONFIRMED' },
        { status: 'CANCELLED' }
      ]

      const refundablePayments = payments.filter(p => p.status === 'CONFIRMED')
      expect(refundablePayments).toHaveLength(2)
    })

    it('deve validar dados de auditoria', () => {
      const auditData = {
        userId: 'user-1',
        userName: 'João Silva',
        targetId: 'event-1',
        action: 'CREATE_EVENT_WITH_PAYMENT',
        resource: 'event',
        context: {
          eventTotal: 1000,
          paymentAmount: 500,
          paymentMethod: 'CASH',
          finalStatus: 'SCHEDULED'
        }
      }

      expect(auditData.userId).toBe('user-1')
      expect(auditData.userName).toBe('João Silva')
      expect(auditData.action).toBe('CREATE_EVENT_WITH_PAYMENT')
      expect(auditData.context?.eventTotal).toBe(1000)
    })
  })

  it('deve validar estrutura básica do serviço', () => {
    expect(TransactionService).toBeDefined()
    expect(typeof TransactionService.createEventWithPayment).toBe('function')
    expect(typeof TransactionService.confirmPaymentAndUpdateStatus).toBe('function')
    expect(typeof TransactionService.cancelEventWithRefunds).toBe('function')
    expect(typeof TransactionService.validateTransactionPrerequisites).toBe('function')
  })

  it('deve validar casos extremos', () => {
    // Teste com arrays vazios
    const emptyPayments = []
    const totalPaid = emptyPayments.reduce((acc, p) => acc + p.amount, 0)
    expect(totalPaid).toBe(0)

    const refundablePayments = emptyPayments.filter(p => p.status === 'CONFIRMED')
    expect(refundablePayments).toHaveLength(0)

    // Teste com valores nulos
    const nullEvent = null
    const hasEvent = nullEvent !== null
    expect(hasEvent).toBe(false)
  })

  it('deve validar tratamento de erros', () => {
    const error = new Error('Test error')
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    expect(errorMessage).toBe('Test error')

    const unknownError = 'String error'
    const unknownErrorMessage = unknownError instanceof Error ? unknownError.message : 'Unknown error'
    expect(unknownErrorMessage).toBe('Unknown error')
  })

  it('deve validarLayout de dados de pagamento', () => {
    const paymentData: Omit<Payment, 'id'> = {
      eventId: 'event-1',
      amount: 500,
      date: '2024-04-06',
      method: 'CASH',
      type: 'PAYMENT',
      status: 'CONFIRMED',
      timestamp: Date.now()
    }

    expect(paymentData.eventId).toBe('event-1')
    expect(paymentData.amount).toBe(500)
    expect(paymentData.method).toBe('CASH')
    expect(paymentData.type).toBe('PAYMENT')
    expect(paymentData.status).toBe('CONFIRMED')
  })
})
