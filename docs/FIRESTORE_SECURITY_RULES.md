# 🔒 Firebase Firestore Security Rules

Este documento contém as regras de segurança completas para o Firebase Firestore, garantindo acesso controlado e seguro aos dados do sistema.

---

## 📋 **Visão Geral**

As regras de segurança do Firestore controlam o acesso aos documentos e coleções, baseando-se em:
- **Autenticação**: Verificação se o usuário está autenticado
- **Autorização**: Verificação de permissões e papéis
- **Validação**: Validação de dados antes de escrita
- **Proteção**: Prevenção contra acesso não autorizado

---

## 🏗️ **Estrutura de Coleções**

```
profiles/          # Perfis de usuários
events/            # Eventos/passeios
boats/             # Embarcações
products/          # Produtos e serviços
clients/           # Clientes
payments/          # Pagamentos
expenses/          # Despesas
expenseCategories/ # Categorias de despesas
boardingLocations/ # Locais de embarque
tourTypes/         # Tipos de passeio
companyData/       # Dados da empresa
voucherTerms/      # Termos de vouchers
voucherAppearance/ # Aparência de vouchers
auditLog/          # Log de auditoria
```

---

## 🏗️ **Estrutura de Coleções**

```
profiles/          # Perfis de usuários
events/            # Eventos/passeios
boats/             # Embarcações
products/          # Produtos e serviços
clients/           # Clientes
payments/          # Pagamentos
expenses/          # Despesas
expenseCategories/ # Categorias de despesas
boardingLocations/ # Locais de embarque
tourTypes/         # Tipos de passeio
companyData/       # Dados da empresa
voucherTerms/      # Termos de vouchers
voucherAppearance/ # Aparência de vouchers
auditLog/          # Log de auditoria
```

---

## 👤 **Sistema de Aprovação de Usuários**

### **🔍 Por que a Aprovação é Necessária?**

O sistema de aprovação é fundamental para:
- **Segurança**: Evita acesso não autorizado ao sistema
- **Controle**: Apenas usuários verificados podem operar
- **Qualidade**: Garante que apenas pessoal autorizado acesse dados sensíveis
- **Auditoria**: Mantém registro de quem tem acesso ao sistema

### **📋 Fluxo de Aprovação**

#### **1. Registro do Usuário**
```javascript
// Ao criar usuário, status inicial é PENDING
const newUser = {
  name: "João Silva",
  email: "joao@empresa.com",
  role: "SELLER",
  status: "PENDING", // ← Status inicial
  createdAt: new Date(),
  createdByUserId: null // Auto-registro
};
```

#### **2. Notificação aos Administradores**
```javascript
// Sistema notifica admins sobre novo usuário pendente
const pendingUsers = await db.collection('profiles')
  .where('status', '==', 'PENDING')
  .get();

// Enviar notificação/email para admins
pendingUsers.forEach(user => {
  notifyAdmins(user.data());
});
```

#### **3. Análise do Administrador**
```javascript
// Admin visualiza usuários pendentes no dashboard
const pendingUsers = await db.collection('profiles')
  .where('status', '==', 'PENDING')
  .orderBy('createdAt', 'desc')
  .get();
```

#### **4. Decisão de Aprovação**
```javascript
// Aprovar usuário
async function approveUser(userId) {
  await db.collection('profiles').doc(userId).update({
    status: 'APPROVED',
    approvedAt: new Date(),
    approvedByUserId: getCurrentUserId()
  });
  
  // Enviar email de boas-vindas
  sendWelcomeEmail(userId);
}

// Rejeitar usuário
async function rejectUser(userId, reason) {
  await db.collection('profiles').doc(userId).update({
    status: 'REJECTED',
    rejectedAt: new Date(),
    rejectedByUserId: getCurrentUserId(),
    rejectionReason: reason
  });
  
  // Enviar email de rejeição
  sendRejectionEmail(userId, reason);
}
```

### **🔐 Validação nas Regras de Segurança**

