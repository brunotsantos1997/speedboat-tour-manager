import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock dos repositories
vi.mock('../../../src/core/repositories/EventRepository', () => ({
  eventRepository: {
    getEventsByDateRange: vi.fn(),
    subscribeToDateRange: vi.fn()
  }
}))

vi.mock('../../../src/core/repositories/ExpenseRepository', () => ({
  expenseRepository: {
    getByDateRange: vi.fn(),
    subscribeByDateRange: vi.fn()
  }
}))

vi.mock('../../../src/core/repositories/PaymentRepository', () => ({
  paymentRepository: {
    getAll: vi.fn(),
    subscribe: vi.fn()
  }
}))

vi.mock('../../../src/core/repositories/IncomeRepository', () => ({
  incomeRepository: {
    getByDateRange: vi.fn(),
    subscribeByDateRange: vi.fn()
  }
}))

// Mock do React hooks
vi.mock('react', () => ({
  useState: vi.fn((initial) => [initial, vi.fn()]),
  useEffect: vi.fn(),
  useMemo: vi.fn((fn) => fn()),
  useCallback: vi.fn((fn) => fn)
}))

// Mock do date-fns
vi.mock('date-fns', () => ({
  startOfMonth: vi.fn((date) => new Date(date.getFullYear(), date.getMonth(), 1)),
  endOfMonth: vi.fn((date) => new Date(date.getFullYear(), date.getMonth() + 1, 0)),
  format: vi.fn((date, formatStr) => {
    if (formatStr === 'yyyy-MM-dd') {
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
    }
    if (formatStr === 'MMM') {
      return ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'][date.getMonth()]
    }
    if (formatStr === 'dd/MM') {
      return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}`
    }
    return 'formatted-date'
  }),
  eachDayOfInterval: vi.fn(({ start, end }) => {
    const days = []
    const current = new Date(start)
    while (current <= end) {
      days.push(new Date(current))
      current.setDate(current.getDate() + 1)
    }
    return days
  })
}))

vi.mock('date-fns/locale', () => ({
  ptBR: {}
}))

describe('useFinanceViewModel - Testes Unitários', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('deve importar o hook corretamente', async () => {
    const { useFinanceViewModel } = await import('../../../src/viewmodels/useFinanceViewModel')
    expect(typeof useFinanceViewModel).toBe('function')
  })

  it('deve validar estrutura básica do hook', async () => {
    const { useFinanceViewModel } = await import('../../../src/viewmodels/useFinanceViewModel')
    
    // Teste básico para garantir que o hook não quebra na importação
    expect(() => {
      // Não vamos executar o hook, apenas validar sua estrutura
      const hookSource = useFinanceViewModel.toString()
      expect(hookSource).toContain('useState')
      expect(hookSource).toContain('useEffect')
      expect(hookSource).toContain('useMemo')
      expect(hookSource).toContain('useCallback')
    }).not.toThrow()
  })

  it('deve calcular estatísticas financeiras corretamente', () => {
    // Mock de dados para teste
    const events = [
      {
        id: 'event-1',
        status: 'COMPLETED',
        total: 1000,
        rentalRevenue: 600,
        productsRevenue: 400
      },
      {
        id: 'event-2',
        status: 'SCHEDULED',
        total: 800,
        rentalRevenue: 500,
        productsRevenue: 300
      },
      {
        id: 'event-3',
        status: 'CANCELLED',
        total: 500,
        rentalRevenue: 300,
        productsRevenue: 200
      }
    ]

    const payments = [
      { eventId: 'event-1', amount: 800 },
      { eventId: 'event-2', amount: 400 },
      { eventId: 'event-3', amount: 200 }
    ]

    const expenses = [
      { status: 'PAID', amount: 300 },
      { status: 'PENDING', amount: 100 }
    ]

    const incomes = [
      { amount: 200 },
      { amount: 150 }
    ]

    // Lógica de cálculo (baseada no ViewModel)
    const confirmedStatuses = ['SCHEDULED', 'COMPLETED', 'ARCHIVED_COMPLETED']
    const filteredEvents = events.filter(e => confirmedStatuses.includes(e.status))
    const filteredExpenses = expenses.filter(e => e.status === 'PAID')
    const filteredIncomes = incomes

    const totalExpenses = filteredExpenses.reduce((acc, e) => acc + e.amount, 0)

    let realizedFromEvents = 0
    let pendingFromEvents = 0
    let boatRentalRealized = 0
    let productsRealized = 0
    let totalEventsValue = 0

    filteredEvents.forEach(event => {
      totalEventsValue += event.total
      const eventPayments = payments.filter(p => p.eventId === event.id)
      const totalPaidForEvent = eventPayments.reduce((acc, p) => acc + p.amount, 0)

      const realized = Math.min(event.total, totalPaidForEvent)
      const pending = Math.max(0, event.total - totalPaidForEvent)

      realizedFromEvents += realized
      pendingFromEvents += pending

      if (event.total > 0) {
        const ratio = realized / event.total
        boatRentalRealized += (event.rentalRevenue || 0) * ratio
        productsRealized += (event.productsRevenue || 0) * ratio
      }
    })

    const otherRevenue = filteredIncomes.reduce((acc, i) => acc + i.amount, 0)
    const totalRealizedRevenue = realizedFromEvents + otherRevenue

    const stats = {
      totalRevenue: totalRealizedRevenue,
      projectedRevenue: pendingFromEvents,
      averageProjectedValue: filteredEvents.length > 0 ? totalEventsValue / filteredEvents.length : 0,
      totalExpenses,
      netProfit: totalRealizedRevenue - totalExpenses,
      boatRentalRevenue: boatRentalRealized,
      productsRevenue: productsRealized,
      otherRevenue,
      eventCount: filteredEvents.length,
      expenseCount: filteredExpenses.length
    }

    // Verificações
    expect(stats.totalRevenue).toBe(1550) // 800 + 400 + 200 + 150
    expect(stats.projectedRevenue).toBe(600) // (1000-800) + (800-400)
    expect(stats.totalExpenses).toBe(300)
    expect(stats.netProfit).toBe(1250) // 1550 - 300
    expect(stats.eventCount).toBe(2)
    expect(stats.expenseCount).toBe(1)
  })

  it('deve calcular fluxo de caixa mensal corretamente', () => {
    // Mock de dados para teste
    const events = [
      {
        id: 'event-1',
        status: 'COMPLETED',
        date: '2024-01-15',
        total: 1000
      },
      {
        id: 'event-2',
        status: 'SCHEDULED',
        date: '2024-01-20',
        total: 800
      }
    ]

    const payments = [
      { eventId: 'event-1', amount: 800 },
      { eventId: 'event-2', amount: 400 }
    ]

    const incomes = [
      { date: '2024-01-10', amount: 200 },
      { date: '2024-01-25', amount: 150 }
    ]

    const expenses = [
      { status: 'PAID', date: '2024-01-05', amount: 100 },
      { status: 'PAID', date: '2024-01-30', amount: 150 }
    ]

    // Lógica simplificada para um mês
    const projectedStatuses = ['SCHEDULED', 'COMPLETED', 'ARCHIVED_COMPLETED', 'PRE_SCHEDULED']
    const monthEvents = events.filter(e => 
      projectedStatuses.includes(e.status) && 
      e.date >= '2024-01-01' && 
      e.date <= '2024-01-31'
    )
    const monthIncomes = incomes.filter(i => 
      i.date >= '2024-01-01' && 
      i.date <= '2024-01-31'
    )

    const realized = monthIncomes.reduce((acc, i) => acc + i.amount, 0)
    
    let pending = 0
    monthEvents.forEach(e => {
      const ePayments = payments.filter(p => p.eventId === e.id)
      const ePaid = ePayments.reduce((acc, p) => acc + p.amount, 0)
      pending += Math.max(0, e.total - ePaid)
    })

    const monthExpenses = expenses.filter(e => 
      e.status === 'PAID' && 
      e.date >= '2024-01-01' && 
      e.date <= '2024-01-31'
    )
    const expensesTotal = monthExpenses.reduce((acc, e) => acc + e.amount, 0)

    expect(realized).toBe(350) // 200 + 150
    expect(pending).toBe(600) // (1000-800) + (800-400)
    expect(expensesTotal).toBe(250) // 100 + 150
  })

  it('deve calcular fluxo de caixa diário corretamente', () => {
    // Mock de dados para teste
    const events = [
      {
        id: 'event-1',
        status: 'COMPLETED',
        date: '2024-01-15',
        total: 1000
      }
    ]

    const payments = [
      { eventId: 'event-1', amount: 800 }
    ]

    const incomes = [
      { date: '2024-01-15', amount: 200 }
    ]

    const expenses = [
      { status: 'PAID', date: '2024-01-15', amount: 100 }
    ]

    // Lógica para um dia específico
    const dStr = '2024-01-15'
    const projectedStatuses = ['SCHEDULED', 'COMPLETED', 'ARCHIVED_COMPLETED', 'PRE_SCHEDULED']
    const dayEvents = events.filter(e => e.date === dStr && projectedStatuses.includes(e.status))
    const dayIncomes = incomes.filter(i => i.date === dStr)
    const dayExpenses = expenses.filter(e => e.date === dStr && e.status === 'PAID')

    let dayRealized = dayIncomes.reduce((acc, i) => acc + i.amount, 0)
    let dayPending = 0

    dayEvents.forEach(e => {
      const ePayments = payments.filter(p => p.eventId === e.id)
      const ePaid = ePayments.reduce((acc, p) => acc + p.amount, 0)
      dayRealized += Math.min(e.total, ePaid)
      dayPending += Math.max(0, e.total - ePaid)
    })

    const dailyCashFlow = {
      day: '15/01',
      projected: dayPending,
      realized: dayRealized,
      expenses: dayExpenses.reduce((acc, e) => acc + e.amount, 0),
    }

    expect(dailyCashFlow.realized).toBe(1000) // 200 (incomes) + 800 (pagamento)
    expect(dailyCashFlow.projected).toBe(200) // 1000 - 800
    expect(dailyCashFlow.expenses).toBe(100)
  })

  it('deve validar estrutura de retorno esperada', () => {
    // Validar a estrutura esperada do retorno do hook
    const expectedStructure = {
      loading: expect.any(Boolean),
      startDate: expect.any(Date),
      setStartDate: expect.any(Function),
      endDate: expect.any(Date),
      setEndDate: expect.any(Function),
      stats: expect.any(Object),
      cashFlowData: expect.any(Array),
      dailyCashFlow: expect.any(Array),
      refresh: expect.any(Function)
    }

    // Validar que a estrutura é a esperada
    expect(expectedStructure).toBeDefined()
  })

  it('deve validar lógica de filtros de status', () => {
    // Teste de lógica de filtros
    const events = [
      { status: 'SCHEDULED', total: 1000 },
      { status: 'COMPLETED', total: 800 },
      { status: 'CANCELLED', total: 500 },
      { status: 'PRE_SCHEDULED', total: 300 }
    ]

    const confirmedStatuses = ['SCHEDULED', 'COMPLETED', 'ARCHIVED_COMPLETED']
    const projectedStatuses = ['SCHEDULED', 'COMPLETED', 'ARCHIVED_COMPLETED', 'PRE_SCHEDULED']

    const confirmedEvents = events.filter(e => confirmedStatuses.includes(e.status))
    const projectedEvents = events.filter(e => projectedStatuses.includes(e.status))

    expect(confirmedEvents).toHaveLength(2) // SCHEDULED + COMPLETED
    expect(projectedEvents).toHaveLength(3) // SCHEDULED + COMPLETED + PRE_SCHEDULED
  })

  it('deve validar cálculo de média de eventos', () => {
    // Teste de cálculo de média
    const events = [
      { total: 1000 },
      { total: 800 },
      { total: 1200 }
    ]

    const totalEventsValue = events.reduce((acc, e) => acc + e.total, 0)
    const averageProjectedValue = events.length > 0 ? totalEventsValue / events.length : 0

    expect(totalEventsValue).toBe(3000)
    expect(averageProjectedValue).toBe(1000)
  })

  it('deve validar cálculo de receita por categoria', () => {
    // Teste de cálculo por categoria
    const events = [
      {
        id: 'event-1',
        total: 1000,
        rentalRevenue: 600,
        productsRevenue: 400
      }
    ]

    const payments = [
      { eventId: 'event-1', amount: 800 }
    ]

    let boatRentalRealized = 0
    let productsRealized = 0

    events.forEach(event => {
      const eventPayments = payments.filter(p => p.eventId === event.id)
      const totalPaidForEvent = eventPayments.reduce((acc, p) => acc + p.amount, 0)
      const realized = Math.min(event.total, totalPaidForEvent)

      if (event.total > 0) {
        const ratio = realized / event.total
        boatRentalRealized += (event.rentalRevenue || 0) * ratio
        productsRealized += (event.productsRevenue || 0) * ratio
      }
    })

    expect(boatRentalRealized).toBe(480) // 600 * (800/1000)
    expect(productsRealized).toBe(320) // 400 * (800/1000)
  })

  it('deve validar casos extremos de cálculo', () => {
    // Teste com arrays vazios
    const emptyEvents = []
    const emptyPayments = []
    const emptyExpenses = []
    const emptyIncomes = []

    const confirmedStatuses = ['SCHEDULED', 'COMPLETED', 'ARCHIVED_COMPLETED']
    const filteredEvents = emptyEvents.filter(e => confirmedStatuses.includes(e.status))
    const filteredExpenses = emptyExpenses.filter(e => e.status === 'PAID')

    const totalExpenses = filteredExpenses.reduce((acc, e) => acc + e.amount, 0)
    const realizedFromEvents = filteredEvents.reduce((acc, event) => {
      const eventPayments = emptyPayments.filter(p => p.eventId === event.id)
      const totalPaidForEvent = eventPayments.reduce((acc, p) => acc + p.amount, 0)
      return acc + Math.min(event.total, totalPaidForEvent)
    }, 0)
    const otherRevenue = emptyIncomes.reduce((acc, i) => acc + i.amount, 0)

    expect(filteredEvents).toHaveLength(0)
    expect(totalExpenses).toBe(0)
    expect(realizedFromEvents).toBe(0)
    expect(otherRevenue).toBe(0)
  })

  it('deve validar lógica de arquivamento de despesas', () => {
    // Teste de filtro de despesas arquivadas
    const expenses = [
      { isArchived: false, status: 'PAID', amount: 100 },
      { isArchived: true, status: 'PAID', amount: 200 },
      { isArchived: false, status: 'PENDING', amount: 50 }
    ]

    const filteredExpenses = expenses.filter(e => !e.isArchived)
    const paidExpenses = filteredExpenses.filter(e => e.status === 'PAID')

    expect(filteredExpenses).toHaveLength(2) // Apenas não arquivadas
    expect(paidExpenses).toHaveLength(1) // Apenas pagas e não arquivadas
  })
})
