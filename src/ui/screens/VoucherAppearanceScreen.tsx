import React, { useState, useCallback } from 'react';
import { useVoucherAppearanceViewModel } from '../../viewmodels/VoucherAppearanceViewModel';
import { useToast } from '../contexts/toast/useToast';
import { ImageIcon, Link2, Trash2 } from 'lucide-react';

export const VoucherAppearanceScreen: React.FC = () => {
  const { appearanceData, isLoading, error, hasLegacyBase64Watermark, updateWatermarkUrl, clearWatermark } = useVoucherAppearanceViewModel();
  const { showToast } = useToast();
  const [preview, setPreview] = useState<string | null>(null);
  const [watermarkUrl, setWatermarkUrl] = useState('');

  React.useEffect(() => {
    setWatermarkUrl(appearanceData?.watermarkImageUrl || '');
  }, [appearanceData?.watermarkImageUrl]);

  const handleSave = useCallback(async () => {
    try {
      const newImage = await updateWatermarkUrl(watermarkUrl);
      setPreview(newImage);
      showToast('Marca d\'agua atualizada com sucesso!');
    } catch (saveError) {
      showToast(saveError instanceof Error ? saveError.message : 'Erro ao atualizar a marca d\'agua.');
    }
  }, [showToast, updateWatermarkUrl, watermarkUrl]);

  const handleClear = useCallback(async () => {
    try {
      await clearWatermark();
      setPreview(null);
      setWatermarkUrl('');
      showToast('Marca d\'agua removida com sucesso!');
    } catch {
      showToast('Erro ao remover a marca d\'agua.');
    }
  }, [clearWatermark, showToast]);

  if (isLoading) {
    return <div className="p-6">Carregando...</div>;
  }

  const currentWatermark = preview || appearanceData?.watermarkImageUrl || appearanceData?.watermarkImageBase64 || null;

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <div className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2 text-gray-800">Aparencia do Voucher</h1>
          <p className="text-sm text-gray-500">
            Para manter o projeto compativel com Firebase free-only, a marca d'agua usa apenas URL publica ou caminho estatico da aplicacao.
          </p>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {hasLegacyBase64Watermark && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Existe uma marca d'agua legada em base64. Salve uma URL publica para concluir a migracao.
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-4">
            <label htmlFor="watermark-url" className="block text-sm font-medium text-gray-700">
              URL publica da marca d'agua
            </label>
            <div className="flex items-center rounded-xl border border-gray-300 px-3 focus-within:ring-2 focus-within:ring-blue-500">
              <Link2 className="h-4 w-4 text-gray-400" />
              <input
                id="watermark-url"
                type="text"
                value={watermarkUrl}
                onChange={(e) => setWatermarkUrl(e.target.value)}
                placeholder="https://exemplo.com/watermark.png ou /images/watermark.svg"
                className="w-full border-0 bg-transparent px-3 py-3 outline-none"
              />
            </div>
            <p className="text-xs text-gray-500">
              Aceita `http://`, `https://` ou caminhos relativos da propria aplicacao como `/assets/watermark.svg`.
            </p>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleSave}
                className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white transition-colors hover:bg-blue-700"
              >
                Salvar URL
              </button>
              <button
                type="button"
                onClick={handleClear}
                className="inline-flex items-center rounded-xl border border-gray-300 px-5 py-3 font-semibold text-gray-700 transition-colors hover:bg-gray-50"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Remover
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-6">
            <p className="mb-4 text-sm font-medium text-gray-700">Pre-visualizacao</p>
            <div className="flex min-h-[260px] items-center justify-center rounded-xl bg-white p-4 shadow-sm">
              {currentWatermark ? (
                <img
                  src={currentWatermark}
                  alt="Preview da marca d'agua"
                  className="mx-auto h-48 w-auto object-contain opacity-80"
                />
              ) : (
                <div className="text-center text-gray-400">
                  <ImageIcon className="mx-auto mb-3 h-12 w-12" />
                  <p className="text-sm">Nenhuma marca d'agua configurada.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