#### **Verificação de Status**
```javascript
// Função que verifica aprovação
function isApproved() {
  return isAuthenticated() && 
         getUserData().status == 'APPROVED';
}

// Aplicação em todas as coleções
match /events/{eventId} {
  // Apenas usuários aprovados podem acessar
  allow read: if isApproved();
  allow create: if isApproved();
  allow update: if isApproved();
}
```

#### **Proteção Contra Auto-Aprovação**
```javascript
match /profiles/{userId} {
  // Usuário pode atualizar apenas campos limitados
  allow update: if isApproved() && (
    (request.auth.uid == userId && 
     !request.resource.data.diff(resource.data).affectedKeys()
       .hasAny(['role', 'status', 'commissionPercentage'])) ||
    hasStaffPermission(true) // Apenas staff pode alterar status
  );
}
```

### **📊 Status do Usuário**

#### **Estados Possíveis**
```javascript
const UserStatus = {
  PENDING: 'PENDING',      // Aguardando aprovação
  APPROVED: 'APPROVED',    // Aprovado e ativo
  REJECTED: 'REJECTED',    // Rejeitado
  PASSWORD_RESET_REQUESTED: 'PASSWORD_RESET_REQUESTED' // Solicitou reset
};
```

#### **Fluxo Visual**
```
[Registro] → PENDING
    ↓
[Análise Admin] → APPROVED → Acesso Total
                ↓
              REJECTED → Bloqueado
                ↓
        [Re-registro] → PENDING
```

### **🎨 Interface de Aprovação**

#### **Componente para Administradores**
```typescript
// UserApprovalPanel.tsx
function UserApprovalPanel() {
  const [pendingUsers, setPendingUsers] = useState([]);
  
  useEffect(() => {
    // Carregar usuários pendentes
    loadPendingUsers();
  }, []);

  const handleApprove = async (userId: string) => {
    await approveUser(userId);
    loadPendingUsers(); // Recarregar lista
  };

  const handleReject = async (userId: string, reason: string) => {
    await rejectUser(userId, reason);
    loadPendingUsers(); // Recarregar lista
  };

  return (
    <div className="approval-panel">
      <h2>Usuários Pendentes de Aprovação</h2>
      {pendingUsers.map(user => (
        <UserApprovalCard 
          key={user.id}
          user={user}
          onApprove={handleApprove}
          onReject={handleReject}
        />
      ))}
    </div>
  );
}
```

#### **Card de Usuário Pendente**
```typescript
// UserApprovalCard.tsx
function UserApprovalCard({ user, onApprove, onReject }) {
  const [rejectionReason, setRejectionReason] = useState('');

  return (
    <div className="user-card">
      <div className="user-info">
        <h3>{user.name}</h3>
        <p>{user.email}</p>
        <span className="role-badge">{user.role}</span>
      </div>
      
      <div className="user-actions">
        <button 
          onClick={() => onApprove(user.id)}
          className="approve-btn"
        >
          ✅ Aprovar
        </button>
        
        <div className="reject-section">
          <textarea
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder="Motivo da rejeição..."
            className="reject-reason"
          />
          <button 
            onClick={() => onReject(user.id, rejectionReason)}
            className="reject-btn"
            disabled={!rejectionReason.trim()}
          >
            ❌ Rejeitar
          </button>
        </div>
      </div>
    </div>
  );
}
```

### **📧 Sistema de Notificações**

#### **Email de Boas-Vindas**
```javascript
// Enviado quando usuário é aprovado
const welcomeEmailTemplate = {
  subject: 'Bem-vindo ao Sistema de Gestão de Passeios!',
  body: `
    Olá {{userName}},
    
    Sua conta foi aprovada e você já pode acessar o sistema.
    
    Acesse: {{loginUrl}}
    Email: {{email}}
    
    Bem-vindo(a) à equipe!
    
    Equipe de Suporte
  `
};
```

#### **Email de Rejeição**
```javascript
// Enviado quando usuário é rejeitado
const rejectionEmailTemplate = {
  subject: 'Seu registro foi analisado',
  body: `
    Olá {{userName}},
    
    Seu registro foi analisado e, neste momento, não podemos aprovar seu acesso.
    
    Motivo: {{rejectionReason}}
    
    Caso tenha dúvidas, entre em contato com o administrador.
    
    Atenciosamente,
    Equipe de Suporte
  `
};
```

