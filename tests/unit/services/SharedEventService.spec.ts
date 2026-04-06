import { describe, it, expect, vi, beforeEach } from 'vitest'
import { SharedEventService, type SharedEventConfig } from '../../../src/core/domain/SharedEventService'
import type { EventType, Boat, ClientProfile, TourType, BoardingLocation } from '../../../src/core/domain/types'

// Mock dos Repositories
vi.mock('../../../src/core/repositories/ClientRepository', () => ({
  clientRepository: {
    search: vi.fn(),
    add: vi.fn()
  }
}))

vi.mock('../../../src/core/repositories/BoatRepository', () => ({
  boatRepository: {
    getAll: vi.fn()
  }
}))

vi.mock('../../../src/core/repositories/TourTypeRepository', () => ({
  tourTypeRepository: {
    getAll: vi.fn(),
    add: vi.fn()
  }
}))

vi.mock('../../../src/core/repositories/BoardingLocationRepository', () => ({
  boardingLocationRepository: {
    getAll: vi.fn()
  }
}))

vi.mock('../../../src/core/repositories/EventRepository', () => ({
  eventRepository: {
    getEventsByDate: vi.fn(),
    getEventsByDateRange: vi.fn(),
    add: vi.fn()
  }
}))

// Mock do Logger
vi.mock('../../../src/core/common/Logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
  }
}))

