import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useClientEventActions } from '../../../src/viewmodels/client/useClientEventActions'

describe('useClientEventActions - Testes Unitários', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('deve importar o hook corretamente', () => {
    expect(typeof useClientEventActions).toBe('function')
  })

  it('deve retornar estado inicial correto', () => {
    const { result } = renderHook(() => useClientEventActions())
    
    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBe(null)
    expect(result.current.events).toEqual([])
  })

  it('deve criar evento para cliente', async () => {
    const { result } = renderHook(() => useClientEventActions())
    
    const eventData = {
      clientId: 'client-1',
      tourTypeId: 'tour-1',
      boatId: 'boat-1',
      date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      time: '14:30',
      duration: 120,
      passengerCount: 4
    }

    await act(async () => {
      const response = await result.current.createClientEvent(eventData)
      expect(response.success).toBe(true)
      expect(response.event).toHaveProperty('id')
      expect(response.event.status).toBe('SCHEDULED')
    })

    expect(result.current.events).toHaveLength(1)
  })

  it('deve cancelar evento', async () => {
    const { result } = renderHook(() => useClientEventActions())
    
    // Primeiro criar um evento
    const eventData = {
      clientId: 'client-1',
      tourTypeId: 'tour-1',
      boatId: 'boat-1',
      date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      time: '14:30',
      duration: 120,
      passengerCount: 4
    }

    await act(async () => {
      await result.current.createClientEvent(eventData)
    })

    const eventId = result.current.events[0].id
    const reason = 'Cliente cancelou'

    await act(async () => {
      const response = await result.current.cancelClientEvent(eventId, reason)
      expect(response.success).toBe(true)
    })

    expect(result.current.events[0].status).toBe('CANCELLED')
    expect(result.current.events[0].cancelReason).toBe(reason)
  })

  it('deve reagendar evento', async () => {
    const { result } = renderHook(() => useClientEventActions())
    
    // Criar evento
    const eventData = {
      clientId: 'client-1',
      tourTypeId: 'tour-1',
      boatId: 'boat-1',
      date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      time: '14:30',
      duration: 120,
      passengerCount: 4
    }

    await act(async () => {
      await result.current.createClientEvent(eventData)
    })

    const eventId = result.current.events[0].id
    const newDate = new Date(Date.now() + 172800000).toISOString().split('T')[0]
    const newTime = '16:00'

    await act(async () => {
      const response = await result.current.rescheduleClientEvent(eventId, newDate, newTime)
      expect(response.success).toBe(true)
    })

    expect(result.current.events[0].date).toBe(newDate)
    expect(result.current.events[0].time).toBe(newTime)
    expect(result.current.events[0].status).toBe('RESCHEDULED')
  })

  it('deve verificar disponibilidade', () => {
    const { result } = renderHook(() => useClientEventActions())
    
    // Adicionar evento existente
    act(() => {
      result.current.events = [
        {
          id: 'event-1',
          boatId: 'boat-1',
          date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
          time: '14:30',
          duration: 120
        }
      ]
    })

    // Testar horário disponível
    const availableCheck = result.current.checkAvailability(
      'boat-1',
      new Date(Date.now() + 86400000).toISOString().split('T')[0],
      '10:00',
      60
    )
    expect(availableCheck.isAvailable).toBe(true)
    expect(availableCheck.conflicts).toHaveLength(0)

    // Testar horário conflitante
    const conflictCheck = result.current.checkAvailability(
      'boat-1',
      new Date(Date.now() + 86400000).toISOString().split('T')[0],
      '14:30',
      120
    )
    expect(conflictCheck.isAvailable).toBe(false)
    expect(conflictCheck.conflicts).toHaveLength(1)
  })

  it('deve calcular preço final', () => {
    const { result } = renderHook(() => useClientEventActions())
    
    const priceCalculation = result.current.calculateFinalPrice(100, 4, [
      { type: 'percentage', value: 10, description: 'Desconto de grupo' }
    ])

    expect(priceCalculation.basePrice).toBe(100)
    expect(priceCalculation.passengerCount).toBe(4)
    expect(priceCalculation.finalPrice).toBe(360)
    expect(priceCalculation.totalDiscount).toBe(40)
  })

  it('deve validar dados do evento', () => {
    const { result } = renderHook(() => useClientEventActions())
    
    // Evento válido
    const validEvent = {
      clientId: 'client-1',
      tourTypeId: 'tour-1',
      boatId: 'boat-1',
      date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      time: '14:30',
      duration: 120,
      passengerCount: 4
    }

    const isValid = result.current.validateEventData(validEvent)
    expect(isValid).toBe(true)
    expect(result.current.errors).toHaveLength(0)

    // Evento inválido - data passada
    const invalidEventPast = {
      clientId: 'client-1',
      tourTypeId: 'tour-1',
      boatId: 'boat-1',
      date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
      time: '14:30',
      duration: 120,
      passengerCount: 4
    }

    const isInvalidPast = result.current.validateEventData(invalidEventPast)
    expect(isInvalidPast).toBe(false)
    expect(result.current.errors).toContain('Data do evento deve ser futura')

    // Evento inválido - sem campos obrigatórios
    const invalidEventMissing = {
      date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      time: '14:30',
      duration: 120,
      passengerCount: 4
    }

    const isInvalidMissing = result.current.validateEventData(invalidEventMissing)
    expect(isInvalidMissing).toBe(false)
    expect(result.current.errors.length).toBeGreaterThan(2)
  })

  it('deve adicionar passageiros', async () => {
    const { result } = renderHook(() => useClientEventActions())
    
    // Criar evento
    const eventData = {
      clientId: 'client-1',
      tourTypeId: 'tour-1',
      boatId: 'boat-1',
      date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      time: '14:30',
      duration: 120,
      passengerCount: 2
    }

    await act(async () => {
      await result.current.createClientEvent(eventData)
    })

    const eventId = result.current.events[0].id
    const passengers = [
      { name: 'João Silva', document: '123456789', phone: '11987654321' },
      { name: 'Maria Santos', document: '987654321', phone: '11912345678' }
    ]

    await act(async () => {
      const response = await result.current.addPassengers(eventId, passengers)
      expect(response.success).toBe(true)
    })

    expect(result.current.events[0].passengers).toHaveLength(2)
    expect(result.current.events[0].passengerCount).toBe(4)
  })

  it('deve gerar horários alternativos', () => {
    const { result } = renderHook(() => useClientEventActions())
    
    // Adicionar evento existente
    act(() => {
      result.current.events = [
        {
          id: 'event-1',
          boatId: 'boat-1',
          date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
          time: '14:30',
          duration: 120
        }
      ]
    })

    const alternatives = result.current.generateAlternativeTimes(
      'boat-1',
      new Date(Date.now() + 86400000).toISOString().split('T')[0],
      120
    )

    expect(alternatives.length).toBeGreaterThan(0)
    expect(alternatives.length).toBeLessThanOrEqual(3)
  })

  it('deve lidar com estados de erro', async () => {
    const { result } = renderHook(() => useClientEventActions())
    
    // Tentar criar evento inválido
    const invalidEvent = {
      clientId: '', // Inválido
      tourTypeId: 'tour-1',
      boatId: 'boat-1',
      date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      time: '14:30',
      duration: 120,
      passengerCount: 4
    }

    await act(async () => {
      const response = await result.current.createClientEvent(invalidEvent)
      expect(response.success).toBe(false)
      expect(response.error).toBeDefined()
    })

    expect(result.current.error).toBeDefined()
    expect(result.current.loading).toBe(false)
  })

  it('deve resetar estado', () => {
    const { result } = renderHook(() => useClientEventActions())
    
    // Adicionar eventos e erro
    act(() => {
      result.current.events = [{ id: 'event-1', status: 'SCHEDULED' }]
      result.current.error = 'Erro de teste'
    })

    expect(result.current.events).toHaveLength(1)
    expect(result.current.error).toBe('Erro de teste')

    // Resetar estado
    act(() => {
      if (result.current.reset) {
        result.current.reset()
      }
    })

    expect(result.current.events).toEqual([])
    expect(result.current.error).toBe(null)
  })
})
