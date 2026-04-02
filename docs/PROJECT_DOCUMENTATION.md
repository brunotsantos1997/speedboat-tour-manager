# 📚 Documentação Completa do Projeto

## 📋 **Sumário**

1. [Visão Geral](#visão-geral)
2. [Arquitetura](#arquitetura)
3. [Estrutura do Projeto](#estrutura-do-projeto)
4. [Modelo de Dados](#modelo-de-dados)
5. [Autenticação e Segurança](#autenticação-e-segurança)
6. [Telas da Aplicação](#telas-da-aplicação)
7. [Repositórios e Acesso a Dados](#repositórios-e-acesso-a-dados)
8. [ViewModels e Lógica de UI](#viewmodels-e-lógica-de-ui)
9. [Componentes Reutilizáveis](#componentes-reutilizáveis)
10. [Configuração e Deploy](#configuração-e-deploy)
11. [Testes](#testes)
12. [Guia de Desenvolvimento](#guia-de-desenvolvimento)

---

## 🎯 **Visão Geral**

### **Propósito do Sistema**
Sistema completo para gestão de passeios turísticos de lancha, oferecendo:
- Gestão completa de eventos e reservas
- Controle financeiro integrado
- Sistema de vouchers personalizados
- Gestão de usuários e comissões
- Interface responsiva e PWA

### **Tecnologias Principais**
- **Frontend**: React 19 + TypeScript + Vite
- **Backend**: Firebase (Auth + Firestore + Storage)
- **Estilo**: Tailwind CSS
- **Testes**: Playwright (E2E)
- **Build**: Vite com PWA

---

## 🏗️ **Arquitetura**

### **Arquitetura Geral**
```
┌─────────────────────────────────────────────────────────────┐
│                    UI Layer (React)                          │
├─────────────────────────────────────────────────────────────┤
│  Screens  │  Components  │  Layouts  │  Hooks  │  Contexts  │
├─────────────────────────────────────────────────────────────┤
│                 ViewModels (Business Logic)                  │
├─────────────────────────────────────────────────────────────┤
│                Repositories (Data Access)                    │
├─────────────────────────────────────────────────────────────┤
│                 Domain Layer (Types & Rules)                │
├─────────────────────────────────────────────────────────────┤
│               Firebase (Firestore + Auth)                   │
└─────────────────────────────────────────────────────────────┘
```

### **Padrões Arquiteturais**
- **Repository Pattern**: Abstração do acesso a dados
- **MVVM**: Model-View-ViewModel com React Hooks
- **Domain-Driven Design**: Separação clara de domínio
- **Component-Based**: Componentes reutilizáveis e compostáveis

---

## 📁 **Estrutura do Projeto**

### **Diretórios Principais**

```
src/
├── ui/                      # Camada de apresentação
│   ├── components/          # Componentes reutilizáveis (16)
│   ├── screens/            # Telas da aplicação (29)
│   ├── layouts/            # Layouts específicos
│   ├── hooks/              # Hooks personalizados
│   ├── contexts/           # Contextos da UI
│   └── tutorials/          # Tutoriais interativos (10)
├── contexts/               # Contextos globais
├── lib/                    # Bibliotecas especializadas
├── core/                   # Lógica de negócio
│   ├── domain/             # Tipos e regras de domínio
│   ├── repositories/       # Acesso a dados (17)
│   └── utils/              # Utilitários do negócio
├── viewmodels/             # ViewModels (22)
├── assets/                 # Arquivos estáticos
└── main.tsx               # Ponto de entrada
```

### **Arquivos de Configuração**
- `vite.config.ts` - Configuração do Vite e PWA
- `playwright.config.ts` - Configuração de testes E2E
- `firestore.rules` - Regras de segurança do Firestore
- `tailwind.config.js` - Configuração do Tailwind
- `eslint.config.js` - Regras de linting

---

## 🗄️ **Modelo de Dados**

### **Entidades Principais**

#### **User**
```typescript
interface User {
  id: string;
  name: string;
  email: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'PASSWORD_RESET_REQUESTED';
  role: 'OWNER' | 'SUPER_ADMIN' | 'ADMIN' | 'SELLER';
  commissionPercentage?: number;
  commissionSettings?: UserCommissionSettings;
  mustChangePassword?: boolean;
  secretQuestion?: string;
  secretAnswerHash?: string;
  calendarSettings?: {
    calendarId?: string;
    autoSync: boolean;
  };
  completedTours?: string[];
}
```

#### **EventType (Evento/Passeio)**
```typescript
interface EventType {
  id: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED' | 'PRE_SCHEDULED' | 'PENDING_REFUND' | 'REFUNDED' | 'ARCHIVED_COMPLETED' | 'ARCHIVED_CANCELLED';
  paymentStatus?: 'PENDING' | 'CONFIRMED';
  boat: Boat;
  boardingLocation: BoardingLocation;
  tourType?: TourType;
  products: SelectedProduct[];
  client: ClientProfile;
  passengerCount: number;
  subtotal: number;
  total: number;
  tax?: number;
  observations?: string;
  createdByUserId?: string;
  payments?: Payment[];
  // ... campos financeiros
}
```

#### **Product**
```typescript
interface Product {
  id: string;
  name: string;
  price?: number;
  cost?: number;
  hourlyPrice?: number;
  hourlyCost?: number;
  pricingType: 'FIXED' | 'PER_PERSON' | 'HOURLY';
  iconKey: string;
  isDefaultCourtesy: boolean;
  isArchived?: boolean;
}
```

#### **Boat**
```typescript
interface Boat {
  id: string;
  name: string;
  capacity: number;
  size: number; // pés
  pricePerHour: number;
  costPerHour?: number;
  pricePerHalfHour: number;
  costPerHalfHour?: number;
  organizationTimeMinutes: number;
  isArchived?: boolean;
}
```

### **Tipos Importantes**
- **PaymentMethod**: 'PIX' | 'CARD_CREDIT' | 'CARD_DEBIT' | 'CASH' | 'TRANSFER' | 'OTHER'
- **PaymentType**: 'DOWN_PAYMENT' | 'BALANCE' | 'FULL'
- **EventStatus**: Status do evento (programado, concluído, cancelado, etc.)
- **UserRole**: Níveis de permissão de usuário

---

## 🔐 **Autenticação e Segurança**

### **Sistema de Autenticação**
- **Firebase Authentication**: Login seguro com email/senha
- **Google OAuth**: Integração opcional com Google
- **Recuperação de Senha**: Via email e pergunta secreta
- **Aprovação Administrativa**: Novos usuários precisam de aprovação

### **Níveis de Permissão**
1. **OWNER**: Acesso completo ao sistema
2. **SUPER_ADMIN**: Gestão administrativa completa
3. **ADMIN**: Gestão de usuários e operações
4. **SELLER**: Acesso a vendas e dashboard

### **Regras de Segurança Firestore**
- Validação de autenticação em todas as operações
- Verificação de status de aprovação do usuário
- Controle granular por coleção e documento
- Funções auxiliares para verificação de permissões

### **Segurança na Aplicação**
- **DOMPurify**: Sanitização de HTML contra XSS
- **bcryptjs**: Hash de senhas para perguntas secretas
- **Protected Routes**: Rotas protegidas por nível de acesso
- **Input Validation**: Validação de dados de entrada

---

## 📱 **Telas da Aplicação**

### **Telas Principais (29 telas)**

#### **Gestão de Eventos**
- **DashboardScreen**: Visão geral com métricas e eventos recentes
- **CreateEventScreen**: Criação de novos eventos/passeios
- **VoucherScreen**: Visualização pública de vouchers

#### **Gestão de Recursos**
- **BoatsScreen**: Gestão da frota de embarcações
- **ProductsScreen**: Gestão de produtos e serviços
- **BoardingLocationsScreen**: Locais de embarque
- **TourTypesScreen**: Tipos de passeios

#### **Financeiro**
- **FinanceScreen**: Visão financeira geral
- **CashBookScreen**: Livro caixa detalhado
- **ExpensesScreen**: Gestão de despesas
- **ExpenseCategoriesScreen**: Categorias de despesas

#### **Clientes**
- **ClientHistoryScreen**: Histórico de clientes
- **UserManagementScreen**: Gestão de usuários
- **UserCommissionsScreen**: Comissões dos usuários
- **CommissionReportScreen**: Relatórios de comissões

#### **Configuração**
- **CompanyDataScreen**: Dados da empresa
- **VoucherTermsScreen**: Termos dos vouchers
- **VoucherAppearanceScreen**: Aparência dos vouchers
- **ProfileScreen**: Perfil do usuário
- **GoogleSyncScreen**: Sincronização Google Calendar

#### **Autenticação**
- **LoginScreen**: Tela de login
- **SignupScreen**: Cadastro de usuários
- **ForgotPasswordScreen**: Recuperação de senha
- **PendingApprovalScreen**: Aguardando aprovação

#### **Públicas**
- **LandingScreen**: Página inicial
- **PrivacyPolicyScreen**: Política de privacidade
- **TermsOfServiceScreen**: Termos de serviço

---

## 🗃️ **Repositórios e Acesso a Dados**

### **Repositórios Principais (17)**

#### **Repositórios de Negócio**
- **EventRepository**: Gestão de eventos/passeios
- **ClientRepository**: Gestão de clientes
- **BoatRepository**: Gestão de embarcações
- **ProductRepository**: Gestão de produtos/serviços
- **PaymentRepository**: Gestão de pagamentos

#### **Repositórios Financeiros**
- **ExpenseRepository**: Gestão de despesas
- **ExpenseCategoryRepository**: Categorias de despesas
- **IncomeRepository**: Gestão de receitas
- **CommissionRepository**: Cálculo de comissões

#### **Repositórios de Configuração**
- **CompanyDataRepository**: Dados da empresa
- **VoucherTermsRepository**: Termos dos vouchers
- **VoucherAppearanceRepository**: Aparência dos vouchers
- **TourTypeRepository**: Tipos de passeios
- **BoardingLocationRepository**: Locais de embarque

#### **Repositórios Auxiliares**
- **AuditLogRepository**: Log de auditoria
- **GoogleCalendarRepository**: Integração com Google Calendar

### **Padrão de Repositório**
```typescript
// Exemplo de padrão
export class EventRepository {
  async create(event: EventType): Promise<void> {
    // Lógica de criação
  }
  
  async getById(id: string): Promise<EventType | null> {
    // Lógica de busca
  }
  
  async update(id: string, data: Partial<EventType>): Promise<void> {
    // Lógica de atualização
  }
  
  async delete(id: string): Promise<void> {
    // Lógica de exclusão
  }
}
```

---

## 🧠 **ViewModels e Lógica de UI**

### **ViewModels Principais (22)**

#### **ViewModels de Gestão**
- **useCreateEventViewModel**: Lógica para criação de eventos
- **useDashboardViewModel**: Lógica do dashboard
- **useClientHistoryViewModel**: Gestão de histórico de clientes
- **useFinanceViewModel**: Lógica financeira

#### **ViewModels de Recursos**
- **useBoatsViewModel**: Gestão de embarcações
- **useProductsViewModel**: Gestão de produtos
- **useBoardingLocationsViewModel**: Gestão de locais
- **useTourTypesViewModel**: Gestão de tipos de passeio

#### **ViewModels Financeiros**
- **useCashBookViewModel**: Livro caixa
- **useExpenseViewModel**: Gestão de despesas
- **useCommissionReportViewModel**: Relatórios de comissão

#### **ViewModels de Configuração**
- **CompanyDataViewModel**: Dados da empresa
- **VoucherTermsViewModel**: Termos dos vouchers
- **VoucherAppearanceViewModel**: Aparência dos vouchers

#### **ViewModels Auxiliares**
- **useVoucherViewModel**: Lógica de vouchers
- **useSharedEventViewModel**: Compartilhamento de eventos
- **useEventCostViewModel**: Custos de eventos
- **useGoogleSyncViewModel**: Sincronização Google

### **Padrão de ViewModel**
```typescript
// Exemplo de padrão
export function useCreateEventViewModel() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const createEvent = async (eventData: EventData) => {
    setLoading(true);
    try {
      // Lógica de criação
      await eventRepository.create(eventData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  return {
    loading,
    error,
    createEvent
  };
}
```

---

## 🧩 **Componentes Reutilizáveis**

### **Componentes Principais (16)**

#### **Componentes de Layout**
- **Layout**: Layout principal da aplicação
- **ProtectedRoute**: Proteção de rotas por permissão

#### **Componentes de Formulário**
- **MoneyInput**: Input para valores monetários
- **CustomTimePicker**: Seletor de horário personalizado
- **EndTimePicker**: Seletor de horário de término
- **PasswordStrengthMeter**: Medidor de força de senha

#### **Componentes de Interface**
- **ConfirmationModal**: Modal de confirmação
- **InformationModal**: Modal de informações
- **Toast**: Notificações toast
- **IconPicker**: Seletor de ícones

#### **Componentes de Negócio**
- **EventCostModal**: Modal de custos de eventos
- **EventQuickEditModal**: Edição rápida de eventos
- **SharedEventModal**: Compartilhamento de eventos
- **PaymentModal**: Modal de pagamentos
- **TimePickerModal**: Modal de seleção de tempo

#### **Componentes Auxiliares**
- **Tutorial**: Componente de tutoriais interativos

### **Padrão de Componentes**
```typescript
// Exemplo de padrão
interface ComponentProps {
  // Props tipadas
}

export function ComponentName({ prop }: ComponentProps) {
  // Lógica do componente
  
  return (
    <div>
      {/* JSX do componente */}
    </div>
  );
}
```

---

## ⚙️ **Configuração e Deploy**

### **Configuração do Ambiente**

#### **Variáveis de Ambiente**
```env
# Firebase
VITE_FIREBASE_API_KEY=sua_api_key
VITE_FIREBASE_AUTH_DOMAIN=seu_auth_domain
VITE_FIREBASE_PROJECT_ID=seu_project_id
VITE_FIREBASE_STORAGE_BUCKET=seu_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=seu_messaging_sender_id
VITE_FIREBASE_APP_ID=seu_app_id
VITE_FIREBASE_MEASUREMENT_ID=seu_measurement_id

# Aplicação
VITE_APP_NAME=Nome da Sua Empresa
```

#### **Configuração PWA**
- **Nome**: Configurável via `VITE_APP_NAME`
- **Tema**: #2563eb (azul)
- **Ícones**: 192x192 e 512x512
- **Start URL**: /dashboard
- **Display**: Standalone

### **Deploy**

#### **Plataformas Compatíveis**
- **Vercel**: Deploy automático com GitHub integration
- **Netlify**: Deploy contínuo com form functions
- **Firebase Hosting**: Hosting estático com CDN
- **GitHub Pages**: Hosting gratuito para projetos públicos

#### **Processo de Deploy**
```bash
# Build para produção
npm run build

# Deploy (exemplo Vercel)
vercel --prod

# Deploy (exemplo Firebase)
firebase deploy
```

---

## 🧪 **Testes**

### **Configuração de Testes**
- **Framework**: Playwright
- **Tipo**: End-to-End (E2E)
- **Browser**: Chromium (configurável para outros)
- **Report**: HTML com screenshots e vídeos

### **Testes Existentes**
- **client-creation.spec.ts**: Teste de criação de clientes
  - Login automático em modo de teste
  - Navegação para tela de criar passeio
  - Cadastro de novo cliente
  - Validação de informações

### **Estrutura de Testes**
```typescript
import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  // Configuração pré-teste
  await page.addInitScript(() => {
    window.localStorage.setItem('TEST_MODE', 'true');
  });
});

test('descrição do teste', async ({ page }) => {
  // Lógica do teste
});
```

### **Comandos de Teste**
```bash
# Rodar todos os testes
npm run test:e2e

# Rodar em modo headed (navegador visível)
npx playwright test --headed

# Gerar relatório
npx playwright show-report
```

---

## 👨‍💻 **Guia de Desenvolvimento**

### **Setup do Ambiente**

#### **Pré-requisitos**
- Node.js 18+
- npm ou yarn
- Conta Firebase com Firestore configurado

#### **Instalação**
```bash
# Clonar repositório
git clone <repository-url>
cd projeto

# Instalar dependências
npm install

# Configurar ambiente
cp .env.example .env
# Editar .env com suas credenciais

# Iniciar desenvolvimento
npm run dev
```

### **Fluxo de Desenvolvimento**

#### **1. Criação de Nova Funcionalidade**
```bash
# Criar branch
git checkout -b feature/nova-funcionalidade

# Desenvolver
# - Criar types em src/core/domain/
# - Implementar repository em src/core/repositories/
# - Criar viewmodel em src/viewmodels/
# - Criar screen em src/ui/screens/
# - Adicionar rota em App.tsx
```

#### **2. Padrões de Código**
- **TypeScript**: Tipagem estrita em todo o código
- **ESLint**: Seguir regras configuradas
- **Componentes**: Usar padrão funcional com hooks
- **Nomenclatura**: CamelCase para variáveis, PascalCase para componentes

#### **3. Boas Práticas**
- **Error Handling**: Sempre tratar erros com try/catch
- **Loading States**: Indicar carregamento ao usuário
- **Formulários**: Validação de dados de entrada
- **Performance**: Lazy loading para telas pesadas

### **Debug e Troubleshooting**

#### **Problemas Comuns**
- **Build falha**: Limpar cache com `rm -rf node_modules`
- **Firebase connection**: Verificar variáveis de ambiente
- **Permissões negadas**: Verificar regras do Firestore
- **PWA não instala**: Verificar manifesto e service worker

#### **Ferramentas de Debug**
- **Console Browser**: Logs e erros
- **React DevTools**: Inspeção de componentes
- **Firestore Console**: Visualização de dados
- **Playwright Inspector**: Debug de testes

### **Contribuição**

#### **Pull Request Process**
1. Fork do projeto
2. Branch feature/nova-funcionalidade
3. Commits descritivos
4. Push para fork
5. Pull Request com descrição detalhada

#### **Code Review**
- Revisão de código por peer
- Validação de testes
- Verificação de performance
- Documentação atualizada

---

## 📊 **Métricas e Performance**

### **Métricas da Aplicação**
- **Performance**: Lazy loading e code splitting
- **Bundle Size**: Otimizado com manual chunks
- **PWA Score**: Configurado para máxima pontuação
- **SEO**: Meta tags e estrutura semântica

### **Monitoramento**
- **Error Tracking**: Console e logs estruturados
- **Performance Metrics**: Tempos de carregamento
- **User Analytics**: Firebase Analytics (opcional)
- **Uso de Features**: Métricas de adoção

---

## 🔮 **Roadmap Futuro**

### **Melhorias Planejadas**
- **Offline Support**: Sincronização automática
- **Push Notifications**: Notificações de eventos
- **Multi-idioma**: Internacionalização i18n
- **Advanced Analytics**: Dashboard de métricas
- **Mobile App**: Aplicativo nativo

### **Escalabilidade**
- **Microservices**: Separação de serviços
- **API Gateway**: Gerenciamento de APIs
- **Cache Layer**: Redis para performance
- **CDN**: Distribuição global de conteúdo

---

## 📞 **Suporte e Contato**

### **Recursos de Ajuda**
- **Documentação**: Este arquivo e README.md
- **Issues**: GitHub Issues para bugs e features
- **Guias**: Arquivos .md específicos (GOOGLE_AUTH_SETUP.md)
- **Relatórios**: SECURITY_REPORT_PTBR.md

### **Comunidade**
- **Contribuição**: Pull requests bem-vindas
- **Feedback**: Issues e discussões no GitHub
- **Suporte**: Respostas a issues em tempo hábil

---

**Última atualização**: Abril 2026  
**Versão**: 1.0.0  
**Maintainers**: Equipe de Desenvolvimento
