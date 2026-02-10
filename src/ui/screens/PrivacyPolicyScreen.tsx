import React from 'react';
import { ArrowLeft, Shield, MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCompanyDataViewModel } from '../../viewmodels/CompanyDataViewModel';

export const PrivacyPolicyScreen: React.FC = () => {
  const navigate = useNavigate();
  const { companyData } = useCompanyDataViewModel();

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
              <Shield size={40} />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Política de Privacidade</h1>
              <p className="text-blue-100 mt-1 italic text-sm">Última atualização: 10 de Fevereiro de 2026</p>
            </div>
          </div>

          <div className="p-8 sm:p-12 prose prose-blue max-w-none text-gray-700 leading-relaxed space-y-8">
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <span className="bg-blue-100 text-blue-600 w-8 h-8 rounded-full flex items-center justify-center text-sm mr-3">1</span>
                Introdução
              </h2>
              <p>
                A Dilancha Náutica ("nós", "nosso") valoriza a sua privacidade. Esta Política de Privacidade descreve como coletamos, usamos e protegemos suas informações pessoais ao utilizar nosso aplicativo de gerenciamento de passeios.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <span className="bg-blue-100 text-blue-600 w-8 h-8 rounded-full flex items-center justify-center text-sm mr-3">2</span>
                Informações que Coletamos
              </h2>
              <p>Podemos coletar as seguintes categorias de informações:</p>
              <ul className="list-disc pl-6 space-y-2 mt-4">
                <li><strong>Dados de Conta:</strong> Nome, endereço de e-mail e senha.</li>
                <li><strong>Dados de Clientes:</strong> Informações sobre seus clientes inseridas no sistema (nome, telefone, histórico de passeios).</li>
                <li><strong>Dados de Integração Google:</strong> Ao utilizar a sincronização com o Google Calendar, acessamos informações de calendários e eventos conforme autorizado por você através dos escopos OAuth.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <span className="bg-blue-100 text-blue-600 w-8 h-8 rounded-full flex items-center justify-center text-sm mr-3">3</span>
                Uso das Informações
              </h2>
              <p>Utilizamos as informações coletadas para:</p>
              <ul className="list-disc pl-6 space-y-2 mt-4">
                <li>Fornecer e manter as funcionalidades do sistema.</li>
                <li>Sincronizar seus passeios com sua agenda do Google.</li>
                <li>Processar pagamentos e gerar relatórios financeiros.</li>
                <li>Enviar notificações relevantes sobre sua conta ou passeios.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <span className="bg-blue-100 text-blue-600 w-8 h-8 rounded-full flex items-center justify-center text-sm mr-3">4</span>
                Segurança dos Dados
              </h2>
              <p>
                Implementamos medidas de segurança técnicas e organizacionais para proteger seus dados contra acesso não autorizado, alteração ou destruição. Utilizamos Firebase Auth para autenticação segura e Firestore com regras de segurança rigorosas.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <span className="bg-blue-100 text-blue-600 w-8 h-8 rounded-full flex items-center justify-center text-sm mr-3">5</span>
                Seus Direitos
              </h2>
              <p>
                Você tem o direito de acessar, corrigir ou excluir seus dados pessoais a qualquer momento através das configurações do seu perfil no aplicativo ou entrando em contato com nosso suporte.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <span className="bg-blue-100 text-blue-600 w-8 h-8 rounded-full flex items-center justify-center text-sm mr-3">6</span>
                Contato
              </h2>
              <p className="flex items-center flex-wrap gap-2">
                Se você tiver dúvidas sobre esta Política de Privacidade, entre em contato conosco através do WhatsApp:
                <span className="inline-flex items-center text-blue-600 font-bold bg-blue-50 px-3 py-1 rounded-full">
                  <MessageCircle size={18} className="mr-2 text-green-500" />
                  {companyData?.phone || '(00) 00000-0000'}
                </span>
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};