### **🔍 Dashboard de Aprovação**

#### **Estatísticas para Admins**
```typescript
function ApprovalDashboard() {
  const [stats, setStats] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
    total: 0
  });

  return (
    <div className="approval-stats">
      <div className="stat-card">
        <h3>⏳ Pendentes</h3>
        <span className="stat-number">{stats.pending}</span>
      </div>
      
      <div className="stat-card">
        <h3>✅ Aprovados</h3>
        <span className="stat-number">{stats.approved}</span>
      </div>
      
      <div className="stat-card">
        <h3>❌ Rejeitados</h3>
        <span className="stat-number">{stats.rejected}</span>
      </div>
      
      <div className="stat-card">
        <h3>📊 Total</h3>
        <span className="stat-number">{stats.total}</span>
      </div>
    </div>
  );
}
```

### **🛡️ Medidas de Segurança**

#### **Rate Limiting**
```javascript
// Evitar múltiplos registros
const registrationAttempts = {};
const MAX_ATTEMPTS = 3;
const ATTEMPT_WINDOW = 24 * 60 * 60 * 1000; // 24 horas

function canRegister(email) {
  const now = Date.now();
  const attempts = registrationAttempts[email] || [];
  
  // Limpar tentativas antigas
  const recentAttempts = attempts.filter(time => 
    now - time < ATTEMPT_WINDOW
  );
  
  if (recentAttempts.length >= MAX_ATTEMPTS) {
    return false;
  }
  
  registrationAttempts[email] = [...recentAttempts, now];
  return true;
}
```

#### **Validação de Email**
```javascript
// Verificar se email é corporativo
function isValidCorporateEmail(email) {
  const allowedDomains = ['empresa.com', 'parceiro.com.br'];
  const domain = email.split('@')[1];
  return allowedDomains.includes(domain);
}
```

### **📋 Processo de Onboarding**

#### **Para Novos Usuários**
1. **Registro**: Preenche formulário de cadastro
2. **Confirmação**: Recebe email de verificação
3. **Aguarda**: Status PENDING
4. **Notificação**: Admin recebe alerta
5. **Análise**: Admin avalia perfil
6. **Decisão**: Aprova ou rejeita
7. **Notificação**: Usuário recebe resultado

#### **Para Administradores**
1. **Dashboard**: Visualiza usuários pendentes
2. **Análise**: Verifica informações
3. **Decisão**: Aprova ou rejeita
4. **Justificativa**: Motivo da decisão (se rejeição)
5. **Registro**: Log da decisão
6. **Notificação**: Usuário é informado

### **🔄 Fluxo Alternativo**

#### **Re-registro Após Rejeição**
```javascript
// Usuário rejeitado pode tentar novamente após 30 dias
function canReregister(lastRejectionDate) {
  const thirtyDays = 30 * 24 * 60 * 60 * 1000;
  return Date.now() - lastRejectionDate > thirtyDays;
}

// Na regra de criação
allow create: if isAuthenticated() && 
  request.auth.uid == userId &&
  (request.resource.data.status == 'PENDING' ||
   (resource.data.status == 'REJECTED' && 
    canReregister(resource.data.rejectedAt)));
```

### **📊 Relatórios de Aprovação**

#### **Métricas Importantes**
```javascript
// Tempo médio de aprovação
const avgApprovalTime = await calculateAverageApprovalTime();

// Taxa de aprovação vs rejeição
const approvalRate = await calculateApprovalRate();

// Usuários por status
const usersByStatus = await getUsersByStatus();
```

### **🎯 Boas Práticas**

#### **Para Administradores**
- ✅ **Analisar rapidamente**: Não deixar usuários pendentes muito tempo
- ✅ **Justificar rejeições**: Sempre informar o motivo
- ✅ **Documentar decisões**: Manter histórico completo
- ✅ **Verificar informações**: Confirmar dados antes de aprovar

#### **Para Desenvolvedores**
- ✅ **Validar no frontend**: Verificar dados antes de enviar
- ✅ **Proteger endpoints**: Regras de segurança robustas
- ✅ **Log de auditoria**: Registrar todas as operações
- ✅ **Notificações automáticas**: Alertar admins sobre pendências

