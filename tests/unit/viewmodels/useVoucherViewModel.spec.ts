import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useVoucherViewModel } from '@/viewmodels/useVoucherViewModel';

const mocks = vi.hoisted(() => ({
  eventId: 'event-1' as string | undefined,
  overrideName: null as string | null,
  snapshotListener: undefined as ((data: any) => void) | undefined,
  getByEventId: vi.fn(),
  subscribeToEvent: vi.fn(),
  showAlert: vi.fn(),
  html2pdfFrom: vi.fn(),
  html2pdfSet: vi.fn(),
  html2pdfSave: vi.fn()
}));

vi.mock('react-router-dom', () => ({
  useParams: () => ({ eventId: mocks.eventId }),
  useSearchParams: () => [
    {
      get: (key: string) => (key === 'name' ? mocks.overrideName : null)
    }
  ]
}));

vi.mock('@/ui/contexts/modal/useModal', () => ({
  useModal: () => ({
    showAlert: mocks.showAlert
  })
}));

vi.mock('@/core/repositories/PublicVoucherRepository', () => ({
  PublicVoucherRepository: {
    getInstance: () => ({
      getByEventId: mocks.getByEventId,
      subscribeToEvent: mocks.subscribeToEvent
    })
  }
}));

vi.mock('html2pdf.js', () => ({
  default: vi.fn(() => ({
    from: mocks.html2pdfFrom
  }))
}));

const buildSnapshot = (overrides: Record<string, unknown> = {}) => ({
  id: 'event-1',
  event: {
    id: 'event-1',
    date: '2026-04-07',
    startTime: '09:00',
    endTime: '11:30',
    status: 'SCHEDULED',
    paymentStatus: 'PENDING',
    boat: { id: 'boat-1', name: 'Alpha', capacity: 10, size: 30, pricePerHour: 100, pricePerHalfHour: 50, organizationTimeMinutes: 15 },
    boardingLocation: { id: 'loc-1', name: 'Pier' },
    tourType: { id: 'tour-1', name: 'Passeio', color: '#000000' },
    products: [],
    client: { id: 'client-1', name: 'Cliente Original', phone: '', totalTrips: 0 },
    passengerCount: 4,
    subtotal: 1000,
    total: 1000
  },
  companyData: {
    id: 'company-1',
    appName: 'ERP Speedboat',
    cnpj: '00.000.000/0001-00',
    phone: '11999999999',
    reservationFeePercentage: 30
  },
  voucherTerms: {
    id: 'terms-1',
    terms: 'Regras do voucher'
  },
  watermarkImageUrl: 'https://cdn.example.com/watermark.png',
  payments: [
    { id: 'payment-1', eventId: 'event-1', amount: 100, method: 'PIX', type: 'DOWN_PAYMENT', date: '2026-04-01', timestamp: 1 },
    { id: 'payment-2', eventId: 'event-1', amount: 50, method: 'PIX', type: 'BALANCE', date: '2026-04-02', timestamp: 2 }
  ],
  updatedAt: Date.now(),
  ...overrides
});

describe('useVoucherViewModel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.eventId = 'event-1';
    mocks.overrideName = null;
    mocks.snapshotListener = undefined;
    mocks.getByEventId.mockResolvedValue(buildSnapshot());
    mocks.subscribeToEvent.mockImplementation((_eventId, callback) => {
      mocks.snapshotListener = callback;
      return vi.fn();
    });
    mocks.html2pdfSave.mockResolvedValue(undefined);
    mocks.html2pdfSet.mockReturnValue({ save: mocks.html2pdfSave });
    mocks.html2pdfFrom.mockReturnValue({ set: mocks.html2pdfSet });
    document.body.innerHTML = '';
    document.title = '';
  });

  it('importa o hook corretamente', () => {
    expect(typeof useVoucherViewModel).toBe('function');
  });

  it('define erro quando a rota nao traz um eventId', async () => {
    mocks.eventId = undefined;

    const { result } = renderHook(() => useVoucherViewModel());

    await waitFor(() => {
      expect(result.current.error).toBe('ID do evento nao fornecido.');
      expect(result.current.isLoading).toBe(false);
    });
  });

  it('carrega voucher publico, aplica override de nome e calcula totais', async () => {
    mocks.overrideName = 'Cliente VIP';
    const { result } = renderHook(() => useVoucherViewModel());

    await waitFor(() => {
      expect(mocks.snapshotListener).toBeTypeOf('function');
    });

    act(() => {
      mocks.snapshotListener?.(buildSnapshot());
    });

    await waitFor(() => {
      expect(result.current.voucher?.id).toBe('event-1');
      expect(result.current.voucher?.client.name).toBe('Cliente VIP');
      expect(result.current.voucher?.totalPaid).toBe(150);
      expect(result.current.voucher?.reservationFee).toBe(300);
      expect(result.current.voucher?.remainingReservationFee).toBe(150);
      expect(result.current.voucher?.remainingBalance).toBe(850);
      expect(result.current.voucher?.durationHours).toBe(2.5);
      expect(result.current.companyData?.appName).toBe('ERP Speedboat');
      expect(result.current.voucherTerms?.terms).toBe('Regras do voucher');
      expect(result.current.watermark).toBe('https://cdn.example.com/watermark.png');
      expect(result.current.error).toBeNull();
      expect(result.current.isLoading).toBe(false);
    });

    expect(document.title).toBe('Voucher - Cliente VIP');
  });

  it('explicita erro quando o snapshot publico ainda esta incompleto', async () => {
    const { result } = renderHook(() => useVoucherViewModel());

    await waitFor(() => {
      expect(mocks.snapshotListener).toBeTypeOf('function');
    });

    act(() => {
      mocks.snapshotListener?.(buildSnapshot({
        companyData: null,
        voucherTerms: null
      }));
    });

    await waitFor(() => {
      expect(result.current.voucher?.id).toBe('event-1');
      expect(result.current.error).toBe('A configuracao publica do voucher ainda nao foi concluida.');
      expect(result.current.isLoading).toBe(false);
    });
  });

  it('mostra erro quando o voucher publico nao existe', async () => {
    mocks.getByEventId.mockResolvedValue(null);

    const { result } = renderHook(() => useVoucherViewModel());

    await waitFor(() => {
      expect(result.current.error).toBe('Voucher publico nao encontrado.');
      expect(result.current.isLoading).toBe(false);
    });
  });

  it('gera o PDF quando o voucher ja esta carregado', async () => {
    const { result } = renderHook(() => useVoucherViewModel());

    await waitFor(() => {
      expect(mocks.snapshotListener).toBeTypeOf('function');
    });

    act(() => {
      mocks.snapshotListener?.(buildSnapshot());
    });

    await waitFor(() => {
      expect(result.current.voucher?.id).toBe('event-1');
    });

    document.body.innerHTML = `
      <div id="voucher-content"></div>
      <button id="download-pdf-button"></button>
    `;

    await act(async () => {
      await result.current.handleDownloadPdf();
    });

    expect(mocks.html2pdfFrom).toHaveBeenCalledWith(document.getElementById('voucher-content'));
    expect(mocks.html2pdfSet).toHaveBeenCalled();
    expect(mocks.html2pdfSave).toHaveBeenCalled();
  });
});
