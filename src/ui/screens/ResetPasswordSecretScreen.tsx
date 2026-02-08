
import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';

export function ResetPasswordSecretScreen() {
  const [answer, setAnswer] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { verifySecretAnswer } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const email = queryParams.get('email');
  const question = queryParams.get('question');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email) {
      setError('E-mail ausente.');
      return;
    }

    try {
      const user = await verifySecretAnswer(email, answer);
      if (user) {
        navigate(`/set-new-password?userId=${user.id}`);
      } else {
        setError('Falha na verificação.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao verificar a resposta.');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-center">Pergunta Secreta</h1>
        <p className="text-center text-gray-700">{question || 'Sua pergunta secreta não foi encontrada.'}</p>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="answer" className="text-sm font-medium text-gray-700">
              Resposta
            </label>
            <input
              id="answer"
              type="text"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              required
              className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            className="w-full py-2 text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Verificar
          </button>
        </form>
      </div>
    </div>
  );
}
