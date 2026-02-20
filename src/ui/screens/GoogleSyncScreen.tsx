import React, { useState, useEffect } from 'react';
import { Calendar, RefreshCw, CheckCircle, AlertCircle, ExternalLink, Link, Unlink } from 'lucide-react';
import { useGoogleSyncViewModel } from '../../viewmodels/useGoogleSyncViewModel';
import { useNavigate } from 'react-router-dom';
import { Tutorial } from '../components/Tutorial';
import { googleSyncSteps } from '../tutorials/googleSyncSteps';

export const GoogleSyncScreen: React.FC = () => {
  const navigate = useNavigate();
  const {
    currentUser,
    calendars,
    isLoading,
    error,
    isGoogleLinked,
    syncProgress,
    saveSettings,
    syncExistingEvents,
    fetchCalendars,
    linkGoogle,
    unlinkGoogle
  } = useGoogleSyncViewModel();

  const [selectedCalendar, setSelectedCalendar] = useState(currentUser?.calendarSettings?.calendarId || '');
  const [autoSync, setAutoSync] = useState(currentUser?.calendarSettings?.autoSync || false);

  useEffect(() => {
    if (currentUser?.calendarSettings) {
      setSelectedCalendar(currentUser.calendarSettings.calendarId || '');
      setAutoSync(currentUser.calendarSettings.autoSync);
    }
  }, [currentUser]);

  const handleSave = async () => {
    await saveSettings(selectedCalendar, autoSync);
  };

  if (!isGoogleLinked) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-md p-8 text-center">
          <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Link className="text-blue-600" size={32} />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Conta Google não vinculada</h2>
          <p className="text-gray-600 mb-6">
            Para sincronizar seus passeios com o Google Calendar, você precisa primeiro vincular sua conta Google.
          </p>
          <button
            onClick={() => navigate('/dashboard/profile')}
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
          >
            Vincular no Perfil
            <ExternalLink size={18} className="ml-2" />
          </button>
        </div>
      </div>
    );
  }

  const handleUnlink = async () => {
    if (window.confirm('Tem certeza que deseja desvincular sua conta Google? Isso desativará a sincronização automática.')) {
      try {
        await unlinkGoogle();
      } catch (err: any) {
        console.error(err);
      }
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <Tutorial tourId="google-sync" steps={googleSyncSteps} />
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center">
          <Calendar className="mr-3 text-blue-600" />
          Sincronização com Google Calendar
        </h1>
        <button
          onClick={handleUnlink}
          className="flex items-center text-sm font-medium text-red-600 hover:text-red-700 bg-red-50 px-3 py-2 rounded-lg border border-red-100 transition-colors"
        >
          <Unlink size={16} className="mr-2" />
          Desvincular Conta Google
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded flex items-center">
          <AlertCircle className="text-red-500 mr-3 flex-shrink-0" />
          <p className="text-red-700">{error}</p>
          <button
            onClick={async () => {
              if (error.includes('expirada')) {
                try {
                  await linkGoogle();
                } catch (err) {
                  console.error('Failed to relink Google:', err);
                }
              } else {
                fetchCalendars();
              }
            }}
            className="ml-auto text-red-700 hover:underline text-sm font-semibold"
          >
            Tentar novamente
          </button>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="p-6 space-y-6">
          <section data-tour="google-calendar-select">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Selecione o Calendário
            </label>
            <select
              value={selectedCalendar}
              onChange={(e) => setSelectedCalendar(e.target.value)}
              disabled={isLoading || calendars.length === 0}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-100"
            >
              <option value="">Selecione um calendário...</option>
              {calendars.map((cal) => (
                <option key={cal.id} value={cal.id}>
                  {cal.summary} {cal.primary ? '(Principal)' : ''}
                </option>
              ))}
            </select>
            {calendars.length === 0 && !isLoading && !error && (
              <div className="mt-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <p className="text-sm text-yellow-700 flex items-start mb-3">
                  <AlertCircle size={18} className="mr-2 flex-shrink-0 mt-0.5" />
                  <span>
                    Nenhum calendário encontrado. Isso geralmente acontece se você não marcou as "caixinhas" de permissão do Google Calendar durante o login.
                  </span>
                </p>
                <button
                  onClick={async () => {
                    try {
                      await linkGoogle();
                      await fetchCalendars();
                    } catch (err: any) {
                      console.error(err);
                    }
                  }}
                  className="text-sm bg-yellow-600 text-white px-4 py-2 rounded font-semibold hover:bg-yellow-700 transition-colors"
                >
                  Atualizar Permissões do Google
                </button>
              </div>
            )}
          </section>

          <section className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200" data-tour="google-auto-sync">
            <div>
              <h3 className="font-semibold text-gray-800">Auto Sincronização</h3>
              <p className="text-sm text-gray-600">Atualizar automaticamente na agenda ao criar ou editar um passeio.</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={autoSync}
                onChange={(e) => setAutoSync(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </section>

          <div className="pt-4 flex flex-col sm:flex-row gap-4">
            <button
              onClick={handleSave}
              data-tour="btn-save-google-settings"
              disabled={isLoading || !selectedCalendar}
              className="flex-1 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-300 flex items-center justify-center"
            >
              {isLoading && !syncProgress ? (
                <RefreshCw className="animate-spin mr-2" size={20} />
              ) : (
                <CheckCircle className="mr-2" size={20} />
              )}
              Salvar Configurações
            </button>

            <button
              onClick={syncExistingEvents}
              data-tour="btn-sync-existing"
              disabled={isLoading || !currentUser?.calendarSettings?.calendarId}
              className="flex-1 px-6 py-3 border-2 border-blue-600 text-blue-600 font-semibold rounded-lg hover:bg-blue-50 transition-colors disabled:border-blue-200 disabled:text-blue-200 flex items-center justify-center"
            >
              {syncProgress ? (
                <RefreshCw className="animate-spin mr-2" size={20} />
              ) : (
                <RefreshCw className="mr-2" size={20} />
              )}
              Sincronizar Passeios Existentes
            </button>
          </div>
        </div>

        {syncProgress && (
          <div className="px-6 pb-6">
            <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
              <div
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${(syncProgress.current / syncProgress.total) * 100}%` }}
              ></div>
            </div>
            <p className="text-sm text-center text-gray-600 font-medium">
              Sincronizando: {syncProgress.current} de {syncProgress.total} passeios...
            </p>
          </div>
        )}
      </div>

      <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
        <h4 className="font-semibold text-blue-800 flex items-center mb-2">
          <AlertCircle size={18} className="mr-2" />
          Informações Importantes
        </h4>
        <ul className="text-sm text-blue-700 list-disc list-inside space-y-1">
          <li>A sincronização é feita para o calendário selecionado.</li>
          <li>Qualquer alteração feita no sistema será refletida no Google Calendar se a auto sincronização estiver ativa.</li>
          <li>Se você trocar de calendário, os eventos já sincronizados no calendário anterior permanecerão lá.</li>
          <li>A exclusão de um passeio no sistema também removerá o evento do Google Calendar.</li>
        </ul>
      </div>
    </div>
  );
};
