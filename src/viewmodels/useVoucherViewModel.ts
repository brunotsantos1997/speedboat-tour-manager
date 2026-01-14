// src/viewmodels/useVoucherViewModel.ts
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import type { Event } from '../core/domain/types';
import { eventRepository } from '../core/repositories/EventRepository';
import { RESERVATION_FEE_PERCENTAGE } from '../core/config';
import html2pdf from 'html2pdf.js';

interface VoucherDetails extends Event {
  reservationFee: number;
  remainingBalance: number;
}

export const useVoucherViewModel = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const [voucher, setVoucher] = useState<VoucherDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEventDetails = async () => {
      if (!eventId) {
        setError('ID do evento não fornecido.');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const eventData = await eventRepository.getById(eventId);

        if (!eventData) {
          setError('Evento não encontrado.');
          setIsLoading(false);
          return;
        }

        const reservationFee = eventData.total * RESERVATION_FEE_PERCENTAGE;
        const remainingBalance = eventData.total - reservationFee;

        setVoucher({
          ...eventData,
          reservationFee,
          remainingBalance,
        });

      } catch (err) {
        setError('Falha ao buscar os detalhes do evento.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEventDetails();
  }, [eventId]);

  const handleDownloadPdf = () => {
    const element = document.getElementById('voucher-content');
    if (element && voucher) {
      const opt = {
        margin:       0.5,
        filename:     `voucher-${voucher.client.name.replace(/\s+/g, '-')}-${voucher.id}.pdf`,
        image:        { type: 'jpeg' as const, quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true },
        jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' as const }
      };
      html2pdf().from(element).set(opt).save();
    }
  };

  return {
    voucher,
    isLoading,
    error,
    handleDownloadPdf,
  };
};
