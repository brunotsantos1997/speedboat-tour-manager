// src/ui/screens/VoucherAppearanceScreen.tsx
import React, { useState, useCallback } from 'react';
import { useVoucherAppearanceViewModel } from '../../viewmodels/VoucherAppearanceViewModel';
import { useToastContext } from '../contexts/ToastContext';
import { UploadCloud } from 'lucide-react';

export const VoucherAppearanceScreen: React.FC = () => {
  const { appearanceData, isLoading, error, updateWatermark } = useVoucherAppearanceViewModel();
  const { showToast } = useToastContext();
  const [preview, setPreview] = useState<string | null>(null);

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        try {
          const newImage = await updateWatermark(file);
          if (newImage) {
            setPreview(newImage);
          }
          showToast('Marca d\'água atualizada com sucesso!');
        } catch (err) {
          showToast('Erro ao atualizar a marca d\'água.');
        }
      }
    },
    [updateWatermark, showToast]
  );

  if (isLoading) {
    return <div className="p-6">Carregando...</div>;
  }

  if (error) {
    return <div className="p-6 text-red-500">{error}</div>;
  }

  const currentWatermark = preview || appearanceData?.watermarkImage;

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <div className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow">
        <h1 className="text-3xl font-bold mb-6 text-gray-800">Aparência do Voucher</h1>

        <div className="space-y-6">
          <div>
            <label className="block text-lg font-medium text-gray-700 mb-2">
              Marca d'Água
            </label>
            <div className="mt-2 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
              <div className="space-y-1 text-center">
                {currentWatermark ? (
                  <img
                    src={currentWatermark}
                    alt="Pré-visualização da marca d'água"
                    className="mx-auto h-48 w-auto object-contain"
                  />
                ) : (
                  <UploadCloud className="mx-auto h-12 w-12 text-gray-400" />
                )}
                <div className="flex text-sm text-gray-600">
                  <label
                    htmlFor="file-upload"
                    className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                  >
                    <span>Carregar um arquivo</span>
                    <input
                      id="file-upload"
                      name="file-upload"
                      type="file"
                      className="sr-only"
                      accept="image/*"
                      onChange={handleFileChange}
                    />
                  </label>
                  <p className="pl-1">ou arraste e solte</p>
                </div>
                <p className="text-xs text-gray-500">PNG, JPG, GIF até 10MB</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
