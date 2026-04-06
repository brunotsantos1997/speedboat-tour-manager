# REFACTORING ROADMAP - ERP SPEEDBOAT TOUR

## Objetivo

Este documento registra o estado real da refatoracao, sem promessas artificiais.
Ele foi atualizado para refletir:

- a restricao fixa de nao usar recursos pagos do Firebase;
- o que ja foi implementado e validado;
- o que ainda falta para um fechamento mais literal do roadmap;
- a ordem recomendada para terminar o que resta.

## Restricao Fixa

- Nenhuma implementacao pode depender de recursos pagos do Firebase.
- Nada aqui deve exigir billing obrigatorio, Cloud Functions pagas ou backend administrado pago.
- Quando um item original do roadmap dependeria disso, ele deve ser reinterpretado para uma alternativa local/free-only.

## Validacao Desta Rodada - 2026-04-06

- `npm run build` -> OK
- `npm run lint` -> OK, sem erros, com warnings legados remanescentes
- `npm run test:unit -- --run` -> OK, 45 arquivos / 717 testes
- `npm run test:unit:coverage -- --run` -> OK
- `npm run test:integration` -> OK, 3 arquivos / 46 testes
- `npm run test:e2e -- --grep smoke` -> OK, 6 testes

## Resumo Executivo

O roadmap de refatoracao avancou de forma concreta. Os blocos mais criticos de seguranca, consistencia e estabilidade ja foram atacados, mas o documento ainda nao pode ser marcado como "100% concluido".

O que mudou de verdade nesta execucao:

- auditoria foi removida de escopo e do codigo;
- reset de senha ficou no fluxo do provedor por email;
- configuracoes criticas deixaram de inventar defaults silenciosos em memoria;
- shared event deixou de depender de entidades sentinela persistidas;
- voucher publico passou a usar snapshot publico sanitizado;
- watermark do voucher saiu do base64 como estrategia principal e passou para URL publica;
- `useGlobalSync` deixou de ter `TODO` e `console.log`, e agora usa fila real com retry;
- ViewModels de perfil, usuarios e reset deixaram de falar com Firebase direto e passaram a delegar para services;
- o provider de auth ficou mais fino ao extrair lifecycle de repositories;
- testes unitarios de auth/profile/sync foram reescritos para validar comportamento real.

## Itens Ja Implementados

### 1. Seguranca e identidade

- Reset de senha por email implementado.
- Fluxo inseguro por pergunta secreta removido.
- `terminate(db)` no logout removido da linha critica.
- Atualizacao de perfil ficou semanticamente mais correta:
  - o proprio usuario pode mudar nome/email/senha com reauth;
  - administradores nao tentam mais trocar email/senha de terceiros pelo cliente.

### 2. Contratos e persistencia

- Alinhamento entre colecoes reais e `firestore.rules`.
- Remocao da auditoria stub e das referencias operacionais antigas.
- Configuracoes de empresa, termos e aparencia de voucher agora falham de forma explicita quando faltam dados obrigatorios.

### 3. Dominio e regras de negocio

- Regras de status e pagamento consolidadas em services reutilizaveis.
- Fluxos de dashboard, historico do cliente e caixa passaram a reutilizar regras centrais.
- Shared event refeito para nao depender de cliente/tour sentinela persistido.

### 4. Voucher e superficie publica

- Voucher publico nao depende mais de bootstrap autenticado indireto.
- Snapshot publico passou a ter repositorio e service dedicados.
- Estrategia de watermark migrou para URL publica como caminho principal.

### 5. MVVM e separacao de responsabilidades

- `Layout` saiu da manipulacao imperativa de DOM.
- `useProfileViewModel`, `useUserManagementViewModel` e `usePasswordResetViewModel` ficaram mais finos e delegam para services.
- `AuthProvider` ainda existe como casca central de sessao, mas com lifecycle de repositories extraido.

## Itens Ainda Abertos

### A. Refatoracao estrutural profunda

Estes itens ainda nao estao fechados de forma literal:

- `AuthProvider` continua sendo um shell relativamente centralizado, mesmo apos o afinamento.
- `useCreateEventViewModel` continua monolitico.
- `useDashboardViewModel` e `useClientHistoryViewModel` melhoraram, mas ainda concentram muita orquestracao.
- ainda existem hooks/viewmodels auxiliares com `any`, warnings e formato claramente legado.

### B. Integracoes e operacoes pesadas no cliente

- o sync global incremental melhorou, mas a estrategia mais pesada de integracao Google ainda continua client-side;
- nao existe uma rotina externa/lote para cenarios de sync pesado ou manutencao historica;
- isso continua dentro da restricao free-only, mas ainda nao representa o estado alvo mais maduro.

### C. Limpeza final

- ainda ha warnings legados em varios hooks e testes;
- ainda ha codigo de apoio e arquivos antigos que merecem revisao ou poda;
- ainda existem documentos secundarios fora destes dois roadmaps com claims antigas.

## Status Por Area

| Area | Status | Observacao |
|---|---|---|
| Build e baseline tecnico | Concluido | Build e lint sem erros |
| Reset de senha e auth basico | Concluido | Fluxo por email e sem pergunta secreta |
| Alinhamento de colecoes e rules | Concluido | `firestore.rules` acompanha colecoes reais |
| Auditoria | Encerrado fora de escopo | Removida por decisao de produto/escopo |
| Shared event sem sentinela | Concluido | Dominio explicito |
| Defaults implicitos em configuracoes | Concluido | Falha explicita em vez de inventar dados |
| Voucher publico | Concluido | Snapshot publico e sem bootstrap autenticado |
| Watermark/base64 | Parcialmente concluido | URL publica adotada; migracao historica total ainda pode evoluir |
| Auth MVVM real | Parcial | Services extraidos, provider ainda central |
| Create event MVVM real | Aberto | Hook ainda grande |
| Google sync pesado fora do cliente | Aberto | Ainda existe dependencia do cliente |
| Limpeza final de warnings e legado | Aberto | Sem erros, mas com warnings relevantes |

## Backlog Prioritario Para Fechamento

### Prioridade 1

- Fatiar `src/viewmodels/useCreateEventViewModel.ts`.
- Reduzir acoplamento restante em `src/contexts/auth/AuthProvider.tsx`.
- Revisar `src/viewmodels/useGlobalSync.ts` e `src/viewmodels/useGoogleSyncViewModel.ts` como um modulo unico de sincronizacao.

### Prioridade 2

- Limpar warnings e `any` nos hooks auxiliares mais usados.
- Revisar arquivos que hoje parecem mocks ou implementacoes provisorias em `src/viewmodels/event/`.
- Padronizar tratamento de erro para remover `console.error` residual em hot paths.

### Prioridade 3

- Revisar documentos secundarios antigos.
- Remover codigo morto remanescente.
- Consolidar a documentacao final com o estado real entregue.

## Definicao Honesta de Conclusao

Este roadmap podera ser tratado como efetivamente concluido quando:

- `AuthProvider` deixar de concentrar bootstrap e wrappers em excesso;
- `useCreateEventViewModel` for quebrado em modulos menores e mais testaveis;
- a integracao Google deixar de depender de fluxos pesados no cliente;
- warnings legados dos pontos mais criticos forem reduzidos de forma significativa;
- a documentacao secundaria parar de contradizer o estado real da base.

## Veredito Atual

Status geral: `parcial avancado`.

Este roadmap nao esta zerado, mas os maiores bloqueios de seguranca e coerencia ja foram enfrentados.
O que resta agora e menos "base quebrada" e mais "refinamento arquitetural, reducao de warnings e fechamento literal das fases profundas".