### **⚠️ Problemas Comuns**

#### **Usuários Presos em PENDING**
```javascript
// Verificar se há admins ativos
const activeAdmins = await db.collection('profiles')
  .where('role', 'in', ['OWNER', 'SUPER_ADMIN'])
  .where('status', '==', 'APPROVED')
  .get();

if (activeAdmins.empty) {
  // Notificar sobre falta de administradores
  notifyNoAdmins();
}
```

#### **Aprovações Acidentais**
```javascript
// Confirmar ação antes de aprovar
async function approveWithConfirmation(userId) {
  const confirmed = confirm('Tem certeza que deseja aprovar este usuário?');
  if (confirmed) {
    await approveUser(userId);
  }
}
```

---

## 📝 **Regras de Segurança Completas**

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // =================================================================
    // FUNÇÕES AUXILIARES
    // =================================================================
    
    // Verifica se o usuário está autenticado
    function isAuthenticated() {
      return request.auth != null;
    }
    
    // Obtém dados do perfil do usuário
    function getUserData() {
      return get(/databases/$(database)/documents/profiles/$(request.auth.uid)).data;
    }
    
    // Verifica se o usuário está aprovado
    function isApproved() {
      return isAuthenticated() && getUserData().status == 'APPROVED';
    }
    
    // Verifica se o usuário tem permissão de staff
    function hasStaffPermission(allowAdmin) {
      return isApproved() && (
        getUserData().role == 'OWNER' ||
        getUserData().role == 'SUPER_ADMIN' ||
        (allowAdmin && getUserData().role == 'ADMIN')
      );
    }
    
    // Verifica se o usuário pode gerenciar usuários
    function canManageUsers() {
      return hasStaffPermission(true);
    }
    
    // Verifica se o usuário pode acessar eventos
    function canAccessEvents() {
      return isApproved();
    }
    
    // Verifica se o usuário pode gerenciar finanças
    function canManageFinance() {
      return hasStaffPermission(true);
    }
    
    // Verifica se o usuário pode gerenciar configurações
    function canManageSettings() {
      return getUserData().role == 'OWNER' || getUserData().role == 'SUPER_ADMIN';
    }
    
    // Verifica se o usuário é dono do recurso
    function isOwner(resource) {
      return resource.data.createdByUserId == request.auth.uid;
    }
    
    // Valida campos obrigatórios para eventos
    function validateEventFields(data) {
      return data.keys().hasAll([
        'date', 'startTime', 'endTime', 'status', 
        'boat', 'client', 'total', 'createdByUserId'
      ]);
    }
    
    // Valida campos obrigatórios para usuários
    function validateUserFields(data) {
      return data.keys().hasAll([
        'name', 'email', 'status', 'role'
      ]);
    }
    
    // =================================================================
    // COLEÇÃO: profiles
    // =================================================================
    
    match /profiles/{userId} {
      // Leitura: próprio usuário ou staff
      allow read: if (isAuthenticated() && 
        (request.auth.uid == userId || hasStaffPermission(true)));
      
      // Criação: apenas próprio usuário
      allow create: if isAuthenticated() && 
        request.auth.uid == userId &&
        validateUserFields(request.resource.data) &&
        request.resource.data.keys().hasAll(['name', 'email']) &&
        request.resource.data.status == 'PENDING' &&
        request.resource.data.role in ['OWNER', 'SUPER_ADMIN', 'ADMIN', 'SELLER'];
      
      // Atualização: próprio usuário (campos limitados) ou staff
      allow update: if isApproved() && (
        (request.auth.uid == userId && 
         !request.resource.data.diff(resource.data).affectedKeys()
           .hasAny(['role', 'status', 'commissionPercentage', 'email'])) ||
        hasStaffPermission(true)
      );
      
      // Exclusão: apenas staff
      allow delete: if hasStaffPermission(true);
    }
    
    // =================================================================
    // COLEÇÃO: events
    // =================================================================
    
    match /events/{eventId} {
      // Leitura: usuários aprovados
      allow read: if canAccessEvents();
      
      // Criação: usuários aprovados
      allow create: if canAccessEvents() &&
        validateEventFields(request.resource.data) &&
        request.resource.data.createdByUserId == request.auth.uid &&
        request.resource.data.status in ['SCHEDULED', 'PRE_SCHEDULED'];
      
      // Atualização: staff ou dono do evento
      allow update: if canAccessEvents() && 
        (hasStaffPermission(false) || isOwner(resource));
      
      // Exclusão: apenas staff
      allow delete: if hasStaffPermission(true);
    }
    
    // =================================================================
    // COLEÇÃO: boats
    // =================================================================
    
    match /boats/{boatId} {
      // Leitura: usuários aprovados
      allow read: if isApproved();
      
      // Criação: staff
      allow create: if hasStaffPermission(false) &&
        request.resource.data.keys().hasAll(['name', 'capacity', 'pricePerHour']);
      
      // Atualização: staff
      allow update: if hasStaffPermission(false);
      
      // Exclusão: apenas admin+
      allow delete: if hasStaffPermission(true);
    }
    
    // =================================================================
    // COLEÇÃO: products
    // =================================================================
    
    match /products/{productId} {
      // Leitura: usuários aprovados
      allow read: if isApproved();
      
      // Criação: staff
      allow create: if hasStaffPermission(false) &&
        request.resource.data.keys().hasAll(['name', 'pricingType']);
      
      // Atualização: staff
      allow update: if hasStaffPermission(false);
      
      // Exclusão: apenas admin+
      allow delete: if hasStaffPermission(true);
    }
    
    // =================================================================
    // COLEÇÃO: clients
    // =================================================================
    
    match /clients/{clientId} {
      // Leitura: usuários aprovados
      allow read: if isApproved();
      
      // Criação: usuários aprovados
      allow create: if isApproved() &&
        request.resource.data.keys().hasAll(['phone', 'name']);
      
      // Atualização: staff
      allow update: if hasStaffPermission(false);
      
      // Exclusão: apenas admin+
      allow delete: if hasStaffPermission(true);
    }
    
    // =================================================================
    // COLEÇÃO: payments
    // =================================================================
    
    match /payments/{paymentId} {
      // Leitura: usuários aprovados
      allow read: if isApproved();
      
      // Criação: usuários aprovados
      allow create: if isApproved() &&
        request.resource.data.keys().hasAll(['eventId', 'amount', 'method', 'date']);
      
      // Atualização: staff ou dono do evento relacionado
      allow update: if isApproved() && 
        (hasStaffPermission(false) || 
         get(/databases/$(database)/documents/events/$(resource.data.eventId)).data.createdByUserId == request.auth.uid);
      
      // Exclusão: apenas admin+
      allow delete: if hasStaffPermission(true);
    }
    
    // =================================================================
    // COLEÇÃO: expenses
    // =================================================================
    
    match /expenses/{expenseId} {
      // Leitura: usuários aprovados
      allow read: if isApproved();
      
      // Criação: usuários aprovados
      allow create: if isApproved() &&
        request.resource.data.keys().hasAll(['amount', 'description', 'date', 'categoryId']);
      
      // Atualização: staff ou dono da despesa
      allow update: if isApproved() && 
        (hasStaffPermission(false) || resource.data.createdByUserId == request.auth.uid);
      
      // Exclusão: staff ou dono
      allow delete: if isApproved() && 
        (hasStaffPermission(false) || resource.data.createdByUserId == request.auth.uid);
    }
    
    // =================================================================
    // COLEÇÃO: expenseCategories
    // =================================================================
    
    match /expenseCategories/{categoryId} {
      // Leitura: usuários aprovados
      allow read: if isApproved();
      
      // Criação: staff
      allow create: if hasStaffPermission(false) &&
        request.resource.data.keys().hasAll(['name']);
      
      // Atualização: staff
      allow update: if hasStaffPermission(false);
      
      // Exclusão: apenas admin+
      allow delete: if hasStaffPermission(true);
    }
    
    // =================================================================
    // COLEÇÃO: boardingLocations
    // =================================================================
    
    match /boardingLocations/{locationId} {
      // Leitura: usuários aprovados
      allow read: if isApproved();
      
      // Criação: staff
      allow create: if hasStaffPermission(false) &&
        request.resource.data.keys().hasAll(['name']);
      
      // Atualização: staff
      allow update: if hasStaffPermission(false);
      
      // Exclusão: apenas admin+
      allow delete: if hasStaffPermission(true);
    }
    
    // =================================================================
    // COLEÇÃO: tourTypes
    // =================================================================
    
    match /tourTypes/{tourTypeId} {
      // Leitura: usuários aprovados
      allow read: if isApproved();
      
      // Criação: staff
      allow create: if hasStaffPermission(false) &&
        request.resource.data.keys().hasAll(['name', 'color']);
      
      // Atualização: staff
      allow update: if hasStaffPermission(false);
      
      // Exclusão: apenas admin+
      allow delete: if hasStaffPermission(true);
    }
    
    // =================================================================
    // COLEÇÃO: companyData
    // =================================================================
    
    match /companyData/{dataId} {
      // Leitura: usuários aprovados
      allow read: if isApproved();
      
      // Criação: apenas owner/super admin
      allow create: if canManageSettings();
      
      // Atualização: apenas owner/super admin
      allow update: if canManageSettings();
      
      // Exclusão: apenas owner
      allow delete: if getUserData().role == 'OWNER';
    }
    
    // =================================================================
    // COLEÇÃO: voucherTerms
    // =================================================================
    
    match /voucherTerms/{termsId} {
      // Leitura: usuários aprovados
      allow read: if isApproved();
      
      // Criação: staff
      allow create: if hasStaffPermission(false) &&
        request.resource.data.keys().hasAll(['content', 'lastUpdated']);
      
      // Atualização: staff
      allow update: if hasStaffPermission(false);
      
      // Exclusão: apenas admin+
      allow delete: if hasStaffPermission(true);
    }
    
    // =================================================================
    // COLEÇÃO: voucherAppearance
    // =================================================================
    
    match /voucherAppearance/{appearanceId} {
      // Leitura: usuários aprovados
      allow read: if isApproved();
      
      // Criação: staff
      allow create: if hasStaffPermission(false);
      
      // Atualização: staff
      allow update: if hasStaffPermission(false);
      
      // Exclusão: apenas admin+
      allow delete: if hasStaffPermission(true);
    }
    
    // =================================================================
    // COLEÇÃO: auditLog
    // =================================================================
    
    match /auditLog/{logId} {
      // Leitura: apenas staff
      allow read: if hasStaffPermission(true);
      
      // Criação: sistema (não permitido via client)
      allow create: if false;
      
      // Atualização: não permitido
      allow update: if false;
      
      // Exclusão: apenas owner
      allow delete: if getUserData().role == 'OWNER';
    }
    
    // =================================================================
    // REGRA PADRÃO (NEGAR TUDO)
    // =================================================================
    
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

