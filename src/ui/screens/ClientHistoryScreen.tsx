/** @jsxImportSource react */
// src/ui/screens/ClientHistoryScreen.tsx
import React from 'react';
import { useClientHistoryViewModel } from '../../viewmodels/useClientHistoryViewModel';
import { useToastContext } from '../contexts/ToastContext';
import { useModalContext } from '../contexts/ModalContext';
import { Search, X, Calendar, Edit, Ban, CheckCircle, Clock, Pencil, FileText, Share2, DollarSign, AlertTriangle, History, Settings, Trash2 } from 'lucide-react';
import type { EventStatus, PaymentStatus, EventType, ClientProfile } from '../../core/domain/types';
import { useNavigate } from 'react-router-dom';
import { PaymentModal } from '../components/PaymentModal';
import { SharedEventModal } from '../components/SharedEventModal';
import { EventCostModal } from '../components/EventCostModal';
import { EventQuickEditModal } from '../components/EventQuickEditModal';
import { useEventCostViewModel } from '../../viewmodels/useEventCostViewModel';

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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-6 md:p-8 w-full max-w-sm">
        <h2 className="text-2xl font-black mb-6 text-gray-900 border-b pb-4">
          {editingClient ? 'Editar Cliente' : 'Novo Cliente'}
        </h2>
        <div className="space-y-6">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-widest">Nome do Cliente</label>
            <input
                type="text"
                placeholder="Ex: João Silva"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-widest">Telefone (WhatsApp)</label>
            <input
                type="tel"
                placeholder="+55 (21) 99999-9999"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium"
            />
          </div>
        </div>
        <div className="flex gap-3 mt-10">
          <button onClick={onClose} className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-colors">
            Cancelar
          </button>
          <button onClick={onSave} className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all active:scale-95">
            {editingClient ? 'Atualizar' : 'Salvar'}
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
  onConfirmPayment: (id: string, type: 'DOWN_PAYMENT' | 'BALANCE' | 'FULL') => void;
  onOpenCosts: (event: EventType) => void;
  onRevert?: (id: string) => void;
  onQuickEdit: (event: EventType) => void;
  onDelete: (id: string) => void;
}> = ({ eventType, onCancel, onEdit, onConfirmPayment, onOpenCosts, onRevert, onQuickEdit, onDelete }) => {
  const { showToast } = useToastContext();
  const { showAlert } = useModalContext();

  const shareVoucher = (eventId: string) => {
    const url = `${window.location.origin}/voucher/${eventId}`;
    navigator.clipboard.writeText(url).then(() => {
      showToast('Link do voucher copiado para a área de transferência!');
    }, (err) => {
      console.error('Falha ao copiar o link: ', err);
      showAlert('Erro', 'Falha ao copiar o link.');
    });
  };

  const hasLegacyDiscounts = (eventType.discount?.value || 0) > 0 || (eventType.productsDiscount?.value || 0) > 0;

  return (
    <div className={`bg-white p-5 rounded-2xl shadow-sm border transition-all hover:shadow-md ${hasLegacyDiscounts ? 'border-yellow-200 bg-yellow-50/50' : 'border-gray-100'}`}>
      {hasLegacyDiscounts && (
        <div className="mb-4 flex items-center gap-2 text-yellow-800 bg-yellow-100 p-3 rounded-xl text-[10px] font-black uppercase tracking-widest leading-tight">
          <AlertTriangle size={16} className="shrink-0" />
          <span>Passeio com descontos antigos. Clique em "Alterar" para atualizar.</span>
        </div>
      )}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: eventType.tourType?.color || '#cbd5e1' }}></div>
            <span className="text-xs font-black text-gray-400 uppercase tracking-widest">{eventType.tourType?.name || 'Passeio'}</span>
          </div>
          <p className="font-black text-xl text-gray-900 leading-tight">{eventType.boat.name}</p>
          <div className="flex items-center text-gray-500 mt-2 font-medium">
            <Calendar size={18} className="mr-2 text-blue-500" />
            <span className="text-sm">
                {new Date(eventType.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })} • {eventType.startTime} - {eventType.endTime}
            </span>
          </div>
        </div>
        <div className="flex flex-row sm:flex-col gap-2 shrink-0">
          <StatusBadge status={eventType.status} />
          <PaymentStatusBadge status={eventType.paymentStatus || 'PENDING'} />
        </div>
      </div>

      <div className="mt-6 pt-5 border-t border-gray-100 flex flex-wrap gap-2">
        <button onClick={() => shareVoucher(eventType.id)} className="flex-1 md:flex-none justify-center px-4 py-2 text-xs font-bold bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"><Share2 size={14} /> Compartilhar</button>
        <a href={`/voucher/${eventType.id}`} target="_blank" rel="noopener noreferrer" className="flex-1 md:flex-none justify-center px-4 py-2 text-xs font-bold bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors flex items-center gap-2"><FileText size={14} /> Voucher</a>

        {['SCHEDULED', 'PRE_SCHEDULED', 'COMPLETED', 'ARCHIVED_COMPLETED', 'CANCELLED', 'PENDING_REFUND', 'REFUNDED'].includes(eventType.status) && (
          <>
            <button onClick={() => onOpenCosts(eventType)} className="flex-1 md:flex-none justify-center px-4 py-2 text-xs font-bold bg-orange-50 text-orange-600 rounded-lg hover:bg-orange-100 transition-colors flex items-center gap-2"><DollarSign size={14} /> Custos</button>
            <button onClick={() => onQuickEdit(eventType)} className="flex-1 md:flex-none justify-center px-4 py-2 text-xs font-bold bg-gray-900 text-white rounded-lg hover:bg-black transition-colors flex items-center gap-2"><Settings size={14} /> Ajuste Rápido</button>
            {eventType.paymentStatus !== 'CONFIRMED' && !['CANCELLED', 'REFUNDED'].includes(eventType.status) && (
                <button onClick={() => onConfirmPayment(eventType.id, eventType.status === 'PRE_SCHEDULED' ? 'DOWN_PAYMENT' : 'BALANCE')} className="flex-1 md:flex-none justify-center px-4 py-2 text-xs font-black bg-green-500 text-white rounded-lg hover:bg-green-600 transition-all shadow-sm active:scale-95 flex items-center gap-2">
                    <CheckCircle size={14} />
                    {eventType.status === 'PRE_SCHEDULED' ? 'Confirmar Reserva' : 'Confirmar Pagamento'}
                </button>
            )}

            {(eventType.status === 'SCHEDULED' || eventType.status === 'PRE_SCHEDULED') && (
              <>
                <button onClick={() => onEdit(eventType.id)} className="flex-1 md:flex-none justify-center px-4 py-2 text-xs font-bold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"><Edit size={14} /> Alterar</button>
                <button onClick={() => onCancel(eventType.id)} className="flex-1 md:flex-none justify-center px-4 py-2 text-xs font-bold bg-white border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors flex items-center gap-2"><Ban size={14} /> Cancelar</button>
              </>
            )}
            <button onClick={() => onDelete(eventType.id)} className="flex-1 md:flex-none justify-center px-4 py-2 text-xs font-bold bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors flex items-center gap-2" title="Excluir Permanentemente"><Trash2 size={14} /> Excluir</button>
          </>
        )}

        {eventType.status === 'CANCELLED' && eventType.autoCancelled && onRevert && (
            <button
                onClick={() => onRevert(eventType.id)}
                className="flex-1 md:flex-none justify-center px-4 py-2 text-xs font-bold bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors flex items-center gap-2"
            >
                <History size={14} /> Reverter Cancelamento
            </button>
        )}
      </div>
    </div>
  );
};


