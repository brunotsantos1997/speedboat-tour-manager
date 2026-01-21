/** @jsxImportSource react */
// src/ui/screens/ClientHistoryScreen.tsx
import React from 'react';
import { useClientHistoryViewModel } from '../../viewmodels/useClientHistoryViewModel';
import { Search, X, Calendar, Edit, Ban, CheckCircle, Clock, Pencil, FileText, Share2, DollarSign, AlertTriangle } from 'lucide-react';
import type { EventStatus, PaymentStatus, EventType, ClientProfile } from '../../core/domain/types';
import { useNavigate } from 'react-router-dom';
import { useToastContext } from '../contexts/ToastContext';
import { ConfirmationModal } from '../components/ConfirmationModal';

// This is the shared modal component. Let's define it here for simplicity,
// but in a real app, it would be in its own file.
const ClientModal: React.FC<{
  isOpen: boolean;
  editingClient: ClientProfile | null;
  name: string;
  phone: string;
  setName: (name: string) => void;
  setPhone: (phone: string) => void;
  onSave: () => void;
  onClose: () => void;
}> = ({ isOpen, editingClient, name, phone, setName, setPhone, onSave, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm">
        <h2 className="text-xl font-bold mb-4">
          {editingClient ? 'Editar Cliente' : 'Cadastrar Novo Cliente'}
        </h2>
        <div className="space-y-4">
          <input
            type="text"
            placeholder="Nome do Cliente"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="tel"
            placeholder="Telefone (WhatsApp)"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex justify-end space-x-3 mt-6">
          <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">
            Cancelar
          </button>
          <button onClick={onSave} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            {editingClient ? 'Atualizar' : 'Salvar Cliente'}
          </button>
        </div>
      </div>
    </div>
  );
};

const PaymentStatusBadge: React.FC<{ status: PaymentStatus }> = ({ status }) => {
  const statusMap = {
    PENDING: { text: 'Pendente', color: 'yellow', icon: <AlertTriangle size={14} /> },
    CONFIRMED: { text: 'Confirmado', color: 'green', icon: <CheckCircle size={14} /> },
  };
  const { text, color, icon } = statusMap[status];

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-${color}-100 text-${color}-800`}>
      {icon}
      <span className="ml-1">{text}</span>
    </span>
  );
};


const StatusBadge: React.FC<{ status: EventStatus }> = ({ status }) => {
  const statusMap: Record<EventStatus, { text: string; color: string; icon: React.ReactElement }> = {
    SCHEDULED: { text: 'Agendado', color: 'blue', icon: <Clock size={14} /> },
    PRE_SCHEDULED: { text: 'Pré-Agendado', color: 'yellow', icon: <Clock size={14} /> },
    COMPLETED: { text: 'Realizado', color: 'green', icon: <CheckCircle size={14} /> },
    CANCELLED: { text: 'Cancelado', color: 'red', icon: <Ban size={14} /> },
    PENDING_REFUND: { text: 'Reembolso Pendente', color: 'orange', icon: <AlertTriangle size={14} /> },
    REFUNDED: { text: 'Reembolsado', color: 'gray', icon: <CheckCircle size={14} /> },
    ARCHIVED_COMPLETED: { text: 'Arquivado (Realizado)', color: 'gray', icon: <CheckCircle size={14} /> },
    ARCHIVED_CANCELLED: { text: 'Arquivado (Cancelado)', color: 'gray', icon: <Ban size={14} /> },
  };
  const { text, color, icon } = statusMap[status] ?? statusMap.CANCELLED;

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-${color}-100 text-${color}-800`}>
      {icon}
      <span className="ml-1">{text}</span>
    </span>
  );
};

