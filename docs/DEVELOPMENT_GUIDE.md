# 📖 Guia de Desenvolvimento

## 🚀 **Guia Rápido de Setup**

### **Pré-requisitos**
- Node.js 18+ 
- npm ou yarn
- Conta Firebase com Firestore ativado
- Git

### **Setup Inicial**
```bash
# 1. Clonar o repositório
git clone <repository-url>
cd Voucher-passeio-lancha

# 2. Instalar dependências
npm install

# 3. Configurar ambiente
cp .env.example .env
# Editar .env com suas credenciais Firebase

# 4. Configurar Firestore
# - Criar projeto no Firebase Console
# - Ativar Firestore
# - Configurar regras de segurança (copiar de firestore.rules)
# - Adicionar dados iniciais (opcional)

# 5. Iniciar desenvolvimento
npm run dev
```

---

## 🏗️ **Arquitetura e Padrões**

### **Estrutura de Camadas**
```
┌─────────────────────────────────────────┐
│              UI Layer                   │
│  Screens → Components → Layouts        │
├─────────────────────────────────────────┤
│            ViewModels                   │
│         Business Logic                  │
├─────────────────────────────────────────┤
│           Repositories                  │
│         Data Access Layer               │
├─────────────────────────────────────────┤
│             Domain                      │
│        Types & Business Rules          │
├─────────────────────────────────────────┤
│            Firebase                     │
│        Database & Auth                  │
└─────────────────────────────────────────┘
```

### **Padrões de Projeto**

#### **1. Repository Pattern**
```typescript
// src/core/repositories/BaseRepository.ts
export abstract class BaseRepository<T> {
  protected collection: string;
  
  constructor(collection: string) {
    this.collection = collection;
  }
  
  async create(data: Omit<T, 'id'>): Promise<string> {
    const docRef = doc(collection(db, this.collection));
    await setDoc(docRef, { ...data, id: docRef.id });
    return docRef.id;
  }
  
  async getById(id: string): Promise<T | null> {
    const docRef = doc(db, this.collection, id);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? docSnap.data() as T : null;
  }
}

// Uso específico
export class EventRepository extends BaseRepository<EventType> {
  async getByDateRange(startDate: string, endDate: string): Promise<EventType[]> {
    const q = query(
      collection(db, this.collection),
      where('date', '>=', startDate),
      where('date', '<=', endDate),
      orderBy('date', 'asc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data() as EventType);
  }
}
```

#### **2. ViewModel Pattern**
```typescript
// src/viewmodels/useCreateEventViewModel.ts
export function useCreateEventViewModel() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const createEvent = async (eventData: CreateEventData) => {
    setLoading(true);
    setError(null);
    
    try {
      // Validações
      if (!eventData.client.phone) {
        throw new Error('Telefone do cliente é obrigatório');
      }
      
      // Criar ou buscar cliente
      let client = await clientRepository.getByPhone(eventData.client.phone);
      if (!client) {
        client = await clientRepository.create(eventData.client);
      }
      
      // Criar evento
      const eventPayload = {
        ...eventData,
        client,
        status: 'SCHEDULED' as EventStatus,
        createdByUserId: getCurrentUserId(),
        timestamp: Date.now()
      };
      
      await eventRepository.create(eventPayload);
      setSuccess(true);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar evento');
    } finally {
      setLoading(false);
    }
  };
  
  return {
    loading,
    error,
    success,
    createEvent,
    reset: () => {
      setError(null);
      setSuccess(false);
    }
  };
}
```

#### **3. Component Pattern**
```typescript
// src/ui/components/EventCostModal.tsx
interface EventCostModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: string;
  onSave: (costs: EventCostItem[]) => void;
}

export function EventCostModal({ 
  isOpen, 
  onClose, 
  eventId, 
  onSave 
}: EventCostModalProps) {
  const [costs, setCosts] = useState<EventCostItem[]>([]);
  const [loading, setLoading] = useState(false);
  
  const handleSave = async () => {
    setLoading(true);
    try {
      await onSave(costs);
      onClose();
    } finally {
      setLoading(false);
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <h3 className="text-lg font-semibold mb-4">Custos do Evento</h3>
        {/* Formulário de custos */}
        <div className="flex justify-end space-x-2 mt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  );
}
```

---

## 📝 **Convenções de Código**

### **Nomenclatura**
- **Arquivos**: PascalCase para componentes, camelCase para utilities
- **Componentes**: PascalCase (`EventCostModal.tsx`)
- **Funções**: camelCase (`createEvent`)
- **Variáveis**: camelCase (`eventData`)
- **Constantes**: UPPER_SNAKE_CASE (`API_BASE_URL`)
- **Types/Interfaces**: PascalCase (`EventType`)

