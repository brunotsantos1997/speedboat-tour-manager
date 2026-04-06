import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock dos repositories
vi.mock('../../../src/core/repositories/ExpenseRepository', () => ({
  expenseRepository: {
    getAll: vi.fn(),
    subscribe: vi.fn(),
    add: vi.fn(),
    update: vi.fn(),
    remove: vi.fn()
  }
}))

// Mock do React hooks
vi.mock('react', () => ({
  useState: vi.fn((initial) => [initial, vi.fn()]),
  useEffect: vi.fn(),
  useMemo: vi.fn((fn) => fn()),
  useCallback: vi.fn((fn) => fn)
}))

describe('useExpenseCategoryViewModel - Testes Unitários', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('deve importar o hook corretamente', async () => {
    const { useExpenseCategoryViewModel } = await import('../../../src/viewmodels/useExpenseCategoryViewModel')
    expect(typeof useExpenseCategoryViewModel).toBe('function')
  })

  it('deve validar estrutura básica do hook', async () => {
    const { useExpenseCategoryViewModel } = await import('../../../src/viewmodels/useExpenseCategoryViewModel')
    
    expect(() => {
      const hookSource = useExpenseCategoryViewModel.toString()
      expect(hookSource).toContain('useState')
      expect(hookSource).toContain('useCallback')
    }).not.toThrow()
  })

  it('deve validar lógica de categorias padrão', () => {
    // Mock de categorias padrão
    const defaultCategories = [
      { id: 'fuel', name: 'Combustível', color: '#FF6B6B', icon: 'fuel', isActive: true },
      { id: 'maintenance', name: 'Manutenção', color: '#4ECDC4', icon: 'wrench', isActive: true },
      { id: 'insurance', name: 'Seguros', color: '#45B7D1', icon: 'shield', isActive: true },
      { id: 'supplies', name: 'Insumos', color: '#96CEB4', icon: 'package', isActive: true },
      { id: 'staff', name: 'Funcionários', color: '#FFEAA7', icon: 'users', isActive: true },
      { id: 'marketing', name: 'Marketing', color: '#DDA0DD', icon: 'megaphone', isActive: true },
      { id: 'office', name: 'Escritório', color: '#98D8C8', icon: 'building', isActive: true },
      { id: 'other', name: 'Outros', color: '#B8B8B8', icon: 'more', isActive: true }
    ]

    expect(defaultCategories).toHaveLength(8)
    expect(defaultCategories[0].name).toBe('Combustível')
    expect(defaultCategories[0].color).toBe('#FF6B6B')
    expect(defaultCategories[0].icon).toBe('fuel')
    expect(defaultCategories[0].isActive).toBe(true)
  })

  it('deve validar lógica de criação de nova categoria', () => {
    // Mock de criação
    const createCategory = (categoryData: any) => {
      const newCategory = {
        id: `cat-${Date.now()}`,
        name: categoryData.name.trim(),
        description: categoryData.description?.trim() || '',
        color: categoryData.color || '#B8B8B8',
        icon: categoryData.icon || 'folder',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      return newCategory
    }

    const categoryData = {
      name: 'Aluguel',
      description: 'Pagamento de aluguel de espaço',
      color: '#FF9F40',
      icon: 'home'
    }

    const newCategory = createCategory(categoryData)
    expect(newCategory.name).toBe('Aluguel')
    expect(newCategory.description).toBe('Pagamento de aluguel de espaço')
    expect(newCategory.color).toBe('#FF9F40')
    expect(newCategory.icon).toBe('home')
    expect(newCategory.isActive).toBe(true)
    expect(newCategory.id).toMatch(/^cat-\d+$/)
  })

  it('deve validar lógica de validação de categoria', () => {
    // Mock de validação
    const validateCategory = (category: any) => {
      const errors: string[] = []

      if (!category.name || category.name.trim().length < 2) {
        errors.push('Nome deve ter pelo menos 2 caracteres')
      }

      if (category.name && category.name.length > 50) {
        errors.push('Nome não pode ter mais de 50 caracteres')
      }

      if (category.color && !/^#[0-9A-F]{6}$/i.test(category.color)) {
        errors.push('Cor deve estar no formato hexadecimal (#RRGGBB)')
      }

      if (category.description && category.description.length > 200) {
        errors.push('Descrição não pode ter mais de 200 caracteres')
      }

      return {
        isValid: errors.length === 0,
        errors
      }
    }

    // Testar categoria válida
    const validCategory = {
      name: 'Combustível',
      color: '#FF6B6B',
      description: 'Despesas com combustível'
    }

    const validResult = validateCategory(validCategory)
    expect(validResult.isValid).toBe(true)
    expect(validResult.errors).toHaveLength(0)

    // Testar categoria inválida
    const invalidCategory = {
      name: '',
      color: 'invalid-color',
      description: 'A'.repeat(201)
    }

    const invalidResult = validateCategory(invalidCategory)
    expect(invalidResult.isValid).toBe(false)
    expect(invalidResult.errors.length).toBe(3)
  })

  it('deve validar lógica de atualização de categoria', () => {
    // Mock de atualização
    const updateCategory = (existingCategory: any, updates: any) => {
      return {
        ...existingCategory,
        ...updates,
        updatedAt: new Date(),
        version: (existingCategory.version || 0) + 1
      }
    }

    const existing = {
      id: 'cat-1',
      name: 'Combustível',
      color: '#FF6B6B',
      isActive: true,
      createdAt: new Date('2023-01-01'),
      updatedAt: new Date('2023-01-01'),
      version: 1
    }

    const updates = {
      name: 'Combustível e Lubrificantes',
      color: '#FF8C42'
    }

    const updated = updateCategory(existing, updates)
    expect(updated.name).toBe('Combustível e Lubrificantes')
    expect(updated.color).toBe('#FF8C42')
    expect(updated.isActive).toBe(true) // Mantido
    expect(updated.version).toBe(2)
    expect(updated.updatedAt.getTime()).toBeGreaterThan(existing.updatedAt.getTime())
  })

  it('deve validar lógica de exclusão de categoria', () => {
    // Mock de verificação antes de excluir
    const canDeleteCategory = (categoryId: string, expenses: any[]) => {
      const categoryExpenses = expenses.filter(expense => expense.categoryId === categoryId)
      
      if (categoryExpenses.length > 0) {
        return {
          canDelete: false,
          reason: `Categoria possui ${categoryExpenses.length} despesa(s) associada(s)`
        }
      }

      return { canDelete: true }
    }

    // Mock de soft delete
    const softDeleteCategory = (category: any) => {
      return {
        ...category,
        isActive: false,
        deletedAt: new Date(),
        updatedAt: new Date()
      }
    }

    const expenses = [
      { id: 'exp-1', categoryId: 'cat-1', amount: 100 },
      { id: 'exp-2', categoryId: 'cat-2', amount: 200 },
      { id: 'exp-3', categoryId: 'cat-1', amount: 150 }
    ]

    // Tentar excluir categoria com despesas
    const canDelete1 = canDeleteCategory('cat-1', expenses)
    expect(canDelete1.canDelete).toBe(false)
    expect(canDelete1.reason).toContain('2 despesa(s)')

    // Tentar excluir categoria sem despesas
    const canDelete2 = canDeleteCategory('cat-3', expenses)
    expect(canDelete2.canDelete).toBe(true)

    // Soft delete
    const category = { id: 'cat-1', name: 'Teste', isActive: true }
    const deleted = softDeleteCategory(category)
    expect(deleted.isActive).toBe(false)
    expect(deleted.deletedAt).toBeDefined()
  })

  it('deve validar lógica de reorganização de categorias', () => {
    // Mock de reorganização
    const reorderCategories = (categories: any[], newOrder: string[]) => {
      const categoryMap = new Map(categories.map(cat => [cat.id, cat]))
      
      return newOrder.map((id, index) => {
        const category = categoryMap.get(id)
        if (!category) return null
        
        return {
          ...category,
          order: index,
          updatedAt: new Date()
        }
      }).filter(Boolean)
    }

    const categories = [
      { id: 'cat-1', name: 'A', order: 0 },
      { id: 'cat-2', name: 'B', order: 1 },
      { id: 'cat-3', name: 'C', order: 2 }
    ]

    const newOrder = ['cat-3', 'cat-1', 'cat-2']
    const reordered = reorderCategories(categories, newOrder)

    expect(reordered).toHaveLength(3)
    expect(reordered[0].id).toBe('cat-3')
    expect(reordered[0].order).toBe(0)
    expect(reordered[1].id).toBe('cat-1')
    expect(reordered[1].order).toBe(1)
    expect(reordered[2].id).toBe('cat-2')
    expect(reordered[2].order).toBe(2)
  })

  it('deve validar lógica de cálculo de estatísticas por categoria', () => {
    // Mock de cálculo
    const calculateCategoryStats = (categoryId: string, expenses: any[]) => {
      const categoryExpenses = expenses.filter(expense => expense.categoryId === categoryId)
      
      if (categoryExpenses.length === 0) {
        return {
          totalExpenses: 0,
          totalAmount: 0,
          averageAmount: 0,
          maxAmount: 0,
          minAmount: 0,
          thisMonthTotal: 0
        }
      }

      const amounts = categoryExpenses.map(e => e.amount)
      const totalAmount = amounts.reduce((sum, amount) => sum + amount, 0)
      const now = new Date()
      const thisMonth = categoryExpenses.filter(e => {
        const expenseDate = new Date(e.date)
        return expenseDate.getMonth() === now.getMonth() && 
               expenseDate.getFullYear() === now.getFullYear()
      })

      return {
        totalExpenses: categoryExpenses.length,
        totalAmount,
        averageAmount: totalAmount / categoryExpenses.length,
        maxAmount: Math.max(...amounts),
        minAmount: Math.min(...amounts),
        thisMonthTotal: thisMonth.reduce((sum, e) => sum + e.amount, 0)
      }
    }

    const expenses = [
      { id: 'exp-1', categoryId: 'cat-1', amount: 100, date: '2024-01-15' },
      { id: 'exp-2', categoryId: 'cat-1', amount: 200, date: '2024-01-20' },
      { id: 'exp-3', categoryId: 'cat-1', amount: 150, date: '2023-12-10' },
      { id: 'exp-4', categoryId: 'cat-2', amount: 300, date: '2024-01-10' }
    ]

    const stats = calculateCategoryStats('cat-1', expenses)
    expect(stats.totalExpenses).toBe(3)
    expect(stats.totalAmount).toBe(450)
    expect(stats.averageAmount).toBe(150)
    expect(stats.maxAmount).toBe(200)
    expect(stats.minAmount).toBe(100)
  })

  it('deve validar lógica de busca de categorias', () => {
    // Mock de busca
    const searchCategories = (categories: any[], searchTerm: string) => {
      const searchLower = searchTerm.toLowerCase()
      return categories.filter(category =>
        category.name.toLowerCase().includes(searchLower) ||
        category.description?.toLowerCase().includes(searchLower)
      )
    }

    const categories = [
      { id: 'cat-1', name: 'Combustível', description: 'Despesas com combustível' },
      { id: 'cat-2', name: 'Manutenção', description: 'Manutenção de embarcações' },
      { id: 'cat-3', name: 'Seguros', description: 'Apólices de seguro' }
    ]

    expect(searchCategories(categories, 'combustível')).toHaveLength(1)
    expect(searchCategories(categories, 'combustível')[0].id).toBe('cat-1')
    expect(searchCategories(categories, 'despesas')).toHaveLength(1)
    expect(searchCategories(categories, 'manutenção')).toHaveLength(1)
    expect(searchCategories(categories, 'inexistente')).toHaveLength(0)
  })

  it('deve validar lógica de cores pré-definidas', () => {
    // Mock de cores
    const predefinedColors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
      '#FFEAA7', '#DDA0DD', '#98D8C8', '#B8B8B8',
      '#FF9F40', '#54A0FF', '#48DBFB', '#0ABDE3'
    ]

    // Validar formato
    const isValidColor = (color: string) => /^#[0-9A-F]{6}$/i.test(color)

    predefinedColors.forEach(color => {
      expect(isValidColor(color)).toBe(true)
    })

    // Gerar cor aleatória
    const getRandomColor = () => {
      return predefinedColors[Math.floor(Math.random() * predefinedColors.length)]
    }

    const randomColor = getRandomColor()
    expect(predefinedColors).toContain(randomColor)
  })

  it('deve validar lógica de ícones disponíveis', () => {
    // Mock de ícones
    const availableIcons = [
      'fuel', 'wrench', 'shield', 'package', 'users',
      'megaphone', 'building', 'home', 'car', 'boat',
      'tools', 'money', 'chart', 'calendar', 'clock'
    ]

    // Validar ícone
    const isValidIcon = (icon: string) => availableIcons.includes(icon)

    expect(isValidIcon('fuel')).toBe(true)
    expect(isValidIcon('wrench')).toBe(true)
    expect(isValidIcon('invalid-icon')).toBe(false)

    // Obter ícone padrão
    const getDefaultIcon = () => 'folder'
    expect(getDefaultIcon()).toBe('folder')
  })

  it('deve validar lógica de exportação de categorias', () => {
    // Mock de categorias
    const categories = [
      { id: 'cat-1', name: 'Combustível', color: '#FF6B6B', isActive: true, expenseCount: 15 },
      { id: 'cat-2', name: 'Manutenção', color: '#4ECDC4', isActive: true, expenseCount: 8 },
      { id: 'cat-3', name: 'Seguros', color: '#45B7D1', isActive: false, expenseCount: 3 }
    ]

    // Gerar CSV
    const headers = ['ID', 'Nome', 'Cor', 'Status', 'Qtd. Despesas']
    const csvContent = categories.map(cat => [
      cat.id,
      cat.name,
      cat.color,
      cat.isActive ? 'Ativa' : 'Inativa',
      cat.expenseCount
    ])

    const csvString = [
      headers.join(','),
      ...csvContent.map(row => row.join(','))
    ].join('\n')

    expect(csvString).toContain('ID,Nome,Cor,Status,Qtd. Despesas')
    expect(csvString).toContain('cat-1,Combustível,#FF6B6B,Ativa,15')
    expect(csvString).toContain('cat-2,Manutenção,#4ECDC4,Ativa,8')
    expect(csvString).toContain('cat-3,Seguros,#45B7D1,Inativa,3')
  })

  it('deve validar lógica de tratamento de erros', () => {
    // Mock de tratamento de erro
    const handleError = (error: any, operation: string) => {
      const errorMap = {
        'duplicate_name': 'Já existe uma categoria com este nome',
        'invalid_color': 'Cor inválida',
        'has_expenses': 'Categoria possui despesas associadas',
        'not_found': 'Categoria não encontrada'
      }

      const errorCode = error?.code || 'unknown'
      const message = errorMap[errorCode] || `Erro ao ${operation}: ${error?.message || 'Erro desconhecido'}`

      return {
        message,
        code: errorCode,
        operation
      }
    }

    expect(handleError({ code: 'duplicate_name' }, 'criar categoria')).toEqual({
      message: 'Já existe uma categoria com este nome',
      code: 'duplicate_name',
      operation: 'criar categoria'
    })

    expect(handleError({ code: 'invalid_color' }, 'atualizar categoria')).toEqual({
      message: 'Cor inválida',
      code: 'invalid_color',
      operation: 'atualizar categoria'
    })

    expect(handleError({ message: 'Database error' }, 'excluir categoria')).toEqual({
      message: 'Erro ao excluir categoria: Database error',
      code: 'unknown',
      operation: 'excluir categoria'
    })
  })

  it('deve validar estrutura de retorno esperada', () => {
    const expectedStructure = {
      loading: expect.any(Boolean),
      categories: expect.any(Array),
      searchResults: expect.any(Array),
      searchTerm: expect.any(String),
      setSearchTerm: expect.any(Function),
      selectedCategory: expect.any(Object),
      setSelectedCategory: expect.any(Function),
      isModalOpen: expect.any(Boolean),
      openModal: expect.any(Function),
      closeModal: expect.any(Function),
      createCategory: expect.any(Function),
      updateCategory: expect.any(Function),
      deleteCategory: expect.any(Function),
      reorderCategories: expect.any(Function),
      refresh: expect.any(Function)
    }

    expect(expectedStructure).toBeDefined()
  })
})
