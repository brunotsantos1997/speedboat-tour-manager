import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useDashboardState } from '@/viewmodels/dashboard/useDashboardState'

// Mock do date-fns para controle de datas
vi.mock('date-fns', () => ({
  startOfDay: (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate()),
  isWithinInterval: (date: Date, interval: { start: Date, end: Date }) => 
    date >= interval.start && date <= interval.end,
  startOfWeek: (date: Date) => new Date(date),
  endOfWeek: (date: Date) => new Date(date),
  getMonth: (date: Date) => date.getMonth(),
  isSameDay: (date1: Date, date2: Date) => 
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate(),
  format: (date: Date, pattern: string) => {
    if (pattern === 'yyyy-MM-dd') {
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
    }
    return date.toString()
  },
  startOfMonth: (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1),
  endOfMonth: (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0)
}))

describe('useDashboardState - Testes Unitários', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('deve importar o hook corretamente', () => {
    expect(typeof useDashboardState).toBe('function')
  })

  it('deve retornar estado inicial correto', () => {
    const { result } = renderHook(() => useDashboardState())
    
    expect(result.current.eventsForPeriod).toEqual([])
    expect(result.current.notificationEvents).toEqual([])
    expect(result.current.allPayments).toEqual([])
    expect(result.current.isLoading).toBe(true)
    expect(result.current.selectedDate).toBeInstanceOf(Date)
  })

  it('deve calcular períodos corretamente', () => {
    const { result } = renderHook(() => useDashboardState())
    
    expect(result.current.periodStart).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect(result.current.periodEnd).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('deve filtrar upcoming events corretamente', () => {
    const { result } = renderHook(() => useDashboardState())
    
    const now = new Date()
    const futureDate = new Date(now.getTime() + 86400000) // Amanhã
    const pastDate = new Date(now.getTime() - 86400000) // Ontem
    
    // Adicionar eventos de teste
    act(() => {
      result.current.setEventsForPeriod([
        {
          id: 'event-1',
          status: 'SCHEDULED',
          date: futureDate.toISOString().split('T')[0],
          endTime: '23:59'
        },
        {
          id: 'event-2',
          status: 'COMPLETED',
          date: futureDate.toISOString().split('T')[0],
          endTime: '23:59'
        },
        {
          id: 'event-3',
          status: 'SCHEDULED',
          date: pastDate.toISOString().split('T')[0],
          endTime: '23:59'
        }
      ])
    })

    expect(result.current.upcomingEvents).toHaveLength(1)
    expect(result.current.upcomingEvents[0].id).toBe('event-1')
  })

  it('deve filtrar eventos por data selecionada', () => {
    const { result } = renderHook(() => useDashboardState())
    
    const selectedDate = new Date()
    const eventDate = new Date(selectedDate)
    
    // Adicionar eventos de teste
    act(() => {
      result.current.setEventsForPeriod([
        {
          id: 'event-1',
          status: 'SCHEDULED',
          date: eventDate.toISOString().split('T')[0],
          endTime: '23:59'
        },
        {
          id: 'event-2',
          status: 'SCHEDULED',
          date: new Date(selectedDate.getTime() + 86400000).toISOString().split('T')[0],
          endTime: '23:59'
        }
      ])
    })

    expect(result.current.eventsForSelectedDate).toHaveLength(1)
    expect(result.current.eventsForSelectedDate[0].id).toBe('event-1')
  })

  it('deve atualizar data selecionada', () => {
    const { result } = renderHook(() => useDashboardState())
    
    const newDate = new Date('2024-12-25')
    
    act(() => {
      result.current.setSelectedDate(newDate)
    })

    expect(result.current.selectedDate).toEqual(newDate)
  })

  it('deve atualizar estado de loading', () => {
    const { result } = renderHook(() => useDashboardState())
    
    act(() => {
      result.current.setIsLoading(false)
    })

    expect(result.current.isLoading).toBe(false)
  })

  it('deve atualizar eventos de notificação', () => {
    const { result } = renderHook(() => useDashboardState())
    
    const notificationEvents = [
      {
        id: 'notification-1',
        status: 'SCHEDULED',
        date: new Date().toISOString().split('T')[0],
        endTime: '23:59'
      }
    ]
    
    act(() => {
      result.current.setNotificationEvents(notificationEvents)
    })

    expect(result.current.notificationEvents).toEqual(notificationEvents)
  })

  it('deve atualizar pagamentos', () => {
    const { result } = renderHook(() => useDashboardState())
    
    const payments = [
      {
        id: 'payment-1',
        amount: 1000,
        status: 'PAID',
        date: new Date().toISOString()
      }
    ]
    
    act(() => {
      result.current.setAllPayments(payments)
    })

    expect(result.current.allPayments).toEqual(payments)
  })

  it('deve calcular eventos de hoje corretamente', () => {
    const { result } = renderHook(() => useDashboardState())
    
    const today = new Date()
    
    // Adicionar eventos de teste
    act(() => {
      result.current.setEventsForPeriod([
        {
          id: 'event-1',
          status: 'SCHEDULED',
          date: today.toISOString().split('T')[0],
          endTime: '23:59'
        },
        {
          id: 'event-2',
          status: 'SCHEDULED',
          date: new Date(today.getTime() + 86400000).toISOString().split('T')[0],
          endTime: '23:59'
        }
      ])
    })

    expect(result.current.todayEvents).toHaveLength(1)
    expect(result.current.todayEvents[0].id).toBe('event-1')
  })

  it('deve calcular eventos desta semana corretamente', () => {
    const { result } = renderHook(() => useDashboardState())
    
    const today = new Date()
    
    // Adicionar eventos de teste
    act(() => {
      result.current.setEventsForPeriod([
        {
          id: 'event-1',
          status: 'SCHEDULED',
          date: today.toISOString().split('T')[0],
          endTime: '23:59'
        },
        {
          id: 'event-2',
          status: 'SCHEDULED',
          date: new Date(today.getTime() + 7 * 86400000).toISOString().split('T')[0],
          endTime: '23:59'
        }
      ])
    })

    expect(result.current.weekEvents.length).toBeGreaterThanOrEqual(1)
  })

  it('deve calcular estatísticas básicas', () => {
    const { result } = renderHook(() => useDashboardState())
    
    // Adicionar eventos de teste
    act(() => {
      result.current.setEventsForPeriod([
        {
          id: 'event-1',
          status: 'SCHEDULED',
          date: new Date().toISOString().split('T')[0],
          endTime: '23:59',
          total: 1000
        },
        {
          id: 'event-2',
          status: 'COMPLETED',
          date: new Date().toISOString().split('T')[0],
          endTime: '23:59',
          total: 2000
        },
        {
          id: 'event-3',
          status: 'CANCELLED',
          date: new Date().toISOString().split('T')[0],
          endTime: '23:59',
          total: 500
        }
      ])
    })

    expect(result.current.totalEvents).toBe(3)
    expect(result.current.completedEvents).toBe(1)
    expect(result.current.cancelledEvents).toBe(1)
  })
})