### **Estrutura de Arquivos**
```typescript
// 1. Imports (ordenados)
import React, { useState, useEffect } from 'react';
import type { User } from '../core/domain/User';
import { eventRepository } from '../core/repositories/EventRepository';

// 2. Types (se necessário)
interface ComponentProps {
  userId: string;
  onSave: (data: any) => void;
}

// 3. Componente principal
export function ComponentName({ userId, onSave }: ComponentProps) {
  // 4. Hooks (estado, efeitos, custom hooks)
  const [loading, setLoading] = useState(false);
  const { data, error } = useCustomHook(userId);
  
  // 5. Handlers
  const handleSubmit = async () => {
    setLoading(true);
    try {
      // lógica
    } finally {
      setLoading(false);
    }
  };
  
  // 6. Render
  return (
    <div>
      {/* JSX */}
    </div>
  );
}
```

### **TypeScript Best Practices**
```typescript
// ✅ Use tipos explícitos
const user: User = { name: 'John', email: 'john@example.com' };

// ✅ Use tipos para parâmetros de função
function calculateTotal(price: number, quantity: number): number {
  return price * quantity;
}

// ✅ Use interfaces para objetos
interface EventData {
  date: string;
  startTime: string;
  client: ClientProfile;
}

// ✅ Use union types para valores limitados
type EventStatus = 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';

// ✅ Use generics para reuso
interface ApiResponse<T> {
  data: T;
  success: boolean;
}
```

---

## 🔧 **Desenvolvimento de Funcionalidades**

### **Passo a Passo**

#### **1. Definir Types**
```typescript
// src/core/domain/types.ts
export interface NewFeature {
  id: string;
  name: string;
  description: string;
  createdAt: number;
}
```

#### **2. Criar Repository**
```typescript
// src/core/repositories/NewFeatureRepository.ts
export class NewFeatureRepository extends BaseRepository<NewFeature> {
  async getActive(): Promise<NewFeature[]> {
    const q = query(
      collection(db, this.collection),
      where('isActive', '==', true)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data() as NewFeature);
  }
}
```

#### **3. Criar ViewModel**
```typescript
// src/viewmodels/useNewFeatureViewModel.ts
export function useNewFeatureViewModel() {
  const [features, setFeatures] = useState<NewFeature[]>([]);
  const [loading, setLoading] = useState(false);
  
  const loadFeatures = async () => {
    setLoading(true);
    try {
      const data = await newFeatureRepository.getActive();
      setFeatures(data);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    loadFeatures();
  }, []);
  
  return {
    features,
    loading,
    loadFeatures
  };
}
```

#### **4. Criar Componente**
```typescript
// src/ui/screens/NewFeatureScreen.tsx
export function NewFeatureScreen() {
  const { features, loading } = useNewFeatureViewModel();
  
  if (loading) return <div>Carregando...</div>;
  
  return (
    <div>
      <h1>Novas Funcionalidades</h1>
      {features.map(feature => (
        <div key={feature.id}>
          <h3>{feature.name}</h3>
          <p>{feature.description}</p>
        </div>
      ))}
    </div>
  );
}
```

#### **5. Adicionar Rota**
```typescript
// src/App.tsx
const NewFeatureScreen = lazy(() => import('./ui/screens/NewFeatureScreen'));

// Adicionar rota
<Route path="/new-feature" element={<ProtectedRoute><Layout><NewFeatureScreen /></Layout></ProtectedRoute>} />
```

---

## 🎨 **UI/UX Guidelines**

### **Componentes UI**
- Use **Tailwind CSS** para estilização
- Componentes devem ser **responsivos**
- Use **loading states** para operações assíncronas
- Implemente **error boundaries** para tratamento de erros

### **Padrões Visuais**
```typescript
// ✅ Botões
<button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors">
  Ação Principal
</button>

<button className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors">
  Ação Secundária
</button>

// ✅ Formulários
<div className="space-y-4">
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">
      Nome
    </label>
    <input
      type="text"
      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
    />
  </div>
</div>

// ✅ Cards
<div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
  <h3 className="text-lg font-semibold text-gray-900 mb-2">Título</h3>
  <p className="text-gray-600">Conteúdo do card</p>
</div>
```

### **Responsividade**
```typescript
// ✅ Grid responsivo
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {/* Cards */}
</div>

// ✅ Container
<div className="container mx-auto px-4 sm:px-6 lg:px-8">
  {/* Conteúdo */}
</div>

// ✅ Textos responsivos
<h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold">
  Título Responsivo
</h1>
```

