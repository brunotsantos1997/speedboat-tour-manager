import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Toast } from '../components/Toast';

export function ProfileScreen() {
  const { currentUser, updateProfile } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (currentUser) {
      setName(currentUser.name);
      setEmail(currentUser.email);
    }
  }, [currentUser]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setToastMessage(null);

    if (password && password !== confirmPassword) {
      setError('As senhas não conferem.');
      return;
    }

    if (!currentUser) {
      setError('Nenhum usuário logado.');
      return;
    }

    try {
      const updates: { name?: string; email?: string; password?: string } = {};
      if (name !== currentUser.name) updates.name = name;
      if (email !== currentUser.email) updates.email = email;
      if (password) updates.password = password;

      if (Object.keys(updates).length > 0) {
        await updateProfile(currentUser.id, updates);
        setToastMessage('Perfil atualizado com sucesso!');
        setPassword('');
        setConfirmPassword('');
      } else {
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
      <div className="bg-white shadow-md rounded-lg p-6">
        <form onSubmit={handleSubmit}>
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
          <p className="text-sm text-gray-500 mb-4">Deixe os campos em branco para manter a senha atual.</p>
          <div className="mb-4">
            <label htmlFor="password" className="block text-gray-700 font-medium mb-2">Nova Senha</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
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
          {error && <p className="text-red-600 mb-4">{error}</p>}
          <div className="flex justify-end">
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Salvar Alterações
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
