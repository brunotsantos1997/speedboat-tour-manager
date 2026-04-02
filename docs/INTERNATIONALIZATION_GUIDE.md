# 🌍 Guia de Internacionalização (i18n)

Este guia explica como implementar e usar o sistema de internacionalização no projeto.

---

## 📋 **Visão Geral**

O sistema de internacionalização permite que a aplicação suporte múltiplos idiomas de forma organizada e escalável.

### **Idiomas Suportados**
- 🇧🇷 **Português (Brasil)** - `pt-BR` (idioma padrão)
- 🇺🇸 **English (United States)** - `en-US`
- 🇪🇸 **Español (España)** - `es-ES`

### **Tecnologias Utilizadas**
- **i18next**: Biblioteca principal de internacionalização
- **react-i18next**: Integração com React
- **i18next-browser-languagedetector**: Detecção automática de idioma

---

## 🚀 **Setup Inicial**

### **1. Instalação das Dependências**
```bash
npm install i18next react-i18next i18next-browser-languagedetector
```

### **2. Estrutura de Arquivos**
```
src/
├── i18n/
│   ├── index.ts              # Configuração do i18n
│   └── locales/
│       ├── pt-BR.json        # Português
│       ├── en-US.json        # Inglês
│       └── es-ES.json        # Espanhol
├── ui/
│   ├── components/
│   │   └── LanguageSelector.tsx
│   └── hooks/
│       └── useLanguage.ts
└── main.tsx                  # Import do i18n
```

---

## 🔧 **Configuração**

### **Arquivo Principal (src/i18n/index.ts)**
```typescript
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import ptBR from './locales/pt-BR.json';
import enUS from './locales/en-US.json';
import esES from './locales/es-ES.json';

const resources = {
  'pt-BR': { translation: ptBR },
  'en-US': { translation: enUS },
  'es-ES': { translation: esES }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'pt-BR',
    debug: import.meta.env.DEV,
    interpolation: { escapeValue: false },
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
      lookupLocalStorage: 'language'
    }
  });
```

### **Inicialização (src/main.tsx)**
```typescript
import './i18n'; // Adicionar no topo do arquivo
```

---

## 📝 **Uso Básico**

### **1. Hook Personalizado**
```typescript
import { useLanguage } from '../hooks/useLanguage';

function MyComponent() {
  const { t, currentLanguage, formatCurrency, formatDate } = useLanguage();
  
  return (
    <div>
      <h1>{t('dashboard.title')}</h1>
      <p>{t('dashboard.welcome')}</p>
      <span>{formatCurrency(1500.50)}</span>
      <span>{formatDate(new Date())}</span>
    </div>
  );
}
```

### **2. Hook Padrão**
```typescript
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation();
  
  return <h1>{t('common.save')}</h1>;
}
```

### **3. Tradução com Parâmetros**
```typescript
// No arquivo de tradução
{
  "validation": {
    "minLength": "Mínimo de {{count}} caracteres"
  }
}

// No componente
const { t } = useTranslation();
t('validation.minLength', { count: 8 })
```

---

## 🎨 **Componentes**

### **LanguageSelector**
Componente para seleção de idioma:

```typescript
import { LanguageSelector } from '../ui/components/LanguageSelector';

function Header() {
  return (
    <header>
      <h1>Minha App</h1>
      <LanguageSelector />
    </header>
  );
}
```

### **I18nExample**
Componente de exemplo demonstrando funcionalidades:

```typescript
import { I18nExample } from '../ui/components/I18nExample';

function SettingsPage() {
  return (
    <div>
      <I18nExample />
    </div>
  );
}
```

---

## 📁 **Estrutura das Traduções**

### **Organização por Módulos**
```json
{
  "common": {
    "save": "Salvar",
    "cancel": "Cancelar",
    "delete": "Excluir"
  },
  "navigation": {
    "dashboard": "Dashboard",
    "events": "Eventos"
  },
  "auth": {
    "login": "Entrar",
    "signup": "Cadastrar"
  },
  "dashboard": {
    "title": "Dashboard",
    "welcome": "Bem-vindo"
  }
}
```

### **Aninhamento**
```json
{
  "events": {
    "status": {
      "scheduled": "Agendado",
      "completed": "Concluído",
      "cancelled": "Cancelado"
    }
  }
}

// Uso: t('events.status.scheduled')
```