---

## 🧪 **Testes**

### **Estrutura de Testes**
```typescript
// tests/feature-creation.spec.ts
import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  // Configurar modo de teste
  await page.addInitScript(() => {
    window.localStorage.setItem('TEST_MODE', 'true');
  });
});

test('deve criar nova funcionalidade com sucesso', async ({ page }) => {
  await page.goto('/new-feature');
  
  // Preencher formulário
  await page.getByLabel('Nome').fill('Nova Funcionalidade');
  await page.getByLabel('Descrição').fill('Descrição detalhada');
  
  // Submeter
  await page.getByRole('button', { name: 'Salvar' }).click();
  
  // Validar
  await expect(page.getByText('Funcionalidade criada com sucesso')).toBeVisible();
});
```

### **Comandos de Teste**
```bash
# Rodar todos os testes
npm run test:e2e

# Rodar teste específico
npx playwright test tests/feature-creation.spec.ts

# Rodar em modo headed
npx playwright test --headed

# Gerar relatório
npx playwright show-report
```

---

## 🐛 **Debug e Troubleshooting**

### **Ferramentas de Debug**
1. **React DevTools**: Inspecionar componentes e estado
2. **Firebase Console**: Visualizar dados em tempo real
3. **Browser Console**: Logs e erros
4. **Playwright Inspector**: Debug de testes

### **Problemas Comuns**

#### **Firebase Connection Issues**
```typescript
// Verificar configuração
console.log('Firebase Config:', {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY?.substring(0, 10) + '...',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID
});

// Testar conexão
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';

if (import.meta.env.DEV) {
  // Conectar ao emulador local para desenvolvimento
  connectFirestoreEmulator(db, 'localhost', 8080);
}
```

#### **Performance Issues**
```typescript
// Lazy loading de componentes
const HeavyComponent = lazy(() => import('./HeavyComponent'));

// Memoização de cálculos pesados
const expensiveValue = useMemo(() => {
  return calculateExpensiveValue(data);
}, [data]);

// Debounce de inputs
const debouncedSearch = useMemo(
  () => debounce((term: string) => performSearch(term), 300),
  []
);
```

#### **State Management Issues**
```typescript
// Evitar dependências desnecessárias em useEffect
useEffect(() => {
  // Effect aqui
}, [dependency1]); // Apenas dependências necessárias

// Usar callback para atualizações de estado
setCount(prevCount => prevCount + 1);
```

---

## 📦 **Build e Deploy**

### **Build Configuration**
```typescript
// vite.config.ts
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: import.meta.env.VITE_APP_NAME || 'Sistema de Gestão',
        short_name: 'Gestão',
        // ... outras configurações
      }
    })
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Otimização de bundle
          if (id.includes('firebase')) return 'vendor-firebase';
          if (id.includes('react')) return 'vendor-react';
          return 'vendor';
        }
      }
    }
  }
});
```

### **Processo de Deploy**
```bash
# 1. Build para produção
npm run build

# 2. Testar build localmente
npm run preview

# 3. Deploy (Vercel)
vercel --prod

# 4. Deploy (Firebase)
firebase deploy

# 5. Deploy (Netlify)
netlify deploy --prod --dir=dist
```

### **Variáveis de Ambiente em Produção**
```bash
# Vercel
vercel env add VITE_FIREBASE_API_KEY

# Netlify
netlify env:set VITE_FIREBASE_API_KEY "your-api-key"

# Firebase
firebase functions:config:set firebase.api_key="your-api-key"
```

---

## 🔄 **CI/CD Pipeline**

### **GitHub Actions**
```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npm run lint
      - run: npm run test:e2e

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npm run build
      - uses: vercel/action@v1
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
```

---

## 📚 **Recursos Adicionais**

### **Documentação Útil**
- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Firebase Documentation](https://firebase.google.com/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Playwright Documentation](https://playwright.dev/)

### **Ferramentas Recomendadas**
- **VS Code**: Editor com extensões React/TypeScript
- **React DevTools**: Debug de componentes
- **Firebase Emulators**: Desenvolvimento local
- **Postman**: Teste de APIs (se aplicável)

### **Comunidade**
- **Stack Overflow**: Dúvidas técnicas
- **GitHub Discussions**: Discussões do projeto
- **Discord**: Chat em tempo real (se disponível)

---

**Última atualização**: Abril 2026  
**Versão**: 1.0.0  
**Maintainers**: Equipe de Desenvolvimento
