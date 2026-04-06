# 🚤 ERP Speedboat Tour

Sistema completo de gestão de passeios turísticos de lancha com autenticação segura, gestão financeira integrada e sistema de vouchers personalizado.

## 🎯 **Visão Geral**

Este projeto oferece uma solução completa para empresas de passeios turísticos que necessitam gerenciar:
- Eventos e reservas
- Frota de embarcações
- Clientes e fidelidade
- Finanças e comissões
- Sistema de vouchers digital

## 🏗️ **Arquitetura MVVM Implementada**

O sistema implementa **MVVM (Model-View-ViewModel)** com separação clara de responsabilidades:

```
┌─────────────────────────────────────────────────────────────┐
│                    View Layer (React)                      │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐          │
│  │   Screens   │ │Components   │ │  Layouts     │          │
│  │ (29 telas)  │ │ (16 comps)  │ │   (3)       │          │
│  └─────────────┘ └─────────────┘ └─────────────┘          │
├─────────────────────────────────────────────────────────────┤
│                ViewModels (22 hooks)                        │
│           Orquestração + Estado Derivado                    │
├─────────────────────────────────────────────────────────────┤
│              Repositories (17 acessos)                     │
│              Acesso a dados puro                            │
├─────────────────────────────────────────────────────────────┤
│                 Domain Layer (Types)                        │
│              Regras + Contratos                             │
├─────────────────────────────────────────────────────────────┤
│               Firebase (Firestore + Auth)                   │
│            Persistência + Autenticação                      │
└─────────────────────────────────────────────────────────────┘
```

### **Princípios Implementados**
- **View**: Apenas renderização e disparo de intenções
- **ViewModel**: Orquestração de casos de uso e estado derivado
- **Repository**: Acesso a dados sem regra de negócio
- **Domain**: Tipos e regras compartilhadas
- **Firebase**: Persistência e autenticação

## 🛠️ **Stack Tecnológico**

### **Frontend**
- **React 19** + **TypeScript** - Componentes modernos e type-safe
- **Vite** - Build ultra-rápido com Hot Module Replacement
- **Tailwind CSS** - Design system responsivo
- **React Router DOM** - Navegação client-side com lazy loading
- **Lucide React** - Biblioteca de ícones

### **Backend & Database**
- **Firebase** - Autenticação, Firestore e Storage
- **Firebase Authentication** - Sistema de login seguro
- **Firestore** - Database NoSQL com regras de segurança

### **Bibliotecas Principais**
- **TipTap** - Editor de texto rico
- **React Day Picker** - Calendário interativo
- **DOMPurify** - Sanitização de HTML contra XSS
- **html2pdf.js** - Geração de PDFs
- **React Input Mask** - Máscaras para formulários
- **React Joyride** - Tours interativos
- **UUID** - Geração de IDs únicos
- **bcryptjs** - Hash de senhas
- **date-fns** - Manipulação de datas

### **Desenvolvimento & Testes**
- **ESLint** - Linting e qualidade de código
- **Playwright** - Testes end-to-end
- **Vitest** - Testes unitários
- **TypeScript** - Tipagem estática rigorosa

## 🚀 **Começando Rápido**

### **Pré-requisitos**
- Node.js 18+
- Conta Firebase com Firestore ativado
- Git

### **Setup**
```bash
# 1. Clonar o repositório
git clone <repository-url>
cd erp-speedboat-tour

# 2. Instalar dependências
npm install

# 3. Configurar ambiente
cp .env.example .env
# Editar .env com suas credenciais Firebase

# 4. Iniciar desenvolvimento
npm run dev
```

### **Configuração Firebase**
1. Criar projeto no Firebase Console
2. Ativar Firestore
3. Configurar regras de segurança (copiar de firestore.rules)
4. Adicionar dados iniciais (opcional)

## 📁 **Estrutura do Projeto**

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

## 🎯 **Funcionalidades Principais**

### **Gestão de Eventos**
- ✅ Criação e gerenciamento de passeios
- ✅ Calendário integrado
- ✅ Gestão de horários e capacidade
- ✅ Edição rápida e compartilhamento

### **Gestão de Recursos**
- ✅ Frota de embarcações
- ✅ Produtos e serviços
- ✅ Locais de embarque
- ✅ Tipos de passeios

### **Gestão Financeira**
- ✅ Controle de receitas e despesas
- ✅ Livro caixa integrado
- ✅ Relatórios financeiros
- ✅ Cálculo de comissões

### **Gestão de Clientes**
- ✅ Cadastro e histórico
- ✅ Programa de fidelidade
- ✅ Comunicação automatizada

### **Sistema de Vouchers**
- ✅ Geração personalizada
- ✅ Validação automática
- ✅ Compartilhamento digital
- ✅ Exportação em PDF

### **Usuários e Permissões**
- ✅ Múltiplos níveis de acesso
- ✅ Aprovação administrativa
- ✅ Gestão de comissões
- ✅ Relatórios de performance

## 🔐 **Segurança**

### **Implementações**
- **Firebase Authentication**: Sistema de autenticação seguro
- **Firestore Security Rules**: Regras detalhadas de acesso
- **Role-Based Access Control**: Múltiplos níveis de permissão
- **Input Sanitization**: Proteção contra XSS com DOMPurify
- **Password Hashing**: Senhas criptografadas com bcryptjs
- **Protected Routes**: Rotas protegidas por nível de acesso

