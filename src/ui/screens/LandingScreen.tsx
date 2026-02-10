import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Anchor, Calendar, Users, BarChart3, ShieldCheck, ArrowRight, MessageCircle } from 'lucide-react';

import { useAuth } from '../../contexts/AuthContext';
import { useCompanyDataViewModel } from '../../viewmodels/CompanyDataViewModel';

export const LandingScreen: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser, loading } = useAuth();
  const { companyData } = useCompanyDataViewModel();

  // Redirect to dashboard if already logged in
  React.useEffect(() => {
    if (!loading && currentUser) {
      navigate('/dashboard');
    }
  }, [currentUser, loading, navigate]);

  if (loading) return null;

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-2">
              <Anchor className="text-blue-600" size={32} />
              <span className="text-xl font-bold tracking-tight text-gray-900">Dilancha Náutica</span>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/login')}
                className="text-gray-600 hover:text-blue-600 font-medium transition-colors"
              >
                Entrar
              </button>
              <button
                onClick={() => navigate('/signup')}
                className="bg-blue-600 text-white px-5 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-all shadow-md shadow-blue-200"
              >
                Cadastrar
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden bg-gradient-to-b from-blue-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-5xl sm:text-6xl font-extrabold text-gray-900 leading-tight mb-6">
              Gerenciador de Passeios <span className="text-blue-600">Dilancha Náutica</span>
            </h1>
            <p className="text-xl text-gray-600 mb-10 leading-relaxed">
              A solução completa para empresas náuticas. Gerencie reservas, clientes e suas finanças em um só lugar, com sincronização automática com o Google Calendar.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <button
                onClick={() => navigate('/signup')}
                className="flex items-center justify-center gap-2 bg-blue-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 group"
              >
                Começar Agora
                <ArrowRight className="group-hover:translate-x-1 transition-transform" size={20} />
              </button>
              <button
                onClick={() => navigate('/login')}
                className="flex items-center justify-center bg-white text-gray-700 border-2 border-gray-200 px-8 py-4 rounded-xl font-bold text-lg hover:border-blue-600 hover:text-blue-600 transition-all"
              >
                Acessar Minha Conta
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">Finalidade do Aplicativo</h2>
            <p className="mt-4 text-lg text-gray-600">Projetado para simplificar a operação diária de locação de embarcações.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <FeatureCard
              icon={<Calendar className="text-blue-600" size={32} />}
              title="Gestão de Reservas"
              description="Controle total do seu calendário de passeios. Evite conflitos de horário e tenha visibilidade clara da sua ocupação."
            />
            <FeatureCard
              icon={<Users className="text-blue-600" size={32} />}
              title="Cadastro de Clientes"
              description="Mantenha um histórico completo de seus clientes, preferências e fidelidade para oferecer um serviço personalizado."
            />
            <FeatureCard
              icon={<BarChart3 className="text-blue-600" size={32} />}
              title="Controle Financeiro"
              description="Acompanhe receitas, despesas e comissões de forma automática. Tenha relatórios detalhados da saúde do seu negócio."
            />
          </div>
        </div>
      </section>

      {/* Google Integration Section */}
      <section className="py-24 bg-gray-50 border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center gap-16">
            <div className="flex-1">
              <div className="inline-flex items-center justify-center p-3 bg-blue-100 rounded-2xl mb-6 text-blue-600">
                <Calendar size={40} />
              </div>
              <h2 className="text-4xl font-bold text-gray-900 mb-6">Integração com Google Calendar</h2>
              <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                Nosso aplicativo solicita acesso ao seu Google Calendar para que seus passeios agendados sejam sincronizados automaticamente com sua agenda pessoal.
              </p>
              <ul className="space-y-4 mb-8">
                <li className="flex items-start gap-3 text-gray-700 font-medium">
                  <ShieldCheck className="text-green-500 shrink-0 mt-1" size={20} />
                  <span>Criação automática de eventos para cada nova reserva.</span>
                </li>
                <li className="flex items-start gap-3 text-gray-700 font-medium">
                  <ShieldCheck className="text-green-500 shrink-0 mt-1" size={20} />
                  <span>Atualização em tempo real caso haja mudanças no horário ou status.</span>
                </li>
                <li className="flex items-start gap-3 text-gray-700 font-medium">
                  <ShieldCheck className="text-green-500 shrink-0 mt-1" size={20} />
                  <span>Sincronização bidirecional opcional para garantir que você nunca perca um compromisso.</span>
                </li>
              </ul>
            </div>
            <div className="flex-1 bg-white p-8 rounded-3xl shadow-xl border border-gray-100">
              <div className="aspect-video bg-blue-50 rounded-2xl flex items-center justify-center border-2 border-dashed border-blue-200">
                 <p className="text-blue-400 font-medium">[Ilustração da Agenda Google]</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8 mb-12 border-b border-gray-800 pb-12">
            <div className="flex items-center gap-2">
              <Anchor className="text-blue-500" size={32} />
              <span className="text-xl font-bold tracking-tight text-white">Dilancha Náutica</span>
            </div>
            <div className="flex flex-wrap justify-center gap-8 font-medium">
              <Link to="/privacy-policy" className="hover:text-white transition-colors">Política de Privacidade</Link>
              <Link to="/terms-of-service" className="hover:text-white transition-colors">Termos de Uso</Link>
              <a
                href={`https://wa.me/${companyData?.phone?.replace(/\D/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white transition-colors flex items-center gap-1 text-green-500 font-bold"
              >
                <MessageCircle size={18} />
                Suporte WhatsApp
              </a>
            </div>
          </div>
          <div className="text-center text-sm">
            <p>&copy; 2026 Dilancha Náutica. Todos os direitos reservados.</p>
            <p className="mt-2 text-gray-600 max-w-2xl mx-auto">
              Este aplicativo utiliza as APIs do Google para fornecer sincronização de calendário. Nosso uso das informações recebidas das APIs do Google está em conformidade com a Política de Dados do Usuário dos Serviços de API do Google, incluindo os requisitos de Uso Limitado.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description }) => (
  <div className="p-8 rounded-2xl border border-gray-100 hover:border-blue-200 hover:shadow-lg transition-all bg-white group">
    <div className="mb-6 group-hover:scale-110 transition-transform">
      {icon}
    </div>
    <h3 className="text-xl font-bold text-gray-900 mb-3">{title}</h3>
    <p className="text-gray-600 leading-relaxed">{description}</p>
  </div>
);
