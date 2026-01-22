import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Toast } from '../components/Toast';
import PasswordStrengthMeter from '../components/PasswordStrengthMeter';

export function ProfileScreen() {
  const { currentUser, updateProfile, setSecretQuestion } = useAuth();
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
