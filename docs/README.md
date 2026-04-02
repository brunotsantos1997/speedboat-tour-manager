# 📚 Documentação do Projeto

Bem-vindo à documentação completa do Sistema de Gestão de Passeios de Lancha. Aqui você encontrará toda a informação necessária para entender, instalar, usar e contribuir com o projeto.

## 📖 **Documentação Disponível**

### **📋 [Documentação Completa do Projeto](./PROJECT_DOCUMENTATION.md)**
Documentação abrangente e detalhada de todo o sistema, incluindo:
- Visão geral e arquitetura
- Estrutura completa do projeto
- Modelo de dados e entidades
- Autenticação e segurança
- Telas e funcionalidades
- Repositórios e ViewModels
- Componentes reutilizáveis
- Configuração e deploy
- Testes e desenvolvimento

### **🔧 [Guia de Desenvolvimento](./DEVELOPMENT_GUIDE.md)**
Guia completo para desenvolvedores que desejam trabalhar no projeto:
- Setup do ambiente de desenvolvimento
- Padrões de arquitetura e código
- Convenções de nomenclatura
- Desenvolvimento de funcionalidades
- UI/UX guidelines
- Debug e troubleshooting
- Build e deploy
- CI/CD pipeline

### **🔌 [Referência de API](./API_REFERENCE.md)**
Documentação técnica detalhada da API e integrações:
- Configuração Firebase
- Coleções Firestore
- Padrões de Repository
- Autenticação API
- Queries e filtros
- Real-time updates
- Storage API
- Security rules
- Performance optimization

### **👥 [Manual do Usuário](./USER_MANUAL.md)**
Guia completo para usuários finais do sistema:
- Primeiro acesso e cadastro
- Níveis de permissão
- Dashboard e métricas
- Gestão de eventos e passeios
- Gestão da frota
- Produtos e serviços
- Gestão financeira
- Sistema de vouchers
- Relatórios e análises

---

## 🚀 **Começando Rápido**

### **Para Desenvolvedores**
1. Leia o [Guia de Desenvolvimento](./DEVELOPMENT_GUIDE.md)
2. Configure seu ambiente local
3. Siga os padrões de código
4. Contribua com novas funcionalidades

### **Para Usuários**
1. Leia o [Manual do Usuário](./USER_MANUAL.md)
2. Faça seu primeiro cadastro
3. Explore o dashboard
4. Comece a gerenciar seus passeios

### **Para Administradores**
1. Configure o ambiente Firebase
2. Defina as regras de segurança
3. Cadastre usuários e permissões
4. Configure os dados da empresa

---

## 🏗️ **Visão Geral da Arquitetura**

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

---

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

---

## 🔧 **Tecnologias Utilizadas**

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

---

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

---

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

---

## 📱 **PWA Features**

### **Funcionalidades**
- **Nome Configurável**: Via variável de ambiente `VITE_APP_NAME`
- **Tema**: #2563eb (azul)
- **Ícones**: 192x192 e 512x512
- **Start URL**: /dashboard
- **Display**: Standalone
- **Offline Support**: Cache inteligente

---

## 🧪 **Testes**

### **Configuração**
- **Framework**: Playwright
- **Tipo**: End-to-End (E2E)
- **Browser**: Chromium
- **Report**: HTML com screenshots

### **Testes Existentes**
- **client-creation.spec.ts**: Teste de criação de clientes

### **Comandos**
```bash
npm run test:e2e              # Rodar todos os testes
npx playwright test --headed  # Modo headed
npx playwright show-report   # Gerar relatório
```

---

## 🚀 **Deploy**

### **Plataformas**
- **Vercel**: Deploy automático
- **Netlify**: Deploy contínuo
- **Firebase Hosting**: Hosting estático
- **GitHub Pages**: Hosting gratuito

### **Comandos**
```bash
npm run build    # Build para produção
npm run preview  # Preview do build
```

---

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

---

## 📊 **Métricas e Performance**

### **Otimizações**
- **Lazy Loading**: Carregamento sob demanda
- **Code Splitting**: Divisão de bundle
- **Manual Chunks**: Separação de vendors
- **Cache Strategy**: Cache inteligente
- **Performance**: Tempos de carregamento otimizados

---

## 🔮 **Roadmap Futuro**

### **Melhorias Planejadas**
- **Multi-idioma**: Internacionalização i18n
- **Push Notifications**: Notificações em tempo real
- **Advanced Analytics**: Dashboard de métricas avançado
- **Mobile App**: Aplicativo nativo
- **API REST**: Endpoints para integrações externas

---

## 📝 **Licença**

Este projeto está licenciado sob a **MIT License**.

---

**Última atualização**: Abril 2026  
**Versão**: 1.0.0  
**Maintainers**: Equipe de Desenvolvimento

---

## 📚 **Índice de Documentação**

| Documento | Audiência | Descrição |
|-----------|-----------|-----------|
| [PROJECT_DOCUMENTATION.md](./PROJECT_DOCUMENTATION.md) | Desenvolvedores, Arquitetos | Documentação técnica completa |
| [DEVELOPMENT_GUIDE.md](./DEVELOPMENT_GUIDE.md) | Desenvolvedores | Guia prático de desenvolvimento |
| [API_REFERENCE.md](./API_REFERENCE.md) | Desenvolvedores, Integradores | Referência detalhada da API |
| [USER_MANUAL.md](./USER_MANUAL.md) | Usuários Finais | Manual completo de uso |
