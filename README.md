# ERP Speedboat Tour

Sistema web para operacao de passeios de lancha com agenda, clientes, financeiro, vouchers e administracao de usuarios.

## Estado atual

Esta base passou por uma rodada forte de estabilizacao e refatoracao. Hoje o projeto:

- compila com `npm run build`
- executa lint sem erros com `npm run lint`
- executa a suite unitaria com `npm run test:unit -- --run`
- gera coverage unitaria com `npm run test:unit:coverage -- --run`
- executa a suite de integracao com `npm run test:integration`
- executa o smoke E2E com `npm run test:e2e -- --grep smoke`
- executa suites E2E dedicadas para acessibilidade, seguranca e performance local

Ainda existem pontos de melhoria arquitetural e de cobertura mais profunda, mas o repositorio nao deve mais prometer estado "100% refatorado" ou "production ready" sem qualificacao.

## Stack

- React 18
- TypeScript
- Vite
- Firebase Auth + Firestore
- Tailwind CSS
- Vitest
- Playwright

## Scripts principais

```bash
npm install
npm run dev
npm run build
npm run lint
npm run test:unit -- --run
npm run test:unit:coverage -- --run
npm run test:integration
npm run test:e2e -- --grep smoke
npm run test:e2e:accessibility
npm run test:e2e:security
npm run test:e2e:performance
```

## Arquitetura pratica

O projeto segue uma separacao por camadas, mas com algumas areas ainda em transicao:

- `src/ui`: telas, componentes e layouts
- `src/viewmodels`: orquestracao de estado e fluxos da UI
- `src/core/domain`: regras compartilhadas e contratos de negocio
- `src/core/repositories`: persistencia e acesso a dados
- `src/contexts`: providers globais, incluindo autenticacao

Nos fluxos de status e pagamento, a regra compartilhada agora fica concentrada principalmente em:

- `src/core/domain/EventStatusService.ts`
- `src/core/domain/TransactionService.ts`

## Testes

### Unitarios

- executam em `happy-dom`
- cobrem hooks, services e repositorios mockados
- comando: `npm run test:unit -- --run`
- coverage baseline: `npm run test:unit:coverage -- --run`

### Integracao

- comando: `npm run test:integration`
- foco atual: contratos e comportamentos integrados do projeto
- observacao: a suite atual ainda usa mocks em parte dos cenarios de Firebase

### E2E

- comando completo: `npm run test:e2e`
- smoke validado com `npm run test:e2e -- --grep smoke`
- acessibilidade: `npm run test:e2e:accessibility`
- seguranca: `npm run test:e2e:security`
- performance local: `npm run test:e2e:performance`
- o `playwright.config.ts` esta preparado para iniciar o app automaticamente

## Fluxos publicos disponiveis

- `/`
- `/login`
- `/signup`
- `/forgot-password`
- `/privacy-policy`
- `/terms-of-service`
- `/voucher/:eventId`

## Observacoes importantes

- A trilha de auditoria foi removida por decisao de escopo.
- As colecoes de configuracao usam `snake_case` no Firestore e nas regras.
- O README foi reduzido para refletir o estado real da base, nao um estado idealizado.

## Documentacao complementar

- `docs/README.md`
- `docs/PROJECT_DOCUMENTATION.md`
- `docs/DEVELOPMENT_GUIDE.md`
- `docs/FIRESTORE_SECURITY_RULES.md`
- `docs/REFACTORING_ROADMAP.md`
- `docs/TESTING_IMPLEMENTATION_ROADMAP.md`
