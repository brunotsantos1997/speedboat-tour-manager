// src/ui/screens/DashboardScreen.tsx
import React, { useEffect } from 'react';
import { useDashboardViewModel } from '../../viewmodels/useDashboardViewModel';
import { useAuth } from '../../contexts/AuthContext';
import { Link, useSearchParams } from 'react-router-dom';
import { formatCurrencyBRL } from '../../core/utils/currencyUtils';
import { DollarSign, Hash, PlusCircle, Search, Clock, AlertTriangle, Anchor, CheckCircle, Bell, Ban, Wallet, Users } from 'lucide-react';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { ptBR } from 'date-fns/locale';
import type { EventType, PaymentType } from '../../core/domain/types';
import { PaymentModal } from '../components/PaymentModal';
import { EventCostModal } from '../components/EventCostModal';
import { SharedEventModal } from '../components/SharedEventModal';
import { useEventCostViewModel } from '../../viewmodels/useEventCostViewModel';
import { Tutorial } from '../components/Tutorial';
import { dashboardSteps } from '../tutorials/dashboardSteps';

// --- Sub-components for the Dashboard ---

const StatCard: React.FC<{ title: string; value: string; subValue?: string; icon: React.ReactNode; tourId?: string }> = ({ title, value, subValue, icon, tourId }) => (
  <div className="bg-white p-4 rounded-lg shadow-md flex items-center" data-tour={tourId}>
    <div className="bg-blue-100 text-blue-600 p-3 rounded-full mr-4">
      {icon}
    </div>
    <div>
      <p className="text-sm text-gray-500">{title}</p>
      <p className="text-2xl font-bold text-gray-800">{value}</p>
      {subValue && <p className="text-xs text-gray-400 mt-0.5">{subValue}</p>}
    </div>
  </div>
);

const QuickAccessButton: React.FC<{
    to?: string;
    title: string;
    icon: React.ReactNode;
    onClick?: () => void;
    colorClass?: string;
    disabled?: boolean;
    tourId?: string;
}> = ({ to, title, icon, onClick, colorClass = "bg-blue-600 hover:bg-blue-700", disabled, tourId }) => {
  const content = (
    <>
      {icon}
      <span className="mt-2 font-bold text-sm md:text-base">{title}</span>
    </>
  );

  const baseClasses = `flex flex-col items-center justify-center text-center p-4 md:p-6 rounded-xl shadow-sm transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] h-28 md:h-32 w-full`;

  if (disabled) {
    return (
      <div className={`${baseClasses} bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200 shadow-none hover:scale-100`}>
        {content}
      </div>
    );
  }

  if (to) {
    return (
      <Link to={to} className={`${baseClasses} ${colorClass} text-white`} data-tour={tourId}>
        {content}
      </Link>
    );
  }

  return (
    <button onClick={onClick} className={`${baseClasses} ${colorClass} text-white`} data-tour={tourId}>
      {content}
    </button>
  );
};

const EventListItem: React.FC<{
  event: EventType;
  onConfirmPayment: (id: string, type: PaymentType) => void;
  onOpenCosts: (event: EventType) => void;
  isSeller?: boolean;
}> = ({ event, onConfirmPayment, onOpenCosts, isSeller }) => {
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
    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex flex-col sm:flex-row justify-between sm:items-center gap-4 transition-all hover:bg-white hover:shadow-sm">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-x-3 mb-1.5">
          <Link to={`/dashboard/clients?clientId=${event.client.id}`} className="font-bold text-blue-600 hover:underline truncate text-lg">{event.client.name}</Link>
          <span className="shrink-0 font-medium text-xs text-gray-500 bg-gray-200 px-2 py-0.5 rounded-full">{capitalizedDate}</span>
        </div>
        <div className="flex flex-wrap items-center text-xs md:text-sm text-gray-500 gap-y-2">
          <div className="flex items-center mr-4 bg-white px-2 py-1 rounded-md border border-gray-100">
            <div className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: event.tourType?.color || '#cbd5e1' }}></div>
            <span className="font-semibold text-gray-700">{event.tourType?.name || 'Passeio'}</span>
          </div>
          <div className="flex items-center mr-4">
            <Anchor size={14} className="mr-1.5 text-gray-400" /> {event.boat.name}
          </div>
          <div className="flex items-center mr-4">
            <Users size={14} className="mr-1.5 text-gray-400" /> {event.passengerCount} {event.passengerCount === 1 ? 'pessoa' : 'pessoas'}
          </div>
          <div className="flex items-center">
            <Clock size={14} className="mr-1.5 text-gray-400" /> {event.startTime} - {event.endTime}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        {!isSeller && (
          <button
            onClick={() => onOpenCosts(event)}
            className="p-2.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Adicionar Custos"
          >
            <DollarSign size={20} />
          </button>
        )}
        {event.paymentStatus === 'PENDING' && !isSeller && (
          <button
            onClick={() => onConfirmPayment(event.id, event.status === 'PRE_SCHEDULED' ? 'DOWN_PAYMENT' : 'BALANCE')}
            className="flex-1 sm:flex-none bg-green-500 text-white px-4 py-2.5 rounded-lg text-sm font-bold hover:bg-green-600 transition-colors flex items-center justify-center shadow-sm active:scale-95"
          >
            <Wallet size={16} className="mr-2"/>
            {event.status === 'PRE_SCHEDULED' ? 'Confirmar Reserva' : 'Confirmar Pagamento'}
          </button>
        )}
      </div>
    </div>
  );
};


