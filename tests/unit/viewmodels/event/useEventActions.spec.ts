import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useEventActions } from '../../../src/viewmodels/event/useEventActions'

// Mock do date-fns para controle de datas
vi.mock('date-fns', () => ({
  addDays: (date: Date, days: number) => {
    const result = new Date(date)
    result.setDate(result.getDate() + days)
    return result
  }
}))

describe('useEventActions - Testes Unitários', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('deve importar o hook corretamente', () => {
    expect(typeof useEventActions).toBe('function')
  })

  it('deve retornar estado inicial correto', () => {
    const { result } = renderHook(() => useEventActions())
    
    expect(result.current.loading).toBe(false)
    expect(result.current.events).toEqual([])
    expect(result.current.selectedEvent).toBe(null)
    expect(result.current.isCreating).toBe(false)
    expect(result.current.isEditing).toBe(false)
    expect(result.current.errors).toEqual([])
  })

  it('deve criar evento com sucesso', async () => {
    const { result } = renderHook(() => useEventActions())
    
    const eventData = {
      clientId: 'client-1',
      boatId: 'boat-1',
      tourTypeId: 'tour-1',
      date: new Date(Date.now() + 86400000).toISOString(), // Amanhã
      duration: 60,
      passengerCount: 4
    }

    await act(async () => {
      const response = await result.current.createEvent(eventData)
      expect(response.success).toBe(true)
      expect(response.event).toHaveProperty('id')
      expect(response.event.status).toBe('PRE_SCHEDULED')
    })

    expect(result.current.events).toHaveLength(1)
    expect(result.current.isCreating).toBe(false)
  })

  it('deve atualizar evento com sucesso', async () => {
    const { result } = renderHook(() => useEventActions())
    
    // Primeiro criar um evento
    const eventData = {
      clientId: 'client-1',
      boatId: 'boat-1',
      tourTypeId: 'tour-1',
      date: new Date(Date.now() + 86400000).toISOString(),
      duration: 60,
      passengerCount: 4
    }

    await act(async () => {
      await result.current.createEvent(eventData)
    })

    const eventId = result.current.events[0].id
    const updates = {
      passengerCount: 6,
      total: 1800
    }

    await act(async () => {
      const response = await result.current.updateEvent(eventId, updates)
      expect(response.success).toBe(true)
    })

    expect(result.current.events[0].passengerCount).toBe(6)
    expect(result.current.events[0].total).toBe(1800)
    expect(result.current.isEditing).toBe(false)
  })

  it('deve cancelar evento com sucesso', async () => {
    const { result } = renderHook(() => useEventActions())
    
    // Criar evento
    const eventData = {
      clientId: 'client-1',
      boatId: 'boat-1',
      tourTypeId: 'tour-1',
      date: new Date(Date.now() + 86400000).toISOString(),
      duration: 60,
      passengerCount: 4
    }

    await act(async () => {
      await result.current.createEvent(eventData)
    })

    const eventId = result.current.events[0].id
    const reason = 'Cliente cancelou'

    await act(async () => {
      const response = await result.current.cancelEvent(eventId, reason)
      expect(response.success).toBe(true)
    })

    expect(result.current.events[0].status).toBe('CANCELLED')
    expect(result.current.events[0].cancelReason).toBe(reason)
  })

  it('deve duplicar evento com sucesso', async () => {
    const { result } = renderHook(() => useEventActions())
    
    // Criar evento original
    const eventData = {
      clientId: 'client-1',
      boatId: 'boat-1',
      tourTypeId: 'tour-1',
      date: new Date(Date.now() + 86400000).toISOString(),
      duration: 60,
      passengerCount: 4
    }

    await act(async () => {
      await result.current.createEvent(eventData)
    })

    const originalEventId = result.current.events[0].id
    const newDate = new Date(Date.now() + 172800000).toISOString() // Depois de amanhã

    await act(async () => {
      const response = await result.current.duplicateEvent(originalEventId, newDate)
      expect(response.success).toBe(true)
      expect(response.event).toHaveProperty('originalEventId', originalEventId)
      expect(response.event.date).toBe(newDate)
      expect(response.event.status).toBe('PRE_SCHEDULED')
    })

    expect(result.current.events).toHaveLength(2)
  })

  it('deve deletar evento com sucesso', async () => {
    const { result } = renderHook(() => useEventActions())
    
    // Criar evento
    const eventData = {
      clientId: 'client-1',
      boatId: 'boat-1',
      tourTypeId: 'tour-1',
      date: new Date(Date.now() + 86400000).toISOString(),
      duration: 60,
      passengerCount: 4
    }

    await act(async () => {
      await result.current.createEvent(eventData)
    })

    const eventId = result.current.events[0].id

    await act(async () => {
      const response = await result.current.deleteEvent(eventId)
      expect(response.success).toBe(true)
    })

    expect(result.current.events).toHaveLength(0)
  })

  it('deve verificar disponibilidade corretamente', () => {
    const { result } = renderHook(() => useEventActions())
    
    // Adicionar eventos de teste
    act(() => {
      result.current.events = [
        {
          id: 'event-1',
          boatId: 'boat-1',
          date: new Date(Date.now() + 86400000).toISOString(),
          duration: 60
        },
        {
          id: 'event-2', 
          boatId: 'boat-2',
          date: new Date(Date.now() + 86400000).toISOString(),
          duration: 60
        }
      ]
    })

    // Testar disponibilidade para mesmo barco em horário conflitante
    const conflictCheck = result.current.checkAvailability(
      'boat-1',
      new Date(Date.now() + 86400000).toISOString(),
      60
    )
    expect(conflictCheck.isAvailable).toBe(false)
    expect(conflictCheck.conflicts).toHaveLength(1)

    // Testar disponibilidade para barco diferente
    const availableCheck = result.current.checkAvailability(
      'boat-2',
      new Date(Date.now() + 172800000).toISOString(),
      60
    )
    expect(availableCheck.isAvailable).toBe(true)
    expect(availableCheck.conflicts).toHaveLength(0)
  })

  it('deve calcular preço corretamente', () => {
    const { result } = renderHook(() => useEventActions())
    
    const priceCalculation = result.current.calculatePrice(
      'tour-1',
      60,
      4,
      [{ type: 'percentage', value: 10 }]
    )

    expect(priceCalculation.basePrice).toBe(100)
    expect(priceCalculation.hourlyRate).toBe(100)
    expect(priceCalculation.passengerCount).toBe(4)
    expect(priceCalculation.subtotal).toBe(400)
    expect(priceCalculation.finalPrice).toBe(360)
    expect(priceCalculation.totalDiscount).toBe(40)
  })

  it('deve validar evento corretamente', () => {
    const { result } = renderHook(() => useEventActions())
    
    // Evento válido
    const validEvent = {
      date: new Date(Date.now() + 86400000).toISOString(),
      tourTypeId: 'tour-1',
      boatId: 'boat-1',
      clientId: 'client-1',
      duration: 60
    }

    const isValid = result.current.validateEvent(validEvent)
    expect(isValid).toBe(true)
    expect(result.current.errors).toHaveLength(0)

    // Evento inválido - data passada
    const invalidEventPast = {
      date: new Date(Date.now() - 86400000).toISOString(),
      tourTypeId: 'tour-1',
      boatId: 'boat-1',
      clientId: 'client-1',
      duration: 60
    }

    const isInvalidPast = result.current.validateEvent(invalidEventPast)
    expect(isInvalidPast).toBe(false)
    expect(result.current.errors).toContain('Data do evento deve ser futura')

    // Evento inválido - sem campos obrigatórios
    const invalidEventMissing = {
      date: new Date(Date.now() + 86400000).toISOString(),
      duration: 60
    }

    const isInvalidMissing = result.current.validateEvent(invalidEventMissing)
    expect(isInvalidMissing).toBe(false)
    expect(result.current.errors.length).toBeGreaterThan(2)
  })

  it('deve exportar eventos em CSV', () => {
    const { result } = renderHook(() => useEventActions())
    
    // Adicionar eventos de teste
    act(() => {
      result.current.events = [
        {
          id: 'event-1',
          date: new Date(Date.now() + 86400000).toISOString(),
          clientName: 'João Silva',
          tourName: 'Passeio Turístico',
          status: 'SCHEDULED',
          total: 400
        }
      ]
    })

    const csvExport = result.current.exportEvents('csv')
    expect(csvExport).toContain('ID,Data,Cliente,Tour,Status,Total')
    expect(csvExport).toContain('event-1')
    expect(csvExport).toContain('João Silva')
  })

  it('deve exportar eventos em JSON', () => {
    const { result } = renderHook(() => useEventActions())
    
    // Adicionar eventos de teste
    act(() => {
      result.current.events = [
        {
          id: 'event-1',
          date: new Date(Date.now() + 86400000).toISOString(),
          clientName: 'João Silva'
        }
      ]
    })

    const jsonExport = result.current.exportEvents('json')
    const parsed = JSON.parse(jsonExport)
    expect(parsed).toHaveLength(1)
    expect(parsed[0].id).toBe('event-1')
    expect(parsed[0].clientName).toBe('João Silva')
  })

  it('deve executar refresh corretamente', async () => {
    const { result } = renderHook(() => useEventActions())
    
    await act(async () => {
      await result.current.refresh()
    })

    expect(result.current.loading).toBe(false)
  })
})