---

## 🔧 **Formatação Avançada**

### **Moedas**
```typescript
const { formatCurrency } = useLanguage();

formatCurrency(1500.50); // "R$ 1.500,50" (pt-BR)
formatCurrency(1500.50, 'USD'); // "$1,500.50" (en-US)
```

### **Datas**
```typescript
const { formatDate, formatTime, formatDateTime } = useLanguage();

formatDate(new Date()); // "1 de abril de 2026"
formatTime(new Date()); // "14:30"
formatDateTime(new Date()); // "1 de abr de 2026, 14:30"
```

### **Números**
```typescript
const { formatNumber } = useLanguage();

formatNumber(1500.50); // "1.500,50" (pt-BR)
formatNumber(1500.50, { minimumFractionDigits: 0 }); // "1.500"
```

### **Tempo Relativo**
```typescript
const { getRelativeTime } = useLanguage();

getRelativeTime(new Date()); // "Hoje"
getRelativeTime(yesterday); // "Ontem"
```

---

## 🔄 **Mudança de Idioma**

### **Programática**
```typescript
const { changeLanguage } = useLanguage();

changeLanguage('en-US'); // Muda para inglês
changeLanguage('es-ES'); // Muda para espanhol
```

### **Persistência**
A escolha do idioma é automaticamente salva no `localStorage` e recuperada na próxima visita.

---

## 📝 **Adicionando Novas Traduções**

### **1. Adicionar Novo Idioma**

#### **a) Criar Arquivo de Tradução**
```json
// src/i18n/locales/fr-FR.json
{
  "common": {
    "save": "Enregistrer",
    "cancel": "Annuler"
  }
}
```

#### **b) Configurar no i18n**
```typescript
// src/i18n/index.ts
import frFR from './locales/fr-FR.json';

const resources = {
  'pt-BR': { translation: ptBR },
  'en-US': { translation: enUS },
  'es-ES': { translation: esES },
  'fr-FR': { translation: frFR } // Adicionar
};
```

#### **c) Atualizar LanguageSelector**
```typescript
const languages = [
  { code: 'pt-BR', name: 'Português (BR)', flag: '🇧🇷' },
  { code: 'en-US', name: 'English (US)', flag: '🇺🇸' },
  { code: 'es-ES', name: 'Español (ES)', flag: '🇪🇸' },
  { code: 'fr-FR', name: 'Français (FR)', flag: '🇫🇷' } // Adicionar
];
```

### **2. Adicionar Novas Chaves**

#### **a) Em Todos os Idiomas**
```json
// pt-BR.json
{
  "newSection": {
    "title": "Título Novo",
    "description": "Descrição Nova"
  }
}

// en-US.json
{
  "newSection": {
    "title": "New Title",
    "description": "New Description"
  }
}

// es-ES.json
{
  "newSection": {
    "title": "Título Nuevo",
    "description": "Descripción Nueva"
  }
}
```

#### **b) Usar no Código**
```typescript
const { t } = useTranslation();
t('newSection.title');
t('newSection.description');
```

---

## 🛠️ **Boas Práticas**

### **1. Nomenclatura de Chaves**
- ✅ `dashboard.title` (claro e hierárquico)
- ✅ `events.status.completed` (específico)
- ❌ `title` (genérico)
- ❌ `event_status_completed` (não convencional)

### **2. Consistência**
- Mantenha a mesma estrutura em todos os idiomas
- Use as mesmas chaves em todos os arquivos
- Verifique se não há chaves faltando

### **3. Parâmetros**
- Use nomes descritivos: `{{userName}}` em vez de `{{name}}`
- Documente parâmetros esperados
- Forneça valores padrão quando possível

### **4. Formatação**
- Use formatação localizada (datas, moedas, números)
- Evite texto hardcoded em componentes
- Considere diferenças culturais (formatos de endereço, etc.)

---

## 🧪 **Testes**

### **Teste de Traduções**
```typescript
import { render } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import i18n from '../i18n';

function renderWithI18n(component, language = 'pt-BR') {
  i18n.changeLanguage(language);
  return render(
    <I18nextProvider i18n={i18n}>
      {component}
    </I18nextProvider>
  );
}

test('traduz título do dashboard', () => {
  const { getByText } = renderWithI18n(<Dashboard />);
  expect(getByText('Dashboard')).toBeInTheDocument();
});
```

