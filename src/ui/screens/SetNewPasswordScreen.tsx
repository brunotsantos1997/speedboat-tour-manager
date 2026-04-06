import { Link } from 'react-router-dom';

export function SetNewPasswordScreen() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-center">Use o Link do E-mail</h1>
        <p className="text-center text-gray-700">
          A redefinicao de senha agora acontece apenas pelo link oficial enviado para o seu e-mail.
        </p>
        <p className="text-sm text-center text-gray-600">
          Se ainda nao recebeu a mensagem, solicite um novo link na tela de login.
        </p>
        <div className="flex flex-col gap-3">
          <Link
            to="/forgot-password"
            className="w-full py-2 text-center text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
          >
            Solicitar Novo Link
          </Link>
          <Link
            to="/login"
            className="w-full py-2 text-center text-indigo-600 border border-indigo-200 rounded-md hover:bg-indigo-50"
          >
            Voltar ao Login
          </Link>
        </div>
      </div>
    </div>
  );
}
