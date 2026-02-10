# Configuração de Autenticação com Google (Firebase)

Este documento descreve os passos necessários para habilitar e configurar a autenticação com Google no Firebase para este projeto.

## 1. Ativar o Provedor de Login no Firebase

1. Acesse o [Console do Firebase](https://console.firebase.google.com/).
2. Selecione o seu projeto.
3. No menu lateral, vá em **Autenticação (Authentication)**.
4. Clique na aba **Método de login (Sign-in method)**.
5. Clique em **Adicionar novo provedor** e selecione **Google**.
6. Ative o interruptor **Ativar**.
7. Escolha um nome público para o projeto e selecione um e-mail de suporte para o projeto.
8. Clique em **Salvar**.

## 2. Configurar a Tela de Consentimento OAuth (Google Cloud)

Para que o login funcione corretamente, é necessário configurar a tela de consentimento no Google Cloud Console:

1. Vá para o [Google Cloud Console](https://console.cloud.google.com/).
2. Certifique-se de que o projeto correto está selecionado (o mesmo do Firebase).
3. No menu lateral, vá em **APIs e Serviços** > **Tela de consentimento OAuth**.
4. Configure como **Externo** (se desejar que qualquer pessoa com conta Google possa se cadastrar).
5. Preencha as informações obrigatórias (Nome do app, e-mail de suporte, e-mail de contato do desenvolvedor).
7. Na seção de **Escopos (Scopes)**, clique em **Adicionar ou remover escopos** e adicione manualmente:
   - `https://www.googleapis.com/auth/calendar.events`
   - `https://www.googleapis.com/auth/calendar.readonly`
8. Em **Domínios autorizados**, adicione o domínio onde o seu app está hospedado (ex: `seu-app.firebaseapp.com` ou seu domínio customizado).

## 3. Ativar API do Google Calendar

Para que a sincronização funcione, você deve ativar a API no console do Google Cloud:

1. Vá para a [Biblioteca de APIs](https://console.cloud.google.com/apis/library).
2. Procure por **Google Calendar API**.
3. Clique em **Ativar**.

## 4. Adicionar Domínios Autorizados no Firebase

1. No Console do Firebase, em **Authentication** > **Settings** > **Authorized domains**.
2. Certifique-se de que `localhost` e o domínio de produção do seu app estão na lista.

## 5. Status de Publicação e Usuários de Teste (Importante!)

Se o seu app ainda não foi verificado pelo Google, ele estará em modo de "Teste". Isso causará o erro **"403: access_denied"** se você tentar logar com um e-mail que não está na lista de permissões.

Para resolver:
1. No [Google Cloud Console](https://console.cloud.google.com/), vá em **APIs e Serviços** > **Tela de consentimento OAuth**.
2. Verifique o **Status de publicação**:
   - Se estiver em **Teste (Testing)**: Role para baixo até **Usuários de teste** e clique em **ADD USERS**. Adicione o e-mail que você está tentando usar.
   - Alternativamente, clique em **PUBLICAR APLICATIVO (PUBLISH APP)** para movê-lo para produção (isso removerá o limite de usuários de teste, mas o Google pode exibir um aviso de "App não verificado" até que você passe pelo processo de auditoria deles).

## 6. Configuração de Conta Única por E-mail (Recomendado)

Para garantir que a vinculação de contas funcione conforme implementado:

1. No Console do Firebase, vá em **Authentication** > **Settings** > **User account linking**.
2. Selecione a opção **"Link accounts that use the same email"** (Vincular contas que usam o mesmo e-mail).
   - Isso permite que o Firebase tente mesclar as contas automaticamente ou lance o erro `auth/account-exists-with-different-credential`, que é tratado no app instruindo o usuário a fazer login com senha e depois vincular o Google.

## 7. Vinculação Manual de Contas

Se um usuário já possui uma conta com e-mail e senha e deseja usar o Google:
1. Ele deve fazer login normalmente com e-mail e senha.
2. Acessar a tela de **Perfil**.
3. Clicar no botão **Vincular** na seção de Contas Vinculadas (Google).
4. Após isso, ele poderá entrar usando tanto a senha quanto o botão do Google.

## Observações sobre Segurança e Roles

- Todos os novos usuários criados via Google entram com o status `PENDING` (Pendente) e o cargo `SELLER` (Vendedor).
- Eles só terão acesso ao sistema após um administrador aprovar a conta na tela de gerenciamento de usuários.
