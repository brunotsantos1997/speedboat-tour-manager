# TESTING IMPLEMENTATION ROADMAP - ERP SPEEDBOAT TOUR

## Objetivo

Este documento registra o estado real da implementacao de testes apos a rodada atual.
Ele substitui a leitura otimista do roadmap antigo por um plano honesto, orientado por:

- o que ja esta funcionando hoje;
- o que ainda falta para maturidade de verdade;
- a restricao fixa de nao usar recursos pagos do Firebase.

## Restricao Fixa

- Nenhuma estrategia de testes pode depender de recursos pagos do Firebase.
- Quando o roadmap antigo falava em "Firebase real", este projeto deve interpretar isso como:
  - mocks confiaveis;
  - ambiente local;
  - Emulator Suite no futuro, se introduzida sem custo adicional.

## Validacao Desta Rodada - 2026-04-06

- `npm run build` -> OK
- `npm run lint` -> OK, sem erros
- `npm run test:unit -- --run` -> OK, 45 arquivos / 717 testes
- `npm run test:unit:coverage -- --run` -> OK
- `npm run test:integration` -> OK, 3 arquivos / 46 testes
- `npm run test:e2e -- --grep smoke` -> OK, 6 testes

## Cobertura Atual

Resultado real desta rodada:

- Statements: `28.21%`
- Branches: `24.98%`
- Functions: `29.59%`
- Lines: `29.08%`

Leitura correta:

- a infraestrutura de testes esta funcional;
- a base unitaria esta verde;
- a cobertura ainda esta muito abaixo da meta aspiracional de 90%;
- o roadmap de testes ainda nao pode ser marcado como concluido.

## O Que Ja Foi Implementado

### 1. Infraestrutura basica de testes

- Vitest operacional.
- Coverage operacional.
- Scripts de teste definidos no `package.json`.
- Ambiente de teste separado.
- Eslint configurado para nao quebrar com artefatos de coverage e Playwright.

### 2. Suite unitaria funcional

- Suite unitaria roda integralmente.
- Regressoes antigas de import, ambiente e mocks foram corrigidas.
- Hooks de estado e varios ViewModels ja tem testes executaveis.
- `useGlobalSync` agora tem teste de comportamento real, nao validacao artificial por string.
- Auth/profile/reset passaram a ter testes mais proximos do uso real.

### 3. Integracao basica

- Suite de integracao executa localmente e esta verde.
- Regras e comportamentos do app sao cobertos em nivel de mocks/integracao leve.

### 4. E2E minimo reproduzivel

- Smoke publico esta verde.
- A base ja possui segmentacao de projetos E2E por tipo de teste.
- Existem suites leves para acessibilidade, seguranca e performance local criadas nesta execucao anterior, ainda que nao tenham sido rerodadas agora.

## O Que Ainda Falta

### A. Cobertura ainda muito baixa

Principais lacunas:

- `useCreateEventViewModel`
- `useDashboardViewModel`
- `useClientHistoryViewModel`
- grande parte dos repositories
- services novos de auth/perfil ainda com pouca cobertura direta

Hoje o projeto esta com suite funcional, nao com cobertura-alvo atingida.

### B. Integracao Firebase ainda nao esta no estado final do roadmap

Ainda nao foi implementado:

- suite baseada em Emulator Suite;
- validacao real das `firestore.rules` em emulador;
- cenarios offline reais;
- cenarios multiusuario/conflito reais.

### C. E2E ainda e cobertura minima, nao cobertura total

Ainda faltam fluxos de verdade para:

- administracao completa de usuarios;
- fluxo financeiro completo;
- clientes ponta a ponta;
- recursos/barcos;
- Google Calendar em fluxo util;
- regressao profunda de perfil, comissao e financeiro.

### D. Qualidade dos testes legados

Ainda ha:

- muitos warnings em testes antigos;
- mocks amplos e arquivos longos;
- specs que ainda cobrem estrutura demais e comportamento de menos em alguns modulos historicos.

## Status Por Area

| Area | Status | Observacao |
|---|---|---|
| Vitest e scripts | Concluido | Base de execucao esta funcional |
| Coverage report | Concluido | Gera numero real, mas ainda baixo |
| Suite unitaria verde | Concluido | 717 testes passando |
| Integracao local | Concluido | 46 testes passando |
| Smoke E2E | Concluido | 6 testes passando |
| Cobertura de ViewModels criticos | Parcial | Muito abaixo da meta original |
| Firebase Emulator Suite | Aberto | Ainda nao implementado |
| Regras reais em emulador | Aberto | Ainda nao implementado |
| E2E funcional completo | Aberto | Apenas smoke e bases especializadas |
| Load/mobile/performance profunda | Aberto | Apenas validacoes leves |
| Acessibilidade WCAG ampla | Aberto | Ainda nao ha cobertura ampla |

## Backlog Prioritario Para Fechamento

### Prioridade 1

- Criar cobertura real para:
  - `src/viewmodels/useCreateEventViewModel.ts`
  - `src/viewmodels/useDashboardViewModel.ts`
  - `src/viewmodels/useClientHistoryViewModel.ts`
- Adicionar testes diretos para services de auth:
  - `ProfileService`
  - `UserManagementService`
  - `PasswordPolicy`

### Prioridade 2

- Substituir a integracao mockada por Emulator Suite, sem custo.
- Cobrir `firestore.rules` com testes de leitura/escrita reais em emulador.
- Criar cenarios offline e multiusuario localmente.

### Prioridade 3

- Expandir E2E para clientes, financeiro e admin.
- Consolidar suites de acessibilidade, seguranca e performance local.
- Reduzir warnings e simplificar specs longos e legados.

## Definicao Honesta de Conclusao

Este roadmap podera ser tratado como concluido quando:

- a cobertura dos ViewModels e services criticos subir de forma material;
- o projeto tiver validacao em Emulator Suite para regras e auth mais sensiveis;
- os fluxos E2E criticos forem cobertos alem do smoke;
- os testes legados mais ruidosos forem substituidos por testes de comportamento real;
- o numero de warnings em testes cair de forma significativa.

## Veredito Atual

Status geral: `parcial avancado`.

O projeto saiu de uma fase de falsa confianca para uma fase de validacao executavel.
Ainda falta bastante para chamar a estrategia de testes de "completa", mas agora existe uma base estavel e mensuravel para continuar sem depender de Firebase pago.
