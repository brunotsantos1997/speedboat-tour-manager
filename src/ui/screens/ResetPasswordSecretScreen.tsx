import { Link } from 'react-router-dom';

export function ResetPasswordSecretScreen() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-center">Fluxo Descontinuado</h1>
        <p className="text-center text-gray-700">
          A recuperacao por pergunta secreta nao esta mais disponivel.
        </p>
        <p className="text-sm text-center text-gray-600">
          Volte para a tela de login e solicite a redefinicao por e-mail.
        </p>
        <div className="flex flex-col gap-3">
          <Link
            to="/forgot-password"
            className="w-full py-2 text-center text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
          >
            Solicitar Link por E-mail
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
