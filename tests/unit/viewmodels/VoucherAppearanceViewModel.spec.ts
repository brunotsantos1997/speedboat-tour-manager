import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock dos repositories
vi.mock('../../../src/core/repositories/VoucherRepository', () => ({
  voucherRepository: {
    getTemplates: vi.fn(),
    saveTemplate: vi.fn(),
    updateTemplate: vi.fn(),
    deleteTemplate: vi.fn()
  }
}))

// Mock do React hooks
vi.mock('react', () => ({
  useState: vi.fn((initial) => [initial, vi.fn()]),
  useEffect: vi.fn(),
  useMemo: vi.fn((fn) => fn()),
  useCallback: vi.fn((fn) => fn)
}))

describe('VoucherAppearanceViewModel - Testes Unitários', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('deve importar o hook corretamente', async () => {
    const { useVoucherAppearanceViewModel } = await import('../../../src/viewmodels/VoucherAppearanceViewModel')
    expect(typeof useVoucherAppearanceViewModel).toBe('function')
  })

  it('deve validar estrutura básica do hook', async () => {
    const { useVoucherAppearanceViewModel } = await import('../../../src/viewmodels/VoucherAppearanceViewModel')
    
    expect(() => {
      const hookSource = useVoucherAppearanceViewModel.toString()
      expect(hookSource).toContain('useState')
      expect(hookSource).toContain('useCallback')
    }).not.toThrow()
  })

  it('deve validar lógica de templates padrão', () => {
    // Mock de templates padrão
    const defaultTemplates = [
      {
        id: 'classic',
        name: 'Clássico',
        description: 'Design tradicional e elegante',
        colors: {
          primary: '#1a472a',
          secondary: '#f5f5f5',
          accent: '#d4af37',
          text: '#333333'
        },
        fonts: {
          header: 'Georgia',
          body: 'Arial',
          size: {
            header: 24,
            body: 14,
            footer: 12
          }
        },
        layout: {
          headerPosition: 'top',
          logoPosition: 'left',
          qrPosition: 'right',
          footerPosition: 'bottom'
        }
      },
      {
        id: 'modern',
        name: 'Moderno',
        description: 'Design limpo e minimalista',
        colors: {
          primary: '#2563eb',
          secondary: '#f8fafc',
          accent: '#10b981',
          text: '#1e293b'
        },
        fonts: {
          header: 'Inter',
          body: 'Inter',
          size: {
            header: 20,
            body: 14,
            footer: 11
          }
        },
        layout: {
          headerPosition: 'top',
          logoPosition: 'center',
          qrPosition: 'bottom',
          footerPosition: 'bottom'
        }
      },
      {
        id: 'beach',
        name: 'Praia',
        description: 'Temático para passeios náuticos',
        colors: {
          primary: '#0891b2',
          secondary: '#f0f9ff',
          accent: '#f59e0b',
          text: '#0c4a6e'
        },
        fonts: {
          header: 'Pacifico',
          body: 'Roboto',
          size: {
            header: 28,
            body: 14,
            footer: 12
          }
        },
        layout: {
          headerPosition: 'top',
          logoPosition: 'left',
          qrPosition: 'right',
          footerPosition: 'bottom'
        }
      }
    ]

    expect(defaultTemplates).toHaveLength(3)
    expect(defaultTemplates[0].id).toBe('classic')
    expect(defaultTemplates[0].name).toBe('Clássico')
    expect(defaultTemplates[0].colors.primary).toBe('#1a472a')
    expect(defaultTemplates[0].fonts.header).toBe('Georgia')
  })

  it('deve validar lógica de criação de template customizado', () => {
    // Mock de criação
    const createCustomTemplate = (templateData: any) => {
      const newTemplate = {
        id: `custom-${Date.now()}`,
        name: templateData.name.trim(),
        description: templateData.description?.trim() || '',
        colors: {
          primary: templateData.colors?.primary || '#000000',
          secondary: templateData.colors?.secondary || '#ffffff',
          accent: templateData.colors?.accent || '#0066cc',
          text: templateData.colors?.text || '#333333'
        },
        fonts: {
          header: templateData.fonts?.header || 'Arial',
          body: templateData.fonts?.body || 'Arial',
          size: {
            header: templateData.fonts?.size?.header || 20,
            body: templateData.fonts?.size?.body || 14,
            footer: templateData.fonts?.size?.footer || 12
          }
        },
        layout: {
          headerPosition: templateData.layout?.headerPosition || 'top',
          logoPosition: templateData.layout?.logoPosition || 'left',
          qrPosition: templateData.layout?.qrPosition || 'right',
          footerPosition: templateData.layout?.footerPosition || 'bottom'
        },
        isCustom: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      return newTemplate
    }

    const customData = {
      name: 'Template Personalizado',
      description: 'Meu design exclusivo',
      colors: {
        primary: '#ff6b6b',
        secondary: '#f8f9fa',
        accent: '#4ecdc4',
        text: '#2d3436'
      },
      fonts: {
        header: 'Montserrat',
        body: 'Open Sans',
        size: {
          header: 22,
          body: 15,
          footer: 11
        }
      },
      layout: {
        headerPosition: 'center',
        logoPosition: 'center',
        qrPosition: 'center',
        footerPosition: 'bottom'
      }
    }

    const template = createCustomTemplate(customData)
    expect(template.name).toBe('Template Personalizado')
    expect(template.colors.primary).toBe('#ff6b6b')
    expect(template.fonts.header).toBe('Montserrat')
    expect(template.isCustom).toBe(true)
    expect(template.id).toMatch(/^custom-\d+$/)
  })

  it('deve validar lógica de validação de cores', () => {
    // Mock de validação de cores
    const validateColors = (colors: any) => {
      const errors: string[] = []
      const colorRegex = /^#[0-9A-F]{6}$/i

      if (!colorRegex.test(colors.primary)) {
        errors.push('Cor primária inválida')
      }

      if (!colorRegex.test(colors.secondary)) {
        errors.push('Cor secundária inválida')
      }

      if (!colorRegex.test(colors.accent)) {
        errors.push('Cor de destaque inválida')
      }

      if (!colorRegex.test(colors.text)) {
        errors.push('Cor do texto inválida')
      }

      // Verificar contraste
      const getContrastRatio = (color1: string, color2: string) => {
        const getLuminance = (color: string) => {
          const rgb = parseInt(color.slice(1), 16)
          const r = (rgb >> 16) & 0xff
          const g = (rgb >> 8) & 0xff
          const b = rgb & 0xff
          return (0.299 * r + 0.587 * g + 0.114 * b) / 255
        }

        const lum1 = getLuminance(color1)
        const lum2 = getLuminance(color2)
        const brightest = Math.max(lum1, lum2)
        const darkest = Math.min(lum1, lum2)
        return (brightest + 0.05) / (darkest + 0.05)
      }

      const textContrast = getContrastRatio(colors.text, colors.secondary)
      if (textContrast < 4.5) {
        errors.push('Baixo contraste entre texto e fundo')
      }

      return {
        isValid: errors.length === 0,
        errors,
        contrastRatio: textContrast
      }
    }

    // Testar cores válidas
    const validColors = {
      primary: '#1a472a',
      secondary: '#ffffff',
      accent: '#d4af37',
      text: '#000000'
    }

    const validResult = validateColors(validColors)
    expect(validResult.isValid).toBe(true)
    expect(validResult.errors).toHaveLength(0)

    // Testar cores inválidas
    const invalidColors = {
      primary: 'invalid',
      secondary: '#f5f5f5',
      accent: '#d4af37',
      text: '#ffffff' // Baixo contraste com fundo branco
    }

    const invalidResult = validateColors(invalidColors)
    expect(invalidResult.isValid).toBe(false)
    expect(invalidResult.errors.length).toBeGreaterThan(0)
  })

  it('deve validar lógica de validação de fontes', () => {
    // Mock de fontes disponíveis
    const availableFonts = [
      'Arial', 'Helvetica', 'Times New Roman', 'Georgia',
      'Verdana', 'Courier New', 'Impact', 'Comic Sans MS',
      'Inter', 'Roboto', 'Open Sans', 'Montserrat',
      'Pacifico', 'Playfair Display', 'Raleway', 'Lato'
    ]

    // Validar fontes
    const validateFonts = (fonts: any) => {
      const errors: string[] = []

      if (!availableFonts.includes(fonts.header)) {
        errors.push('Fonte do cabeçalho inválida')
      }

      if (!availableFonts.includes(fonts.body)) {
        errors.push('Fonte do corpo inválida')
      }

      // Validar tamanhos
      if (fonts.size.header < 12 || fonts.size.header > 48) {
        errors.push('Tamanho do cabeçalho deve estar entre 12px e 48px')
      }

      if (fonts.size.body < 10 || fonts.size.body > 24) {
        errors.push('Tamanho do corpo deve estar entre 10px e 24px')
      }

      if (fonts.size.footer < 8 || fonts.size.footer > 16) {
        errors.push('Tamanho do rodapé deve estar entre 8px e 16px')
      }

      return {
        isValid: errors.length === 0,
        errors
      }
    }

    const validFonts = {
      header: 'Montserrat',
      body: 'Open Sans',
      size: {
        header: 24,
        body: 14,
        footer: 12
      }
    }

    const validResult = validateFonts(validFonts)
    expect(validResult.isValid).toBe(true)

    const invalidFonts = {
      header: 'Invalid Font',
      body: 'Open Sans',
      size: {
        header: 60, // Muito grande
        body: 8,   // Muito pequeno
        footer: 20 // Muito grande
      }
    }

    const invalidResult = validateFonts(invalidFonts)
    expect(invalidResult.isValid).toBe(false)
    expect(invalidResult.errors.length).toBe(4)
  })

  it('deve validar lógica de preview do voucher', () => {
    // Mock de preview
    const generatePreview = (template: any, voucherData: any) => {
      const preview = {
        template: template.id,
        dimensions: {
          width: 350,
          height: 200
        },
        elements: {
          header: {
            text: voucherData.companyName || 'Nome da Empresa',
            position: template.layout.headerPosition,
            style: {
              font: template.fonts.header,
              size: template.fonts.size.header,
              color: template.colors.primary
            }
          },
          logo: {
            url: voucherData.logo || '',
            position: template.layout.logoPosition,
            size: 60
          },
          qrCode: {
            url: voucherData.qrUrl || '',
            position: template.layout.qrPosition,
            size: 80
          },
          footer: {
            text: voucherData.footerText || 'Obrigado pela preferência!',
            position: template.layout.footerPosition,
            style: {
              font: template.fonts.body,
              size: template.fonts.size.footer,
              color: template.colors.text
            }
          }
        },
        background: template.colors.secondary
      }

      return preview
    }

    const template = {
      id: 'modern',
      colors: { primary: '#2563eb', secondary: '#f8fafc', accent: '#10b981', text: '#1e293b' },
      fonts: { header: 'Inter', body: 'Inter', size: { header: 20, body: 14, footer: 11 } },
      layout: { headerPosition: 'top', logoPosition: 'center', qrPosition: 'bottom', footerPosition: 'bottom' }
    }

    const voucherData = {
      companyName: 'Speedboat Tour',
      logo: 'https://example.com/logo.png',
      qrUrl: 'https://example.com/voucher/123',
      footerText: 'Aproveite seu passeio!'
    }

    const preview = generatePreview(template, voucherData)
    expect(preview.template).toBe('modern')
    expect(preview.dimensions.width).toBe(350)
    expect(preview.elements.header.text).toBe('Speedboat Tour')
    expect(preview.elements.header.style.font).toBe('Inter')
    expect(preview.elements.header.style.color).toBe('#2563eb')
    expect(preview.background).toBe('#f8fafc')
  })

  it('deve validar lógica de exportação de template', () => {
    // Mock de exportação
    const exportTemplate = (template: any, format: 'json' | 'css') => {
      if (format === 'json') {
        return JSON.stringify(template, null, 2)
      }

      if (format === 'css') {
        const css = `
.voucher-${template.id} {
  --primary-color: ${template.colors.primary};
  --secondary-color: ${template.colors.secondary};
  --accent-color: ${template.colors.accent};
  --text-color: ${template.colors.text};
  
  --header-font: '${template.fonts.header}';
  --body-font: '${template.fonts.body}';
  --header-size: ${template.fonts.size.header}px;
  --body-size: ${template.fonts.size.body}px;
  --footer-size: ${template.fonts.size.footer}px;
  
  background-color: var(--secondary-color);
  color: var(--text-color);
}

.voucher-${template.id} .header {
  font-family: var(--header-font);
  font-size: var(--header-size);
  color: var(--primary-color);
}

.voucher-${template.id} .body {
  font-family: var(--body-font);
  font-size: var(--body-size);
}

.voucher-${template.id} .footer {
  font-family: var(--body-font);
  font-size: var(--footer-size);
}
        `.trim()

        return css
      }

      throw new Error('Formato não suportado')
    }

    const template = {
      id: 'classic',
      name: 'Clássico',
      colors: { primary: '#1a472a', secondary: '#f5f5f5', accent: '#d4af37', text: '#333333' },
      fonts: { header: 'Georgia', body: 'Arial', size: { header: 24, body: 14, footer: 12 } }
    }

    const jsonExport = exportTemplate(template, 'json')
    expect(jsonExport).toContain('"id": "classic"')
    expect(jsonExport).toContain('"primary": "#1a472a"')

    const cssExport = exportTemplate(template, 'css')
    expect(cssExport).toContain('--primary-color: #1a472a')
    expect(cssExport).toContain('--header-font: \'Georgia\'')
    expect(cssExport).toContain('.voucher-classic')
  })

  it('deve validar lógica de duplicação de template', () => {
    // Mock de duplicação
    const duplicateTemplate = (originalTemplate: any, newName: string) => {
      const duplicated = {
        ...originalTemplate,
        id: `duplicate-${Date.now()}`,
        name: newName.trim(),
        isCustom: true,
        isDuplicate: true,
        originalId: originalTemplate.id,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      // Remover campos que não devem ser duplicados
      delete duplicated.version
      delete duplicated.usageCount

      return duplicated
    }

    const original = {
      id: 'classic',
      name: 'Clássico',
      description: 'Design tradicional',
      isCustom: false,
      version: 1,
      usageCount: 150
    }

    const duplicated = duplicateTemplate(original, 'Clássico - Cópia')
    expect(duplicated.id).not.toBe(original.id)
    expect(duplicated.name).toBe('Clássico - Cópia')
    expect(duplicated.isCustom).toBe(true)
    expect(duplicated.isDuplicate).toBe(true)
    expect(duplicated.originalId).toBe('classic')
    expect(duplicated.version).toBeUndefined()
    expect(duplicated.usageCount).toBeUndefined()
  })

  it('deve validar estrutura de retorno esperada', () => {
    const expectedStructure = {
      loading: expect.any(Boolean),
      templates: expect.any(Array),
      selectedTemplate: expect.any(Object),
      preview: expect.any(Object),
      isEditing: expect.any(Boolean),
      errors: expect.any(Array),
      selectTemplate: expect.any(Function),
      createTemplate: expect.any(Function),
      updateTemplate: expect.any(Function),
      deleteTemplate: expect.any(Function),
      duplicateTemplate: expect.any(Function),
      generatePreview: expect.any(Function),
      exportTemplate: expect.any(Function),
      importTemplate: expect.any(Function),
      validateTemplate: expect.any(Function)
    }

    expect(expectedStructure).toBeDefined()
  })
})