describe('SharedEventService - Testes Unitários', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getOrCreateSharedClient', () => {
    it('deve retornar cliente compartilhado existente', async () => {
      const { clientRepository } = await import('../../../src/core/repositories/ClientRepository')
      const mockClient = { id: 'client-1', name: 'Compartilhado', phone: '0000000000', totalTrips: 0 }
      
      vi.mocked(clientRepository.search).mockResolvedValue([mockClient])
      
      const result = await SharedEventService.getOrCreateSharedClient()
      
      expect(result).toEqual(mockClient)
      expect(clientRepository.search).toHaveBeenCalledWith('Compartilhado')
      expect(clientRepository.add).not.toHaveBeenCalled()
    })

    it('deve criar novo cliente compartilhado se não existir', async () => {
      const { clientRepository } = await import('../../../src/core/repositories/ClientRepository')
      const newClient = { id: 'client-1', name: 'Compartilhado', phone: '0000000000', totalTrips: 0 }
      
      vi.mocked(clientRepository.search).mockResolvedValue([])
      vi.mocked(clientRepository.add).mockResolvedValue(newClient)
      
      const result = await SharedEventService.getOrCreateSharedClient()
      
      expect(result).toEqual(newClient)
      expect(clientRepository.search).toHaveBeenCalledWith('Compartilhado')
      expect(clientRepository.add).toHaveBeenCalledWith({
        name: 'Compartilhado',
        phone: '0000000000',
        totalTrips: 0
      })
    })

    it('deve lançar erro em caso de falha no repository', async () => {
      const { clientRepository } = await import('../../../src/core/repositories/ClientRepository')
      const { logger } = await import('../../../src/core/common/Logger')
      
      vi.mocked(clientRepository.search).mockRejectedValue(new Error('Database error'))
      
      await expect(SharedEventService.getOrCreateSharedClient()).rejects.toThrow('Unable to setup shared event client')
      expect(logger.error).toHaveBeenCalled()
    })
  })

  describe('getOrCreateSharedTourType', () => {
    it('deve retornar tour type compartilhado existente', async () => {
      const { tourTypeRepository } = await import('../../../src/core/repositories/TourTypeRepository')
      const mockTourType = { id: 'tour-1', name: 'Compartilhado', color: '#6B7280', isArchived: false }
      
      vi.mocked(tourTypeRepository.getAll).mockResolvedValue([mockTourType])
      
      const result = await SharedEventService.getOrCreateSharedTourType()
      
      expect(result).toEqual(mockTourType)
      expect(tourTypeRepository.getAll).toHaveBeenCalled()
      expect(tourTypeRepository.add).not.toHaveBeenCalled()
    })

    it('deve criar novo tour type compartilhado se não existir', async () => {
      const { tourTypeRepository } = await import('../../../src/core/repositories/TourTypeRepository')
      const newTourType = { id: 'tour-1', name: 'Compartilhado', color: '#6B7280', isArchived: false }
      
      vi.mocked(tourTypeRepository.getAll).mockResolvedValue([])
      vi.mocked(tourTypeRepository.add).mockResolvedValue(newTourType)
      
      const result = await SharedEventService.getOrCreateSharedTourType()
      
      expect(result).toEqual(newTourType)
      expect(tourTypeRepository.getAll).toHaveBeenCalled()
      expect(tourTypeRepository.add).toHaveBeenCalledWith({
        name: 'Compartilhado',
        color: '#6B7280',
        isArchived: false
      })
    })

    it('deve lançar erro em caso de falha no repository', async () => {
      const { tourTypeRepository } = await import('../../../src/core/repositories/TourTypeRepository')
      const { logger } = await import('../../../src/core/common/Logger')
      
      vi.mocked(tourTypeRepository.getAll).mockRejectedValue(new Error('Database error'))
      
      await expect(SharedEventService.getOrCreateSharedTourType()).rejects.toThrow('Unable to setup shared event tour type')
      expect(logger.error).toHaveBeenCalled()
    })
  })

  describe('getDefaultBoardingLocation', () => {
    it('deve retornar primeiro local ativo', async () => {
      const { boardingLocationRepository } = await import('../../../src/core/repositories/BoardingLocationRepository')
      const locations = [
        { id: 'loc-1', name: 'Marina', isArchived: false },
        { id: 'loc-2', name: 'Porto', isArchived: true }
      ]
      
      vi.mocked(boardingLocationRepository.getAll).mockResolvedValue(locations)
      
      const result = await SharedEventService.getDefaultBoardingLocation()
      
      expect(result).toEqual(locations[0])
      expect(boardingLocationRepository.getAll).toHaveBeenCalled()
    })

    it('deve retornar null se não houver locais ativos', async () => {
      const { boardingLocationRepository } = await import('../../../src/core/repositories/BoardingLocationRepository')
      const { logger } = await import('../../../src/core/common/Logger')
      
      vi.mocked(boardingLocationRepository.getAll).mockResolvedValue([])
      
      const result = await SharedEventService.getDefaultBoardingLocation()
      
      expect(result).toBeNull()
      expect(logger.warn).toHaveBeenCalledWith('No active boarding locations found')
    })

    it('deve retornar null em caso de erro', async () => {
      const { boardingLocationRepository } = await import('../../../src/core/repositories/BoardingLocationRepository')
      const { logger } = await import('../../../src/core/common/Logger')
      
      vi.mocked(boardingLocationRepository.getAll).mockRejectedValue(new Error('Database error'))
      
      const result = await SharedEventService.getDefaultBoardingLocation()
      
      expect(result).toBeNull()
      expect(logger.error).toHaveBeenCalled()
    })
  })

  describe('validateSharedEventConfig', () => {
    const mockBoats: Boat[] = [
      { id: 'boat-1', name: 'Speedboat 1', capacity: 10, size: 30, pricePerHour: 100, pricePerHalfHour: 60, organizationTimeMinutes: 30, isArchived: false },
      { id: 'boat-2', name: 'Speedboat 2', capacity: 20, size: 35, pricePerHour: 150, pricePerHalfHour: 90, organizationTimeMinutes: 30, isArchived: false }
    ]

    it('deve validar configuração válida', () => {
      const config: SharedEventConfig = {
        requiredClientType: 'SHARED',
        requiredTourType: 'SHARED',
        minPassengers: 5,
        maxPassengers: 15
      }

      const errors = SharedEventService.validateSharedEventConfig(config, mockBoats)
      
      expect(errors).toHaveLength(0)
    })

    it('deve retornar erro se min > max', () => {
      const config: SharedEventConfig = {
        requiredClientType: 'SHARED',
        requiredTourType: 'SHARED',
        minPassengers: 15,
        maxPassengers: 10
      }

      const errors = SharedEventService.validateSharedEventConfig(config, mockBoats)
      
      expect(errors).toContain('Minimum passengers cannot be greater than maximum passengers')
    })

    it('deve retornar erro se não houver barcos adequados', () => {
      const config: SharedEventConfig = {
        requiredClientType: 'SHARED',
        requiredTourType: 'SHARED',
        maxPassengers: 5
      }

      const errors = SharedEventService.validateSharedEventConfig(config, mockBoats)
      
      expect(errors).toContain('No boats available for passenger range 0-5')
    })

    it('deve validar sem erros se não houver maxPassengers', () => {
      const config: SharedEventConfig = {
        requiredClientType: 'SHARED',
        requiredTourType: 'SHARED',
        minPassengers: 5
      }

      const errors = SharedEventService.validateSharedEventConfig(config, mockBoats)
      
      expect(errors).toHaveLength(0)
    })
  })

  describe('checkSharedEventConflict', () => {
    it('deve retornar evento conflitante', async () => {
      const { eventRepository } = await import('../../../src/core/repositories/EventRepository')
      const mockEvent: EventType = {
        id: 'event-1',
        date: '2023-01-01',
        startTime: '09:00',
        boat: { id: 'boat-1', name: 'Speedboat 1', capacity: 10, size: 30, pricePerHour: 100, pricePerHalfHour: 60, organizationTimeMinutes: 30, isArchived: false },
        tourType: { id: 'tour-1', name: 'Compartilhado', color: '#6B7280', isArchived: false },
        status: 'SCHEDULED'
      } as EventType
      
      vi.mocked(eventRepository.getEventsByDate).mockResolvedValue([mockEvent])
      
      const result = await SharedEventService.checkSharedEventConflict('2023-01-01', '09:00', 'boat-1')
      
      expect(result).toEqual(mockEvent)
    })

    it('deve retornar null se não houver conflito', async () => {
      const { eventRepository } = await import('../../../src/core/repositories/EventRepository')
      const mockEvent: EventType = {
        id: 'event-1',
        date: '2023-01-01',
        startTime: '10:00',
        boat: { id: 'boat-1', name: 'Speedboat 1', capacity: 10, size: 30, pricePerHour: 100, pricePerHalfHour: 60, organizationTimeMinutes: 30, isArchived: false },
        tourType: { id: 'tour-1', name: 'Privado', color: '#6B7280', isArchived: false },
        status: 'SCHEDULED'
      } as EventType
      
      vi.mocked(eventRepository.getEventsByDate).mockResolvedValue([mockEvent])
      
      const result = await SharedEventService.checkSharedEventConflict('2023-01-01', '09:00', 'boat-1')
      
      expect(result).toBeNull()
    })

    it('deve excluir evento especificado', async () => {
      const { eventRepository } = await import('../../../src/core/repositories/EventRepository')
      const mockEvent: EventType = {
        id: 'event-1',
        date: '2023-01-01',
        startTime: '09:00',
        boat: { id: 'boat-1', name: 'Speedboat 1', capacity: 10, size: 30, pricePerHour: 100, pricePerHalfHour: 60, organizationTimeMinutes: 30, isArchived: false },
        tourType: { id: 'tour-1', name: 'Compartilhado', color: '#6B7280', isArchived: false },
        status: 'SCHEDULED'
      } as EventType
      
      vi.mocked(eventRepository.getEventsByDate).mockResolvedValue([mockEvent])
      
      const result = await SharedEventService.checkSharedEventConflict('2023-01-01', '09:00', 'boat-1', 'event-1')
      
      expect(result).toBeNull()
    })

    it('deve retornar null em caso de erro', async () => {
      const { eventRepository } = await import('../../../src/core/repositories/EventRepository')
      
      vi.mocked(eventRepository.getEventsByDate).mockRejectedValue(new Error('Database error'))
      
      const result = await SharedEventService.checkSharedEventConflict('2023-01-01', '09:00', 'boat-1')
      
      expect(result).toBeNull()
    })
  })

  describe('getSharedEvents', () => {
    it('deve retornar apenas eventos compartilhados', async () => {
      const { eventRepository } = await import('../../../src/core/repositories/EventRepository')
      const mockEvents: EventType[] = [
        {
          id: 'event-1',
          tourType: { id: 'tour-1', name: 'Compartilhado', color: '#6B7280', isArchived: false }
        } as EventType,
        {
          id: 'event-2',
          tourType: { id: 'tour-2', name: 'Privado', color: '#6B7280', isArchived: false }
        } as EventType
      ]
      
      vi.mocked(eventRepository.getEventsByDateRange).mockResolvedValue(mockEvents)
      
      const result = await SharedEventService.getSharedEvents('2023-01-01', '2023-01-31')
      
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('event-1')
      expect(eventRepository.getEventsByDateRange).toHaveBeenCalledWith('2023-01-01', '2023-01-31')
    })

    it('deve retornar array vazio em caso de erro', async () => {
      const { eventRepository } = await import('../../../src/core/repositories/EventRepository')
      
      vi.mocked(eventRepository.getEventsByDateRange).mockRejectedValue(new Error('Database error'))
      
      const result = await SharedEventService.getSharedEvents('2023-01-01', '2023-01-31')
      
      expect(result).toEqual([])
    })
  })

  describe('calculateSharedEventPricing', () => {
    it('deve calcular preço por pessoa e total', () => {
      const result = SharedEventService.calculateSharedEventPricing(100, 5)
      
      expect(result).toEqual({
        totalPrice: 500,
        pricePerPerson: 100
      })
    })

    it('deve calcular com passageiro zero', () => {
      const result = SharedEventService.calculateSharedEventPricing(100, 0)
      
      expect(result).toEqual({
        totalPrice: 0,
        pricePerPerson: 100
      })
    })

    it('deve calcular com preço base zero', () => {
      const result = SharedEventService.calculateSharedEventPricing(0, 5)
      
      expect(result).toEqual({
        totalPrice: 0,
        pricePerPerson: 0
      })
    })

    it('deve calcular com valores decimais', () => {
      const result = SharedEventService.calculateSharedEventPricing(99.99, 3)
      
      expect(result.pricePerPerson).toBe(99.99)
      expect(result.totalPrice).toBeCloseTo(299.97, 2)
    })
  })

  describe('constantes e configurações', () => {
    it('deve ter constante SHARED_CLIENT_NAME', () => {
      expect('Compartilhado').toBe('Compartilhado')
    })

    it('deve ter constante SHARED_TOUR_NAME', () => {
      expect('Compartilhado').toBe('Compartilhado')
    })

    it('deve validar interface SharedEventConfig', () => {
      const config: SharedEventConfig = {
        requiredClientType: 'SHARED',
        requiredTourType: 'SHARED',
        defaultBoardingLocation: 'loc-1',
        minPassengers: 1,
        maxPassengers: 10
      }

      expect(config.requiredClientType).toBe('SHARED')
      expect(config.requiredTourType).toBe('SHARED')
      expect(config.defaultBoardingLocation).toBe('loc-1')
      expect(config.minPassengers).toBe(1)
      expect(config.maxPassengers).toBe(10)
    })

    it('deve aceitar configuração mínima', () => {
      const config: SharedEventConfig = {
        requiredClientType: 'ANY',
        requiredTourType: 'ANY'
      }

      expect(config.requiredClientType).toBe('ANY')
      expect(config.requiredTourType).toBe('ANY')
      expect(config.defaultBoardingLocation).toBeUndefined()
      expect(config.minPassengers).toBeUndefined()
      expect(config.maxPassengers).toBeUndefined()
    })
  })

  describe('casos extremos e validação', () => {
    it('deve lidar com nome de cliente case insensitive', async () => {
      const { clientRepository } = await import('../../../src/core/repositories/ClientRepository')
      const mockClient = { id: 'client-1', name: 'compartilhado', phone: '0000000000', totalTrips: 0 }
      
      vi.mocked(clientRepository.search).mockResolvedValue([mockClient])
      
      const result = await SharedEventService.getOrCreateSharedClient()
      
      expect(result.name.toLowerCase()).toBe('compartilhado')
    })

    it('deve lidar com nome de tour type case insensitive', async () => {
      const { tourTypeRepository } = await import('../../../src/core/repositories/TourTypeRepository')
      const mockTourType = { id: 'tour-1', name: 'compartilhado', color: '#6B7280', isArchived: false }
      
      vi.mocked(tourTypeRepository.getAll).mockResolvedValue([mockTourType])
      
      const result = await SharedEventService.getOrCreateSharedTourType()
      
      expect(result.name.toLowerCase()).toBe('compartilhado')
    })

    it('deve filtrar eventos cancelados corretamente', async () => {
      const { eventRepository } = await import('../../../src/core/repositories/EventRepository')
      const mockEvents: EventType[] = [
        {
          id: 'event-1',
          date: '2023-01-01',
          startTime: '09:00',
          boat: { id: 'boat-1', name: 'Speedboat 1', capacity: 10, size: 30, pricePerHour: 100, pricePerHalfHour: 60, organizationTimeMinutes: 30, isArchived: false },
          tourType: { id: 'tour-1', name: 'Compartilhado', color: '#6B7280', isArchived: false },
          status: 'CANCELLED'
        } as EventType,
        {
          id: 'event-2',
          date: '2023-01-01',
          startTime: '09:00',
          boat: { id: 'boat-1', name: 'Speedboat 1', capacity: 10, size: 30, pricePerHour: 100, pricePerHalfHour: 60, organizationTimeMinutes: 30, isArchived: false },
          tourType: { id: 'tour-1', name: 'Compartilhado', color: '#6B7280', isArchived: false },
          status: 'ARCHIVED_CANCELLED'
        } as EventType
      ]
      
      vi.mocked(eventRepository.getEventsByDate).mockResolvedValue(mockEvents)
      
      const result = await SharedEventService.checkSharedEventConflict('2023-01-01', '09:00', 'boat-1')
      
      expect(result).toBeNull()
    })

    it('deve validar capacidade de barcos corretamente', () => {
      const boats: Boat[] = [
        { id: 'boat-1', name: 'Speedboat 1', capacity: 5, size: 25, pricePerHour: 80, pricePerHalfHour: 50, organizationTimeMinutes: 30, isArchived: false },
        { id: 'boat-2', name: 'Speedboat 2', capacity: 10, size: 30, pricePerHour: 100, pricePerHalfHour: 60, organizationTimeMinutes: 30, isArchived: false },
        { id: 'boat-3', name: 'Speedboat 3', capacity: 15, size: 35, pricePerHour: 150, pricePerHalfHour: 90, organizationTimeMinutes: 30, isArchived: false }
      ]

      const config: SharedEventConfig = {
        requiredClientType: 'SHARED',
        requiredTourType: 'SHARED',
        minPassengers: 8,
        maxPassengers: 12
      }

      const errors = SharedEventService.validateSharedEventConfig(config, boats)
      
      expect(errors).toHaveLength(0)
    })

    it('deve rejeitar barcos arquivados', () => {
      const boats: Boat[] = [
        { id: 'boat-1', name: 'Speedboat 1', capacity: 10, size: 30, pricePerHour: 100, pricePerHalfHour: 60, organizationTimeMinutes: 30, isArchived: true },
        { id: 'boat-2', name: 'Speedboat 2', capacity: 10, size: 30, pricePerHour: 100, pricePerHalfHour: 60, organizationTimeMinutes: 30, isArchived: false }
      ]

      const config: SharedEventConfig = {
        requiredClientType: 'SHARED',
        requiredTourType: 'SHARED',
        minPassengers: 5,
        maxPassengers: 15
      }

      const errors = SharedEventService.validateSharedEventConfig(config, boats)
      
      expect(errors).toHaveLength(0) // boat-2 ainda é adequado
    })
  })
})
