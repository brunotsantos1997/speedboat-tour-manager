import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useClientEventActions } from '@/viewmodels/client/useClientEventActions'

const mocks = vi.hoisted(() => ({
  getByEventId: vi.fn(),
  getById: vi.fn(),
  updateEvent: vi.fn(),
  remove: vi.fn(),
  confirm: vi.fn(),
  showToast: vi.fn(),
  syncEvent: vi.fn(),
  deleteFromGoogle: vi.fn(),
  confirmPaymentAndUpdateStatus: vi.fn()
}))

vi.mock('@/core/repositories/PaymentRepository', () => ({
  paymentRepository: {
    getByEventId: mocks.getByEventId
  }
}))

vi.mock('@/core/repositories/EventRepository', () => ({
  eventRepository: {
    getById: mocks.getById,
    updateEvent: mocks.updateEvent,
    remove: mocks.remove
  }
}))

vi.mock('@/ui/contexts/modal/useModal', () => ({
  useModal: () => ({
    confirm: mocks.confirm
  })
}))

vi.mock('@/ui/contexts/toast/useToast', () => ({
  useToast: () => ({
    showToast: mocks.showToast
  })
}))

vi.mock('@/viewmodels/useEventSync', () => ({
  useEventSync: () => ({
    syncEvent: mocks.syncEvent,
    deleteFromGoogle: mocks.deleteFromGoogle
  })
}))

vi.mock('@/core/domain/TransactionService', () => ({
  TransactionService: {
    confirmPaymentAndUpdateStatus: mocks.confirmPaymentAndUpdateStatus
  }
}))

const buildEvent = (overrides: Record<string, unknown> = {}) => ({
  id: 'event-1',
  date: '2026-04-07',
  startTime: '09:00',
  endTime: '10:00',
  status: 'PRE_SCHEDULED',
  paymentStatus: 'PENDING',
  total: 1000,
  boat: { id: 'boat-1', name: 'Alpha', capacity: 10, size: 30, pricePerHour: 100, pricePerHalfHour: 50, organizationTimeMinutes: 15 },
  boardingLocation: { id: 'loc-1', name: 'Pier' },
  tourType: { id: 'tour-1', name: 'Passeio', color: '#000000' },
  products: [],
  client: { id: 'client-1', name: 'Joao', phone: '11999999999', totalTrips: 0 },
  passengerCount: 2,
  subtotal: 1000,
  createdByUserId: 'user-1',
  ...overrides
})

describe('useClientEventActions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.getByEventId.mockResolvedValue([])
    mocks.getById.mockResolvedValue(buildEvent())
    mocks.updateEvent.mockImplementation(async (event) => event)
    mocks.remove.mockResolvedValue(undefined)
    mocks.confirm.mockResolvedValue(true)
    mocks.showToast.mockImplementation(() => {})
    mocks.syncEvent.mockResolvedValue(undefined)
    mocks.deleteFromGoogle.mockResolvedValue(undefined)
    mocks.confirmPaymentAndUpdateStatus.mockResolvedValue({
      success: true,
      eventId: 'event-1'
    })
  })

  it('sugere o valor correto ao iniciar um pagamento', async () => {
    mocks.getByEventId.mockResolvedValue([{ id: 'payment-1', amount: 100 }])
    const onOpenPaymentModal = vi.fn()
    const event = buildEvent()

    const { result } = renderHook(() => useClientEventActions())

    await act(async () => {
      await result.current.initiatePayment('event-1', 'DOWN_PAYMENT', [event], onOpenPaymentModal)
    })

    expect(onOpenPaymentModal).toHaveBeenCalledWith(event, 'DOWN_PAYMENT', 200)
  })

  it('confirma pagamento usando a transacao centralizada', async () => {
    const updatedEvent = buildEvent({ status: 'SCHEDULED', paymentStatus: 'CONFIRMED' })
    mocks.getById.mockResolvedValue(updatedEvent)
    const onUpdateEvent = vi.fn().mockResolvedValue(undefined)

    const { result } = renderHook(() => useClientEventActions())

    await act(async () => {
      await result.current.confirmPayment('event-1', 1000, 'PIX', 'FULL', onUpdateEvent)
    })

    expect(mocks.confirmPaymentAndUpdateStatus).toHaveBeenCalledWith(
      'event-1',
      expect.objectContaining({ amount: 1000, method: 'PIX', type: 'FULL' }),
      'system',
      'ClientEventActions'
    )
    expect(onUpdateEvent).toHaveBeenCalledWith(updatedEvent)
    expect(mocks.syncEvent).toHaveBeenCalledWith(updatedEvent)
    expect(mocks.showToast).toHaveBeenCalledWith('Pagamento confirmado com sucesso!')
  })

  it('cancela eventos pagos como pendentes de reembolso', async () => {
    const event = buildEvent({ status: 'SCHEDULED', paymentStatus: 'CONFIRMED' })
    const onUpdateEvent = vi.fn().mockResolvedValue(undefined)

    const { result } = renderHook(() => useClientEventActions())

    await act(async () => {
      await result.current.cancelEvent('event-1', [event], onUpdateEvent)
    })

    expect(mocks.updateEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'event-1',
        status: 'PENDING_REFUND'
      })
    )
    expect(mocks.syncEvent).toHaveBeenCalled()
    expect(onUpdateEvent).toHaveBeenCalled()
  })

  it('reverte cancelamentos automaticos para scheduled', async () => {
    const event = buildEvent({ status: 'CANCELLED', autoCancelled: true })
    const onUpdateEvent = vi.fn().mockResolvedValue(undefined)

    const { result } = renderHook(() => useClientEventActions())

    await act(async () => {
      await result.current.revertCancellation('event-1', [event], onUpdateEvent)
    })

    expect(mocks.updateEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'event-1',
        status: 'SCHEDULED',
        autoCancelled: false
      })
    )
    expect(mocks.showToast).toHaveBeenCalledWith('Cancelamento revertido com sucesso!')
  })

  it('exclui o evento apos confirmar e sincroniza dependencias externas', async () => {
    const event = buildEvent({ id: 'event-99' })
    const onUpdateEvent = vi.fn().mockResolvedValue(undefined)

    const { result } = renderHook(() => useClientEventActions())

    await act(async () => {
      await result.current.deleteEvent('event-99', [event], onUpdateEvent)
    })

    await waitFor(() => {
      expect(mocks.deleteFromGoogle).toHaveBeenCalledWith('event-99')
      expect(mocks.remove).toHaveBeenCalledWith('event-99')
      expect(onUpdateEvent).toHaveBeenCalled()
    })
  })
})
