# Development Guide

## Setup

```bash
npm install
npm run dev
```

Configure as variaveis de ambiente do Firebase antes de usar o app fora da suite de testes.

## Validacao minima antes de merge

```bash
npm run lint
npm run build
npm run test:unit -- --run
npm run test:unit:coverage -- --run
npm run test:integration
npm run test:e2e -- --grep smoke
npm run test:e2e:accessibility
npm run test:e2e:security
npm run test:e2e:performance
```

## Convencoes praticas

- prefira `rg` para busca no repositorio
- use `apply_patch` para edicoes manuais
- nao reverta alteracoes do usuario sem pedido explicito
- mantenha repositorios focados em persistencia
- concentre regras compartilhadas em services de dominio quando houver duplicacao

## Areas sensiveis

- autenticacao e perfil
- pagamentos e mudanca de status de evento
- voucher publico
- regras do Firestore

Ao alterar essas areas, rode pelo menos build, unitarios, integracao e smoke E2E.
Quando a mudanca tocar UI publica, auth ou comportamento de rotas, rode tambem as suites especializadas de acessibilidade, seguranca e performance local.