export const ClientHistoryScreen: React.FC = () => {
    const vm = useClientHistoryViewModel();
    const costVm = useEventCostViewModel();
    const { showToast } = useToastContext();
    const navigate = useNavigate();

    const handleEditEvent = (eventId: string) => {
        const event = vm.clientEvents.find(e => e.id === eventId);
        if (event?.tourType?.name.toLowerCase() === 'compartilhado') {
            vm.setSelectedSharedEventId(eventId);
            vm.setIsSharedModalOpen(true);
        } else {
            navigate(`/dashboard/create-event?eventId=${eventId}`);
        }
    };

    return (
        <div className="p-4 md:p-8 max-w-4xl mx-auto min-h-screen bg-gray-50">
            <div className="mb-8">
                <h1 className="text-3xl font-black text-gray-900 leading-tight">Histórico de Clientes</h1>
                <p className="text-gray-500 font-medium">Consulte e gerencie passeios por cliente</p>
            </div>

            <div className="max-w-2xl mx-auto">
                <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={20} />
                    <input
                        type="text"
                        placeholder="Buscar por nome ou telefone..."
                        value={vm.searchTerm}
                        onChange={(e) => vm.handleSearch(e.target.value)}
                        className="w-full p-4 pl-12 border border-gray-200 rounded-2xl shadow-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-medium text-lg"
                    />
                    {(vm.searchTerm || vm.selectedClient) && (
                         <button onClick={vm.clearSelection} className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
                            <X size={20} />
                        </button>
                    )}
                </div>

                {vm.searchResults.length > 0 && !vm.selectedClient && (
                    <ul className="bg-white border border-gray-100 rounded-2xl mt-2 shadow-xl z-20 max-h-80 overflow-y-auto divide-y divide-gray-50">
                        {vm.searchResults.map(client => (
                            <li key={client.id} onClick={() => vm.selectClient(client)} className="p-4 hover:bg-blue-50 cursor-pointer transition-colors flex items-center gap-3">
                                <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-lg">
                                    {client.name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <p className="font-bold text-gray-900">{client.name}</p>
                                    <p className="text-xs text-gray-500">{client.phone}</p>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}

                {vm.selectedClient && (
                    <div className="mt-10">
                        <div className="flex items-center justify-between mb-6 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center font-black text-xl shadow-lg shadow-blue-200">
                                    {vm.selectedClient.name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black text-gray-900 leading-tight">{vm.selectedClient.name}</h2>
                                    <p className="text-sm text-gray-500 font-medium">{vm.selectedClient.phone}</p>
                                </div>
                            </div>
                            <button onClick={vm.openEditModal} className="p-3 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all">
                                <Pencil size={24} />
                            </button>
                        </div>

                        {vm.isLoading ? (
                            <div className="flex justify-center p-12">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {vm.clientEvents.length > 0 ? (
                                    vm.clientEvents.map(eventType => (
                                       <EventCard
                                          key={eventType.id}
                                          eventType={eventType}
                                          onCancel={vm.cancelEvent}
                                          onEdit={handleEditEvent}
                                          onConfirmPayment={vm.initiatePayment}
                                          onOpenCosts={costVm.openModal}
                                          onRevert={vm.revertCancellation}
                                          onQuickEdit={vm.openQuickEdit}
                                          onDelete={vm.deleteEventPermanently}
                                       />
                                    ))
                                ) : (
                                    <div className="text-center p-12 bg-white rounded-2xl border border-dashed border-gray-200">
                                        <History size={48} className="mx-auto text-gray-200 mb-3" />
                                        <p className="text-gray-500 font-medium">Nenhum passeio encontrado.</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {vm.isPaymentModalOpen && vm.activeEventForPayment && (
                <PaymentModal
                    isOpen={vm.isPaymentModalOpen}
                    onClose={() => vm.setIsPaymentModalOpen(false)}
                    onConfirm={vm.confirmPaymentRecord}
                    title={vm.paymentType === 'DOWN_PAYMENT' ? 'Confirmar Reserva (Sinal)' : 'Registrar Pagamento de Saldo'}
                    defaultAmount={vm.defaultPaymentAmount}
                    type={vm.paymentType}
                />
            )}

            <ClientModal
                isOpen={vm.isModalOpen}
                editingClient={vm.editingClient}
                name={vm.clientName}
                phone={vm.clientPhone}
                setName={vm.setClientName}
                setPhone={vm.setClientPhone}
                onSave={() => {
                  vm.handleSaveChanges().then(() => showToast('Dados atualizados com sucesso!'));
                }}
                onClose={vm.closeEditModal}
            />

            {vm.isSharedModalOpen && (
                <SharedEventModal
                    isOpen={vm.isSharedModalOpen}
                    onClose={() => vm.setIsSharedModalOpen(false)}
                    onSuccess={() => {
                        // Success toast is handled by the ViewModel
                    }}
                    eventId={vm.selectedSharedEventId}
                />
            )}

            {vm.isQuickEditModalOpen && vm.activeEventForQuickEdit && (
                <EventQuickEditModal
                    isOpen={vm.isQuickEditModalOpen}
                    onClose={() => vm.setIsQuickEditModalOpen(false)}
                    event={vm.activeEventForQuickEdit}
                    payments={vm.activeEventPayments}
                    onUpdateEvent={vm.manualUpdateEvent}
                    onUpdatePayment={vm.updatePayment}
                    onDeletePayment={vm.deletePayment}
                    onAddPayment={vm.addPaymentToEvent}
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
        </div>
    );
};
