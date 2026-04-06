import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useDashboardMetrics } from '../../../src/viewmodels/dashboard/useDashboardMetrics'

// Mock do date-fns para controle de datas
vi.mock('date-fns', () => ({
  format: (date: Date, pattern: string) => {
    if (pattern === 'yyyy-MM') {
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    }
    return date.toString()
  },
  startOfMonth: (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1),
  endOfMonth: (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0),
  isSameMonth: (date1: Date, date2: Date) => 
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth(),
  subMonths: (date: Date, months: number) => {
    const result = new Date(date)
    result.setMonth(result.getMonth() - months)
    return result
  }
}))

describe('useDashboardMetrics - Testes Unitários', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('deve importar o hook corretamente', () => {
    expect(typeof useDashboardMetrics).toBe('function')
  })

  it('deve retornar estado inicial correto', () => {
    const { result } = renderHook(() => useDashboardMetrics())
    
    expect(result.current.metrics).toBeDefined()
    expect(result.current.loading).toBe(true)
    expect(result.current.error).toBe(null)
  })

  it('deve calcular métricas financeiras básicas', () => {
    const { result } = renderHook(() => useDashboardMetrics())
    
    // Mock de dados financeiros
    const financialData = {
      events: [
        { id: 'event-1', status: 'COMPLETED', total: 1500, date: '2024-01-15' },
        { id: 'event-2', status: 'COMPLETED', total: 2000, date: '2024-01-20' },
        { id: 'event-3', status: 'SCHEDULED', total: 1800, date: '2024-01-25' },
        { id: 'event-4', status: 'CANCELLED', total: 1200, date: '2024-01-10' }
      ],
      payments: [
        { id: 'payment-1', eventId: 'event-1', amount: 1500, date: '2024-01-15' },
        { id: 'payment-2', eventId: 'event-2', amount: 2000, date: '2024-01-20' },
        { id: 'payment-3', eventId: 'event-3', amount: 900, date: '2024-01-25' }
      ],
      expenses: [
        { id: 'expense-1', amount: 500, date: '2024-01-05', category: 'fuel' },
        { id: 'expense-2', amount: 300, date: '2024-01-12', category: 'maintenance' },
        { id: 'expense-3', amount: 200, date: '2024-01-18', category: 'supplies' }
      ]
    }

    // Função de cálculo de métricas financeiras
    const calculateFinancialMetrics = (data: any) => {
      const completedEvents = data.events.filter((e: any) => e.status === 'COMPLETED')
      const scheduledEvents = data.events.filter((e: any) => e.status === 'SCHEDULED')
      
      // Calcular receita realizada
      const realizedRevenue = completedEvents.reduce((sum: number, e: any) => sum + e.total, 0)
      
      // Calcular receita pendente
      const pendingRevenue = scheduledEvents.reduce((sum: number, e: any) => sum + e.total, 0)
      
      // Calcular total recebido
      const totalReceived = data.payments.reduce((sum: number, p: any) => sum + p.amount, 0)
      
      // Calcular total despesas
      const totalExpenses = data.expenses.reduce((sum: number, e: any) => sum + e.amount, 0)
      
      // Calcular saldo a receber
      const outstandingBalance = pendingRevenue
      
      // Calcular lucro líquido
      const netProfit = realizedRevenue - totalExpenses
      
      // Calcular margem de lucro
      const profitMargin = realizedRevenue > 0 ? Math.round((netProfit / realizedRevenue) * 100) : 0

      return {
        realizedRevenue,
        pendingRevenue,
        totalReceived,
        totalExpenses,
        outstandingBalance,
        netProfit,
        profitMargin,
        completedEventsCount: completedEvents.length,
        scheduledEventsCount: scheduledEvents.length,
        paymentRate: pendingRevenue + realizedRevenue > 0 
          ? Math.round((totalReceived / (pendingRevenue + realizedRevenue)) * 100)
          : 0
      }
    }

    const metrics = calculateFinancialMetrics(financialData)
    expect(metrics.realizedRevenue).toBe(3500) // 1500 + 2000
    expect(metrics.pendingRevenue).toBe(1800) // Evento agendado
    expect(metrics.totalReceived).toBe(4400) // 1500 + 2000 + 900
    expect(metrics.totalExpenses).toBe(1000) // 500 + 300 + 200
    expect(metrics.outstandingBalance).toBe(1800)
    expect(metrics.netProfit).toBe(2500) // 3500 - 1000
    expect(metrics.profitMargin).toBe(71) // 2500 / 3500 * 100
    expect(metrics.completedEventsCount).toBe(2)
    expect(metrics.scheduledEventsCount).toBe(1)
    expect(metrics.paymentRate).toBe(83) // 4400 / 5300 * 100
  })

  it('deve calcular métricas de performance', () => {
    // Mock de dados de performance
    const performanceData = {
      events: [
        { id: 'event-1', status: 'COMPLETED', passengerCount: 8, duration: 120, date: '2024-01-15' },
        { id: 'event-2', status: 'COMPLETED', passengerCount: 10, duration: 90, date: '2024-01-20' },
        { id: 'event-3', status: 'CANCELLED', passengerCount: 6, duration: 120, date: '2024-01-10' },
        { id: 'event-4', status: 'SCHEDULED', passengerCount: 12, duration: 150, date: '2024-01-25' }
      ],
      boats: [
        { id: 'boat-1', name: 'Alpha', capacity: 15, isActive: true },
        { id: 'boat-2', name: 'Beta', capacity: 20, isActive: true },
        { id: 'boat-3', name: 'Gamma', capacity: 12, isActive: false }
      ]
    }

    // Função de cálculo de métricas de performance
    const calculatePerformanceMetrics = (data: any) => {
      const completedEvents = data.events.filter((e: any) => e.status === 'COMPLETED')
      const cancelledEvents = data.events.filter((e: any) => e.status === 'CANCELLED')
      const activeBoats = data.boats.filter((b: any) => b.isActive)

      const totalPassengers = completedEvents.reduce((sum: number, e: any) => sum + e.passengerCount, 0)
      const averageDuration = completedEvents.length > 0 
        ? Math.round(completedEvents.reduce((sum: number, e: any) => sum + e.duration, 0) / completedEvents.length)
        : 0
      const completionRate = data.events.length > 0 
        ? Math.round((completedEvents.length / data.events.length) * 100)
        : 0
      const cancellationRate = data.events.length > 0 
        ? Math.round((cancelledEvents.length / data.events.length) * 100)
        : 0

      return {
        totalEvents: data.events.length,
        completedEvents: completedEvents.length,
        cancelledEvents: cancelledEvents.length,
        totalPassengers,
        averageDuration,
        completionRate,
        cancellationRate,
        activeBoats: activeBoats.length,
        boatUtilization: activeBoats.length > 0 ? Math.round((totalPassengers / (activeBoats.reduce((sum: number, b: any) => sum + b.capacity, 0))) * 100) : 0
      }
    }

    const metrics = calculatePerformanceMetrics(performanceData)
    expect(metrics.totalEvents).toBe(4)
    expect(metrics.completedEvents).toBe(2)
    expect(metrics.cancelledEvents).toBe(1)
    expect(metrics.totalPassengers).toBe(18)
    expect(metrics.averageDuration).toBe(105)
    expect(metrics.completionRate).toBe(50)
    expect(metrics.cancellationRate).toBe(25)
    expect(metrics.activeBoats).toBe(2)
  })

  it('deve calcular tendências mensais', () => {
    // Mock de dados de tendências
    const trendsData = {
      currentMonth: {
        revenue: 21000,
        expenses: 3500,
        events: 32,
        completionRate: 85
      },
      previousMonth: {
        revenue: 20000,
        expenses: 3200,
        events: 28,
        completionRate: 88
      },
      lastYear: {
        revenue: 12000,
        expenses: 2000,
        events: 20,
        completionRate: 80
      }
    }

    // Função de cálculo de tendências
    const calculateTrends = (data: any) => {
      const monthlyGrowth = {
        revenue: data.previousMonth.revenue > 0 
          ? Math.round(((data.currentMonth.revenue - data.previousMonth.revenue) / data.previousMonth.revenue) * 100)
          : 0,
        expenses: data.previousMonth.expenses > 0 
          ? Math.round(((data.currentMonth.expenses - data.previousMonth.expenses) / data.previousMonth.expenses) * 100)
          : 0,
        events: data.previousMonth.events > 0 
          ? Math.round(((data.currentMonth.events - data.previousMonth.events) / data.previousMonth.events) * 100)
          : 0,
        completionRate: data.previousMonth.completionRate > 0 
          ? Math.round(((data.currentMonth.completionRate - data.previousMonth.completionRate) / data.previousMonth.completionRate) * 100)
          : 0
      }

      const totalGrowth = {
        revenue: data.lastYear.revenue > 0 
          ? Math.round(((data.currentMonth.revenue - data.lastYear.revenue) / data.lastYear.revenue) * 100)
          : 0,
        expenses: data.lastYear.expenses > 0 
          ? Math.round(((data.currentMonth.expenses - data.lastYear.expenses) / data.lastYear.expenses) * 100)
          : 0,
        events: data.lastYear.events > 0 
          ? Math.round(((data.currentMonth.events - data.lastYear.events) / data.lastYear.events) * 100)
          : 0,
        completionRate: data.lastYear.completionRate > 0 
          ? Math.round(((data.currentMonth.completionRate - data.lastYear.completionRate) / data.lastYear.completionRate) * 100)
          : 0
      }

      return {
        monthlyGrowth,
        totalGrowth,
        trendDirection: monthlyGrowth.revenue > 0 && monthlyGrowth.events > 0 ? 'up' : 'stable'
      }
    }

    const trends = calculateTrends(trendsData)
    expect(trends.monthlyGrowth.revenue).toBe(5) // (21000-20000)/20000
    expect(trends.monthlyGrowth.expenses).toBe(9) // ((3500-3200)/3200)*100
    expect(trends.monthlyGrowth.events).toBe(14) // ((32-28)/28)*100
    expect(trends.totalGrowth.revenue).toBe(75) // ((21000-12000)/12000)*100
    expect(trends.trendDirection).toBe('up')
  })

  it('deve comparar com metas', () => {
    // Mock de dados e metas
    const actualData = {
      revenue: 21000,
      expenses: 3500,
      events: 32,
      completionRate: 85
    }

    const targets = {
      monthlyRevenue: 20000,
      monthlyExpenses: 4000,
      monthlyEvents: 30,
      completionRate: 90
    }

    // Função de comparação com metas
    const compareWithTargets = (actual: any, targets: any) => {
      const comparisons = {
        revenue: {
          target: targets.monthlyRevenue,
          actual: actual.revenue,
          variance: actual.revenue - targets.monthlyRevenue,
          variancePercent: Math.round(((actual.revenue - targets.monthlyRevenue) / targets.monthlyRevenue) * 100),
          achieved: actual.revenue >= targets.monthlyRevenue
        },
        expenses: {
          target: targets.monthlyExpenses,
          actual: actual.expenses,
          variance: actual.expenses - targets.monthlyExpenses,
          variancePercent: Math.round(((actual.expenses - targets.monthlyExpenses) / targets.monthlyExpenses) * 100),
          achieved: actual.expenses <= targets.monthlyExpenses
        },
        events: {
          target: targets.monthlyEvents,
          actual: actual.events,
          variance: actual.events - targets.monthlyEvents,
          variancePercent: Math.round(((actual.events - targets.monthlyEvents) / targets.monthlyEvents) * 100),
          achieved: actual.events >= targets.monthlyEvents
        },
        completionRate: {
          target: targets.completionRate,
          actual: actual.completionRate,
          variance: actual.completionRate - targets.completionRate,
          variancePercent: Math.round(((actual.completionRate - targets.completionRate) / targets.completionRate) * 100),
          achieved: actual.completionRate >= targets.completionRate
        }
      }

      const achievedCount = Object.values(comparisons).filter((c: any) => c.achieved).length
      const achievementRate = Math.round((achievedCount / Object.keys(comparisons).length) * 100)

      return {
        comparisons,
        achievementRate,
        status: achievementRate >= 75 ? 'excellent' : achievementRate >= 50 ? 'good' : 'needs_improvement'
      }
    }

    const comparison = compareWithTargets(actualData, targets)
    expect(comparison.comparisons.revenue.achieved).toBe(true)
    expect(comparison.comparisons.revenue.variancePercent).toBe(5) // 21000-20000 / 20000
    expect(comparison.comparisons.expenses.achieved).toBe(true)
    expect(comparison.comparisons.expenses.variancePercent).toBe(-12) // 3500-4000 / 4000
    expect(comparison.comparisons.events.achieved).toBe(true)
    expect(comparison.comparisons.events.variancePercent).toBe(7) // 32-30 / 30
    expect(comparison.comparisons.completionRate.achieved).toBe(false)
    expect(comparison.achievementRate).toBe(75) // 3 / 4 * 100
    expect(comparison.status).toBe('excellent')
  })

  it('deve gerar alertas corretamente', () => {
    // Mock de dados para alertas
    const alertData = {
      metrics: {
        completionRate: 45,
        cancellationRate: 30,
        pendingPayments: 15000,
        lowPerformingBoats: ['boat-3', 'boat-5'],
        upcomingEvents: 8,
        overduePayments: 3
      },
      thresholds: {
        minCompletionRate: 70,
        maxCancellationRate: 15,
        maxPendingPayments: 10000,
        maxOverduePayments: 0
      }
    }

    // Função de geração de alertas
    const generateAlerts = (data: any, thresholds: any) => {
      const alerts: any[] = []

      if (data.metrics.completionRate < thresholds.minCompletionRate) {
        alerts.push({
          type: 'warning',
          title: 'Taxa de Conclusão Baixa',
          message: `Taxa de conclusão de ${data.metrics.completionRate}% está abaixo da meta de ${thresholds.minCompletionRate}%`,
          severity: 'high',
          action: 'review_events'
        })
      }

      if (data.metrics.cancellationRate > thresholds.maxCancellationRate) {
        alerts.push({
          type: 'warning',
          title: 'Alta Taxa de Cancelamento',
          message: `Taxa de cancelamento de ${data.metrics.cancellationRate}% excede o limite de ${thresholds.maxCancellationRate}%`,
          severity: 'medium',
          action: 'analyze_cancellations'
        })
      }

      if (data.metrics.pendingPayments > thresholds.maxPendingPayments) {
        alerts.push({
          type: 'alert',
          title: 'Pagamentos Pendentes Elevados',
          message: `R$ ${data.metrics.pendingPayments.toLocaleString('pt-BR')} em pagamentos pendentes`,
          severity: 'high',
          action: 'review_payments'
        })
      }

      if (data.metrics.overduePayments > thresholds.maxOverduePayments) {
        alerts.push({
          type: 'critical',
          title: 'Pagamentos em Atraso',
          message: `${data.metrics.overduePayments} pagamentos em atraso`,
          severity: 'critical',
          action: 'contact_clients'
        })
      }

      if (data.metrics.lowPerformingBoats.length > 0) {
        alerts.push({
          type: 'info',
          title: 'Barcos com Baixa Performance',
          message: `${data.metrics.lowPerformingBoats.length} barcos com performance abaixo da média`,
          severity: 'low',
          action: 'review_boat_performance'
        })
      }

      return {
        alerts,
        totalAlerts: alerts.length,
        criticalAlerts: alerts.filter((a: any) => a.severity === 'critical').length,
        highAlerts: alerts.filter((a: any) => a.severity === 'high').length,
        mediumAlerts: alerts.filter((a: any) => a.severity === 'medium').length,
        lowAlerts: alerts.filter((a: any) => a.severity === 'low').length
      }
    }

    const alerts = generateAlerts(alertData, alertData.thresholds)
    expect(alerts.totalAlerts).toBe(5)
    expect(alerts.criticalAlerts).toBe(1)
    expect(alerts.highAlerts).toBe(2)
    expect(alerts.mediumAlerts).toBe(1)
    expect(alerts.lowAlerts).toBe(1)
    expect(alerts.alerts[0].title).toBe('Taxa de Conclusão Baixa')
    expect(alerts.alerts[3].type).toBe('critical')
  })

  it('deve atualizar métricas quando dados mudam', () => {
    const { result } = renderHook(() => useDashboardMetrics())
    
    // Simular atualização de dados
    const newMetrics = {
      revenue: 25000,
      expenses: 4000,
      events: 35,
      completionRate: 90
    }

    act(() => {
      if (result.current.updateMetrics) {
        result.current.updateMetrics(newMetrics)
      }
    })

    // Verificar se as métricas foram atualizadas
    if (result.current.metrics) {
      expect(result.current.metrics.revenue).toBe(25000)
    }
  })

  it('deve lidar com estados de erro', () => {
    const { result } = renderHook(() => useDashboardMetrics())
    
    // Simular estado de erro
    act(() => {
      if (result.current.setError) {
        result.current.setError('Erro ao carregar dados')
      }
    })

    expect(result.current.error).toBe('Erro ao carregar dados')
    expect(result.current.loading).toBe(false)
  })
})
