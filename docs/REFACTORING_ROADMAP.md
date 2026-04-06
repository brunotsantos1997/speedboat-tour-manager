# REFACTORING ROADMAP - ERP SPEEDBOAT TOUR

## Objetivo

Este roadmap foi refeito para cobrir integralmente os problemas encontrados na code review.
Ele nao descreve uma refatoracao "generica". Ele descreve a ordem exata para zerar os achados reais da analise, com rastreabilidade entre:

- problema encontrado;
- fase que resolve o problema;
- tarefas necessarias;
- criterio de aceite para validar a correcao;
- arquivos que concentram o problema;
- evidencias esperadas para provar o fechamento.

## Premissas de Execucao

- Nenhuma fase arquitetural grande comeca antes de `build`, `lint` e CI estarem confiaveis.
- Nenhum fluxo sensivel continua no cliente quando deveria estar no backend, no provedor de auth ou nas regras.
- Nenhum PR mistura seguranca, arquitetura, UI e testes sem necessidade.
- Toda fase termina com validacao objetiva.
- O trabalho sera entregue em PRs pequenos e reversiveis.
- Cada achado precisa de owner, evidencia e PR de fechamento.

## Resultado Esperado

Ao final deste roadmap, o projeto deve:

- compilar e lintar de forma consistente;
- remover os riscos criticos de seguranca;
- alinhar contratos entre View, ViewModel, repositories e dominio;
- consolidar as regras de negocio em fontes de verdade unicas;
- aplicar MVVM de forma real nas areas criticas;
- ter relatorios confiaveis;
- ter testes reproduziveis;
- ter documentacao coerente com o codigo real.

---

## Arquitetura Alvo e Regras de Dependencia

Estas regras definem o estado alvo da refatoracao. Elas existem para reduzir ambiguidade e impedir que a execucao "melhore" a base em uma area enquanto piora outra.

- View pode depender de componentes de apresentacao, hooks de ViewModel, tipos de entrada e saida e utilitarios puros de formatacao.
- View nao pode importar Firebase, repository concreto, regra de negocio de dominio ou manipular DOM imperativamente quando estado React resolver o problema.
- ViewModel pode orquestrar casos de uso, traduzir intencoes da View, consolidar estado derivado e coordenar feedback de erro.
- ViewModel nao pode acessar Firebase diretamente, carregar regra de autorizacao sensivel, conhecer DOM como fonte de verdade ou depender de string de rota para semantica critica.
- Caso de uso ou servico de dominio concentra regras de status, pagamento, shared event, comissao, backfill e outras decisoes reutilizadas.
- Repository so acessa dados, traduz persistencia e nao atua como store global da UI nem como camada principal de permissao.
- Auth provider, backend e regras de seguranca concentram reset de senha, enforcement de autorizacao e operacoes identitarias sensiveis.
- Auditoria precisa ser transversal, persistida e acionada pelos fluxos criticos do dominio e da identidade, nunca por `console.log`.

---

## Catalogo Completo dos Achados da Review

Cada item abaixo representa um problema encontrado na analise.
Nenhum item desta lista deve ficar sem fase de tratamento.

### A. Estabilidade e build

- `A01` Build quebrado por instalacao inconsistente de dependencias.
- `A02` `tsconfig` incompatível com a versao real do TypeScript.
- `A03` `lint` e validacao local nao confiaveis.
- `A04` configuracao PWA com assets ausentes ou incorretos.
- `A05` documentacao promete estado "production ready" sem sustentacao tecnica.

### B. Seguranca e autenticacao

- `B01` fluxo de reset de senha quebrado.
- `B02` reset de senha inseguro via pergunta secreta no cliente.
- `B03` query string contendo dados sensiveis de recuperacao de senha.
- `B04` aprovacao manual falsa de reset com stub tratado como senha temporaria.
- `B05` troca final de senha ignorando o usuario alvo.
- `B06` `AuthContext` com acoplamento excessivo e lifecycle perigoso.
- `B07` logout com `terminate(db)` sobre singleton reutilizado.
- `B08` update de perfil/email/senha sem reauth e com semantica incorreta para edicao administrativa.
- `B09` autorizacao baseada em filtro no cliente em vez de enforcement server-side.

### C. Contratos e arquitetura do core

- `C01` metodos chamados mas nao implementados em repositories.
- `C02` interfaces divergentes das implementacoes concretas.
- `C03` repositories stateful atuando como mini-store global.
- `C04` repositories mantendo `currentUser` e regras de permissao client-side.
- `C05` uso extensivo de `any` em caminho critico.
- `C06` tratamento de erro inconsistente, console-only ou silencioso.
- `C07` `AuditLogRepository` e apenas stub.

### D. Dominio, regras de negocio e transacoes

- `D01` regras de status de evento duplicadas em varios hooks.
- `D02` auto-cancelamento e reversao duplicados.
- `D03` fluxos `evento + pagamento + despesa + sync` sem atomicidade.
- `D04` `useEventCostViewModel` remove e recria despesas sem transacao.
- `D05` `CommissionRepository` usa heuristica textual para detectar pagamento de comissao.
- `D06` `useSharedEventViewModel` depende de entidades sentinela e defaults implicitos.
- `D07` defaults de configuracao em memoria criam fonte de verdade ambigua.
- `D08` `backfillFinancialData()` roda no cliente e muta dados a partir de tela.

### E. MVVM, UI e manutenibilidade

- `E01` `AuthContext` virou god object.
- `E02` `useCreateEventViewModel` virou god hook.
- `E03` `useDashboardViewModel` e `useClientHistoryViewModel` concentram regra demais.
- `E04` telas acessam repository diretamente, violando MVVM.
- `E05` componentes manipulam DOM imperativamente em vez de usar estado React.
- `E06` arquivos muito grandes e com multiplas responsabilidades.
- `E07` mutacao de props durante render.
- `E08` classes dinamicas do Tailwind podem falhar no build de producao.
- `E09` armazenamento de imagem do voucher em base64 no documento.

### F. Relatorios, performance e integracoes

- `F01` relatorios usam dados truncados por listener limitado.
- `F02` grafico mensal nao representa o que a UI promete.
- `F03` livro caixa usa fontes incompletas e contratos quebrados.
- `F04` sync em massa do Google e executado no cliente, de forma sequencial e fragil.
- `F05` `getAnalytics()` e inicializado sem guardas robustas de ambiente.
- `F06` voucher publico depende de inicializacao indireta de repositories autenticados.

### G. Testes e confiabilidade operacional

- `G01` testes versionam credenciais reais.
- `G02` teste assume `TEST_MODE` que o app nao implementa.
- `G03` testes funcionais, screenshots e scripts operacionais estao misturados.
- `G04` suite paralela altera estado compartilhado.
- `G05` cobertura de regressao nao protege fluxos criticos de verdade.

### H. Documentacao e consistencia

- `H01` documentacao afirma arquitetura MVVM que o codigo nao pratica.
- `H02` regras documentadas usam nomes de colecao diferentes do codigo real.
- `H03` documentacao contem mojibake e problemas de encoding.
- `H04` README e docs prometem Vitest, seguranca e qualidade acima do estado real.
- `H05` codigo morto, comentarios enganosos e promessas tecnicas nao cumpridas.

---

## Matriz de Cobertura dos Achados

