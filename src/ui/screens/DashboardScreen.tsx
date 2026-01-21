// src/ui/screens/DashboardScreen.tsx
import React from 'react';
import { useDashboardViewModel } from '../../viewmodels/useDashboardViewModel';
import { Link } from 'react-router-dom';
import { DollarSign, Hash, PlusCircle, Search, Clock, AlertTriangle, Anchor, CheckCircle, Bell, Ban } from 'lucide-react';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import type { EventType } from '../../core/domain/types';

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

const EventListItem: React.FC<{ event: EventType; onConfirmPayment: (id: string) => void; }> = ({ event, onConfirmPayment }) => {
  // Parse date string as local to avoid timezone issues.
  const eventDate = new Date(`${event.date}T00:00`);

  const formattedDate = new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
  }).format(eventDate);

  // Capitalize the first letter of the weekday
  const capitalizedDate = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);

  return (
    <div className="bg-gray-50 p-3 rounded-lg flex flex-col sm:flex-row justify-between sm:items-center">
      <div className="mb-2 sm:mb-0">
        <div className="flex items-baseline gap-x-3">
          <Link to={`/clients?clientId=${event.client.id}`} className="font-semibold text-blue-600 hover:underline">{event.client.name}</Link>
          <span className="font-normal text-sm text-gray-600">{capitalizedDate}</span>
        </div>
        <div className="flex items-center text-sm text-gray-500 mt-1">
          <Anchor size={14} className="mr-2" /> {event.boat.name}
          <Clock size={14} className="ml-4 mr-2" /> {event.startTime}
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
};


export const DashboardScreen: React.FC = () => {
  const {
    isLoading,
    error,
    notificationEvents,
    eventsForSelectedDate,
    eventsThisWeek,
    pendingPayments,
    monthlyStats,
    calendarEvents,
    selectedDate,
    setSelectedDate,
    confirmPayment,
    processNotification
  } = useDashboardViewModel();

  // A new component for notifications
  const NotificationCard: React.FC<{ event: EventType; onAcknowledge: (id: string) => void; }> = ({ event, onAcknowledge }) => {
    const styleMap = {
      CANCELLED: {
        container: 'bg-red-50 border-l-4 border-red-500',
        iconContainer: 'text-red-700',
        button: 'bg-gray-500 hover:bg-gray-600',
        icon: Ban,
        actionText: 'Arquivar',
        message: `O passeio de ${event.client.name} foi cancelado.`
      },
      COMPLETED: {
        container: 'bg-green-50 border-l-4 border-green-500',
        iconContainer: 'text-green-700',
        button: 'bg-gray-500 hover:bg-gray-600',
        icon: CheckCircle,
        actionText: 'Arquivar',
        message: `O passeio de ${event.client.name} foi concluído.`
      },
      PENDING_REFUND: {
        container: 'bg-yellow-50 border-l-4 border-yellow-500',
        iconContainer: 'text-yellow-700',
        button: 'bg-yellow-500 hover:bg-yellow-600',
        icon: AlertTriangle,
        actionText: 'Confirmar Estorno',
        message: `Reembolso pendente para ${event.client.name}.`
      }
    };

    const status = event.status as 'CANCELLED' | 'COMPLETED' | 'PENDING_REFUND';
    const { container, iconContainer, button, icon: Icon, actionText, message } = styleMap[status];

    return (
      <div className={`${container} p-3 flex justify-between items-center`}>
        <div>
          <div className={`${iconContainer} flex items-center`}>
            <Icon size={18} className="mr-2"/>
            <span className="font-semibold">{message}</span>
          </div>
          <p className="text-sm text-gray-600 ml-7">{new Date(event.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })} - {event.boat.name}</p>
        </div>
        <button
          onClick={() => onAcknowledge(event.id)}
          className={`${button} text-white px-3 py-1 rounded-lg text-sm transition-colors`}
        >
          {actionText}
        </button>
      </div>
    );
  };


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

          {/* Notifications */}
          {notificationEvents.length > 0 && (
            <div className="bg-white rounded-lg shadow-md">
              <div className="p-4 border-b">
                <h2 className="text-xl font-semibold flex items-center"><Bell className="mr-2 text-gray-600"/> Avisos</h2>
              </div>
              <div className="space-y-2 p-2">
                {notificationEvents.map(event =>
                  <NotificationCard key={event.id} event={event} onAcknowledge={processNotification} />
                )}
              </div>
            </div>
          )}


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

          {/* Week's Events */}
          <div className="bg-white p-4 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-3 flex items-center"><Clock className="mr-2 text-purple-500"/> Passeios da Semana</h2>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {eventsThisWeek.length > 0
                ? eventsThisWeek.map(event => <EventListItem key={event.id} event={event} onConfirmPayment={confirmPayment} />)
                : <p className="text-gray-500">Nenhum passeio agendado para esta semana.</p>
              }
            </div>
          </div>

          {/* Events for Selected Date */}
          <div className="bg-white p-4 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-3 flex items-center"><Clock className="mr-2 text-blue-500"/>
              Passeios para {selectedDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
            </h2>
            <div className="space-y-3">
              {eventsForSelectedDate.length > 0
                ? eventsForSelectedDate.map(event => <EventListItem key={event.id} event={event} onConfirmPayment={confirmPayment} />)
                : <p className="text-gray-500">Nenhum passeio agendado para a data selecionada.</p>
              }
            </div>
          </div>

        </div>

        {/* Right Column: Calendar */}
        <div className="bg-white p-4 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-3">Calendário de Eventos</h2>
          <DayPicker
            mode="single"
            selected={selectedDate}
            onSelect={(date) => {
              if (date) {
                setSelectedDate(date);
              }
            }}
            modifiers={{ booked: calendarEvents }}
            modifiersStyles={{ booked: { color: 'red', fontWeight: 'bold' } }}
            className="w-full"
          />
        </div>

      </div>
    </div>
  );
};