### **Teste de Formatação**
```typescript
test('formata moeda corretamente', () => {
  const { formatCurrency } = renderHook(() => useLanguage()).result.current;
  
  expect(formatCurrency(1500.50)).toBe('R$ 1.500,50');
});
```

---

## 🔍 **Debug e Troubleshooting**

### **Problemas Comuns**

#### **Tradução Não Aparece**
```typescript
// Verifique se a chave existe
console.log(i18n.getResourceBundle('pt-BR', 'translation'));

// Verifique idioma atual
console.log(i18n.language);

// Forçar recarregamento
i18n.reloadResources();
```

#### **Idioma Não Muda**
```typescript
// Limpar cache
localStorage.removeItem('language');

// Forçar mudança
i18n.changeLanguage('en-US').then(() => {
  console.log('Idioma mudado');
});
```

#### **Formatação Incorreta**
```typescript
// Verificar locale do navegador
console.log(navigator.language);

// Forçar locale específico
new Intl.DateTimeFormat('pt-BR').format(new Date());
```

### **Debug Mode**
Ative debug mode em desenvolvimento:
```typescript
// src/i18n/index.ts
i18n.init({
  debug: true, // Mostra logs no console
  // ...
});
```

---

## 📦 **Build e Deploy**

### **Otimização**
- Arquivos de tradução são incluídos no bundle
- Use lazy loading para muitos idiomas
- Considere split por idioma se necessário

### **Variáveis de Ambiente**
```typescript
// .env
VITE_DEFAULT_LANGUAGE=pt-BR
VITE_SUPPORTED_LANGUAGES=pt-BR,en-US,es-ES

// src/i18n/index.ts
const defaultLanguage = import.meta.env.VITE_DEFAULT_LANGUAGE || 'pt-BR';
```

---

## 🚀 **Exemplos Práticos**

### **Componente Completo**
```typescript
import React from 'react';
import { useLanguage } from '../hooks/useLanguage';
import { LanguageSelector } from './LanguageSelector';

export function EventCard({ event }) {
  const { t, formatDate, formatCurrency, currentLanguage } = useLanguage();
  
  return (
    <div className="event-card">
      <div className="header">
        <h3>{event.name}</h3>
        <LanguageSelector />
      </div>
      
      <div className="details">
        <p>
          <strong>{t('events.date')}: </strong>
          {formatDate(event.date)}
        </p>
        <p>
          <strong>{t('events.client')}: </strong>
          {event.client.name}
        </p>
        <p>
          <strong>{t('events.status')}: </strong>
          <span className={`status ${event.status}`}>
            {t(`events.status.${event.status}`)}
          </span>
        </p>
        <p>
          <strong>{t('finance.revenue')}: </strong>
          {formatCurrency(event.total)}
        </p>
      </div>
      
      <div className="actions">
        <button>{t('common.edit')}</button>
        <button>{t('common.delete')}</button>
      </div>
    </div>
  );
}
```

### **Contexto com Idioma**
```typescript
import React, { createContext, useContext } from 'react';
import { useLanguage } from '../hooks/useLanguage';

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const languageData = useLanguage();
  
  return (
    <LanguageContext.Provider value={languageData}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguageContext() {
  return useContext(LanguageContext);
}
```

---

## 📚 **Recursos Adicionais**

### **Documentação Oficial**
- [i18next Documentation](https://www.i18next.com/)
- [react-i18next Documentation](https://react.i18next.com/)

### **Ferramentas Úteis**
- [i18next Scanner](https://github.com/i18next/i18next-scanner) - Extração automática de chaves
- [i18next Editor](https://github.com/locize/next-i18next-editor) - Editor visual
- [Locize](https://locize.com/) - Plataforma de gerenciamento de traduções

### **Bibliotecas Complementares**
- `date-fns` - Formatação de datas localizada
- `intl-pluralrules` - Regras de pluralização
- `intl-relativetimeformat` - Formatação de tempo relativo

---

**Última atualização**: Abril 2026  
**Versão**: 1.0.0  
**Idiomas suportados**: 3
