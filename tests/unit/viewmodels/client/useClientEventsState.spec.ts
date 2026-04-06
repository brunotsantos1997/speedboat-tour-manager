import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useClientEventsState } from '../../../src/viewmodels/client/useClientEventsState'

// Mock do date-fns para controle de datas
vi.mock('date-fns', () => ({
  format: (date: Date, pattern: string) => {
    if (pattern === 'yyyy-MM-dd') {
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
    }
    return date.toString()
  },
  isSameDay: (date1: Date, date2: Date) => 
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate(),
  startOfDay: (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate()),
  endOfDay: (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999)
}))

describe('useClientEventsState - Testes Unitários', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('deve importar o hook corretamente', () => {
    expect(typeof useClientEventsState).toBe('function')
  })

  it('deve retornar estado inicial correto', () => {
    const { result } = renderHook(() => useClientEventsState())
    
    expect(result.current.events).toEqual([])
    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBe(null)
    expect(result.current.filters).toEqual({
      status: 'all',
      dateRange: null,
      boatId: null
    })
  })

  it('deve filtrar eventos por status', () => {
    const { result } = renderHook(() => useClientEventsState())
    
    const mockEvents = [
      { id: '1', status: 'SCHEDULED', date: '2024-01-15' },
      { id: '2', status: 'COMPLETED', date: '2024-01-16' },
      { id: '3', status: 'CANCELLED', date: '2024-01-17' }
    ]

    act(() => {
      result.current.setEvents(mockEvents)
    })

    // Filtrar por SCHEDULED
    act(() => {
      result.current.setFilters({ ...result.current.filters, status: 'SCHEDULED' })
    })

    const filteredEvents = result.current.filteredEvents
    expect(filteredEvents).toHaveLength(1)
    expect(filteredEvents[0].status).toBe('SCHEDULED')
  })

  it('deve filtrar eventos por período', () => {
    const { result } = renderHook(() => useClientEventsState())
    
    const mockEvents = [
      { id: '1', status: 'SCHEDULED', date: '2024-01-15' },
      { id: '2', status: 'COMPLETED', date: '2024-02-16' },
      { id: '3', status: 'CANCELLED', date: '2024-03-17' }
    ]

    act(() => {
      result.current.setEvents(mockEvents)
    })

    // Filtrar por janeiro
    act(() => {
      result.current.setFilters({
        ...result.current.filters,
        dateRange: { start: '2024-01-01', end: '2024-01-31' }
      })
    })

    const filteredEvents = result.current.filteredEvents
    expect(filteredEvents).toHaveLength(1)
    expect(filteredEvents[0].date).toBe('2024-01-15')
  })

  it('deve calcular estatísticas do cliente', () => {
    const { result } = renderHook(() => useClientEventsState())
    
    const mockEvents = [
      { id: '1', status: 'COMPLETED', total: 1500, date: '2024-01-15' },
      { id: '2', status: 'COMPLETED', total: 2000, date: '2024-02-16' },
      { id: '3', status: 'SCHEDULED', total: 1800, date: '2024-03-17' },
      { id: '4', status: 'CANCELLED', total: 1200, date: '2024-01-20' }
    ]

    act(() => {
      result.current.setEvents(mockEvents)
    })

    const stats = result.current.statistics
    expect(stats.totalEvents).toBe(4)
    expect(stats.completedEvents).toBe(2)
    expect(stats.scheduledEvents).toBe(1)
    expect(stats.cancelledEvents).toBe(1)
    expect(stats.totalRevenue).toBe(3500) // 1500 + 2000
    expect(stats.pendingRevenue).toBe(1800)
  })

  it('deve ordenar eventos corretamente', () => {
    const { result } = renderHook(() => useClientEventsState())
    
    const mockEvents = [
      { id: '1', status: 'SCHEDULED', date: '2024-01-15', createdAt: '2024-01-10T10:00:00Z' },
      { id: '2', status: 'COMPLETED', date: '2024-01-16', createdAt: '2024-01-11T10:00:00Z' },
      { id: '3', status: 'CANCELLED', date: '2024-01-14', createdAt: '2024-01-12T10:00:00Z' }
    ]

    act(() => {
      result.current.setEvents(mockEvents)
    })

    // Ordenar por data (mais recente primeiro)
    act(() => {
      if (result.current.setSortBy) {
        result.current.setSortBy('date')
      }
    })

    const sortedEvents = result.current.sortedEvents
    expect(sortedEvents[0].date).toBe('2024-01-16') // Mais recente
    expect(sortedEvents[2].date).toBe('2024-01-14') // Mais antigo
  })

  it('deve buscar eventos por texto', () => {
    const { result } = renderHook(() => useClientEventsState())
    
    const mockEvents = [
      { id: '1', status: 'SCHEDULED', tourName: 'Passeio para Ilha', clientName: 'João Silva' },
      { id: '2', status: 'COMPLETED', tourName: 'Tour pela Baía', clientName: 'Maria Santos' },
      { id: '3', status: 'CANCELLED', tourName: 'Passeio Noturno', clientName: 'José Oliveira' }
    ]

    act(() => {
      result.current.setEvents(mockEvents)
    })

    // Buscar por "Passeio"
    act(() => {
      if (result.current.setSearchTerm) {
        result.current.setSearchTerm('Passeio')
      }
    })

    const searchResults = result.current.searchResults || result.current.filteredEvents
    expect(searchResults.length).toBe(2)
    expect(searchResults[0].tourName).toContain('Passeio')
    expect(searchResults[1].tourName).toContain('Passeio')
  })

  it('deve lidar com estado de loading', () => {
    const { result } = renderHook(() => useClientEventsState())
    
    act(() => {
      if (result.current.setLoading) {
        result.current.setLoading(true)
      }
    })

    expect(result.current.loading).toBe(true)

    act(() => {
      if (result.current.setLoading) {
        result.current.setLoading(false)
      }
    })

    expect(result.current.loading).toBe(false)
  })

  it('deve lidar com estado de erro', () => {
    const { result } = renderHook(() => useClientEventsState())
    
    const errorMessage = 'Erro ao carregar eventos'
    
    act(() => {
      if (result.current.setError) {
        result.current.setError(errorMessage)
      }
    })

    expect(result.current.error).toBe(errorMessage)
    expect(result.current.loading).toBe(false)
  })

  it('deve limpar erro ao definir novos eventos', () => {
    const { result } = renderHook(() => useClientEventsState())
    
    // Definir erro
    act(() => {
      if (result.current.setError) {
        result.current.setError('Erro inicial')
      }
    })

    expect(result.current.error).toBe('Erro inicial')

    // Definir novos eventos deve limpar o erro
    act(() => {
      result.current.setEvents([{ id: '1', status: 'SCHEDULED', date: '2024-01-15' }])
    })

    expect(result.current.error).toBe(null)
  })

  it('deve resetar filtros', () => {
    const { result } = renderHook(() => useClientEventsState())
    
    // Alterar filtros
    act(() => {
      result.current.setFilters({
        status: 'COMPLETED',
        dateRange: { start: '2024-01-01', end: '2024-01-31' },
        boatId: 'boat-1'
      })
    })

    expect(result.current.filters.status).toBe('COMPLETED')
    expect(result.current.filters.boatId).toBe('boat-1')

    // Resetar filtros
    act(() => {
      if (result.current.resetFilters) {
        result.current.resetFilters()
      }
    })

    expect(result.current.filters.status).toBe('all')
    expect(result.current.filters.dateRange).toBe(null)
    expect(result.current.filters.boatId).toBe(null)
  })
})