| ID | Problema | Fase |
|---|---|---|
| A01 | Build quebrado por dependencias | Fase 0 |
| A02 | `tsconfig` incompatível | Fase 0 |
| A03 | `lint` nao confiavel | Fase 0 |
| A04 | PWA com assets invalidos | Fase 0 |
| A05 | "Production ready" sem base | Fase 6 |
| B01 | Reset de senha quebrado | Fase 1 |
| B02 | Pergunta secreta no cliente | Fase 1 |
| B03 | Dados sensiveis na URL | Fase 1 |
| B04 | Stub de aprovacao manual | Fase 1 |
| B05 | Troca de senha no usuario errado | Fase 1 |
| B06 | Auth acoplado e excessivo | Fase 1 e Fase 4 |
| B07 | Logout com `terminate(db)` | Fase 1 |
| B08 | Perfil/email/senha sem reauth correto | Fase 1 |
| B09 | Autorizacao no cliente | Fase 1 e Fase 2 |
| C01 | Metodos inexistentes chamados | Fase 2 |
| C02 | Interfaces divergentes | Fase 2 |
| C03 | Repositories stateful | Fase 4 |
| C04 | Permissao client-side em repository | Fase 1, 2 e 4 |
| C05 | `any` em caminho critico | Fase 2 |
| C06 | Tratamento de erro ruim | Fase 2 |
| C07 | Auditoria stub | Fase 1 e Fase 3 |
| D01 | Regra de status duplicada | Fase 3 |
| D02 | Auto-cancelamento duplicado | Fase 3 |
| D03 | Escrita nao atomica | Fase 3 |
| D04 | Custo de evento sem transacao | Fase 3 |
| D05 | Comissao por descricao textual | Fase 3 |
| D06 | Shared event com sentinelas | Fase 3 |
| D07 | Defaults implicitos | Fase 3 e Fase 6 |
| D08 | Backfill client-side | Fase 3 |
| E01 | AuthContext god object | Fase 4 |
| E02 | God hook de criacao de evento | Fase 4 |
| E03 | Dashboard e client history super carregados | Fase 4 |
| E04 | View acessa repository direto | Fase 4 |
| E05 | Manipulacao imperativa de DOM | Fase 4 |
| E06 | Arquivos enormes | Fase 4 |
| E07 | Mutacao de props em render | Fase 4 |
| E08 | Tailwind dinamico inseguro | Fase 4 |
| E09 | Base64 no documento do voucher | Fase 4 e Fase 5 |
| F01 | Relatorio com dados truncados | Fase 5 |
| F02 | Grafico mensal incorreto | Fase 5 |
| F03 | Livro caixa inconsistente | Fase 5 |
| F04 | Google sync em massa no cliente | Fase 5 |
| F05 | Analytics sem guardas robustas | Fase 5 |
| F06 | Voucher publico acoplado a init indireto | Fase 5 |
| G01 | Credenciais reais nos testes | Fase 1 |
| G02 | `TEST_MODE` inexistente | Fase 5 |
| G03 | Testes misturados com scripts | Fase 5 |
| G04 | Paralelismo frágil no Playwright | Fase 5 |
| G05 | Regressao insuficiente | Fase 5 |
| H01 | MVVM ficticio na documentacao | Fase 6 |
| H02 | Colecoes divergentes entre docs e codigo | Fase 1 e Fase 6 |
| H03 | Mojibake/encoding quebrado | Fase 6 |
| H04 | README e docs sobrevendem a qualidade | Fase 6 |
| H05 | Codigo morto e comentarios enganosos | Fase 6 |

---

## Controle Operacional dos Achados

Durante a execucao, cada achado desta review deve ser acompanhado com rastreabilidade operacional minima. O roadmap deixa de ser apenas plano e passa a ser instrumento de acompanhamento.

### Campos obrigatorios por achado

| Campo | Uso minimo |
|---|---|
| ID | Identificador do achado (`A01` ... `H05`) |
| Status | `nao iniciado`, `em andamento`, `bloqueado`, `em validacao`, `concluido` |
| Fase | Fase oficial que resolve o achado |
| PR | PR onde o tratamento principal aconteceu |
| Owner | Responsavel tecnico pelo fechamento |
| Evidencia | Build, lint, teste, walkthrough, regra ou diff que prova o fechamento |
| Bloqueios | Dependencias ou riscos restantes |

### Regra operacional

- Nenhum achado muda para `concluido` sem evidencia objetiva.
- Nenhum PR fecha achado critico sem smoke test ou walkthrough registrado.
- Nenhum achado pode migrar para fase posterior sem anotacao explicita do motivo.

---

## Mapa de Contexto por Achado

Esta secao existe para reduzir ambiguidade durante a execucao.
Ela diz explicitamente quais arquivos concentram cada problema relevante da review e por que eles entram no escopo.

### 1. Reset de senha quebrado e inseguro

**Achados relacionados**

- `B01`
- `B02`
- `B03`
- `B04`
- `B05`

**Arquivos principais**

- `src/viewmodels/usePasswordResetViewModel.ts`
  Contexto: concentra `requestPasswordReset`, `approvePasswordReset`, `verifySecretAnswer` e `resetPasswordAfterVerification`; hoje mistura reset por email, aprovacao manual e pergunta secreta.
- `src/ui/screens/ForgotPasswordScreen.tsx`
  Contexto: inicia o fluxo e hoje navega com `email` e `question` na URL.
- `src/ui/screens/ResetPasswordSecretScreen.tsx`
  Contexto: consome `email` e `question` da URL e redireciona para a etapa final com `userId`.
- `src/ui/screens/SetNewPasswordScreen.tsx`
  Contexto: recebe `userId`, mas a implementacao atual do ViewModel nao usa esse alvo corretamente.
- `src/ui/screens/UserManagementScreen.tsx`
  Contexto: trata o retorno de `approvePasswordReset()` como se fosse uma senha temporaria real.
- `src/contexts/AuthContext.tsx`
  Contexto: expõe os wrappers que mantêm o desenho atual do fluxo de reset.

### 2. Contratos quebrados entre repositories e consumidores

**Achados relacionados**

- `C01`
- `C02`

**Arquivos principais**

- `src/core/repositories/PaymentRepository.ts`
  Contexto: expõe contrato incompleto em relacao ao que os consumidores usam.
- `src/core/repositories/EventRepository.ts`
  Contexto: a API publica nao bate com os usos atuais de subscribe em parte da base.
- `src/viewmodels/useClientHistoryViewModel.ts`
  Contexto: chama `paymentRepository.update/remove`, assumindo contrato que nao existe.
- `src/viewmodels/useCashBookViewModel.ts`
  Contexto: chama `eventRepository.subscribe` e `paymentRepository.remove` com semantica nao alinhada.
- `src/viewmodels/useGlobalSync.ts`
  Contexto: assume um subscribe global em `eventRepository` que nao existe na API exposta.
- `src/viewmodels/useFinanceViewModel.ts`
  Contexto: tambem depende de contratos de leitura/subscribe que precisam ser revisados como parte do alinhamento.

### 3. `AuthContext` como god object e lifecycle inseguro

**Achados relacionados**

- `B06`
- `B07`
- `E01`

**Arquivos principais**

- `src/contexts/AuthContext.tsx`
  Contexto: concentra autenticacao, perfil, reset, Google, bootstrap e teardown de repositories, alem de `terminate(db)` no logout.
- `src/core/repositories/index.ts`
  Contexto: documenta que o lifecycle esta acoplado ao `AuthContext`.
- `src/core/repositories/*.ts`
  Contexto: varios repositories dependem de `initialize(user)` e `dispose()`, reforcando o acoplamento atual ao contexto de auth.

### 4. Violacao sistemica de MVVM

**Achados relacionados**

- `E01`
- `E02`
- `E03`
- `E04`
- `E05`

**Arquivos principais**

- `src/viewmodels/useUserManagementViewModel.ts`
  Contexto: acessa Firebase direto e mistura caso de uso com detalhes de persistencia.
- `src/viewmodels/usePasswordResetViewModel.ts`
  Contexto: idem, com logica sensivel de identidade no ViewModel.
- `src/viewmodels/useProfileViewModel.ts`
  Contexto: mistura regra de perfil com operacoes diretas de auth/firestore.
- `src/ui/screens/FinanceScreen.tsx`
  Contexto: acessa repository diretamente pela View.
- `src/ui/components/Layout.tsx`
  Contexto: manipula DOM via `classList.toggle` em vez de usar estado React.
- `src/viewmodels/useCreateEventViewModel.ts`
  Contexto: hook grande demais, mistura dominio, UI state, roteamento, modal e persistencia.

### 5. Dados truncados em financeiro e livro-caixa

**Achados relacionados**

- `F01`
- `F03`

**Arquivos principais**

- `src/core/repositories/PaymentRepository.ts`
  Contexto: `subscribe()` e `getAll()` trabalham com limite que hoje vaza para uso analitico.
- `src/viewmodels/useFinanceViewModel.ts`
  Contexto: usa pagamentos como base de relatorio financeiro e grafico.
- `src/viewmodels/useCashBookViewModel.ts`
  Contexto: monta o livro-caixa combinando fontes que hoje podem estar truncadas ou desalinhadas.
- `src/ui/screens/FinanceScreen.tsx`
  Contexto: consome as metricas e graficos derivados desses dados.
- `src/ui/screens/CashBookScreen.tsx`
  Contexto: renderiza o livro-caixa e ajuda a validar a semantica final dos dados.

