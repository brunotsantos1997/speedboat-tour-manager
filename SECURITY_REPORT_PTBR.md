# Relatório de Avaliação de Segurança

**Data:** 24 de Maio de 2024
**Status do Sistema:** Fase de Testes / Pré-Produção
**Analista:** Jules (IA Software Engineer)

## 1. Resumo Executivo
A aplicação apresenta uma arquitetura onde a segurança e as regras de permissão estão concentradas quase inteiramente no **lado do cliente (frontend)**. Em sistemas que utilizam Firebase, isso representa um risco crítico, pois o cliente (navegador) é um ambiente que pode ser manipulado pelo usuário. Sem regras de segurança robustas configuradas no console do Firebase, o sistema está vulnerável a escalação de privilégios, manipulação de dados financeiros e roubo de informações.

## 2. Vulnerabilidades Identificadas

### 2.1. Escalação de Privilégios (Crítica)
*   **Descrição:** As funções de alteração de cargo (`updateUserRole`) e status (`updateUserStatus`) realizam verificações de permissão apenas no código React.
*   **Cenário de Ataque:** Um usuário comum pode abrir o console do desenvolvedor (F12) e executar um comando do SDK do Firestore para alterar seu próprio campo `role` para `OWNER` ou `SUPER_ADMIN`.
*   **Impacto:** Acesso total administrativo ao sistema, podendo visualizar dados de vendas, excluir registros e alterar configurações da empresa.

### 2.2. Insecure Direct Object Reference - IDOR (Crítica)
*   **Descrição:** A função `updateProfile` permite que um `userId` seja passado como argumento, mas não valida se o usuário autenticado é o dono daquele ID.
*   **Cenário de Ataque:** Um atacante pode disparar chamadas para o Firestore alterando o email ou nome de qualquer outro usuário, bastando conhecer o ID dele.
*   **Impacto:** Sequestro de contas (ao alterar o email) e corrupção de dados cadastrais.

### 2.3. Bypassing de Regras de Negócio - Conflitos de Agendamento (Alta)
*   **Descrição:** A validação que impede dois eventos no mesmo barco/horário ocorre apenas no `EventRepository.ts`.
*   **Cenário de Ataque:** Um usuário pode contornar a lógica do repositório e inserir um documento diretamente na coleção `events` que sobreponha um agendamento existente.
*   **Impacto:** Overbooking, inconsistência na agenda e prejuízo operacional.

### 2.4. Exposição de Dados Sensíveis (Média)
*   **Descrição:** O campo `secretAnswerHash` (hash da resposta de segurança) é armazenado na coleção `profiles`.
*   **Risco:** Se as regras de leitura forem genéricas (`allow read: if request.auth != null`), qualquer usuário logado pode ler os hashes de todos os outros usuários.
*   **Impacto:** Ataques de força bruta offline contra os hashes para comprometer o fluxo de recuperação de senha.

### 2.5. Injeção de Scripts - XSS (Média)
*   **Descrição:** O uso de `DOMPurify` ocorre apenas antes do envio dos dados pelo frontend.
*   **Risco:** Dados inseridos diretamente no banco de dados não passam por essa limpeza. Se esses dados forem renderizados de forma insegura em alguma parte do sistema (especialmente em áreas administrativas), scripts maliciosos podem ser executados.
*   **Impacto:** Roubo de tokens de sessão e ações não autorizadas em nome de administradores.

## 3. Recomendações de Mitigação

### 3.1. Implementação de Firestore Security Rules (Imediato)
Esta é a ação mais importante. As regras devem validar:
1.  **Quem pode escrever:** Apenas usuários com `role == 'OWNER'` ou `'SUPER_ADMIN'` podem alterar campos sensíveis como `role`, `status` e `commissionPercentage`.
2.  **Autoria:** Usuários comuns só podem editar seus próprios perfis (e apenas campos específicos como `name`).
3.  **Integridade:** Validar se os dados enviados seguem o esquema esperado.

### 3.2. Uso de Cloud Functions para Ações Sensíveis
Ações como "Aprovar Reset de Senha" ou "Mudar Comissão" não deveriam ser feitas via `updateDoc` direto do cliente. O ideal seria chamar uma **Firebase Cloud Function**, onde o código roda em ambiente seguro e pode validar as permissões de forma robusta.

### 3.3. Proteção de Campos Sensíveis
No Firestore, use regras para impedir que o campo `secretAnswerHash` seja lido em consultas listadas (getDocs), permitindo apenas que ele seja usado em verificações específicas ou ocultando-o completamente de usuários não administrativos.

---

## 4. Guia de Implementação de Segurança (Próximos Passos)

### 4.1. Configuração do Firestore
Criei um arquivo chamado `firestore.rules.example` na raiz do projeto. Ele contém um modelo de regras que:
*   Impede que usuários alterem seu próprio cargo (`role`) ou comissão.
*   Garante que apenas usuários aprovados acessem dados do sistema.
*   Restringe a edição de cadastros (produtos, barcos) apenas para `OWNER` e `SUPER_ADMIN`.

**Como aplicar:** Copie o conteúdo de `firestore.rules.example` e cole na aba "Rules" do Firestore no seu Console do Firebase.

### 4.2. Melhorias no Código (Refatoração)
1.  **Validação de IDOR:** No `AuthContext.tsx`, altere a função `updateProfile` para garantir que o `userId` passado seja o mesmo do `currentUser.id`, a menos que o usuário logado seja um administrador.
2.  **Sanitização Centralizada:** Considere mover a lógica de sanitização e validação para as Regras do Firestore (usando `request.resource.data.name.size() < 100`, por exemplo) ou para Cloud Functions.
3.  **Segurança das Perguntas Secretas:** Para uma segurança rigorosa, o `secretAnswerHash` não deveria ser retornado em consultas comuns. Você pode configurar as regras do Firestore para permitir que o campo seja escrito, mas nunca lido, realizando a verificação apenas via Cloud Functions.

---
**Nota:** Este relatório foca na estrutura do código analisado. Recomenda-se uma revisão completa das regras configuradas no Console do Firebase (aba Rules), pois elas são a última linha de defesa.