### **Níveis de Acesso**
- **OWNER**: Acesso completo ao sistema
- **SUPER_ADMIN**: Gestão administrativa completa
- **ADMIN**: Gestão de usuários e operações
- **SELLER**: Acesso a vendas e dashboard

## 🧪 **Testes**

### **Testes Existentes**
- **Suite de regressão crítica**: Login, criação de eventos, pagamentos, cancelamentos
- **Testes de screenshots**: Validação visual em desktop e mobile
- **Testes de smoke**: Validação de fluxos críticos de negócio

### **Cobertura de Testes**
- ✅ Fluxos de autenticação e autorização
- ✅ Operações financeiras críticas
- ✅ Geração e validação de vouchers
- ✅ Gestão de eventos e clientes
- ⚠️ Cobertura unitária em expansão

### **Comandos**
```bash
npm run test:e2e              # Rodar todos os testes
npx playwright test --headed  # Modo headed
npx playwright show-report   # Gerar relatório
```

## 🚀 **Deploy**

### **Build e Produção**
```bash
npm run build    # Build para produção
npm run preview  # Preview do build
```

### **Plataformas Suportadas**
- **Vercel**: Deploy automático
- **Netlify**: Deploy contínuo
- **Firebase Hosting**: Hosting estático
- **GitHub Pages**: Hosting gratuito

## 📱 **PWA Features**

### **Funcionalidades**
- **Nome Configurável**: Via variável de ambiente `VITE_APP_NAME`
- **Tema**: #2563eb (azul)
- **Ícones**: 192x192 e 512x512
- **Start URL**: /dashboard
- **Display**: Standalone
- **Offline Support**: Cache inteligente

## 🌐 **Internacionalização**

### **Idiomas Suportados**
- 🇧🇷 **Português (BR)** - Idioma principal
- 🇺🇸 **Inglês (US)** - Em desenvolvimento
- 🇪🇸 **Espanhol (ES)** - Planejado

### **Configuração**
```typescript
import { i18n } from './i18n';
i18n.changeLanguage('pt-BR'); // ou 'en', 'es'
```

## 📊 **Métricas e Performance**

### **Otimizações**
- **Lazy Loading**: Carregamento sob demanda
- **Code Splitting**: Divisão de bundle
- **Manual Chunks**: Separação de vendors
- **Cache Strategy**: Cache inteligente
- **Performance**: Tempos de carregamento otimizados

## 📞 **Suporte e Contribuição**

### **Para Ajuda**
- **Issues**: [GitHub Issues](https://github.com/user/repo/issues)
- **Email**: suporte@empresa.com
- **Documentação**: Leia os manuais disponíveis

### **Para Contribuir**
- **Fork**: Faça um fork do projeto
- **Branch**: Crie `feature/nova-funcionalidade`
- **Commit**: Commits descritivos
- **PR**: Abra Pull Request

### **Convenções**
- **Code**: Siga regras ESLint
- **Testes**: Adicione testes E2E
- **Docs**: Atualize documentação

## 📝 **Licença**

Este projeto está licenciado sob a **MIT License**.

---

## 📚 **Documentação Adicional**

### **Documentação Técnica**
- **REFACTORING_ROADMAP.md**: Plano completo de refatoração arquitetural
- **API_REFERENCE.md**: Referência de APIs do sistema
- **DEVELOPMENT_GUIDE.md**: Guia de desenvolvimento e boas práticas
- **CI_SETUP.md**: Configuração de pipeline CI/CD

### **Documentação de Negócio**
- **USER_MANUAL.md**: Manual completo para usuários finais
- **SECURITY_REPORT_PTBR.md**: Relatório detalhado de segurança
- **GOOGLE_AUTH_SETUP.md**: Configuração OAuth

### **Documentação de Projeto**
- **docs/README.md**: Documentação completa do projeto
- **docs/PROJECT_DOCUMENTATION.md**: Arquitetura e estrutura
- **docs/FIRESTORE_SECURITY_RULES.md**: Regras de segurança

---

## 🎉 **Sistema Completo e Funcional!**

Este projeto oferece:
- ✅ **Sistema completo** de gestão de passeios
- ✅ **Autenticação segura** com múltiplos níveis
- ✅ **Interface responsiva** e moderna
- ✅ **Gestão financeira** integrada
- ✅ **Sistema de vouchers** personalizado
- ✅ **Testes automatizados** E2E com regressão crítica
- ✅ **Código type-safe** com TypeScript
- ✅ **Performance otimizada** com lazy loading
- ✅ **PWA funcional** para dispositivos móveis
- ✅ **Segurança enterprise** com regras detalhadas
- ✅ **Arquitetura MVVM** implementada
- ✅ **Documentação técnica** completa e atualizada

**Desenvolvido com ❤️ para empresas de passeios turísticos!** 🚤

---

## 📈 **Status do Projeto**

### **✅ Concluído**
- Refatoração arquitetural completa (MVVM)
- Correção de todos os problemas críticos de segurança
- Implementação de testes de regressão confiáveis
- Documentação técnica alinhada com o código
- Build e lint consistentes em CI/CD

### **🔄 Em Melhoria Contínua**
- Expansão da cobertura de testes unitários
- Otimização de performance de relatórios
- Novas funcionalidades baseadas em feedback do usuário

### **🎯 Próximo Release**
- Dashboard analítico avançado
- Integração com gateways de pagamento
- Sistema de notificações push

---

**Última atualização**: Abril 2026  
**Versão**: 2.0.0 (Pós-refatoração)  
**Status**: Produção estável  
**Maintainers**: Equipe de Desenvolvimento