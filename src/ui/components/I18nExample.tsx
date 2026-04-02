import { useLanguage } from '../hooks/useLanguage';
import { LanguageSelector } from './LanguageSelector';

export function I18nExample() {
  const { t, formatCurrency, formatDate, currentLanguage } = useLanguage();

  const exampleDate = new Date();
  const exampleAmount = 1500.50;

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          {t('common.settings')}
        </h2>
        <LanguageSelector />
      </div>

      <div className="space-y-4">
        <div className="border-b pb-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            {t('dashboard.title')}
          </h3>
          <p className="text-gray-600">
            {t('dashboard.welcome')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gray-50 p-4 rounded">
            <h4 className="font-medium text-gray-700 mb-2">
              {t('finance.title')}
            </h4>
            <div className="space-y-2">
              <div>
                <span className="text-sm text-gray-500">{t('finance.revenue')}: </span>
                <span className="font-semibold text-green-600">
                  {formatCurrency(exampleAmount)}
                </span>
              </div>
              <div>
                <span className="text-sm text-gray-500">{t('common.date')}: </span>
                <span className="font-medium">
                  {formatDate(exampleDate)}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded">
            <h4 className="font-medium text-gray-700 mb-2">
              {t('events.title')}
            </h4>
            <div className="space-y-2">
              <div>
                <span className="text-sm text-gray-500">{t('events.status')}: </span>
                <span className="font-medium text-blue-600">
                  {t('events.status.scheduled')}
                </span>
              </div>
              <div>
                <span className="text-sm text-gray-500">{t('events.client')}: </span>
                <span className="font-medium">
                  {t('clients.newClient')}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 p-4 rounded">
          <h4 className="font-medium text-blue-800 mb-2">
            {t('messages.info')}
          </h4>
          <p className="text-blue-700 text-sm">
            {t('messages.success')} - {t('languages.' + currentLanguage)}
          </p>
        </div>

        <div className="flex justify-between items-center pt-4 border-t">
          <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors">
            {t('common.save')}
          </button>
          <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors">
            {t('common.cancel')}
          </button>
        </div>
      </div>
    </div>
  );
}