### 6. Escritas financeiras nao atomicas

**Achados relacionados**

- `D03`
- `D04`

**Arquivos principais**

- `src/viewmodels/useEventCostViewModel.ts`
  Contexto: atualiza evento, recria despesas e sincroniza sem transacao unica.
- `src/viewmodels/useSharedEventViewModel.ts`
  Contexto: cria/atualiza evento compartilhado e pagamento em varias etapas independentes.
- `src/viewmodels/useDashboardViewModel.ts`
  Contexto: registra pagamento e muda status do evento em operacoes separadas.
- `src/viewmodels/useClientHistoryViewModel.ts`
  Contexto: repete o mesmo padrao em outro fluxo.
- `src/core/repositories/EventRepository.ts`
  Contexto: precisa ser revisado como parte do novo boundary transacional.
- `src/core/repositories/PaymentRepository.ts`
  Contexto: idem.
- `src/core/repositories/ExpenseRepository.ts`
  Contexto: idem.

### 7. Regras de negocio criticas duplicadas

**Achados relacionados**

- `D01`
- `D02`

**Arquivos principais**

- `src/viewmodels/useDashboardViewModel.ts`
  Contexto: auto-cancelamento, confirmacao de pagamento e reversao de cancelamento.
- `src/viewmodels/useClientHistoryViewModel.ts`
  Contexto: repete confirmacao de pagamento, reversao e exclusao.
- `src/viewmodels/useCashBookViewModel.ts`
  Contexto: repete ajuste de status ao excluir pagamento.
- `src/viewmodels/useSharedEventViewModel.ts`
  Contexto: cria evento/pagamento com suas proprias regras implicitas de status.

### 8. Autorizacao excessivamente dependente do cliente

**Achados relacionados**

- `B09`
- `C04`

**Arquivos principais**

- `src/viewmodels/useUserManagementViewModel.ts`
  Contexto: busca todos os perfis e so depois filtra por role.
- `src/core/repositories/CommissionRepository.ts`
  Contexto: tambem busca perfis diretamente, sem boundary de acesso coerente.
- `docs/FIRESTORE_SECURITY_RULES.md`
  Contexto: precisa ser alinhado com a implementacao real e com o enforcement desejado.
- `src/core/repositories/*.ts`
  Contexto: varios repositories mantem `currentUser` para permissao client-side; todos esses pontos precisam ser revisados.

### 9. Auditoria inexistente

**Achados relacionados**

- `C07`

**Arquivos principais**

- `src/core/repositories/AuditLogRepository.ts`
  Contexto: hoje e apenas stub com `console.log`.
- `src/core/repositories/TourTypeRepository.ts`
- `src/core/repositories/ExpenseCategoryRepository.ts`
- `src/core/repositories/ExpenseRepository.ts`
- `src/core/repositories/IncomeRepository.ts`
  Contexto: sao exemplos de pontos que assumem existencia de trilha de auditoria real.

### 10. Suite de testes gera falsa confianca

**Achados relacionados**

- `G01`
- `G02`
- `G03`
- `G04`
- `G05`

**Arquivos principais**

- `tests/prepare-data.spec.ts`
  Contexto: usa credenciais reais e muta dados compartilhados.
- `tests/capture-screenshots.spec.ts`
  Contexto: usa credenciais reais e gera evidencia visual, nao validacao funcional robusta.
- `tests/client-creation.spec.ts`
  Contexto: assume `TEST_MODE` via `localStorage`, mas o app nao consome essa flag.
- `tests/generate-icons.spec.ts`
  Contexto: nao e teste funcional; escreve assets em `public/`.
- `tests/*.spec.ts`
  Contexto: a pasta precisa ser segmentada entre teste funcional, screenshot e script operacional.
- `playwright.config.ts`
  Contexto: `fullyParallel: true` entra em conflito com a natureza stateful de varios specs atuais.

### 11. Calculo de comissao fragil

**Achados relacionados**

- `D05`

**Arquivos principais**

- `src/core/repositories/CommissionRepository.ts`
  Contexto: detecta pagamento de comissao por `description.includes(...)`.
- `src/core/repositories/ExpenseRepository.ts`
  Contexto: hoje serve de apoio para essa heuristica.
- `src/ui/screens/CommissionReportScreen.tsx`
  Contexto: tela consumidora do relatorio final.
- `src/viewmodels/useCommissionReportViewModel.ts`
  Contexto: camada de orquestracao do fluxo atual de comissao.

### 12. Grafico mensal semanticamente errado

**Achados relacionados**

- `F02`

**Arquivos principais**

- `src/viewmodels/useFinanceViewModel.ts`
  Contexto: constrói `cashFlowData`, mas hoje entrega apenas um ponto apesar do rotulo de 6 meses.
- `src/ui/screens/FinanceScreen.tsx`
  Contexto: promete "Fluxo Mensal (Ultimos 6 meses)" e precisa ser realinhada com a semantica do dado.

### 13. Shared event dependente de sentinelas e defaults ocultos

**Achados relacionados**

- `D06`

**Arquivos principais**

- `src/viewmodels/useSharedEventViewModel.ts`
  Contexto: procura/cria cliente "Compartilhado", tipo "Compartilhado" e usa primeiro local de embarque disponivel.
- `src/ui/components/SharedEventModal.tsx`
  Contexto: UI do fluxo que hoje mascara as decisoes de dominio implicitas.
- `src/core/repositories/ClientRepository.ts`
  Contexto: participa da criacao/lookup da entidade sentinela.
- `src/core/repositories/TourTypeRepository.ts`
  Contexto: participa da criacao/lookup do tipo sentinela.
- `src/core/repositories/BoardingLocationRepository.ts`
  Contexto: fornece o default implicito do "primeiro local".

### 14. Voucher com superficie de risco maior que o necessario

**Achados relacionados**

- `E09`
- `F06`

**Arquivos principais**

- `src/ui/screens/VoucherScreen.tsx`
  Contexto: renderiza HTML vindo do banco com `dangerouslySetInnerHTML`.
- `src/viewmodels/VoucherAppearanceViewModel.ts`
  Contexto: transforma imagem em base64 e persiste no fluxo atual.
- `src/core/repositories/VoucherAppearanceRepository.ts`
  Contexto: persiste a imagem no documento do Firestore.
- `src/viewmodels/useVoucherViewModel.ts`
  Contexto: faz bootstrap indireto para rota publica e precisa ser revisado no boundary de leitura.
- `src/core/repositories/VoucherTermsRepository.ts`
  Contexto: fonte do HTML de termos que sera exibido publicamente.

### 15. Defaults implicitos e divergencia entre codigo e regras documentadas

**Achados relacionados**

- `D07`
- `H02`

**Arquivos principais**

- `src/core/repositories/CompanyDataRepository.ts`
  Contexto: inventa defaults em memoria e usa `company_data`.
- `src/core/repositories/VoucherTermsRepository.ts`
  Contexto: inventa defaults em memoria e usa `voucher_terms`.
- `src/core/repositories/VoucherAppearanceRepository.ts`
  Contexto: usa `voucher_appearance`.
- `docs/FIRESTORE_SECURITY_RULES.md`
  Contexto: documenta nomes de colecao diferentes dos usados no codigo.

### 16. Bug potencial com Tailwind dinamico

**Achados relacionados**

- `E08`

**Arquivos principais**

- `src/ui/screens/ClientHistoryScreen.tsx`
  Contexto: usa `bg-${color}-100` e `text-${color}-800`.
- `tailwind.config.js`
  Contexto: nao possui `safelist` nem estrategia explicita para essas classes.

### 17. Complexidade local fora de controle

**Achados relacionados**

- `E02`
- `E03`
- `E06`
- `E07`
- `C05`
- `C06`

**Arquivos principais**

- `src/ui/screens/CreateEventScreen.tsx`
  Contexto: tela muito grande e fortemente acoplada ao hook principal.
- `src/viewmodels/useCreateEventViewModel.ts`
  Contexto: principal concentrador de regra, estado de UI e persistencia.
- `src/ui/components/EventQuickEditModal.tsx`
  Contexto: componente grande com `sort()` em render e mutacao de props.
- `src/ui/screens/DashboardScreen.tsx`
  Contexto: precisa ser revisada junto do ViewModel.
- `src/ui/screens/ClientHistoryScreen.tsx`
  Contexto: idem.

