import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Toast } from '../components/Toast';
import PasswordStrengthMeter from '../components/PasswordStrengthMeter';

export function ProfileScreen() {
  const { currentUser, updateProfile, setSecretQuestion, linkGoogle, unlinkGoogle, linkedProviders, resetTours } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [secretQuestion, setSecretQuestionState] = useState('');
  const [secretAnswer, setSecretAnswer] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (currentUser) {
      setName(currentUser.name);
      setEmail(currentUser.email);
      setSecretQuestionState(currentUser.secretQuestion || '');
    }
  }, [currentUser]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setToastMessage(null);

    if (newPassword && newPassword !== confirmPassword) {
      setError('As senhas não conferem.');
      return;
    }

    if (!currentUser) {
      setError('Nenhum usuário logado.');
      return;
    }

    try {
      const updates: { name?: string; email?: string; newPassword?: string; oldPassword?: string } = {};
      if (name !== currentUser.name) updates.name = name;
      if (email !== currentUser.email) updates.email = email;
      if (newPassword) {
        updates.newPassword = newPassword;
        updates.oldPassword = oldPassword;
      }

      if (Object.keys(updates).length > 0) {
        await updateProfile(currentUser.id, updates);
        setToastMessage('Perfil atualizado com sucesso!');
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }

      if (currentUser.role === 'OWNER' && secretQuestion && secretAnswer) {
        await setSecretQuestion(currentUser.id, secretQuestion, secretAnswer);
        setToastMessage('Perfil e pergunta secreta atualizados com sucesso!');
        setSecretAnswer('');
      } else if (Object.keys(updates).length === 0) {
        setToastMessage('Nenhuma alteração para salvar.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao atualizar o perfil.');
    }
  };

  if (!currentUser) {
    return <div>Carregando perfil...</div>;
  }

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto">
      {toastMessage && <Toast message={toastMessage} onClose={() => setToastMessage(null)} />}
      <h1 className="text-2xl font-bold mb-6">Meu Perfil</h1>
      <form onSubmit={handleSubmit}>
        <div className="bg-white shadow-md rounded-lg p-6">
          <div className="mb-4">
            <label htmlFor="name" className="block text-gray-700 font-medium mb-2">Nome</label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="mb-4">
            <label htmlFor="email" className="block text-gray-700 font-medium mb-2">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <hr className="my-6" />
          <h2 className="text-xl font-bold mb-4">Alterar Senha</h2>
          <div className="mb-4">
            <label htmlFor="oldPassword" className="block text-gray-700 font-medium mb-2">Senha Atual</label>
            <input
              id="oldPassword"
              type="password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="mb-4">
            <label htmlFor="newPassword" className="block text-gray-700 font-medium mb-2">Nova Senha</label>
            <input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <PasswordStrengthMeter password={newPassword} />
          </div>
          <div className="mb-6">
            <label htmlFor="confirmPassword" className="block text-gray-700 font-medium mb-2">Confirmar Nova Senha</label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {currentUser.role === 'OWNER' && (
          <div className="bg-white shadow-md rounded-lg p-6 mt-6">
            <h2 className="text-xl font-bold mb-4">Pergunta Secreta</h2>
            <p className="text-sm text-gray-500 mb-4">Usada para recuperação de conta. Preencha a resposta apenas se desejar alterá-la.</p>
            <div className="mb-4">
              <label htmlFor="secretQuestion" className="block text-gray-700 font-medium mb-2">Pergunta</label>
              <input
                id="secretQuestion"
                type="text"
                value={secretQuestion}
                onChange={(e) => setSecretQuestionState(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="mb-6">
              <label htmlFor="secretAnswer" className="block text-gray-700 font-medium mb-2">Resposta</label>
              <input
                id="secretAnswer"
                type="password"
                value={secretAnswer}
                onChange={(e) => setSecretAnswer(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        )}

        {error && <p className="text-red-600 my-4 text-center">{error}</p>}

        <div className="bg-white shadow-md rounded-lg p-6 mt-6">
          <h2 className="text-xl font-bold mb-4">Contas Vinculadas</h2>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <svg className="w-6 h-6" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              <div>
                <p className="font-medium">Google</p>
                <p className="text-sm text-gray-500">
                  {linkedProviders.includes('google.com')
                    ? 'Sua conta está vinculada ao Google'
                    : 'Vincule sua conta para entrar com Google'}
                </p>
              </div>
            </div>
            {linkedProviders.includes('google.com') ? (
              <button
                type="button"
                onClick={async () => {
                  if (window.confirm('Tem certeza que deseja desvincular sua conta Google?')) {
                    try {
                      setError(null);
                      await unlinkGoogle();
                      setToastMessage('Conta do Google desvinculada com sucesso!');
                    } catch (err) {
                      setError(err instanceof Error ? err.message : 'Falha ao desvincular conta.');
                    }
                  }
                }}
                className="px-4 py-2 border border-red-300 text-red-700 bg-white rounded-md text-sm font-medium hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors"
              >
                Desvincular
              </button>
            ) : (
              <button
                type="button"
                onClick={async () => {
                  try {
                    setError(null);
                    await linkGoogle();
                    setToastMessage('Conta do Google vinculada com sucesso!');
                  } catch (err) {
                    setError(err instanceof Error ? err.message : 'Falha ao vincular conta.');
                  }
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 bg-white rounded-md text-sm font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
              >
                Vincular
              </button>
            )}
          </div>
        </div>

        <div className="bg-white shadow-md rounded-lg p-6 mt-6">
          <h2 className="text-xl font-bold mb-2">Tutoriais</h2>
          <p className="text-sm text-gray-500 mb-4">Deseja ver as explicações das telas novamente?</p>
          <button
            type="button"
            onClick={async () => {
                if (window.confirm('Deseja resetar todos os tutoriais? Eles aparecerão novamente quando você acessar cada tela.')) {
                    await resetTours(currentUser.id);
                    setToastMessage('Tutoriais resetados! Eles aparecerão ao navegar pelas telas.');
                }
            }}
            className="w-full sm:w-auto px-6 py-2 border-2 border-blue-600 text-blue-600 font-bold rounded-lg hover:bg-blue-50 transition-all active:scale-95"
          >
            Resetar Tutoriais
          </button>
        </div>

        <div className="flex justify-end mt-6">
          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Salvar Alterações
          </button>
        </div>
      </form>
    </div>
  );
}
