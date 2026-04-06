# Project Documentation

## Objetivo

O ERP Speedboat Tour organiza a operacao diaria de uma empresa de passeios de lancha:

- agenda de eventos
- cadastro de clientes
- pagamentos, despesas e livro caixa
- vouchers publicos
- administracao de usuarios e permissoes

## Estrutura principal

- `src/ui`
  camadas de apresentacao, layouts e componentes
- `src/viewmodels`
  hooks que coordenam estado, efeitos e intencoes da interface
- `src/core/domain`
  tipos e regras compartilhadas
- `src/core/repositories`
  acesso a Firebase e traducao de persistencia
- `src/contexts`
  providers globais como autenticacao

## Regras de negocio consolidadas

Hoje as regras mais sensiveis de eventos e pagamentos estao centralizadas em:

- `src/core/domain/EventStatusService.ts`
  auto-cancelamento, sugestao de pagamento, reversao e arquivamento
- `src/core/domain/TransactionService.ts`
  confirmacao de pagamento com rollback basico e cancelamento de evento

## Estado de testes

- unitarios verdes
- integracao verde
- smoke E2E verde

Ainda existe espaco para aprofundar cenarios de Firebase real, concorrencia e cobertura E2E mais completa.