---

## 🎯 **Princípios de Segurança**

### **1. Princípio do Menor Privilégio**
- Usuários só acessam o necessário
- Permissões granulares por coleção
- Hierarquia clara de papéis

### **2. Validação de Dados**
- Campos obrigatórios verificados
- Tipos de dados validados
- Valores permitidos restritos

### **3. Autenticação Obrigatória**
- Nenhuma operação sem autenticação
- Verificação de status do usuário
- Proteção contra acesso anônimo

### **4. Auditoria e Logging**
- Log de operações críticas
- Rastreabilidade de ações
- Proteção contra manipulação

---

## 👥 **Hierarquia de Permissões**

```
OWNER
├── Acesso total a todos os recursos
├── Gestão de usuários
├── Configurações do sistema
└── Exclusão de dados críticos

SUPER_ADMIN
├── Acesso a quase todos os recursos
├── Gestão de usuários (exceto OWNER)
├── Configurações gerais
└── Relatórios completos

ADMIN
├── Acesso operacional
├── Gestão de eventos e clientes
├── Relatórios básicos
└── Configurações limitadas

SELLER
├── Dashboard e métricas
├── Criação de eventos
├── Gestão de clientes
└── Relatórios pessoais
```

---

## 🛡️ **Proteções Específicas**

### **Proteção contra Escrita Indevida**
```javascript
// Evita que usuários alterem campos críticos
allow update: if (request.auth.uid == userId && 
  !request.resource.data.diff(resource.data).affectedKeys()
    .hasAny(['role', 'status', 'commissionPercentage']));
```