### 18. Documentacao e configuracao nao confiaveis

**Achados relacionados**

- `A05`
- `H01`
- `H03`
- `H04`
- `H05`

**Arquivos principais**

- `README.md`
  Contexto: promete qualidade, stack e maturidade acima do que o codigo sustenta hoje.
- `docs/README.md`
  Contexto: replica a narrativa arquitetural como se ela ja existisse.
- `docs/PROJECT_DOCUMENTATION.md`
  Contexto: precisa ser revisado contra a arquitetura real apos a refatoracao.
- `docs/DEVELOPMENT_GUIDE.md`
  Contexto: precisa refletir o fluxo real de desenvolvimento e validacao.
- `docs/FIRESTORE_SECURITY_RULES.md`
  Contexto: hoje documenta colecoes e readiness de forma nao confiavel.
- `vite.config.ts`
  Contexto: possui manifesto PWA com encoding quebrado e assets inconsistentes.

---

## Fluxos Criticos - Estado Atual vs Estado Alvo

Esta secao existe para reduzir interpretacao livre durante a execucao. Ela define, de forma curta, o que o sistema faz hoje e qual fluxo deve existir ao final.

### 1. Reset de senha

**Estado atual**

- View chama `usePasswordResetViewModel`.
- O ViewModel mistura email reset, aprovacao manual e pergunta secreta.
- Dados sensiveis trafegam na URL.
- A troca final de senha nao amarra corretamente o usuario alvo.

**Estado alvo**

- View inicia um fluxo legitimo de identidade.
- O provedor de auth ou backend emite token apropriado de uso unico.
- Nenhum dado sensivel trafega em query string aberta.
- A confirmacao final opera no alvo correto e gera auditoria.

### 2. Bootstrap de autenticacao e perfil

**Estado atual**

- `AuthContext` autentica, carrega perfil, expande wrappers, inicializa repositories e faz teardown global.
- Logout interfere no lifecycle de objetos reutilizados pelo app.

**Estado alvo**

- `AuthContext` fica fino e previsivel.
- Auth, profile, identity e bootstrap ficam separados.
- Repositories deixam de depender de lifecycle dirigido pela UI.
- Logout encerra sessao sem invalidar indevidamente a infraestrutura compartilhada.

### 3. Evento, pagamento, despesa e sync

**Estado atual**

- Hooks diferentes salvam evento, pagamento, despesa e sincronizacao em varias etapas independentes.
- Falha intermediaria deixa estado parcial.

**Estado alvo**

- Um caso de uso unico coordena a operacao critica.
- Persistencia relevante ocorre de forma atomica ou com compensacao formal.
- Auditoria e sincronizacao acontecem com semantica previsivel.

### 4. Shared event

**Estado atual**

- O fluxo depende de cliente sentinela, tour sentinela e defaults ocultos.
- Parte da regra de dominio fica mascarada como conveniencia de UI.

**Estado alvo**

- Shared event vira caso de uso explicito.
- Dependencias obrigatorias sao definidas por contrato.
- Nao existe regra critica escondida em valor default textual.

### 5. Financeiro e relatorios

**Estado atual**

- Relatorios usam listeners truncados e fontes semanticas divergentes.
- A tela ainda tenta corrigir dados via backfill client-side.

**Estado alvo**

- Relatorios usam consulta por periodo, agregacao ou fonte apropriada.
- A semantica financeira e unica entre dashboard, financeiro e livro-caixa.
- Nenhuma tela muta colecao de producao como "correcao automatica".

### 6. Voucher publico

**Estado atual**

- A rota publica depende de bootstrap indireto.
- HTML vindo do banco e renderizado publicamente.
- Imagens sao persistidas em base64 no documento.

**Estado alvo**

- A leitura publica do voucher e isolada e previsivel.
- HTML exibido e saneado.
- Midia e assets seguem estrategia escalavel e segura.

---

## Sequencia Obrigatoria

1. Fase 0 - Baseline tecnico.
2. Fase 1 - Seguranca, auth e enforcement.
3. Fase 2 - Contratos, type safety e erros do core.
4. Fase 3 - Dominio, auditoria e transacoes.
5. Fase 4 - MVVM real nas areas criticas.
6. Fase 5 - Relatorios, performance, integracoes e testes.
7. Fase 6 - Documentacao, encoding e limpeza final.

---

## Fase 0 - Baseline Tecnico

### Objetivo

Voltar a ter um projeto que compila, linta e pode ser validado de forma repetivel.

### Achados cobertos

- `A01`
- `A02`
- `A03`
- `A04`

### Prioridade interna

- Bloqueadores: `install`, `build`, `lint` e CI.
- Obrigatorios: `tsconfig`, scripts reais e assets PWA validos.
- Melhorias: limpeza de scripts auxiliares e warnings nao bloqueantes.

### Arquivos-alvo prioritarios

- `package.json`
  Contexto: scripts, dependencias e contrato real de execucao do projeto.
- `package-lock.json`
  Contexto: precisa refletir exatamente o estado instalavel esperado.
- `tsconfig.app.json`
  Contexto: parte do problema de compatibilidade e type-check do app.
- `tsconfig.node.json`
  Contexto: precisa bater com a versao de TypeScript e ferramentas usadas.
- `vite.config.ts`
  Contexto: manifesta assets PWA, plugin stack e parte do comportamento de build.
- `playwright.config.ts`
  Contexto: entra no baseline porque o smoke de CI depende dele.
- `public/`
  Contexto: abriga os assets PWA que hoje podem estar ausentes ou inconsistentes.

### Fora de escopo nesta fase

- Nao redesenhar autenticacao, reset de senha ou regras de autorizacao.
- Nao refatorar ViewModel, MVVM ou dominio de negocio.
- Nao corrigir ainda relatorios, shared event ou comissao.

### Tarefas

- [ ] Corrigir instalacao local e lockfile para estado consistente.
- [ ] Ajustar `tsconfig.app.json` e `tsconfig.node.json` para a versao real do TypeScript instalada.
- [ ] Garantir que `npm run build` funcione do inicio ao fim.
- [ ] Garantir que `npm run lint` funcione do inicio ao fim.
- [ ] Corrigir referencias de assets PWA invalidos.
- [ ] Revisar scripts do `package.json` para refletir o estado real do projeto.
- [ ] Criar pipeline minima com `install`, `lint`, `build` e smoke E2E.
- [ ] Bloquear merge sem pipeline verde.

### Criterios de aceite

- [ ] `npm install` sem divergencia entre `package.json` e lockfile.
- [ ] `npm run lint` verde.
- [ ] `npm run build` verde.
- [ ] CI executando automaticamente em PR.
- [ ] PWA sem referencia a assets inexistentes.

### Validacao objetiva por achado

- `A01`: validar `npm install` em ambiente limpo e conferir lockfile sem drift posterior.
- `A02`: validar `npx tsc -p tsconfig.app.json --noEmit` e `npx tsc -p tsconfig.node.json --noEmit`.
- `A03`: validar `npm run lint` local e na pipeline.
- `A04`: validar `npm run build` sem erro de asset e conferir que o manifesto PWA nao referencia arquivo inexistente.

### Plano de migracao e rollback

- Todas as alteracoes desta fase devem ficar em PR isolado de baseline.
- Se `install`, `build` ou `lint` piorarem em ambiente limpo, o rollback e total no lockfile, scripts e configs desta fase.
- Nenhuma correcao funcional entra junto; isso mantem o rollback simples.

### Estimativa

- 1 a 2 dias.

---

## Fase 1 - Seguranca, Auth e Enforcement

### Objetivo

Eliminar riscos que hoje impedem aprovacao tecnica seria e garantir que autenticacao/autorizacao tenham semantica correta.

### Achados cobertos

- `B01`
- `B02`
- `B03`
- `B04`
- `B05`
- `B06`
- `B07`
- `B08`
- `B09`
- `C04`
- `C07`
- `G01`
- `H02`

### Prioridade interna

- Bloqueadores: reset de senha, URL sensivel, `terminate(db)` e segredos versionados.
- Obrigatorios: reauth correto, enforcement server-side e auditoria minima real.
- Melhorias: preparacao de compatibilidade para a quebra posterior do `AuthContext`.

### Arquivos-alvo prioritarios

- `src/viewmodels/usePasswordResetViewModel.ts`
  Contexto: concentrador atual do fluxo inseguro de reset.