const EventCard: React.FC<{
  eventType: EventType;
  onCancel: (id: string) => void;
  onEdit: (id: string) => void;
  onConfirmPayment: (id: string) => void;
}> = ({ eventType, onCancel, onEdit, onConfirmPayment }) => {
  const { showToast } = useToastContext();

  const shareVoucher = (eventId: string) => {
    const url = `${window.location.origin}/voucher/${eventId}`;
    navigator.clipboard.writeText(url).then(() => {
      showToast('Link do voucher copiado para a área de transferência!');
    }, (err) => {
      console.error('Falha ao copiar o link: ', err);
      showToast('Falha ao copiar o link.');
    });
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-md border transition-shadow hover:shadow-lg">
      <div className="flex justify-between items-start">
        <div>
          <p className="font-bold text-lg text-gray-800">{eventType.boat.name}</p>
          <p className="flex items-center text-gray-600 mt-1">
            <Calendar size={16} className="mr-2" />
            {new Date(eventType.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })} às {eventType.startTime}
          </p>
        </div>
        <div className="text-right">
          <StatusBadge status={eventType.status} />
          <div className="mt-1">
            <PaymentStatusBadge status={eventType.paymentStatus || 'PENDING'} />
          </div>
        </div>
      </div>

      <div className="mt-4 border-t pt-4 flex flex-wrap justify-end gap-2">
        <button onClick={() => shareVoucher(eventType.id)} className="px-3 py-1 text-sm bg-gray-500 text-white rounded hover:bg-gray-600 flex items-center"><Share2 size={14} className="mr-1" /> Compartilhar</button>
        <a href={`/voucher/${eventType.id}`} target="_blank" rel="noopener noreferrer" className="px-3 py-1 text-sm bg-indigo-500 text-white rounded hover:bg-indigo-600 flex items-center"><FileText size={14} className="mr-1" /> Ver Voucher</a>

        {(eventType.status === 'SCHEDULED' || eventType.status === 'PRE_SCHEDULED') && (
          <>
            {eventType.paymentStatus === 'PENDING' && (
              <button onClick={() => onConfirmPayment(eventType.id)} className="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600 flex items-center"><DollarSign size={14} className="mr-1" /> Confirmar Pagamento</button>
            )}
            <button onClick={() => onEdit(eventType.id)} className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center"><Edit size={14} className="mr-1" /> Alterar</button>
            <button onClick={() => onCancel(eventType.id)} className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600 flex items-center"><Ban size={14} className="mr-1" /> Cancelar</button>
          </>
        )}
      </div>
    </div>
  );
};


export const ClientHistoryScreen: React.FC = () => {
    const vm = useClientHistoryViewModel();
    const navigate = useNavigate();

    const handleEditEvent = (eventId: string) => {
        navigate(`/create-event?eventId=${eventId}`);
    };

    return (
        <div className="p-4 md:p-6">
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Histórico de Clientes</h1>

            <div className="max-w-xl mx-auto">
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Buscar cliente por nome ou telefone..."
                        value={vm.searchTerm}
                        onChange={(e) => vm.handleSearch(e.target.value)}
                        className="w-full p-3 pl-12 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500"
                    />
                    {vm.selectedClient && (
                         <button onClick={vm.clearSelection} className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-red-600">
                            <X size={20} />
                        </button>
                    )}
                </div>

                {vm.searchResults.length > 0 && !vm.selectedClient && (
                    <ul className="bg-white border rounded-lg mt-1 shadow-lg z-20 max-h-60 overflow-y-auto">
                        {vm.searchResults.map(client => (
                            <li key={client.id} onClick={() => vm.selectClient(client)} className="p-3 hover:bg-gray-100 cursor-pointer">
                                <p className="font-semibold">{client.name}</p>
                            </li>
                        ))}
                    </ul>
                )}

                {vm.selectedClient && (
                    <div className="mt-8">
                        <div className="flex items-center mb-4">
                            <h2 className="text-2xl font-semibold">{vm.selectedClient.name}</h2>
                            <button onClick={vm.openEditModal} className="ml-3 p-1 text-gray-500 hover:text-blue-600">
                                <Pencil size={20} />
                            </button>
                        </div>
                        {vm.isLoading ? <p>Carregando eventos...</p> : (
                            <div className="space-y-4">
                                {vm.clientEvents.length > 0 ? (
                                    vm.clientEvents.map(eventType => (
                                       <EventCard
                                          key={eventType.id}
                                          eventType={eventType}
                                          onCancel={vm.cancelEvent}
                                          onEdit={handleEditEvent}
                                          onConfirmPayment={vm.confirmPayment}
                                       />
                                    ))
                                ) : <p>Nenhum evento encontrado para este cliente.</p>}
                            </div>
                        )}
                    </div>
                )}
            </div>

            <ClientModal
                isOpen={vm.isModalOpen}
                editingClient={vm.editingClient}
                name={vm.clientName}
                phone={vm.clientPhone}
                setName={vm.setClientName}
                setPhone={vm.setClientPhone}
                onSave={vm.handleSaveChanges}
                onClose={vm.closeEditModal}
            />

      <ConfirmationModal
        isOpen={vm.isConfirmationModalOpen}
        title={vm.confirmationMessage.title}
        message={vm.confirmationMessage.message}
        onConfirm={vm.confirmAction}
        onCancel={vm.closeConfirmationModal}
      />
        </div>
    );
};
