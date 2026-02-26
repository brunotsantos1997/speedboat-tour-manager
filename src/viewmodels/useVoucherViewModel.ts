// src/viewmodels/useVoucherViewModel.ts
import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import type { EventType, CompanyData, VoucherTerms, Payment } from '../core/domain/types';
import { eventRepository } from '../core/repositories/EventRepository';
import { CompanyDataRepository } from '../core/repositories/CompanyDataRepository';
import { VoucherTermsRepository } from '../core/repositories/VoucherTermsRepository';
import { VoucherAppearanceRepository } from '../core/repositories/VoucherAppearanceRepository';
import { paymentRepository } from '../core/repositories/PaymentRepository';
import { useModalContext } from '../ui/contexts/ModalContext';

interface VoucherDetails extends EventType {
  reservationFee: number;
  remainingReservationFee: number;
  remainingBalance: number;
  durationHours: number;
  totalPaid: number;
  isFullyPaid: boolean;
}

export const useVoucherViewModel = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const [searchParams] = useSearchParams();
  const { showAlert } = useModalContext();
  const overrideName = searchParams.get('name');
  const [voucher, setVoucher] = useState<VoucherDetails | null>(null);
  const [companyData, setCompanyData] = useState<CompanyData | null>(null);
  const [voucherTerms, setVoucherTerms] = useState<VoucherTerms | null>(null);
  const [watermark, setWatermark] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!eventId) {
      setError('ID do evento não fornecido.');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    const companyRepo = CompanyDataRepository.getInstance();
    const termsRepo = VoucherTermsRepository.getInstance();
    const appearanceRepo = VoucherAppearanceRepository.getInstance();

    // Ensure listeners are started (important for unauthenticated users)
    companyRepo.initialize();
    termsRepo.initialize();
    appearanceRepo.initialize();

    // Trigger loads/seeding
    companyRepo.get();
    termsRepo.get();
    appearanceRepo.get();

    const unsubs: (() => void)[] = [];

    unsubs.push(companyRepo.subscribe((data) => {
      if (data) setCompanyData(data);
    }));

    unsubs.push(termsRepo.subscribe((data) => {
      if (data) setVoucherTerms(data);
    }));

    unsubs.push(appearanceRepo.subscribe((data) => {
      if (data) setWatermark(data.watermarkImage);
    }));

    let currentEvent: EventType | undefined;
    let currentPayments: Payment[] = [];

    const updateVoucherState = () => {
      if (!currentEvent) return;

      const totalPaid = currentPayments.reduce((acc, p) => acc + p.amount, 0);
      const reservationFeePercentage = companyData?.reservationFeePercentage || 30;
      const reservationFee = currentEvent.total * (reservationFeePercentage / 100);

      const displaySignal = Math.max(reservationFee, totalPaid);
      const remainingReservationFee = Math.max(0, reservationFee - totalPaid);
      const remainingBalance = Math.max(0, currentEvent.total - displaySignal);

      const parseTime = (time: string) => {
        const [h, m] = time.split(':').map(Number);
        return h + m / 60;
      };
      const durationHours = parseTime(currentEvent.endTime) - parseTime(currentEvent.startTime);

      setVoucher({
        ...currentEvent,
        client: {
          ...currentEvent.client,
          name: overrideName || currentEvent.client.name
        },
        reservationFee: displaySignal,
        remainingReservationFee,
        remainingBalance,
        durationHours,
        totalPaid,
        isFullyPaid: totalPaid >= currentEvent.total
      });

      if (overrideName || currentEvent.client?.name) {
        document.title = `Voucher - ${overrideName || currentEvent.client.name}`;
      }
      setIsLoading(false);
    };

    unsubs.push(eventRepository.subscribeToId(eventId, (event) => {
      if (event) {
        currentEvent = event;
        updateVoucherState();
      } else {
        setError('Evento não encontrado.');
        setIsLoading(false);
      }
    }));

    unsubs.push(paymentRepository.subscribeToEventPayments(eventId, (payments) => {
      currentPayments = payments;
      updateVoucherState();
    }));

    return () => unsubs.forEach(fn => fn());
  }, [eventId, companyData?.reservationFeePercentage]);

  const handleDownloadPdf = async () => {
    const element = document.getElementById('voucher-content');
    const button = document.getElementById('download-pdf-button');
    if (element && voucher) {
      if (button) button.style.display = 'none';

      try {
        // Dynamic import to avoid loading the heavy PDF library until needed
        // @ts-ignore - html2pdf might not have types in some environments
        const html2pdf = (await import('html2pdf.js')).default;

        const opt = {
          margin: 0.5,
          filename: `voucher-${voucher.client.name.replace(/\s+/g, '-')}-${voucher.id}.pdf`,
          image: { type: 'jpeg' as const, quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true },
          jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' as const }
        };

        await html2pdf().from(element).set(opt).save();
      } catch (err) {
        console.error('Erro ao gerar PDF:', err);
        await showAlert('Erro', 'Ocorreu um erro ao gerar o PDF. Por favor, tente novamente.');
      } finally {
        if (button) button.style.display = 'flex';
      }
    }
  };

  return {
    voucher,
    companyData,
    voucherTerms,
    watermark,
    isLoading,
    error,
    handleDownloadPdf,
  };
};