- `src/ui/screens/ForgotPasswordScreen.tsx`
  Contexto: inicia fluxo com dados sensiveis na navegacao.
- `src/ui/screens/ResetPasswordSecretScreen.tsx`
  Contexto: etapa intermediaria hoje baseada em pergunta secreta.
- `src/ui/screens/SetNewPasswordScreen.tsx`
  Contexto: precisa respeitar corretamente o fluxo legitimo do provedor.
- `src/ui/screens/UserManagementScreen.tsx`
  Contexto: usa aprovacao manual falsa como se fosse senha temporaria real.
- `src/contexts/AuthContext.tsx`
  Contexto: mistura auth, profile, reset e lifecycle destrutivo.
- `src/viewmodels/useProfileViewModel.ts`
  Contexto: precisa separar perfil de operacoes identitarias sensiveis.
- `src/viewmodels/useUserManagementViewModel.ts`
  Contexto: expoe problema de autorizacao baseada em filtro client-side.
- `src/core/repositories/AuditLogRepository.ts`
  Contexto: precisa deixar de ser stub.
- `docs/FIRESTORE_SECURITY_RULES.md`
  Contexto: precisa refletir enforcement e naming real.
- `tests/prepare-data.spec.ts`
  Contexto: exemplo direto de segredo versionado.
- `tests/capture-screenshots.spec.ts`
  Contexto: outro ponto com credencial real no repositorio.

### Fora de escopo nesta fase

- Nao fatiar ainda todos os hooks grandes do sistema.
- Nao reescrever o financeiro nem o shared event.
- Nao reestruturar ainda toda a suite de testes alem da remocao de segredos e riscos imediatos.

### Tarefas

#### Reset de senha e identidade

- [ ] Redesenhar o fluxo de reset de senha.
- [ ] Remover pergunta secreta do cliente e qualquer dado sensivel em query string.
- [ ] Remover aprovacao manual falsa e stub de senha temporaria.
- [ ] Garantir que a troca de senha ocorra por fluxo valido do provedor de autenticacao.
- [ ] Garantir que o usuario alvo da troca seja respeitado por design, sem ambiguidade.

#### Perfil, email e senha

- [ ] Revisar o fluxo de update de perfil para suportar reauth onde necessario.
- [ ] Separar claramente "edicao do proprio perfil" de "edicao administrativa de dados de perfil".
- [ ] Garantir que alteracao de email e senha nao fique mascarada como update generico de perfil.

#### Auth e lifecycle

- [ ] Revisar `AuthContext` para remover comportamento destrutivo inseguro no logout.
- [ ] Remover dependencia de cleanup que invalida o singleton do Firestore de forma imprevisivel.
- [ ] Explicitar ownership entre auth, profile, identity e bootstrap de repositories.

#### Autorizacao e enforcement

- [ ] Mover o enforcement de autorizacao critica para backend/regras onde aplicavel.
- [ ] Eliminar padrao "buscar tudo e filtrar no cliente" para dados administrativos.
- [ ] Definir o que fica no cliente apenas como UX e o que precisa ser proibido server-side.

#### Auditoria

- [ ] Substituir `AuditLogRepository` stub por mecanismo real.
- [ ] Registrar operacoes criticas: mudanca de role, status, comissao, reset, configuracoes e operacoes financeiras criticas.
- [ ] Definir modelo minimo de auditoria: ator, alvo, acao, contexto e timestamp.

#### Testes e segredos

- [ ] Remover credenciais reais de todos os testes.
- [ ] Introduzir contas de teste, fixture controlada ou seed dedicado.
- [ ] Garantir que nenhum segredo sensivel seja versionado no repositório.

### Criterios de aceite

- [ ] Nenhum reset de senha depende de stub.
- [ ] Nenhum dado sensivel trafega via URL sem token apropriado.
- [ ] Nenhum fluxo de email/senha ignora reauth quando necessario.
- [ ] Nenhuma operacao administrativa depende apenas de filtro no cliente para estar segura.
- [ ] Existe auditoria persistida para operacoes criticas.
- [ ] Nenhuma credencial real existe no repositorio.
- [ ] Fluxo de logout nao invalida o app de forma imprevisivel.

### Validacao objetiva por achado

- `B01` a `B05`: executar walkthrough completo de reset de senha e comprovar que nao ha pergunta secreta, stub nem dado sensivel em URL.
- `B06` e `B07`: executar ciclo login -> logout -> login e comprovar que o app continua funcional sem teardown destrutivo.
- `B08`: validar separadamente o fluxo de autoedicao de credenciais e o fluxo administrativo de perfil.
- `B09`, `C04` e `H02`: validar com usuario sem privilegio que leitura e escrita administrativas sao negadas pelas regras e que a documentacao de colecoes bate com a implementacao.
- `C07`: executar uma operacao critica e confirmar registro persistido de auditoria.
- `G01`: revisar a base com busca por credenciais conhecidas e comprovar substituicao por fixture ou segredo de ambiente.

### Plano de migracao e rollback

- O novo fluxo de reset deve entrar primeiro com compatibilidade de navegacao e somente depois substituir as rotas antigas.
- Mudancas de regra de seguranca devem ser separadas das mudancas de UI sempre que possivel para facilitar rollback.
- Se houver regressao em login, reset ou autorizacao, o rollback prioritario e restaurar as regras e as entradas de rota da fase anterior antes de retomar a refatoracao.

### Estimativa

- 4 a 6 dias.

---

## Fase 2 - Contratos, Type Safety e Erros do Core

### Objetivo

Garantir que as camadas conversem com contratos verdadeiros, tipados e semanticamente consistentes.

### Achados cobertos

- `C01`
- `C02`
- `C05`
- `C06`
- `C04` parcialmente

### Prioridade interna

- Bloqueadores: contratos inexistentes chamados em producao.
- Obrigatorios: alinhamento de interfaces, type safety do caminho critico e erro previsivel.
- Melhorias: endurecimento gradual de lint para impedir regressao.

### Arquivos-alvo prioritarios

- `src/core/repositories/PaymentRepository.ts`
  Contexto: contrato nao bate com consumidores importantes.
- `src/core/repositories/EventRepository.ts`
  Contexto: subscribe e API publica precisam ser realinhados.
- `src/core/repositories/ExpenseRepository.ts`
  Contexto: participa de contratos de escrita e leitura relevantes.
- `src/core/repositories/IncomeRepository.ts`
  Contexto: parte da consistencia da camada de dados.
- `src/core/repositories/CompanyDataRepository.ts`
  Contexto: precisa contrato explicito e menos ambiguidade.
- `src/core/repositories/VoucherTermsRepository.ts`
  Contexto: idem.
- `src/core/repositories/VoucherAppearanceRepository.ts`
  Contexto: idem.
- `src/viewmodels/useClientHistoryViewModel.ts`
  Contexto: chama metodos que hoje nao existem no contrato real.
- `src/viewmodels/useCashBookViewModel.ts`
  Contexto: depende de subscribe e remocoes mal alinhadas.
- `src/viewmodels/useGlobalSync.ts`
  Contexto: depende de subscribe global nao garantido pela API.
- `src/viewmodels/useFinanceViewModel.ts`
  Contexto: depende de leitura e subscribe que precisam semantica formal.

### Fora de escopo nesta fase

- Nao mudar ainda a regra de negocio de status, comissao ou shared event.
- Nao fatiar ainda estruturalmente todos os ViewModels grandes.
- Nao redesenhar ainda o financeiro do ponto de vista de UX.

### Tarefas

#### Contratos entre camadas

- [ ] Mapear todos os contratos quebrados entre ViewModels e repositories.
- [ ] Corrigir `PaymentRepository` e consumidores para a mesma API real.
- [ ] Corrigir `EventRepository` e consumidores para a mesma API real.
- [ ] Revisar contratos equivalentes em `ExpenseRepository`, `IncomeRepository`, `CompanyDataRepository`, `VoucherTermsRepository` e `VoucherAppearanceRepository`.
- [ ] Definir contratos explicitos para operacoes de leitura, escrita e subscribe.

#### Type safety

- [ ] Remover `any` das entidades e fluxos centrais.
- [ ] Proibir novo uso de `any` via lint nas areas novas/refatoradas.
- [ ] Revisar tipos de dominio para evitar overload semantico e campos ambiguos.
- [ ] Eliminar casts inseguros em caminho critico.