export const DashboardScreen: React.FC = () => {
  const { currentUser } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isSharedModalOpen, setIsSharedModalOpen] = React.useState(searchParams.get('shared') === 'true');
  const isSeller = currentUser?.role === 'SELLER';

  useEffect(() => {
    if (searchParams.get('shared') === 'true') {
      setIsSharedModalOpen(true);
    }
  }, [searchParams]);

  const closeSharedModal = () => {
    setIsSharedModalOpen(false);
    if (searchParams.get('shared') === 'true') {
        setSearchParams({}, { replace: true });
    }
  };
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
    isPaymentModalOpen,
    setIsPaymentModalOpen,
    activeEventForPayment,
    paymentType,
    defaultPaymentAmount,
    initiatePayment,
    confirmPaymentRecord,
    processNotification,
    revertCancellation
  } = useDashboardViewModel();

  const costVm = useEventCostViewModel();

  // A new component for notifications
  const NotificationCard: React.FC<{ event: EventType; onAcknowledge: (id: string) => void; onPayment: (id: string, type: PaymentType) => void; onRevert: (id: string) => void; }> = ({ event, onAcknowledge, onPayment, onRevert }) => {
    const styleMap = {
      CANCELLED: {
        container: 'bg-red-50 border-red-200 border',
        iconContainer: 'text-red-700',
        button: 'bg-red-600 hover:bg-red-700',
        icon: Ban,
        actionText: 'Arquivar',
        message: `Passeio Cancelado: ${event.client.name}`
      },
      COMPLETED: {
        container: 'bg-green-50 border-green-200 border',
        iconContainer: 'text-green-700',
        button: 'bg-green-600 hover:bg-green-700',
        icon: CheckCircle,
        actionText: event.paymentStatus === 'PENDING' ? 'Pagar e Arquivar' : 'Arquivar',
        message: `Passeio Concluído: ${event.client.name}`
      },
      PENDING_REFUND: {
        container: 'bg-yellow-50 border-yellow-200 border',
        iconContainer: 'text-yellow-700',
        button: 'bg-yellow-600 hover:bg-yellow-700',
        icon: AlertTriangle,
        actionText: 'Confirmar Estorno',
        message: `Reembolso Pendente: ${event.client.name}`
      }
    };

    const status = event.status as 'CANCELLED' | 'COMPLETED' | 'PENDING_REFUND';
    const { container, iconContainer, button, icon: Icon, actionText, message } = styleMap[status];

    return (
      <div className={`${container} p-4 rounded-xl flex flex-col sm:flex-row justify-between sm:items-center gap-3`}>
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-full bg-white bg-opacity-50 ${iconContainer}`}>
            <Icon size={20}/>
          </div>
          <div>
            <span className={`font-bold block ${iconContainer}`}>{message}</span>
            <p className="text-xs text-gray-500 font-medium">{new Date(event.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })} • {event.boat.name}</p>
          </div>
        </div>
        <div className="flex gap-2">
            {status === 'CANCELLED' && event.autoCancelled && (
                <button
                    onClick={() => onRevert(event.id)}
                    className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors"
                >
                    Reverter
                </button>
            )}
            <button
                onClick={() => {
                    if (status === 'COMPLETED' && event.paymentStatus === 'PENDING') {
                        onPayment(event.id, 'BALANCE');
                    } else {
                        onAcknowledge(event.id);
                    }
                }}
                className={`${button} flex-1 sm:flex-none text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors`}
            >
                {actionText}
            </button>
        </div>
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
      <Tutorial tourId="dashboard" steps={dashboardSteps} />
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Stat Cards */}
        {!isSeller && (
          <StatCard
            title="Faturamento Realizado (Mês)"
            value={formatCurrencyBRL(monthlyStats.realizedRevenue)}
            subValue={`Projeção (A receber): ${formatCurrencyBRL(monthlyStats.pendingRevenue)}`}
            icon={<DollarSign />}
            tourId="stat-revenue"
          />
        )}
        <StatCard title="Passeios no Mês" value={monthlyStats.totalEvents.toString()} icon={<Hash />} tourId="stat-events" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
        {/* Quick Access */}
        <QuickAccessButton to="/dashboard/create-event" title="Criar Passeio" icon={<PlusCircle size={32}/>} tourId="btn-create-event" />
        <QuickAccessButton
          onClick={() => setIsSharedModalOpen(true)}
          title="Passeio Compartilhado"
          icon={<Users size={32} />}
          colorClass="bg-indigo-600 hover:bg-indigo-700"
          tourId="btn-shared-event"
        />
        <QuickAccessButton
          to="/dashboard/clients"
          title="Buscar Cliente"
          icon={<Search size={32}/>}
          disabled={isSeller}
          tourId="btn-search-client"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">

        {/* Left Column: Event Lists */}
        <div className="lg:col-span-2 space-y-6">

          {/* Notifications */}
          {notificationEvents.length > 0 && (
            <div className="bg-white rounded-lg shadow-md" data-tour="notifications">
              <div className="p-4 border-b">
                <h2 className="text-xl font-semibold flex items-center"><Bell className="mr-2 text-gray-600"/> Avisos</h2>
              </div>
              <div className="space-y-2 p-2">
                {notificationEvents.map(event =>
                  <NotificationCard
                    key={event.id}
                    event={event}
                    onAcknowledge={processNotification}
                    onPayment={initiatePayment}
                    onRevert={revertCancellation}
                  />
                )}
              </div>
            </div>
          )}


          {/* Pending Payments */}
          <div className="bg-white p-4 rounded-lg shadow-md" data-tour="pending-payments">
            <h2 className="text-xl font-semibold mb-3 flex items-center"><AlertTriangle className="mr-2 text-yellow-500"/> Pagamentos Pendentes</h2>
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {pendingPayments.length > 0
                ? pendingPayments.map(event => <EventListItem key={event.id} event={event} onConfirmPayment={initiatePayment} onOpenCosts={costVm.openModal} isSeller={isSeller} />)
                : <p className="text-gray-500">Nenhum pagamento pendente.</p>
              }
            </div>
          </div>

          {/* Week's Events */}
          <div className="bg-white p-4 rounded-lg shadow-md" data-tour="week-events">
            <h2 className="text-xl font-semibold mb-3 flex items-center"><Clock className="mr-2 text-purple-500"/> Passeios da Semana</h2>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {eventsThisWeek.length > 0
                ? eventsThisWeek.map(event => <EventListItem key={event.id} event={event} onConfirmPayment={initiatePayment} onOpenCosts={costVm.openModal} isSeller={isSeller} />)
                : <p className="text-gray-500">Nenhum passeio agendado para esta semana.</p>
              }
            </div>
          </div>

          {/* Events for Selected Date */}
          <div className="bg-white p-4 rounded-lg shadow-md" data-tour="selected-date-events">
            <h2 className="text-xl font-semibold mb-3 flex items-center"><Clock className="mr-2 text-blue-500"/>
              Passeios para {selectedDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
            </h2>
            <div className="space-y-3">
              {eventsForSelectedDate.length > 0
                ? eventsForSelectedDate.map(event => <EventListItem key={event.id} event={event} onConfirmPayment={initiatePayment} onOpenCosts={costVm.openModal} isSeller={isSeller} />)
                : <p className="text-gray-500">Nenhum passeio agendado para a data selecionada.</p>
              }
            </div>
          </div>

        </div>

        {/* Right Column: Calendar */}
        <div className="bg-white p-4 rounded-lg shadow-md" data-tour="calendar">
          <h2 className="text-xl font-semibold mb-3">Calendário de Eventos</h2>
          <DayPicker
            mode="single"
            selected={selectedDate}
            onSelect={(date) => {
              if (date) {
                setSelectedDate(date);
              }
            }}
            locale={ptBR}
            modifiers={{ booked: calendarEvents }}
            modifiersStyles={{ booked: { color: 'red', fontWeight: 'bold' } }}
            className="w-full"
          />
        </div>

      </div>

      {isPaymentModalOpen && activeEventForPayment && (
        <PaymentModal
          isOpen={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
          onConfirm={confirmPaymentRecord}
          title={paymentType === 'DOWN_PAYMENT' ? 'Confirmar Reserva (Sinal)' : 'Registrar Pagamento de Saldo'}
          defaultAmount={defaultPaymentAmount}
          type={paymentType}
        />
      )}

      {costVm.isModalOpen && (
        <EventCostModal
          isOpen={costVm.isModalOpen}
          onClose={costVm.closeModal}
          onSave={costVm.saveCosts}
          event={costVm.event}
          rentalCost={costVm.rentalCost}
          setRentalCost={costVm.setRentalCost}
          products={costVm.products}
          updateProductCost={costVm.updateProductCost}
          additionalCosts={costVm.additionalCosts}
          addAdditionalCost={costVm.addAdditionalCost}
          updateAdditionalCost={costVm.updateAdditionalCost}
          removeAdditionalCost={costVm.removeAdditionalCost}
          isSaving={costVm.isSaving}
        />
      )}

      {isSharedModalOpen && (
        <SharedEventModal
          isOpen={isSharedModalOpen}
          onClose={closeSharedModal}
          onSuccess={() => {}}
        />
      )}
    </div>
  );
};
