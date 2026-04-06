import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useEventActions } from '@/viewmodels/event/useEventActions'

const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

describe('useEventActions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('retorna o estado inicial esperado', () => {
    const { result } = renderHook(() => useEventActions())

    expect(result.current.loading).toBe(false)
    expect(result.current.events).toEqual([])
    expect(result.current.selectedEvent).toBe(null)
    expect(result.current.isCreating).toBe(false)
    expect(result.current.isEditing).toBe(false)
    expect(result.current.errors).toEqual([])
  })

  it('cria, atualiza, duplica e remove eventos', async () => {
    const { result } = renderHook(() => useEventActions())

    await act(async () => {
      await result.current.createEvent({
        clientId: 'client-1',
        boatId: 'boat-1',
        tourTypeId: 'tour-1',
        date: tomorrow,
        duration: 60,
        passengerCount: 4
      })
    })

    expect(result.current.events).toHaveLength(1)
    const originalId = result.current.events[0].id

    await act(async () => {
      await result.current.updateEvent(originalId, { passengerCount: 6, total: 1800 })
    })

    expect(result.current.events[0]).toEqual(expect.objectContaining({ passengerCount: 6, total: 1800 }))

    await act(async () => {
      await result.current.duplicateEvent(originalId, new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString())
    })

    expect(result.current.events).toHaveLength(2)

    await act(async () => {
      await result.current.deleteEvent(originalId)
    })

    expect(result.current.events).toHaveLength(1)
  })

  it('detecta conflitos de disponibilidade para o mesmo barco', () => {
    const { result } = renderHook(() => useEventActions())

    act(() => {
      result.current.seedEvents([
        {
          id: 'event-1',
          boatId: 'boat-1',
          date: tomorrow,
          duration: 60,
          clientName: 'Joao',
          tourName: 'Passeio',
          status: 'SCHEDULED',
          total: 400
        }
      ])
    })

    const conflictCheck = result.current.checkAvailability('boat-1', tomorrow, 60)
    const availableCheck = result.current.checkAvailability('boat-2', tomorrow, 60)

    expect(conflictCheck.isAvailable).toBe(false)
    expect(conflictCheck.conflicts).toHaveLength(1)
    expect(availableCheck.isAvailable).toBe(true)
    expect(availableCheck.conflicts).toHaveLength(0)
  })

  it('valida eventos e expõe erros do formulário', async () => {
    const { result } = renderHook(() => useEventActions())

    act(() => {
      const valid = result.current.validateEvent({
        date: tomorrow,
        tourTypeId: 'tour-1',
        boatId: 'boat-1',
        clientId: 'client-1',
        duration: 60
      })
      expect(valid).toBe(true)
    })

    await waitFor(() => {
      expect(result.current.errors).toEqual([])
    })

    act(() => {
      const valid = result.current.validateEvent({
        date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        duration: 10
      })
      expect(valid).toBe(false)
    })

    await waitFor(() => {
      expect(result.current.errors).toContain('Data do evento deve ser futura')
      expect(result.current.errors).toContain('Duração deve ser de pelo menos 30 minutos')
      expect(result.current.errors).toContain('Tipo de tour é obrigatório')
    })
  })

  it('calcula preço e exporta os eventos cadastrados', () => {
    const { result } = renderHook(() => useEventActions())

    act(() => {
      result.current.seedEvents([
        {
          id: 'event-1',
          boatId: 'boat-1',
          date: tomorrow,
          duration: 60,
          clientName: 'João Silva',
          tourName: 'Passeio Turístico',
          status: 'SCHEDULED',
          total: 400
        }
      ])
    })

    const price = result.current.calculatePrice('tour-1', 60, 4, [{ type: 'percentage', value: 10 }])
    const csvExport = result.current.exportEvents('csv')
    const jsonExport = JSON.parse(result.current.exportEvents('json'))

    expect(price.finalPrice).toBe(360)
    expect(price.totalDiscount).toBe(40)
    expect(csvExport).toContain('event-1')
    expect(csvExport).toContain('João Silva')
    expect(jsonExport).toHaveLength(1)
    expect(jsonExport[0].id).toBe('event-1')
  })
})
