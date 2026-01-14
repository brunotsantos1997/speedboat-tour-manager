// src/ui/screens/DashboardScreen.tsx
import React from 'react';
import { useDashboardViewModel } from '../../viewmodels/useDashboardViewModel';
import { Link } from 'react-router-dom';
import { DollarSign, Hash, PlusCircle, Search, Clock, AlertTriangle, Anchor, CheckCircle } from 'lucide-react';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import type { Event } from '../../core/domain/types';

// --- Sub-components for the Dashboard ---

const StatCard: React.FC<{ title: string; value: string; icon: React.ReactNode }> = ({ title, value, icon }) => (
  <div className="bg-white p-4 rounded-lg shadow-md flex items-center">
    <div className="bg-blue-100 text-blue-600 p-3 rounded-full mr-4">
      {icon}
    </div>
    <div>
      <p className="text-sm text-gray-500">{title}</p>
      <p className="text-2xl font-bold text-gray-800">{value}</p>
    </div>
  </div>
);

const QuickAccessButton: React.FC<{ to: string; title: string; icon: React.ReactNode }> = ({ to, title, icon }) => (
  <Link to={to} className="bg-blue-600 text-white p-4 rounded-lg shadow-md hover:bg-blue-700 transition-colors flex flex-col items-center justify-center text-center">
    {icon}
    <span className="mt-2 font-semibold">{title}</span>
  </Link>
);

const EventListItem: React.FC<{ event: Event; onConfirmPayment: (id: string) => void; }> = ({ event, onConfirmPayment }) => (
  <div className="bg-gray-50 p-3 rounded-lg flex flex-col sm:flex-row justify-between sm:items-center">
    <div className="mb-2 sm:mb-0">
      <Link to={`/clients?clientId=${event.client.id}`} className="font-semibold text-blue-600 hover:underline">{event.client.name}</Link>
      <div className="flex items-center text-sm text-gray-500 mt-1">
        <Anchor size={14} className="mr-2" /> {event.boat.name}
        <Clock size={14} className="ml-4 mr-2" /> {event.time}
      </div>
    </div>
    <div className="flex items-center">
      {event.paymentStatus === 'PENDING' && (
        <button
          onClick={() => onConfirmPayment(event.id)}
          className="bg-green-500 text-white px-3 py-1 rounded-lg text-sm hover:bg-green-600 transition-colors flex items-center"
        >
          <CheckCircle size={14} className="mr-1"/>
          Confirmar
        </button>
      )}
    </div>
  </div>
);


export const DashboardScreen: React.FC = () => {
  const {
    isLoading,
    error,
    eventsToday,
    pendingPayments,
    monthlyStats,
    calendarEvents,
    confirmPayment
  } = useDashboardViewModel();

  if (isLoading) {
    return <div className="p-6">Carregando dashboard...</div>;
  }

  if (error) {
    return <div className="p-6 text-red-500">{error}</div>;
  }

  return (
    <div className="p-4 md:p-6 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Stat Cards */}
        <StatCard title="Faturamento do Mês" value={`R$ ${monthlyStats.totalRevenue.toFixed(2)}`} icon={<DollarSign />} />
        <StatCard title="Passeios no Mês" value={monthlyStats.totalEvents.toString()} icon={<Hash />} />

        {/* Quick Access */}
        <QuickAccessButton to="/create-event" title="Criar Passeio" icon={<PlusCircle size={32}/>} />
        <QuickAccessButton to="/clients" title="Buscar Cliente" icon={<Search size={32}/>} />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">

        {/* Left Column: Event Lists */}
        <div className="lg:col-span-2 space-y-6">

          {/* Pending Payments */}
          <div className="bg-white p-4 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-3 flex items-center"><AlertTriangle className="mr-2 text-yellow-500"/> Pagamentos Pendentes</h2>
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {pendingPayments.length > 0
                ? pendingPayments.map(event => <EventListItem key={event.id} event={event} onConfirmPayment={confirmPayment} />)
                : <p className="text-gray-500">Nenhum pagamento pendente.</p>
              }
            </div>
          </div>

          {/* Today's Events */}
          <div className="bg-white p-4 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-3 flex items-center"><Clock className="mr-2 text-blue-500"/> Passeios de Hoje</h2>
            <div className="space-y-3">
              {eventsToday.length > 0
                ? eventsToday.map(event => <EventListItem key={event.id} event={event} onConfirmPayment={confirmPayment} />)
                : <p className="text-gray-500">Nenhum passeio agendado para hoje.</p>
              }
            </div>
          </div>

        </div>

        {/* Right Column: Calendar */}
        <div className="bg-white p-4 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-3">Calendário de Eventos</h2>
          <DayPicker
            mode="multiple"
            selected={calendarEvents}
            className="w-full"
          />
        </div>

      </div>
    </div>
  );
};
