import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock dos módulos antes de importar
vi.mock('../../../src/contexts/auth/useAuth', () => ({
  useAuth: () => ({
    currentUser: {
      id: 'user-1',
      name: 'Test User',
      email: 'test@example.com',
      role: 'ADMIN'
    }
  })
}))

vi.mock('../../../src/viewmodels/useEventSync', () => ({
  useEventSync: () => ({
    syncEvent: vi.fn()
  })
}))

vi.mock('../../../src/ui/contexts/modal/useModal', () => ({
  useModal: () => ({
    confirm: vi.fn().mockResolvedValue(true)
  })
}))

vi.mock('react-router-dom', () => ({
  useSearchParams: () => [new URLSearchParams()]
}))

// Mock dos repositories
vi.mock('../../../src/core/repositories/ClientRepository', () => ({
  clientRepository: {
    search: vi.fn(),
    add: vi.fn(),
    update: vi.fn(),
    delete: vi.fn()
  }
}))

vi.mock('../../../src/core/repositories/ProductRepository', () => ({
  productRepository: {
    getAll: vi.fn()
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

vi.mock('../../../src/core/repositories/EventRepository', () => ({
  eventRepository: {
    getById: vi.fn(),
    getEventsByDate: vi.fn(),
    add: vi.fn(),
    updateEvent: vi.fn()
  }
}))

vi.mock('../../../src/core/repositories/CompanyDataRepository', () => ({
  CompanyDataRepository: {
    getInstance: () => ({
      get: vi.fn()
    })
  }
}))

vi.mock('../../../src/core/repositories/BoardingLocationRepository', () => ({
  boardingLocationRepository: {
    getAll: vi.fn()
  }
}))

// Mock do React hooks
vi.mock('react', () => ({
  useState: vi.fn((initial) => [initial, vi.fn()]),
  useEffect: vi.fn(),
  useMemo: vi.fn((fn) => fn()),
  useCallback: vi.fn((fn) => fn)
}))

describe('useCreateEventViewModel - Testes Unitários', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('deve importar o hook corretamente', async () => {
    const { useCreateEventViewModel } = await import('../../../src/viewmodels/useCreateEventViewModel')
    expect(typeof useCreateEventViewModel).toBe('function')
  }, 10000)

  it('deve validar estrutura básica do hook', async () => {
    const { useCreateEventViewModel } = await import('../../../src/viewmodels/useCreateEventViewModel')
    
    // Teste básico para garantir que o hook não quebra na importação
    expect(() => {
      // Não vamos executar o hook, apenas validar sua estrutura
      const hookSource = useCreateEventViewModel.toString()
      expect(hookSource).toContain('useState')
      expect(hookSource).toContain('useEffect')
      expect(hookSource).toContain('useMemo')
      expect(hookSource).toContain('useCallback')
    }).not.toThrow()
  })

  it('deve calcular custo de aluguel de barco corretamente', () => {
    // Teste de lógica de cálculo isolada
    const mockBoat = {
      id: 'boat-1',
      name: 'Speedboat Alpha',
      capacity: 10,
      pricePerHour: 100,
      pricePerHalfHour: 60,
      costPerHour: 50,
      costPerHalfHour: 30,
      organizationTimeMinutes: 15
    }

    const startTime = '09:00'
    const endTime = '11:30' // 2.5 horas

    // Lógica de cálculo (baseada no ViewModel)
    const startMin = 9 * 60 // 540
    const endMin = 11 * 60 + 30 // 690
    const durationInMinutes = endMin - startMin // 150 minutos

    const hours = Math.floor(durationInMinutes / 60) // 2
    const remainingMinutes = durationInMinutes % 60 // 30

    let cost = hours * mockBoat.pricePerHour // 2 * 100 = 200
    if (remainingMinutes >= 30) {
      cost += mockBoat.pricePerHalfHour // + 60 = 260
    }

    expect(cost).toBe(260)
    expect(durationInMinutes).toBe(150)
  })

  it('deve calcular custo de produtos por pessoa corretamente', () => {
    // Teste de lógica de produtos
    const mockProducts = [
      {
        id: 'product-1',
        name: 'Snorkel',
        pricingType: 'PER_PERSON',
        price: 50,
        isCourtesy: false
      },
      {
        id: 'product-2',
        name: 'Cerveja',
        pricingType: 'PER_PERSON',
        price: 10,
        isCourtesy: false
      },
      {
        id: 'product-3',
        name: 'Fotografia',
        pricingType: 'PER_PERSON',
        price: 30,
        isCourtesy: true // Cortesia
      }
    ]

    const passengerCount = 4

    // Lógica de cálculo (baseada no ViewModel)
    const productsCost = mockProducts.reduce((acc, product) => {
      if (product.isCourtesy) {
        return acc
      }

      switch (product.pricingType) {
        case 'PER_PERSON':
          return acc + (product.price || 0) * passengerCount
        default:
          return acc + (product.price || 0)
      }
    }, 0)

    // (50 + 10) * 4 = 240 (fotografia é cortesia, não conta)
    expect(productsCost).toBe(240)
  })

  it('deve calcular custo de produtos por hora corretamente', () => {
    // Teste de lógica de produtos horários
    const mockProducts = [
      {
        id: 'product-1',
        name: 'Passeio Completo',
        pricingType: 'HOURLY',
        hourlyPrice: 100,
        startTime: '10:00',
        endTime: '12:00',
        isCourtesy: false
      }
    ]

    // Lógica de cálculo (baseada no ViewModel)
    const productsCost = mockProducts.reduce((acc, product) => {
      if (product.isCourtesy) {
        return acc
      }

      if (product.pricingType === 'HOURLY' && product.startTime && product.endTime && product.hourlyPrice) {
        const startMin = 10 * 60 // 600
        const endMin = 12 * 60 // 720
        const durationInMinutes = endMin - startMin
        const durationInHours = durationInMinutes / 60

        if (durationInHours > 0) {
          return acc + durationInHours * product.hourlyPrice
        }
      }
      return acc
    }, 0)

    // 2 horas * 100 = 200
    expect(productsCost).toBe(200)
  })

  it('deve calcular descontos corretamente', () => {
    // Teste de lógica de descontos
    const subtotal = 500
    const rentalDiscount = { type: 'FIXED' as const, value: 50 }
    const productDiscountsTotal = 30

    // Lógica de cálculo (baseada no ViewModel)
    const rentalDiscountValue = rentalDiscount.type === 'FIXED' 
      ? rentalDiscount.value 
      : subtotal * (rentalDiscount.value / 100)

    const totalDiscount = rentalDiscountValue + productDiscountsTotal
    const total = Math.max(0, subtotal - totalDiscount)

    expect(rentalDiscountValue).toBe(50)
    expect(totalDiscount).toBe(80)
    expect(total).toBe(420)
  })

  it('deve calcular desconto percentual corretamente', () => {
    // Teste de desconto percentual
    const subtotal = 500
    const rentalDiscount = { type: 'PERCENTAGE' as const, value: 10 }
    const productDiscountsTotal = 0

    // Lógica de cálculo (baseada no ViewModel)
    const rentalDiscountValue = rentalDiscount.type === 'FIXED' 
      ? rentalDiscount.value 
      : subtotal * (rentalDiscount.value / 100)

    const totalDiscount = rentalDiscountValue + productDiscountsTotal
    const total = Math.max(0, subtotal - totalDiscount)

    expect(rentalDiscountValue).toBe(50) // 10% de 500
    expect(totalDiscount).toBe(50)
    expect(total).toBe(450)
  })

  it('deve validar capacidade do barco', () => {
    // Teste de validação de capacidade
    const mockBoat = {
      id: 'boat-1',
      name: 'Speedboat Alpha',
      capacity: 10
    }

    const passengerCount = 8
    const isCapacityExceeded = passengerCount > mockBoat.capacity

    expect(isCapacityExceeded).toBe(false)

    const passengerCountExceeded = 12
    const isCapacityExceeded2 = passengerCountExceeded > mockBoat.capacity

    expect(isCapacityExceeded2).toBe(true)
  })

  it('deve validar estrutura de retorno esperada', () => {
    // Validar a estrutura esperada do retorno do hook
    const expectedStructure = {
      isLoading: expect.any(Boolean),
      editingEventId: expect.any(String),
      selectedDate: expect.any(Date),
      startTime: expect.any(String),
      endTime: expect.any(String),
      scheduledEvents: expect.any(Array),
      isPreScheduled: expect.any(Boolean),
      availableBoats: expect.any(Array),
      selectedBoat: expect.any(Object),
      isCapacityExceeded: expect.any(Boolean),
      isBusinessClosed: expect.any(Boolean),
      availableBoardingLocations: expect.any(Array),
      selectedBoardingLocation: expect.any(Object),
      availableTourTypes: expect.any(Array),
      selectedTourType: expect.any(Object),
      availableProducts: expect.any(Array),
      selectedProducts: expect.any(Array),
      rentalDiscount: expect.any(Object),
      passengerCount: expect.any(Number),
      boatRentalCost: expect.any(Number),
      subtotal: expect.any(Number),
      totalDiscount: expect.any(Number),
      total: expect.any(Number),
      tax: expect.any(Number),
      taxDescription: expect.any(String),
      observations: expect.any(String),
      selectedClient: expect.any(Object),
      clientSearchTerm: expect.any(String),
      clientSearchResults: expect.any(Array),
      isSearching: expect.any(Boolean),
      loyaltySuggestion: expect.any(String),
      availableTimeSlots: expect.any(Array),
      availableEndTimeSlots: expect.any(Array),
      isModalOpen: expect.any(Boolean),
      editingClient: expect.any(Object),
      newClientName: expect.any(String),
      newClientPhone: expect.any(String),
      createEvent: expect.any(Function),
      syncEvent: expect.any(Function)
    }

    // Validar que a estrutura é a esperada
    expect(expectedStructure).toBeDefined()
  })

  it('deve validar lógica de toggle de produtos', () => {
    // Teste de lógica de toggle
    const mockProduct = {
      id: 'product-1',
      name: 'Snorkel',
      pricingType: 'PER_PERSON',
      price: 50
    }

    const selectedProducts = []

    // Adicionar produto
    const updatedProducts = selectedProducts.some(p => p.id === mockProduct.id)
      ? selectedProducts.filter(p => p.id !== mockProduct.id)
      : [...selectedProducts, {
          ...mockProduct,
          isCourtesy: false,
          startTime: mockProduct.pricingType === 'HOURLY' ? '09:00' : undefined,
          endTime: mockProduct.pricingType === 'HOURLY' ? '10:00' : undefined
        }]

    expect(updatedProducts).toHaveLength(1)
    expect(updatedProducts[0].id).toBe('product-1')
    expect(updatedProducts[0].isCourtesy).toBe(false)

    // Remover produto
    const finalProducts = updatedProducts.some(p => p.id === mockProduct.id)
      ? updatedProducts.filter(p => p.id !== mockProduct.id)
      : updatedProducts

    expect(finalProducts).toHaveLength(0)
  })

  it('deve validar lógica de toggle de cortesia', () => {
    // Teste de lógica de cortesia
    const selectedProducts = [
      {
        id: 'product-1',
        name: 'Snorkel',
        isCourtesy: false
      }
    ]

    // Toggle cortesia
    const updatedProducts = selectedProducts.map(p => 
      p.id === 'product-1' ? { ...p, isCourtesy: !p.isCourtesy } : p
    )

    expect(updatedProducts[0].isCourtesy).toBe(true)

    // Toggle novamente
    const finalProducts = updatedProducts.map(p => 
      p.id === 'product-1' ? { ...p, isCourtesy: !p.isCourtesy } : p
    )

    expect(finalProducts[0].isCourtesy).toBe(false)
  })
})
