import React from 'react';
import { ArrowLeft, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const TermsOfServiceScreen: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <button
          onClick={() => navigate(-1)}
          className="mb-8 flex items-center text-blue-600 hover:text-blue-700 transition-colors font-medium"
        >
          <ArrowLeft className="mr-2" size={20} />
          Voltar
        </button>

        <div className="bg-white shadow-xl rounded-2xl overflow-hidden">
          <div className="bg-blue-600 px-8 py-10 text-white flex items-center">
            <div className="bg-white/20 p-3 rounded-lg mr-6">
              <FileText size={40} />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Termos de Uso</h1>
              <p className="text-blue-100 mt-1 italic text-sm">Última atualização: 10 de Fevereiro de 2026</p>
            </div>
          </div>

          <div className="p-8 sm:p-12 prose prose-blue max-w-none text-gray-700 leading-relaxed space-y-8">
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Aceitação dos Termos</h2>
              <p>
                Ao acessar e usar o aplicativo Dilancha Náutica, você concorda em cumprir e estar vinculado a estes Termos de Uso. Se você não concordar com qualquer parte destes termos, não deverá utilizar o aplicativo.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Uso da Conta</h2>
              <p>
                Você é responsável por manter a confidencialidade de sua conta e senha e por todas as atividades que ocorrem sob sua conta. Você concorda em nos notificar imediatamente sobre qualquer uso não autorizado de sua conta.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Responsabilidades do Usuário</h2>
              <p>Você concorda em:</p>
              <ul className="list-disc pl-6 space-y-2 mt-4">
                <li>Fornecer informações precisas e completas ao se cadastrar.</li>
                <li>Não utilizar o aplicativo para qualquer finalidade ilegal ou não autorizada.</li>
                <li>Não interferir ou interromper a integridade ou o desempenho do aplicativo.</li>
                <li>Respeitar a privacidade de outros usuários e de seus clientes.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Propriedade Intelectual</h2>
              <p>
                Todo o conteúdo, recursos e funcionalidades do aplicativo (incluindo, mas não se limitando a informações, software, texto, exibições, imagens, vídeo e áudio) são de nossa propriedade ou de nossos licenciadores e são protegidos por leis de direitos autorais e outras leis de propriedade intelectual.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Limitação de Responsabilidade</h2>
              <p>
                Em nenhum caso a Dilancha Náutica será responsável por quaisquer danos indiretos, incidentais, especiais ou consequentes decorrentes de ou em conexão com seu uso do aplicativo. O aplicativo é fornecido "como está" e "conforme disponível".
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Alterações nos Termos</h2>
              <p>
                Reservamo-nos o direito de modificar ou substituir estes Termos de Uso a qualquer momento. Se uma revisão for material, tentaremos fornecer um aviso com pelo menos 30 dias de antecedência antes que quaisquer novos termos entrem em vigor.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Rescisão</h2>
              <p>
                Podemos encerrar ou suspender seu acesso ao aplicativo imediatamente, sem aviso prévio ou responsabilidade, por qualquer motivo, incluindo, sem limitação, se você violar os Termos de Uso.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};