#### Erros e logging

- [ ] Substituir `console.*` por camada de logging minima e controlada.
- [ ] Padronizar erros tecnicos vs erros de usuario.
- [ ] Proibir `catch` silencioso em fluxos criticos.
- [ ] Definir formato minimo de erro para ViewModel e UI.

### Criterios de aceite

- [ ] `tsc` sem erro de contrato.
- [ ] Nenhum consumidor chama metodo inexistente.
- [ ] Caminho critico tipado sem `any`.
- [ ] Nao ha `catch` silencioso em fluxos criticos.
- [ ] Tratamento de erro consistente nas operacoes principais.

### Validacao objetiva por achado

- `C01` e `C02`: rodar `tsc` e comprovar que nenhum consumidor chama metodo inexistente ou assinatura divergente.
- `C04`: revisar que contratos nao dependem mais de permissao implicita mascarada como estado do repository.
- `C05`: inspecionar os caminhos criticos definidos nesta fase e comprovar remocao de `any`.
- `C06`: executar fluxos principais com erro induzido e confirmar retorno previsivel para ViewModel e UI.

### Plano de migracao e rollback

- Contratos devem ser alinhados com adaptadores temporarios apenas quando reduzirem risco de mudanca em cascata.
- Nenhuma alteracao de contrato deve vir junto com regra nova de dominio.
- Se um contrato quebrar consumidores importantes, o rollback e restaurar a API anterior e reintroduzir a mudanca de forma incremental por modulo.

### Estimativa

- 4 a 6 dias.

---

## Fase 3 - Dominio, Auditoria e Transacoes

### Objetivo

Consolidar regras de negocio em uma unica fonte de verdade e garantir consistencia transacional.

### Achados cobertos

- `D01`
- `D02`
- `D03`
- `D04`
- `D05`
- `D06`
- `D07`
- `D08`
- `C07` parcialmente

### Prioridade interna

- Bloqueadores: operacoes financeiras sem atomicidade e status duplicado.
- Obrigatorios: shared event explicito, comissao estruturada e fim do backfill em tela.
- Melhorias: consolidacao adicional de defaults e auditoria de dominio.

### Arquivos-alvo prioritarios

- `src/viewmodels/useDashboardViewModel.ts`
  Contexto: concentra mudanca de status e confirmacao de pagamento.
- `src/viewmodels/useClientHistoryViewModel.ts`
  Contexto: repete regras de status e exclusao.
- `src/viewmodels/useCashBookViewModel.ts`
  Contexto: tambem reage a status e exclusao de pagamento.
- `src/viewmodels/useEventCostViewModel.ts`
  Contexto: atualiza custos e despesas de modo nao atomico.
- `src/viewmodels/useSharedEventViewModel.ts`
  Contexto: shared event atual depende de sentinelas e etapas independentes.
- `src/viewmodels/useFinanceViewModel.ts`
  Contexto: abriga o backfill client-side que precisa sair da tela.
- `src/core/repositories/EventRepository.ts`
  Contexto: faz parte do boundary transacional do evento.
- `src/core/repositories/PaymentRepository.ts`
  Contexto: faz parte do boundary transacional do pagamento.
- `src/core/repositories/ExpenseRepository.ts`
  Contexto: faz parte do boundary transacional das despesas.
- `src/core/repositories/CommissionRepository.ts`
  Contexto: hoje depende de heuristica textual.
- `src/core/repositories/CompanyDataRepository.ts`
  Contexto: defaults implicitos precisam virar contrato claro.
- `src/core/repositories/VoucherTermsRepository.ts`
  Contexto: idem para configuracao sensivel.

### Fora de escopo nesta fase

- Nao refazer ainda a arquitetura completa de MVVM das telas.
- Nao reestruturar ainda a camada de apresentacao do voucher publico.
- Nao expandir ainda a suite E2E alem do minimo necessario para proteger os fluxos alterados.

### Tarefas

#### Regras de status e pagamento

- [ ] Centralizar regra de status de evento baseada em pagamento.
- [ ] Centralizar regra de auto-cancelamento e reversao.
- [ ] Consolidar regra de confirmacao de pagamento e reflexos no evento.
- [ ] Eliminar duplicacao dessa logica entre dashboard, historico de cliente e livro caixa.

#### Operacoes atomicas

- [ ] Encapsular fluxos `evento + pagamento + despesa + sync` em operacoes atomicas.
- [ ] Revisar `useEventCostViewModel` para nao remover e recriar despesas sem transacao.
- [ ] Revisar criacao/edicao de shared event para nao produzir estado parcial.
- [ ] Revisar exclusao de evento com pagamentos e integracao externa para comportamento consistente.

#### Comissao

- [ ] Modelar pagamento de comissao com dado estruturado, nao por descricao textual.
- [ ] Revisar fonte de dados da comissao para nao depender de heuristica textual.
- [ ] Corrigir a estrategia de identificacao de "pago" e "pendente".

#### Defaults implicitos e fonte de verdade

- [ ] Eliminar defaults sensiveis inventados em memoria sem persistencia ou contrato.
- [ ] Definir quais configuracoes sao obrigatorias para operar.
- [ ] Falhar explicitamente quando configuracao obrigatoria estiver ausente.

#### Backfill e migracao de dados

- [ ] Remover `backfillFinancialData()` do fluxo de tela.
- [ ] Migrar esse comportamento para rotina controlada de manutencao ou migracao.
- [ ] Criar plano de backfill seguro, observavel e idempotente.

### Criterios de aceite

- [ ] Nenhum fluxo financeiro critico deixa estado parcial em caso de erro.
- [ ] Mudanca de status existe em um unico lugar.
- [ ] Comissao paga nao depende de `description.includes(...)`.
- [ ] Shared event usa regra explicita de dominio.
- [ ] Configuracoes obrigatorias nao sao inventadas silenciosamente em memoria.
- [ ] Nenhuma tela dispara batch corretivo em colecao de producao.

### Validacao objetiva por achado

- `D01` e `D02`: provar que a regra de status e auto-cancelamento existe em um unico caso de uso ou servico reutilizado.
- `D03` e `D04`: induzir falha intermediaria e comprovar ausencia de estado parcial persistido.
- `D05`: validar que o relatorio de comissao nao depende mais de descricao textual livre.
- `D06`: validar criacao e edicao de shared event sem cliente, tour ou local sentinela implicito.
- `D07`: remover configuracao obrigatoria e comprovar falha explicita, sem default silencioso inventado.
- `D08`: comprovar que nenhuma tela dispara backfill corretivo em dados de producao.
- `C07`: validar auditoria de operacoes criticas de dominio apos a consolidacao.

### Plano de migracao e rollback

- Qualquer migracao de dados desta fase deve ser idempotente, observavel e executavel fora da UI.
- Fluxos novos de dominio devem entrar primeiro em paralelo ao comportamento legado quando isso reduzir risco.
- Se uma migracao financeira gerar divergencia, o rollback prioriza congelar o fluxo novo, preservar os dados fonte e recomputar a partir deles, nunca corrigir manualmente pela tela.

### Estimativa

- 5 a 8 dias.

---

## Fase 4 - MVVM Real nas Areas Criticas

### Objetivo

Aplicar separacao real entre View, ViewModel e acesso a dados nas areas que hoje concentram acoplamento e complexidade.

### Achados cobertos

- `E01`
- `E02`
- `E03`
- `E04`
- `E05`
- `E06`
- `E07`
- `E08`
- `E09` parcialmente
- `C03`

### Prioridade interna

- Bloqueadores: `AuthContext`, `useCreateEventViewModel` e telas que importam repository direto.
- Obrigatorios: quebrar pontos de acoplamento sem mudar a semantica de negocio.
- Melhorias: reducao de tamanho de arquivo, organizacao de componentes e Tailwind previsivel.

### Arquivos-alvo prioritarios

- `src/contexts/AuthContext.tsx`
  Contexto: god object que precisa virar casca fina.
- `src/viewmodels/useCreateEventViewModel.ts`
  Contexto: principal god hook da base.
- `src/viewmodels/useDashboardViewModel.ts`
  Contexto: mistura orquestracao, dominio e estado de UI.
- `src/viewmodels/useClientHistoryViewModel.ts`
  Contexto: idem.
- `src/viewmodels/useFinanceViewModel.ts`
  Contexto: tambem mistura concerns demais.
