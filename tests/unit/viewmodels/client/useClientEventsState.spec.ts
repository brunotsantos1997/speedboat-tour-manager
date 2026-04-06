import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useClientEventsState } from '@/viewmodels/client/useClientEventsState'

const mocks = vi.hoisted(() => ({
  getEventsByClient: vi.fn(),
  subscribeToClientEvents: vi.fn(),
  updateEvent: vi.fn(),
  syncEvent: vi.fn()
}))

vi.mock('@/core/repositories/EventRepository', () => ({
  eventRepository: {
    getEventsByClient: mocks.getEventsByClient,
    subscribeToClientEvents: mocks.subscribeToClientEvents,
    updateEvent: mocks.updateEvent
  }
}))

vi.mock('@/viewmodels/useEventSync', () => ({
  useEventSync: () => ({
    syncEvent: mocks.syncEvent
  })
}))

const client = {
  id: 'client-1',
  name: 'Joao',
  phone: '11999999999',
  totalTrips: 0
}

const createEvent = (overrides: Record<string, unknown> = {}) => ({
  id: 'event-1',
  date: '2026-04-07',
  startTime: '09:00',
  endTime: '10:00',
  status: 'SCHEDULED',
  paymentStatus: 'PENDING',
  boat: { id: 'boat-1', name: 'Alpha', capacity: 10, size: 30, pricePerHour: 100, pricePerHalfHour: 50, organizationTimeMinutes: 15 },
  boardingLocation: { id: 'loc-1', name: 'Pier' },
  tourType: { id: 'tour-1', name: 'Passeio', color: '#000000' },
  products: [],
  client,
  passengerCount: 2,
  subtotal: 200,
  total: 200,
  ...overrides
})

describe('useClientEventsState', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.getEventsByClient.mockResolvedValue([])
    mocks.subscribeToClientEvents.mockImplementation((_clientId, callback) => {
      callback([])
      return vi.fn()
    })
    mocks.updateEvent.mockImplementation(async (event) => event)
    mocks.syncEvent.mockResolvedValue(undefined)
  })

  it('retorna estado vazio quando nao ha cliente selecionado', async () => {
    const { result } = renderHook(() => useClientEventsState(null))

    await waitFor(() => {
      expect(result.current.clientEvents).toEqual([])
      expect(result.current.isLoading).toBe(false)
    })
  })

  it('ordena os eventos do cliente por data decrescente', async () => {
    mocks.subscribeToClientEvents.mockImplementation((_clientId, callback) => {
      callback([
        createEvent({ id: 'event-older', date: '2026-04-01' }),
        createEvent({ id: 'event-newer', date: '2026-04-10' })
      ])
      return vi.fn()
    })

    const { result } = renderHook(() => useClientEventsState(client))

    await waitFor(() => {
      expect(result.current.clientEvents.map(event => event.id)).toEqual(['event-newer', 'event-older'])
      expect(result.current.isLoading).toBe(false)
    })
  })

  it('auto-cancela eventos pre-agendados expirados na carga inicial', async () => {
    const expiredEvent = createEvent({
      id: 'event-expired',
      status: 'PRE_SCHEDULED',
      preScheduledAt: Date.now() - (25 * 60 * 60 * 1000)
    })

    mocks.getEventsByClient.mockResolvedValue([expiredEvent])

    renderHook(() => useClientEventsState(client))

    await waitFor(() => {
      expect(mocks.updateEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'event-expired',
          status: 'CANCELLED',
          autoCancelled: true
        })
      )
      expect(mocks.syncEvent).toHaveBeenCalled()
    })
  })

  it('nao tenta auto-cancelar eventos ainda dentro da janela de 24 horas', async () => {
    const pendingEvent = createEvent({
      id: 'event-pending',
      status: 'PRE_SCHEDULED',
      preScheduledAt: Date.now() - (2 * 60 * 60 * 1000)
    })

    mocks.getEventsByClient.mockResolvedValue([pendingEvent])

    renderHook(() => useClientEventsState(client))

    await waitFor(() => {
      expect(mocks.getEventsByClient).toHaveBeenCalledWith('client-1')
    })

    expect(mocks.updateEvent).not.toHaveBeenCalled()
    expect(mocks.syncEvent).not.toHaveBeenCalled()
  })
})
