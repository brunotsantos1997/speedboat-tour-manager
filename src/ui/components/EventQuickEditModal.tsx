import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Calendar, DollarSign, Tag, CheckCircle, AlertTriangle, Clock, Ban, Smartphone, CreditCard, Landmark, Receipt, Save } from 'lucide-react';
import { formatCurrencyBRL } from '../../core/utils/currencyUtils';
import { MoneyInput } from './MoneyInput';
import type { EventType, Payment, EventStatus, PaymentStatus, PaymentMethod, PaymentType } from '../../core/domain/types';
import { format } from 'date-fns';
import { useModalContext } from '../contexts/ModalContext';

interface EventQuickEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: EventType;
  payments: Payment[];
  onUpdateEvent: (data: Partial<EventType>) => Promise<void>;
  onUpdatePayment: (paymentId: string, data: Partial<Payment>) => Promise<void>;
  onDeletePayment: (paymentId: string) => Promise<void>;
  onAddPayment: (data: { amount: number; method: PaymentMethod; type: PaymentType; date: string }) => Promise<void>;
}

export const EventQuickEditModal: React.FC<EventQuickEditModalProps> = ({
  isOpen,
  onClose,
  event,
  payments,
  onUpdateEvent,
  onUpdatePayment,
  onDeletePayment,
  onAddPayment
}) => {
  const { confirm } = useModalContext();
  const [eventStatus, setEventStatus] = useState<EventStatus>(event.status);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>(event.paymentStatus || 'PENDING');
  const [isSaving, setIsSaving] = useState(false);
  const [showAddPayment, setShowAddPayment] = useState(false);

  // New Payment State
  const [newAmount, setNewAmount] = useState(0);
  const [newMethod, setNewMethod] = useState<PaymentMethod>('PIX');
  const [newType, setNewType] = useState<PaymentType>('BALANCE');
  const [newDate, setNewDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  useEffect(() => {
    if (isOpen) {
      setEventStatus(event.status);
      setPaymentStatus(event.paymentStatus || 'PENDING');
    }
  }, [isOpen, event]);

  if (!isOpen) return null;

  const handleSaveStatus = async () => {
    setIsSaving(true);
    try {
      await onUpdateEvent({ status: eventStatus, paymentStatus });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddPaymentClick = async () => {
    if (newAmount <= 0) return;
    setIsSaving(true);
    try {
      await onAddPayment({ amount: newAmount, method: newMethod, type: newType, date: newDate });
      setNewAmount(0);
      setShowAddPayment(false);
    } finally {
      setIsSaving(false);
    }
  };

  const statusOptions: { value: EventStatus; label: string; icon: any; color: string }[] = [
    { value: 'PRE_SCHEDULED', label: 'Pré-Agendado', icon: Clock, color: 'text-yellow-600' },
    { value: 'SCHEDULED', label: 'Agendado', icon: Clock, color: 'text-blue-600' },
    { value: 'COMPLETED', label: 'Realizado', icon: CheckCircle, color: 'text-green-600' },
    { value: 'CANCELLED', label: 'Cancelado', icon: Ban, color: 'text-red-600' },
    { value: 'PENDING_REFUND', label: 'Reembolso Pendente', icon: AlertTriangle, color: 'text-orange-600' },
    { value: 'REFUNDED', label: 'Reembolsado', icon: CheckCircle, color: 'text-gray-600' },
    { value: 'ARCHIVED_COMPLETED', label: 'Arquivado (Realizado)', icon: CheckCircle, color: 'text-gray-500' },
    { value: 'ARCHIVED_CANCELLED', label: 'Arquivado (Cancelado)', icon: Ban, color: 'text-gray-500' },
  ];

  const paymentStatusOptions: { value: PaymentStatus; label: string; color: string }[] = [
    { value: 'PENDING', label: 'Pendente', color: 'text-yellow-600' },
    { value: 'CONFIRMED', label: 'Confirmado', color: 'text-green-600' },
  ];

  const methods: { value: PaymentMethod; label: string; icon: any }[] = [
    { value: 'PIX', label: 'PIX', icon: Smartphone },
    { value: 'CARD_CREDIT', label: 'Crédito', icon: CreditCard },
    { value: 'CARD_DEBIT', label: 'Débito', icon: CreditCard },
    { value: 'CASH', label: 'Dinheiro', icon: DollarSign },
    { value: 'TRANSFER', label: 'Transf.', icon: Landmark },
    { value: 'OTHER', label: 'Outro', icon: Receipt },
  ];

  const types: { value: PaymentType; label: string }[] = [
    { value: 'DOWN_PAYMENT', label: 'Sinal' },
    { value: 'BALANCE', label: 'Saldo' },
    { value: 'FULL', label: 'Integral' },
  ];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[70] p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b flex justify-between items-center bg-gray-50/50">
          <div>
            <h2 className="text-xl font-black text-gray-900">Ajuste Rápido</h2>
            <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-1">
              {event.boat.name} • {new Date(event.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-xl transition-all">
            <X size={24} className="text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {/* Status Section */}
          <section className="space-y-4">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
              <Tag size={14} /> Status do Evento e Pagamento
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1 uppercase">Status do Passeio</label>
                <select
                  value={eventStatus}
                  onChange={(e) => setEventStatus(e.target.value as EventStatus)}
                  className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white font-bold text-sm"
                >
                  {statusOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1 uppercase">Status do Pagamento</label>
                <select
                  value={paymentStatus}
                  onChange={(e) => setPaymentStatus(e.target.value as PaymentStatus)}
                  className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white font-bold text-sm"
                >
                  {paymentStatusOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <button
              onClick={handleSaveStatus}
              disabled={isSaving}
              className="w-full md:w-auto px-6 py-2 bg-gray-900 text-white rounded-xl font-bold text-sm hover:bg-black transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Save size={16} /> Salvar Status
            </button>
          </section>

          {/* Payments Section */}
          <section className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                <DollarSign size={14} /> Pagamentos Realizados
              </h3>
              <button
                onClick={() => setShowAddPayment(!showAddPayment)}
                className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-all"
                title="Adicionar Pagamento"
              >
                <Plus size={20} />
              </button>
            </div>

            {showAddPayment && (
              <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100 space-y-4 animate-in fade-in slide-in-from-top-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-blue-600 uppercase mb-1">Valor</label>
                    <MoneyInput value={newAmount} onChange={setNewAmount} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-blue-600 uppercase mb-1">Data</label>
                    <input
                      type="date"
                      value={newDate}
                      onChange={(e) => setNewDate(e.target.value)}
                      className="w-full p-2.5 border border-blue-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-blue-600 uppercase mb-1">Método</label>
                    <select
                      value={newMethod}
                      onChange={(e) => setNewMethod(e.target.value as PaymentMethod)}
                      className="w-full p-2.5 border border-blue-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    >
                      {methods.map(m => (
                        <option key={m.value} value={m.value}>{m.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-blue-600 uppercase mb-1">Tipo</label>
                    <select
                      value={newType}
                      onChange={(e) => setNewType(e.target.value as PaymentType)}
                      className="w-full p-2.5 border border-blue-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    >
                      {types.map(t => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => setShowAddPayment(false)}
                    className="flex-1 py-2 text-sm font-bold text-gray-500 hover:bg-gray-100 rounded-xl transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleAddPaymentClick}
                    disabled={newAmount <= 0 || isSaving}
                    className="flex-1 py-2 text-sm font-bold bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all disabled:opacity-50"
                  >
                    Adicionar
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-3">
              {payments.length === 0 ? (
                <div className="text-center py-8 text-gray-400 bg-gray-50 rounded-2xl border border-dashed">
                  Nenhum pagamento registrado.
                </div>
              ) : (
                payments.sort((a,b) => b.timestamp - a.timestamp).map((p) => (
                  <PaymentItem
                    key={p.id}
                    payment={p}
                    onUpdate={(data) => onUpdatePayment(p.id, data)}
                    onDelete={() => onDeletePayment(p.id)}
                    methods={methods}
                    types={types}
                    confirm={confirm}
                  />
                ))
              )}
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-gray-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-8 py-3 bg-white border border-gray-300 text-gray-700 rounded-xl font-black uppercase tracking-widest text-xs hover:bg-gray-50 transition-all active:scale-95"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

const PaymentItem: React.FC<{
  payment: Payment;
  onUpdate: (data: Partial<Payment>) => Promise<void>;
  onDelete: () => Promise<void>;
  methods: { value: PaymentMethod; label: string; icon: any }[];
  types: { value: PaymentType; label: string }[];
  confirm: (title: string, message: string) => Promise<boolean>;
}> = ({ payment, onUpdate, onDelete, methods, types, confirm }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [amount, setAmount] = useState(payment.amount);
  const [method, setMethod] = useState(payment.method);
  const [type, setType] = useState(payment.type);
  const [date, setDate] = useState(payment.date);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onUpdate({ amount, method, type, date });
      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (await confirm('Confirmar Exclusão', 'Excluir este pagamento?')) {
      await onDelete();
    }
  };

  if (isEditing) {
    return (
      <div className="p-4 border border-blue-200 rounded-2xl bg-blue-50/30 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] font-black text-gray-500 uppercase mb-1">Valor</label>
            <MoneyInput value={amount} onChange={setAmount} />
          </div>
          <div>
            <label className="block text-[10px] font-black text-gray-500 uppercase mb-1">Data</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full p-2 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] font-black text-gray-500 uppercase mb-1">Método</label>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value as PaymentMethod)}
              className="w-full p-2 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
            >
              {methods.map(m => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-black text-gray-500 uppercase mb-1">Tipo</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as PaymentType)}
              className="w-full p-2 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
            >
              {types.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setIsEditing(false)} className="flex-1 py-2 text-xs font-bold text-gray-500 hover:bg-gray-100 rounded-lg transition-all">Cancelar</button>
          <button onClick={handleSave} disabled={isSaving} className="flex-1 py-2 text-xs font-bold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all disabled:opacity-50">Salvar</button>
        </div>
      </div>
    );
  }

  const methodIcon = methods.find(m => m.value === payment.method)?.icon || Smartphone;

  return (
    <div className="p-4 border border-gray-100 rounded-2xl bg-white hover:border-gray-200 transition-all group">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 group-hover:text-blue-600 group-hover:bg-blue-50 transition-all">
            {React.createElement(methodIcon, { size: 20 })}
          </div>
          <div>
            <p className="font-black text-gray-900 leading-tight">{formatCurrencyBRL(payment.amount)}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider">
                {new Date(payment.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
              </span>
              <span className="text-[10px] font-black uppercase px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded">
                {types.find(t => t.value === payment.type)?.label || payment.type}
              </span>
            </div>
          </div>
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
          <button
            onClick={() => setIsEditing(true)}
            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
          >
            <Calendar size={18} />
          </button>
          <button
            onClick={handleDelete}
            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};