- `src/ui/screens/FinanceScreen.tsx`
  Contexto: acessa repository diretamente.
- `src/ui/components/Layout.tsx`
  Contexto: manipula DOM imperativamente.
- `src/ui/screens/CreateEventScreen.tsx`
  Contexto: tela grande demais e acoplada ao hook principal.
- `src/ui/components/EventQuickEditModal.tsx`
  Contexto: concentra complexidade local e mutacao indevida.
- `src/ui/screens/ClientHistoryScreen.tsx`
  Contexto: depende de classes Tailwind dinamicas e precisa ficar previsivel.

### Fora de escopo nesta fase

- Nao alterar regra de negocio financeira alem do necessario para extracao.
- Nao trocar semantica de relatorio ou de integracao externa nesta fase.
- Nao reinventar design visual das telas como objetivo principal.

### Ordem de refatoracao

1. Auth e perfil.
2. Dashboard e historico de cliente.
3. Criacao/edicao de evento.
4. Financeiro e livro caixa.
5. Modulos administrativos restantes.
6. Voucher e configuracoes.

### Tarefas

#### Auth e perfil

- [ ] Quebrar `AuthContext` em servicos/coordenadores menores.
- [ ] Remover regras de negocio do contexto global.
- [ ] Separar responsabilidades de identity, profile, linking externo e bootstrap de app.

#### ViewModels monoliticos

- [ ] Fatiar `useCreateEventViewModel` por casos de uso.
- [ ] Fatiar `useDashboardViewModel`.
- [ ] Fatiar `useClientHistoryViewModel`.
- [ ] Fatiar `useFinanceViewModel`.
- [ ] Revisar hooks auxiliares para evitar mistura de UI state com dominio.

#### Views e componentes

- [ ] Remover acesso direto de tela para repository.
- [ ] Eliminar manipulacao imperativa de DOM em componentes React.
- [ ] Corrigir pontos com mutacao de props durante render.
- [ ] Reduzir arquivos gigantes e separar componentes de apresentacao.
- [ ] Trocar classes dinamicas do Tailwind por mapeamento explicito ou safelist validada.

#### Repositories

- [ ] Tornar repositories stateless ou, no minimo, sem responsabilidade de store global da interface.
- [ ] Retirar listeners e caches ocultos do papel de "fonte de verdade da UI" quando isso violar separacao de responsabilidade.

### Criterios de aceite

- [ ] View so renderiza e dispara intencoes.
- [ ] ViewModel nao conhece detalhes de DOM ou estrutura visual.
- [ ] Repository so acessa dados.
- [ ] `AuthContext` deixa de ser ponto central de regra de negocio.
- [ ] Nao ha mutacao de props durante render.
- [ ] Classes Tailwind dinamicas criticas foram eliminadas ou formalmente suportadas.

### Validacao objetiva por achado

- `E01` e `C03`: comprovar que `AuthContext` e repositories nao concentram mais bootstrap, store global e regra de negocio ao mesmo tempo.
- `E02` e `E03`: comprovar quebra dos hooks grandes em unidades menores com responsabilidade delimitada.
- `E04`: revisar imports e comprovar que telas nao importam repository concreto.
- `E05`: comprovar remocao de manipulacao imperativa de DOM onde React resolve o fluxo.
- `E06` e `E07`: validar reducao de complexidade local e ausencia de mutacao de props durante render.
- `E08`: validar build de producao com classes Tailwind criticas resolvidas de forma deterministica.
- `E09`: garantir que a refatoracao de MVVM nao reintroduz o problema de midia e base64 do voucher.

### Plano de migracao e rollback

- Cada modulo deve manter contrato externo estavel enquanto a extracao interna acontece.
- Quando necessario, usar adaptadores temporarios para preservar chamadas antigas durante a transicao.
- Se um fatiamento aumentar regressao funcional, o rollback deve restaurar o modulo anterior inteiro, nao metade da extracao.

### Estimativa

- 1,5 a 2,5 semanas.

---

## Fase 5 - Relatorios, Performance, Integracoes e Testes

### Objetivo

Garantir que os dados exibidos sejam confiaveis, que integracoes nao fiquem fragilizadas no cliente e que os testes representem o produto real.

### Achados cobertos

- `F01`
- `F02`
- `F03`
- `F04`
- `F05`
- `F06`
- `E09` parcialmente
- `G02`
- `G03`
- `G04`
- `G05`

### Prioridade interna

- Bloqueadores: dados truncados, livro-caixa inconsistente e suite E2E ficticia.
- Obrigatorios: integracoes robustas, voucher publico previsivel e testes reproduziveis.
- Melhorias: otimizar UX de erro, PDF e observabilidade das integracoes.

### Arquivos-alvo prioritarios

- `src/core/repositories/PaymentRepository.ts`
  Contexto: origem do truncamento que hoje vaza para relatorios.
- `src/viewmodels/useFinanceViewModel.ts`
  Contexto: base do grafico mensal, relatorios e parte do backfill.
- `src/viewmodels/useCashBookViewModel.ts`
  Contexto: livro-caixa depende de contratos e semantica corretos.
- `src/ui/screens/FinanceScreen.tsx`
  Contexto: promete um grafico mensal que hoje nao existe de verdade.
- `src/ui/screens/CashBookScreen.tsx`
  Contexto: renderiza a visao financeira final que precisa bater com a base.
- `src/viewmodels/useGlobalSync.ts`
  Contexto: sync em massa do Google precisa sair do modelo fragil atual.
- `src/lib/firebase.ts`
  Contexto: inicializacao de analytics precisa guardas robustas de ambiente.
- `src/viewmodels/useVoucherViewModel.ts`
  Contexto: rota publica depende de bootstrap indireto.
- `src/ui/screens/VoucherScreen.tsx`
  Contexto: renderizacao publica e PDF precisam semantica previsivel.
- `src/viewmodels/VoucherAppearanceViewModel.ts`
  Contexto: participa da estrategia de imagem do voucher.
- `src/core/repositories/VoucherAppearanceRepository.ts`
  Contexto: persiste a imagem em formato inadequado hoje.
- `tests/`
  Contexto: precisa ser segmentada e saneada como suite confiavel.
- `playwright.config.ts`
  Contexto: paralelismo e estrategia de execucao precisam refletir a realidade dos specs.

### Fora de escopo nesta fase

- Nao refazer novamente a separacao MVVM ja tratada na fase anterior.
- Nao alterar sem necessidade o dominio central ja consolidado na fase 3.
- Nao usar a fase de testes para esconder defeito funcional ainda nao resolvido.

### Tarefas

#### Relatorios e dados

- [ ] Trocar leituras truncadas por consultas por periodo ou agregacao adequada.
- [ ] Revisar `PaymentRepository` e demais fontes para que relatorios nao dependam de listener limitado.
- [ ] Corrigir a base do grafico mensal para refletir o que a UI promete.
- [ ] Revisar a origem dos dados do livro caixa.
- [ ] Garantir que dashboards, relatorios e livro caixa usem a mesma semantica financeira.

#### Integracoes externas

- [ ] Revisar sync em massa do Google para nao depender de loop sequencial no cliente para tarefas pesadas.
- [ ] Melhorar tratamento de erro e observabilidade da integracao com Google.
- [ ] Revisar inicializacao de analytics para ambientes suportados de forma segura.
- [ ] Revisar voucher publico para nao depender de bootstrap indireto de repositories autenticados.

#### Voucher e assets

- [ ] Mover estrategia de imagem do voucher para abordagem mais escalavel do que base64 no documento.
- [ ] Garantir saneamento adequado do HTML exibido no voucher.
- [ ] Revisar download e renderizacao de PDF em relacao a erro, UX e performance.

#### Testes

- [ ] Separar testes funcionais, testes de screenshot e scripts operacionais.
- [ ] Remover dependencias de `TEST_MODE` inexistente ou implementa-lo formalmente com contrato claro.
- [ ] Criar fixtures e seed deterministico.
- [ ] Isolar dados de teste por execucao.
- [ ] Revisar estrategia de paralelismo do Playwright.
- [ ] Criar smoke tests para fluxos criticos: login, evento, pagamento, cancelamento, voucher, admin.
- [ ] Adicionar testes de regressao para reset de senha, perfil, comissao e financeiro.

### Criterios de aceite

