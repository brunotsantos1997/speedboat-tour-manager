import { describe, it, expect, vi, beforeEach } from 'vitest'
import { CommissionService } from '../../../src/core/domain/CommissionService'

// Mock do CompanyDataRepository
vi.mock('../../../src/core/repositories/CompanyDataRepository', () => ({
  CompanyDataRepository: {
    getInstance: () => ({
      get: vi.fn().mockResolvedValue({
        commissionBasis: 'TOTAL_PRICE'
      })
    })
  }
}))

// Mock do Logger
vi.mock('../../../src/core/common/Logger', () => ({
  logger: {
    debug: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn()
  }
}))

describe('CommissionService - Testes Unitários', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('deve importar a classe corretamente', () => {
    expect(CommissionService).toBeDefined()
    expect(typeof CommissionService.calculateCommission).toBe('function')
    expect(typeof CommissionService.isCommissionPaid).toBe('function')
    expect(typeof CommissionService.createCommissionExpense).toBe('function')
    expect(typeof CommissionService.validateCommissionSettings).toBe('function')
  })

  it('deve validar configurações de comissão corretamente', () => {
    const validSettings = {
      rentalEnabled: true,
      rentalBase: 'NET' as const,
      rentalPercentage: 10,
      deductRentalCost: true,
      productEnabled: true,
      productBase: 'NET' as const,
      productPercentage: 15,
      deductProductCost: true,
      taxEnabled: true,
      taxPercentage: 5,
      deductTaxCost: false
    }

    const errors = CommissionService.validateCommissionSettings(validSettings)
    expect(errors).toHaveLength(0)
  })

  it('deve identificar percentuais negativos', () => {
    const invalidSettings = {
      rentalEnabled: true,
      rentalBase: 'NET' as const,
      rentalPercentage: -5, // Inválido
      deductRentalCost: true,
      productEnabled: true,
      productBase: 'NET' as const,
      productPercentage: 15,
      deductProductCost: true,
      taxEnabled: true,
      taxPercentage: 5,
      deductTaxCost: false
    }

    const errors = CommissionService.validateCommissionSettings(invalidSettings)
    expect(errors).toContain('Rental commission percentage cannot be negative')
  })

  it('deve identificar percentuais acima de 100%', () => {
    const invalidSettings = {
      rentalEnabled: true,
      rentalBase: 'NET' as const,
      rentalPercentage: 150, // Inválido
      deductRentalCost: true,
      productEnabled: true,
      productBase: 'NET' as const,
      productPercentage: 15,
      deductProductCost: true,
      taxEnabled: true,
      taxPercentage: 5,
      deductTaxCost: false
    }

    const errors = CommissionService.validateCommissionSettings(invalidSettings)
    expect(errors).toContain('Commission percentages cannot exceed 100%')
  })

  it('deve identificar múltiplos erros', () => {
    const invalidSettings = {
      rentalEnabled: true,
      rentalBase: 'NET' as const,
      rentalPercentage: -10, // Inválido
      deductRentalCost: true,
      productEnabled: true,
      productBase: 'NET' as const,
      productPercentage: 150, // Inválido
      deductProductCost: true,
      taxEnabled: true,
      taxPercentage: -5, // Inválido
      deductTaxCost: false
    }

    const errors = CommissionService.validateCommissionSettings(invalidSettings)
    expect(errors.length).toBeGreaterThan(2)
    expect(errors).toContain('Rental commission percentage cannot be negative')
    expect(errors).toContain('Commission percentages cannot exceed 100%')
    expect(errors).toContain('Tax commission percentage cannot be negative')
  })

  it('deve identificar comissão paga corretamente', () => {
    const expenses = [
      {
        id: 'expense-1',
        eventId: 'event-1',
        categoryId: 'COMMISSION',
        amount: 100,
        isArchived: false,
        date: '2024-04-06',
        description: 'Comissão',
        status: 'PAID' as const,
        paymentMethod: 'OTHER',
        timestamp: Date.now()
      },
      {
        id: 'expense-2',
        eventId: 'event-2',
        categoryId: 'OTHER',
        amount: 50,
        isArchived: false,
        date: '2024-04-06',
        description: 'Outro',
        status: 'PENDING' as const,
        paymentMethod: 'OTHER',
        timestamp: Date.now()
      }
    ]

    expect(CommissionService.isCommissionPaid('event-1', expenses)).toBe(true)
    expect(CommissionService.isCommissionPaid('event-2', expenses)).toBe(false)
    expect(CommissionService.isCommissionPaid('event-3', expenses)).toBe(false)
  })

  it('deve ignorar despesas arquivadas', () => {
    const expenses = [
      {
        id: 'expense-1',
        eventId: 'event-1',
        categoryId: 'COMMISSION',
        amount: 100,
        isArchived: true, // Arquivada
        date: '2024-04-06',
        description: 'Comissão',
        status: 'PAID' as const,
        paymentMethod: 'OTHER',
        timestamp: Date.now()
      }
    ]

    expect(CommissionService.isCommissionPaid('event-1', expenses)).toBe(false)
  })

  it('deve criar despesa de comissão corretamente', () => {
    const mockCommission = {
      commissionValue: 150,
      rentalBaseValue: 1000,
      productBaseValue: 200,
      taxBaseValue: 50,
      breakdown: {
        rental: 100,
        product: 30,
        tax: 20
      }
    }

    const expense = CommissionService.createCommissionExpense('event-1', mockCommission, 'Guia Teste')

    expect(expense.eventId).toBe('event-1')
    expect(expense.amount).toBe(150)
    expect(expense.categoryId).toBe('COMMISSION')
    expect(expense.description).toBe('Comissão: Guia Teste - Evento event-1')
    expect(expense.status).toBe('PENDING')
    expect(expense.paymentMethod).toBe('OTHER')
    expect(expense.isArchived).toBe(false)
    expect(expense.date).toMatch(/^\d{4}-\d{2}-\d{2}$/) // Formato YYYY-MM-DD
  })

  it('deve calcular comissão estruturada básica', async () => {
    const mockEvent = {
      id: 'event-1',
      rentalRevenue: 1000,
      rentalGross: 1200,
      rentalCost: 200,
      productsRevenue: 300,
      productsGross: 350,
      productsCost: 50,
      tax: 100
    }

    const mockUser = {
      id: 'user-1',
      name: 'Guia Teste',
      email: 'guia@example.com',
      role: 'ADMIN' as const,
      commissionSettings: {
        rentalEnabled: true,
        rentalBase: 'NET' as const,
        rentalPercentage: 10,
        deductRentalCost: true,
        productEnabled: true,
        productBase: 'NET' as const,
        productPercentage: 15,
        deductProductCost: true,
        taxEnabled: true,
        taxPercentage: 5,
        deductTaxCost: false
      }
    }

    const result = await CommissionService.calculateCommission(mockEvent as any, mockUser as any)

    expect(result.commissionValue).toBeGreaterThan(0)
    expect(result.breakdown.rental).toBe((1000 - 200) * 0.10) // 800 * 10% = 80
    expect(result.breakdown.product).toBe((300 - 50) * 0.15) // 250 * 15% = 37.5
    expect(result.breakdown.tax).toBe(100 * 0.05) // 100 * 5% = 5
    expect(result.commissionValue).toBe(80 + 37.5 + 5) // 122.5
  })
})