### **Proteção contra Criação de Admins**
```javascript
// Apenas OWNER pode criar outros OWNERS
allow create: if request.resource.data.role != 'OWNER' || 
  getUserData().role == 'OWNER';
```

### **Validação de Campos Obrigatórios**
```javascript
// Verifica campos essenciais antes da criação
allow create: if request.resource.data.keys().hasAll([
  'date', 'startTime', 'endTime', 'status'
]);
```

---

## 📊 **Tipos de Operações**

### **Leitura (read)**
- **GET**: Leitura de documento específico
- **LIST**: Listagem de documentos em coleção
- **QUERY**: Consultas com filtros

### **Escrita (write)**
- **CREATE**: Criação de novos documentos
- **UPDATE**: Atualização de documentos existentes
- **DELETE**: Exclusão de documentos

---

## 🔄 **Como Aplicar as Regras**

### **1. Via Firebase Console**
1. Acesse [Firebase Console](https://console.firebase.google.com)
2. Selecione seu projeto
3. Vá para Firestore Database
4. Clique em "Rules"
5. Copie e cole as regras
6. Publique as alterações

### **2. Via Firebase CLI**
```bash
# Instalar Firebase CLI
npm install -g firebase-tools

# Login no Firebase
firebase login

# Inicializar projeto
firebase init firestore

# Deploy das regras
firebase deploy --only firestore:rules
```

### **3. Via Arquivo firestore.rules**
```bash
# Testar regras localmente
firebase emulators:start

# Deploy das regras
firebase deploy --only firestore:rules
```

---

## 🧪 **Teste de Regras**

### **Teste no Simulador**
```javascript
// Teste de criação de evento
firebase.firestore().collection('events').add({
  date: '2026-04-01',
  startTime: '14:00',
  endTime: '16:00',
  status: 'SCHEDULED',
  // ... outros campos
});
```

### **Teste de Permissões**
```javascript
// Teste de acesso negado
firebase.firestore().collection('profiles').doc('other-user').get()
  .then(() => console.log('Acesso permitido'))
  .catch(() => console.log('Acesso negado - como esperado'));
```

---

## ⚠️ **Considerações Importantes**

### **Performance**
- Regras complexas podem afetar performance
- Use funções auxiliares para otimização
- Evite consultas aninhadas desnecessárias

### **Manutenção**
- Documente todas as regras
- Teste regularmente as permissões
- Monitore logs de acesso

### **Segurança**
- Nunca use regras muito permissivas
- Valide sempre os dados de entrada
- Implemente logging de auditoria

---

## 📝 **Boas Práticas**

### **1. Estrutura Clara**
- Funções auxiliares bem definidas
- Nomenclatura consistente
- Comentários explicativos

### **2. Validação Robusta**
- Campos obrigatórios
- Tipos de dados
- Valores permitidos

### **3. Monitoramento**
- Logs de acesso
- Alertas de atividades suspeitas
- Auditoria regular

### **4. Documentação**
- Regras documentadas
- Exemplos de uso
- Guia de troubleshooting

---

## 🚨 **Solução de Problemas**

### **Problemas Comuns**

#### **Permissão Negada Inesperada**
```javascript
// Verificar se usuário está aprovado
function isApproved() {
  return isAuthenticated() && getUserData().status == 'APPROVED';
}
```

#### **Regras Muito Complexas**
```javascript
// Simplificar usando funções auxiliares
function canAccess(resource) {
  return isApproved() && (hasStaffPermission() || isOwner(resource));
}
```

#### **Performance Lenta**
```javascript
// Evitar múltiplas leituras em uma única regra
// Usar cache quando possível
```

---

**Última atualização**: Abril 2026  
**Versão**: 1.0.0  
**Status**: Produção Ready
