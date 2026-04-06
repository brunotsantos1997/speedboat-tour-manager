# Firestore Security Rules

Este documento resume o estado atual de `firestore.rules`.

## Principios

- tudo e negado por padrao
- leitura e escrita dependem de autenticacao e perfil aprovado
- permissoes elevadas usam papeis `OWNER`, `SUPER_ADMIN` e, em alguns casos, `ADMIN`
- algumas operacoes permitem acesso ao criador do recurso

## Funcoes auxiliares principais

- `isAuthenticated()`
- `getUserData()`
- `isApproved()`
- `hasStaffPermission(allowAdmin)`
- `canManageUsers()`
- `canManageFinance()`
- `canManageSettings()`
- `isOwner(resource)`

## Colecoes mapeadas

Os nomes abaixo precisam ficar alinhados entre codigo, regras e documentacao:

- `profiles`
- `events`
- `boats`
- `products`
- `clients`
- `payments`
- `expenses`
- `expense_categories`
- `boarding_locations`
- `tour_types`
- `company_data`
- `voucher_terms`
- `voucher_appearance`
- `public_vouchers`

## Regras resumidas por colecao

### `profiles`

- leitura: proprio usuario ou staff
- criacao: proprio usuario autenticado
- atualizacao: proprio usuario com campos limitados, ou staff com validacao hierarquica
- exclusao: staff

### `events`

- leitura: usuario aprovado
- criacao: usuario aprovado, com `createdByUserId` igual ao usuario autenticado
- atualizacao: staff ou dono do evento
- exclusao: staff

### `payments`

- leitura: usuario aprovado
- criacao: usuario aprovado
- atualizacao: staff ou criador do evento relacionado
- exclusao: admin ou superior

### `expenses`

- leitura: usuario aprovado
- criacao: usuario aprovado
- atualizacao: staff ou criador
- exclusao: staff ou criador

### Colecoes administrativas

`boats`, `products`, `expense_categories`, `boarding_locations`, `tour_types`

- leitura: usuario aprovado
- criacao e atualizacao: staff
- exclusao: admin ou superior

### Configuracoes

`company_data`

- leitura: usuario aprovado
- criacao e atualizacao: `OWNER` ou `SUPER_ADMIN`
- exclusao: apenas `OWNER`

`voucher_terms`, `voucher_appearance`

- leitura: usuario aprovado
- criacao e atualizacao: staff
- exclusao: admin ou superior

### `public_vouchers`

- leitura: publica
- criacao, atualizacao e exclusao: usuario aprovado

## Observacoes

- A colecao de auditoria nao faz mais parte da base.
- As regras atuais nao substituem validacoes de dominio no cliente e nos services.
- Sempre que uma colecao for renomeada, atualize `firestore.rules`, os repositories e esta documentacao no mesmo change set.
