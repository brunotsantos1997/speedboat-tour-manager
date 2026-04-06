# Configuração de CI e Branch Protection - Fase 0

Este documento descreve como completar a Fase 0 do roadmap de refatoração configurando a pipeline de CI e as regras de proteção de branch.

## 🎯 Objetivo

Garantir que todo código passe por validação automática antes de ser mergeado, conforme os critérios de aceite da Fase 0:

- ✅ CI executando automaticamente em PR
- ✅ Bloquear merge sem pipeline verde
- ✅ Pipeline mínima com install, lint, build e smoke E2E

## 📋 Arquivos Criados

### 1. Pipeline de CI (`.github/workflows/ci.yml`)
- **Instala dependências** com `npm ci`
- **Executa lint** para validação de código
- **Executa build** para verificar compilação
- **Instala browsers Playwright** para testes E2E
- **Executa smoke tests** para validação de fluxos críticos

### 2. Smoke Tests (`tests/smoke.spec.ts`)
Testes críticos que validam:
- Carregamento da página de login
- Carregamento do dashboard
- Acesso à rota pública de voucher
- Manifesto PWA acessível
- Ausência de erros JavaScript críticos

### 3. Branch Protection Rules (`.github/branch-protection.yml`)
Documentação das regras que devem ser aplicadas no GitHub:
- Status checks obrigatórios
- Reviews obrigatórios
- Restrições de force push e deleção

## 🚀 Configuração Automática

### Via PowerShell (Recomendado para Windows)

```powershell
# No diretório do projeto
.\scripts\setup-branch-protection.ps1
```

### Via Shell (Linux/Mac)

```bash
# No diretório do projeto
chmod +x scripts/setup-branch-protection.sh
./scripts/setup-branch-protection.sh
```

### Manual (GitHub UI)

1. Vá para **Settings > Branches** no repositório
2. Clique em **Add rule** para o branch `main`
3. Configure:
   - ✅ **Require status checks to pass before merging**
   - ✅ **Require branches to be up to date before merging**
   - Selecione `CI` como status check obrigatório
   - ✅ **Require pull request reviews before merging**
   - **Required approving reviews**: `1`
   - ✅ **Dismiss stale reviews when new commits are pushed**
   - ❌ **Do not allow administrators to bypass**

## 🧪 Validação da Configuração

### 1. Testar Pipeline Localmente

```bash
# Verificar se tudo funciona antes de abrir PR
npm run lint
npm run build
npx playwright install --with-deps
npm run test:e2e -- --grep "smoke"
```

### 2. Testar Pipeline no GitHub

1. Crie uma branch de teste
2. Faça uma pequena alteração
3. Abra um PR
4. Verifique se:
   - ✅ Pipeline executa automaticamente
   - ✅ Todos os checks passam
   - ✅ PR não pode ser mergeado sem aprovação

## 🔧 Troubleshooting

### Pipeline não executa
- Verifique se o arquivo está em `.github/workflows/ci.yml`
- Confirme se o YAML está válido
- Verifique permissões do repositório

### Smoke tests falham
- Verifique se os browsers Playwright estão instalados
- Confirme se as rotas testadas existem
- Verifique se há problemas de tempo/timeout

### Branch protection não funciona
- Verifique se você tem permissões de admin
- Confirme se o nome do status check bate com o job (`CI`)
- Verifique se há regras conflitantes

## 📊 Critérios de Aceite - Fase 0

Após seguir este guia, a Fase 0 estará 100% completa:

- [x] `npm install` sem divergências
- [x] `npm run lint` verde
- [x] `npm run build` verde  
- [x] CI executando automaticamente em PR
- [x] PWA sem referência a assets inexistentes
- [x] Pipeline mínima com install, lint, build e smoke E2E
- [x] Bloqueio de merge sem pipeline verde

## 🎉 Próximo Passo

Com a Fase 0 completa, o projeto tem uma base técnica sólida para iniciar a **Fase 1 - Segurança, Auth e Enforcement** conforme o roadmap.

Todos os PRs subsequentes passarão por validação automática, garantindo qualidade e evitando regressões durante a refatoração.
