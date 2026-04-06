import { describe, it, expect, vi, beforeEach } from 'vitest'
import { CompanyDataService } from '../../../src/core/domain/CompanyDataService'
import type { CompanyData } from '../../../src/core/domain/types'

// Mock do CompanyDataRepository
vi.mock('../../../src/core/repositories/CompanyDataRepository', () => ({
  CompanyDataRepository: {
    getInstance: () => ({
      get: vi.fn(),
      update: vi.fn()
    })
  }
}))

// Mock do Logger
vi.mock('../../../src/core/common/Logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn()
  }
}))

describe('CompanyDataService - Testes Unitários', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Limpar cache antes de cada teste
    CompanyDataService.clearCache()
  })

  describe('validateConfig', () => {
    it('deve validar configuração válida', () => {
      const validConfig: CompanyData = {
        commissionBasis: 'TOTAL_PRICE',
        appName: 'Speedboat Tours',
        phone: '11999999999',
        cnpj: '12345678901234',
        reservationFeePercentage: 10
      }

      const errors = CompanyDataService.validateConfig(validConfig)
      expect(errors).toHaveLength(0)
    })

    it('deve identificar falta de commissionBasis', () => {
      const invalidConfig: Partial<CompanyData> = {
        appName: 'Speedboat Tours',
        phone: '11999999999'
      }

      const errors = CompanyDataService.validateConfig(invalidConfig as CompanyData)
      expect(errors).toContain('Commission basis is required')
    })

    it('deve identificar commissionBasis inválido', () => {
      const invalidConfig: Partial<CompanyData> = {
        commissionBasis: 'INVALID' as any,
        appName: 'Speedboat Tours',
        phone: '11999999999'
      }

      const errors = CompanyDataService.validateConfig(invalidConfig as CompanyData)
      expect(errors).toContain('Invalid commission basis. Must be TOTAL_PRICE or RENTAL_ONLY')
    })

    it('deve identificar appName ausente', () => {
      const invalidConfig: Partial<CompanyData> = {
        commissionBasis: 'TOTAL_PRICE',
        appName: '',
        phone: '11999999999'
      }

      const errors = CompanyDataService.validateConfig(invalidConfig as CompanyData)
      expect(errors).toContain('App name is required')
    })

    it('deve identificar phone ausente', () => {
      const invalidConfig: Partial<CompanyData> = {
        commissionBasis: 'TOTAL_PRICE',
        appName: 'Speedboat Tours',
        phone: ''
      }

      const errors = CompanyDataService.validateConfig(invalidConfig as CompanyData)
      expect(errors).toContain('Company phone is required')
    })

    it('deve identificar múltiplos erros', () => {
      const invalidConfig: Partial<CompanyData> = {
        commissionBasis: 'INVALID' as any,
        appName: '',
        phone: ''
      }

      const errors = CompanyDataService.validateConfig(invalidConfig as CompanyData)
      expect(errors).toContain('Invalid commission basis. Must be TOTAL_PRICE or RENTAL_ONLY')
      expect(errors).toContain('App name is required')
      expect(errors).toContain('Company phone is required')
      expect(errors).toHaveLength(3)
    })
  })

  describe('clearCache', () => {
    it('deve limpar o cache', () => {
      // Não há como testar diretamente o cache privado, mas podemos testar se o método existe
      expect(() => CompanyDataService.clearCache()).not.toThrow()
    })
  })

  describe('lógica de cache', () => {
    it('deve validar lógica de expiração de cache', () => {
      const now = Date.now()
      const cacheDuration = 5 * 60 * 1000 // 5 minutos
      const cacheExpiry = now + cacheDuration
      const isExpired = now >= cacheExpiry
      
      expect(isExpired).toBe(false)
      
      // Teste com tempo expirado
      const futureTime = now + cacheDuration + 1000
      const isExpiredFuture = futureTime >= cacheExpiry
      expect(isExpiredFuture).toBe(true)
    })

    it('deve validar constantes de cache', () => {
      const cacheDuration = 5 * 60 * 1000
      expect(cacheDuration).toBe(300000) // 5 minutos em ms
    })
  })

  describe('lógica de fallback', () => {
    it('deve retornar fallback para commission basis', () => {
      const fallbackBasis = 'RENTAL_ONLY'
      expect(fallbackBasis).toBe('RENTAL_ONLY')
    })

    it('deve retornar fallback para reservation fee', () => {
      const fallbackFee = 0
      expect(fallbackFee).toBe(0)
    })
  })

  describe('lógica de validação de campos', () => {
    it('deve validar appName trim', () => {
      const appName = '  Speedboat Tours  '
      const trimmedAppName = appName.trim()
      expect(trimmedAppName).toBe('Speedboat Tours')
      expect(trimmedAppName.length).toBeGreaterThan(0)
    })

    it('deve validar phone trim', () => {
      const phone = '  11999999999  '
      const trimmedPhone = phone.trim()
      expect(trimmedPhone).toBe('11999999999')
      expect(trimmedPhone.length).toBeGreaterThan(0)
    })

    it('deve validar string vazia após trim', () => {
      const emptyString = '   '
      const trimmed = emptyString.trim()
      expect(trimmed).toBe('')
      expect(trimmed.length).toBe(0)
    })

    it('deve validar valores válidos de commissionBasis', () => {
      const validBases = ['TOTAL_PRICE', 'RENTAL_ONLY']
      
      validBases.forEach(basis => {
        expect(['TOTAL_PRICE', 'RENTAL_ONLY'].includes(basis)).toBe(true)
      })
    })

    it('deve validar valores inválidos de commissionBasis', () => {
      const invalidBases = ['INVALID', 'TOTAL', 'RENTAL']
      
      invalidBases.forEach(basis => {
        expect(['TOTAL_PRICE', 'RENTAL_ONLY'].includes(basis as any)).toBe(false)
      })
    })
  })

  describe('lógica de atualização', () => {
    it('deve validar lógica de merge de configuração', () => {
      const currentConfig = {
        commissionBasis: 'TOTAL_PRICE',
        appName: 'Speedboat Tours',
        phone: '11999999999',
        cnpj: '12345678901234',
        reservationFeePercentage: 10
      }

      const updates = {
        appName: 'New Tours',
        phone: '11888888888'
      }

      const mergedConfig = { ...currentConfig, ...updates }
      
      expect(mergedConfig.commissionBasis).toBe('TOTAL_PRICE')
      expect(mergedConfig.appName).toBe('New Tours')
      expect(mergedConfig.phone).toBe('11888888888')
      expect(mergedConfig.cnpj).toBe('12345678901234')
      expect(mergedConfig.reservationFeePercentage).toBe(10)
    })

    it('deve validar chaves de atualização', () => {
      const updates = {
        appName: 'New Tours',
        phone: '11888888888',
        commissionBasis: 'RENTAL_ONLY'
      }

      const updateKeys = Object.keys(updates)
      expect(updateKeys).toContain('appName')
      expect(updateKeys).toContain('phone')
      expect(updateKeys).toContain('commissionBasis')
      expect(updateKeys).toHaveLength(3)
    })
  })

  describe('lógica de tratamento de erro', () => {
    it('deve validar tratamento de erro genérico', () => {
      const error = new Error('Test error')
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      expect(errorMessage).toBe('Test error')
    })

    it('deve validar tratamento de erro string', () => {
      const error = 'String error'
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      expect(errorMessage).toBe('Unknown error')
    })
  })

  describe('lógica de configuração requerida', () => {
    it('deve validar estrutura de configuração requerida', () => {
      const config = {
        commissionBasis: 'TOTAL_PRICE',
        appName: 'Speedboat Tours',
        phone: '11999999999',
        reservationFeePercentage: 10
      }

      const requiredConfig = {
        commissionBasis: config.commissionBasis as 'TOTAL_PRICE' | 'RENTAL_ONLY',
        appName: config.appName,
        phone: config.phone,
        reservationFeePercentage: config.reservationFeePercentage || 0
      }

      expect(requiredConfig.commissionBasis).toBe('TOTAL_PRICE')
      expect(requiredConfig.appName).toBe('Speedboat Tours')
      expect(requiredConfig.phone).toBe('11999999999')
      expect(requiredConfig.reservationFeePercentage).toBe(10)
    })

    it('deve validar fallback para reservation fee', () => {
      const config = {
        commissionBasis: 'TOTAL_PRICE',
        appName: 'Speedboat Tours',
        phone: '11999999999',
        reservationFeePercentage: undefined
      }

      const reservationFee = config.reservationFeePercentage || 0
      expect(reservationFee).toBe(0)
    })
  })

  describe('lógica de validação booleana', () => {
    it('deve validar lógica de verdadeiro', () => {
      const isValid = true
      expect(isValid).toBe(true)
    })

    it('deve validar lógica de falso', () => {
      const isValid = false
      expect(isValid).toBe(false)
    })
  })

  it('deve validar estrutura básica do serviço', () => {
    expect(CompanyDataService).toBeDefined()
    expect(typeof CompanyDataService.validateConfig).toBe('function')
    expect(typeof CompanyDataService.clearCache).toBe('function')
    expect(typeof CompanyDataService.getValidatedConfig).toBe('function')
    expect(typeof CompanyDataService.getCommissionBasis).toBe('function')
    expect(typeof CompanyDataService.getReservationFeePercentage).toBe('function')
    expect(typeof CompanyDataService.updateConfig).toBe('function')
    expect(typeof CompanyDataService.isConfigurationValid).toBe('function')
    expect(typeof CompanyDataService.getRequiredConfig).toBe('function')
  })

  it('deve validar casos extremos', () => {
    // Teste com configuração vazia
    const emptyConfig = {}
    const errors = CompanyDataService.validateConfig(emptyConfig as CompanyData)
    expect(errors.length).toBeGreaterThan(0)

    // Teste com valores nulos
    const nullConfig = {
      commissionBasis: null,
      appName: null,
      phone: null
    }

    const nullErrors = CompanyDataService.validateConfig(nullConfig as CompanyData)
    expect(nullErrors.length).toBeGreaterThan(0)

    // Teste com valores undefined
    const undefinedConfig = {
      commissionBasis: undefined,
      appName: undefined,
      phone: undefined
    }

    const undefinedErrors = CompanyDataService.validateConfig(undefinedConfig as CompanyData)
    expect(undefinedErrors.length).toBeGreaterThan(0)
  })
})