- [ ] Relatorios batem com a base.
- [ ] Livro caixa nao depende de dados truncados.
- [ ] Integracoes externas nao executam tarefas pesadas no cliente sem controle.
- [ ] Voucher publico nao depende de init oculto.
- [ ] Nenhum teste depende de modo ficticio nao implementado.
- [ ] Suite E2E reproduzivel em ambiente limpo.

### Validacao objetiva por achado

- `F01` e `F03`: comparar relatorios e livro-caixa contra consultas base ou amostra conhecida e comprovar ausencia de truncamento.
- `F02`: validar que o grafico mensal exibe de fato a serie prometida ou foi renomeado para semantica verdadeira.
- `F04`: induzir falha no sync e comprovar tratamento previsivel, observabilidade e ausencia de loop pesado sem controle no cliente.
- `F05`: validar inicializacao de analytics em ambiente suportado e nao suportado sem quebra.
- `F06` e `E09`: abrir voucher publico em ambiente limpo e comprovar que ele nao depende de bootstrap autenticado nem de base64 inseguro como estrategia principal.
- `G02` a `G05`: executar suite E2E limpa, sem `TEST_MODE` fantasma, sem colisao paralela e com cobertura minima dos fluxos criticos definidos.

### Plano de migracao e rollback

- Relatorios novos devem ser comparados com a fonte anterior antes do corte definitivo sempre que a semantica mudar.
- Integracoes externas devem ter rollback simples para modo anterior de disparo enquanto observabilidade e retries nao estiverem estaveis.
- A troca da estrategia de midia do voucher deve preservar leitura dos dados antigos ate que a migracao esteja concluida.

### Estimativa

- 5 a 7 dias.

---

## Fase 6 - Documentacao, Encoding e Limpeza Final

### Objetivo

Fechar a diferenca entre o sistema real e o que o projeto diz que ele e.

### Achados cobertos

- `A05`
- `D07` parcialmente
- `H01`
- `H02`
- `H03`
- `H04`
- `H05`

### Prioridade interna

- Bloqueadores: documentacao que contradiz o sistema real.
- Obrigatorios: alinhamento entre docs, colecoes, regras, encoding e claims tecnicas.
- Melhorias: limpeza adicional de codigo morto, scripts e ativos legados.

### Arquivos-alvo prioritarios

- `README.md`
  Contexto: principal ponto de promessa tecnica do projeto.
- `docs/README.md`
  Contexto: replica a narrativa arquitetural.
- `docs/PROJECT_DOCUMENTATION.md`
  Contexto: precisa refletir o sistema apos as fases anteriores.
- `docs/DEVELOPMENT_GUIDE.md`
  Contexto: deve registrar fluxo real de desenvolvimento e validacao.
- `docs/FIRESTORE_SECURITY_RULES.md`
  Contexto: precisa bater com colecoes, regras e enforcement real.
- `vite.config.ts`
  Contexto: ainda pode concentrar referencias PWA e encoding a documentar.
- `src/core/repositories/CompanyDataRepository.ts`
  Contexto: ajuda a validar naming e defaults reais.
- `src/core/repositories/VoucherTermsRepository.ts`
  Contexto: idem.
- `src/core/repositories/VoucherAppearanceRepository.ts`
  Contexto: idem.

### Fora de escopo nesta fase

- Nao abrir nova frente de refatoracao estrutural no codigo.
- Nao prometer maturidade futura que ainda nao esteja validada.
- Nao manter codigo morto apenas por medo de remover sem evidencias de uso.

### Tarefas

#### Documentacao

- [ ] Atualizar documentacao para refletir a arquitetura real.
- [ ] Atualizar README, guias e docs tecnicas para nao prometer capacidades nao validadas.
- [ ] Corrigir referencias a framework de teste, arquitetura, cobertura e readiness.
- [ ] Atualizar guia de desenvolvimento com regras de PR e validacao minima.
- [ ] Documentar fluxos criticos refatorados.

#### Consistencia tecnica

- [ ] Corrigir encoding dos documentos principais.
- [ ] Alinhar nomes de colecao, regras e implementacoes.
- [ ] Remover comentarios enganosos e codigo morto relevante.
- [ ] Revisar assets, scripts e dependencias nao usadas.

### Criterios de aceite

- [ ] Documentacao confiavel.
- [ ] Sem divergencia entre nome de colecao, regra e implementacao.
- [ ] Sem mojibake nos documentos principais.
- [ ] Sem promessas tecnicas falsas no README e docs.
- [ ] Sem codigo morto relevante remanescente.

### Validacao objetiva por achado

- `A05`, `H01` e `H04`: revisar docs principais e comprovar que as afirmacoes de arquitetura, testes e readiness batem com o estado real entregue.
- `H02`: comparar nomes de colecao e regras documentadas com o codigo efetivo.
- `H03`: abrir os documentos principais em ambiente limpo e comprovar ausencia de mojibake.
- `H05`: revisar comentarios e codigo morto removido com evidencias de que nao havia uso ativo.
- `D07`: confirmar que a documentacao final explicita quais configuracoes sao obrigatorias e nao inventadas em memoria.

### Plano de migracao e rollback

- Alteracoes documentais e de limpeza devem ser feitas por PRs pequenos para rollback trivial.
- Remocao de codigo morto so deve ocorrer quando houver evidencia de nao uso ou substituicao ja consolidada.
- Se uma remocao gerar regressao, o rollback deve restaurar apenas o bloco removido, sem reverter a documentacao confiavel da fase.

### Estimativa

- 2 a 4 dias.

---

## Plano de PRs

Cada fase deve ser quebrada em PRs pequenos. Ordem recomendada:

- PR 1: baseline tecnico, dependencias, build, lint e CI.
- PR 2: reset de senha e identidade.
- PR 3: seguranca de auth, perfil, logout e enforcement.
- PR 4: auditoria e remocao de segredos dos testes.
- PR 5: contratos de repositories.
- PR 6: type safety e camada minima de erros/logging.
- PR 7: consolidacao de regras de dominio.
- PR 8: transacoes financeiras e comissao.
- PR 9: auth/profile MVVM.
- PR 10: dashboard + client history.
- PR 11: create event + shared event.
- PR 12: financeiro + livro caixa.
- PR 13: integracoes externas, voucher e relatorios.
- PR 14: testes reais e limpeza da suite.
- PR 15: documentacao final, encoding e limpeza.

## Politica de Merge Durante a Refatoracao

- Nenhuma feature nova entra sem justificativa forte.
- Nenhum merge com build ou lint quebrado.
- Nenhum merge com contrato quebrado entre camadas.
- Nenhum PR grande sem checklist de regressao.
- Nenhum fluxo sensivel e alterado sem smoke test correspondente.
- Nenhum achado critico e fechado sem evidencia operacional registrada.

## Definicao de Pronto por Fase

Uma fase so e considerada concluida quando:

- os achados mapeados para a fase foram efetivamente tratados;
- os criterios de aceite foram verificados;
- a validacao objetiva por achado foi registrada;
- a pipeline esta verde;
- a documentacao minima da fase foi atualizada;
- nao restou regressao bloqueando a fase seguinte.

## Metricas de Sucesso

### Tecnicas

- [ ] Build verde em CI.
- [ ] Lint verde em CI.
- [ ] Zero contrato quebrado entre ViewModel e repository.
- [ ] Zero segredo real no repositorio.
- [ ] Fluxos financeiros criticos sem escrita parcial.
- [ ] Nenhum reset de senha critico com logica quebrada.

### Arquitetura

- [ ] Auth, financeiro e evento com separacao clara de responsabilidade.
- [ ] Regras de dominio centralizadas.
- [ ] Views sem logica de negocio relevante.
- [ ] Repositories sem papel de store global da UI.

### Qualidade

- [ ] Suite minima de regressao confiavel.
- [ ] Relatorios coerentes com os dados reais.
- [ ] Documentacao coerente com o codigo.
- [ ] Reducao clara de acoplamento nos modulos criticos.

## Estimativa Consolidada

- 1 dev senior focado: 6 a 9 semanas.
- 1 senior + 1 pleno: 4 a 6 semanas.

Essas estimativas assumem congelamento parcial de novas features durante a refatoracao.

## Proximo Passo Recomendado

Iniciar pela `Fase 0 - Baseline Tecnico`.

Sem isso, qualquer tentativa de corrigir os problemas de arquitetura, seguranca e dominio continuara sem validacao confiavel e com alto risco de regressao invisivel.
