import React, { useState, useEffect } from 'react';
import { 
  Languages, 
  Check, 
  AlertCircle, 
  Star, 
  Loader2, 
  ShieldAlert, 
  RefreshCw,
  Globe2,
  Sparkles,
  Info
} from 'lucide-react';
import { api } from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';

export function LanguageManagementCard() {
  const { t, refreshLanguages } = useLanguage();
  const [languages, setLanguages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingCode, setUpdatingCode] = useState(null);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const showSuccess = (msg) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 3500);
  };

  const loadLanguages = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getAdminLanguages();
      setLanguages(data || []);
    } catch (err) {
      console.error('Fehler beim Laden der Sprachen:', err);
      setError(err.message || 'Fehler beim Laden der Sprachkonfigurationen.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLanguages();
  }, []);

  const handleToggle = async (lang) => {
    if (lang.is_default && lang.is_active) {
      setError(`Die Standardsprache „${lang.name}“ kann nicht deaktiviert werden. Bitte wählen Sie zuerst eine andere Sprache als Standard.`);
      return;
    }

    try {
      setUpdatingCode(lang.code);
      setError(null);
      const newStatus = !lang.is_active;
      await api.toggleLanguage(lang.code, newStatus);
      
      // Update local list
      setLanguages((prev) =>
        prev.map((l) => (l.code === lang.code ? { ...l, is_active: newStatus } : l))
      );

      // Refresh global context
      await refreshLanguages();

      showSuccess(`Sprache „${lang.name}“ wurde ${newStatus ? 'aktiviert' : 'deaktiviert'}.`);
    } catch (err) {
      console.error('Fehler beim Umschalten der Sprache:', err);
      setError(err.message || 'Aktion fehlgeschlagen.');
    } finally {
      setUpdatingCode(null);
    }
  };

  const handleSetDefault = async (lang) => {
    if (lang.is_default) return;

    try {
      setUpdatingCode(lang.code);
      setError(null);
      await api.setDefaultLanguage(lang.code);

      // Update local state
      setLanguages((prev) =>
        prev.map((l) => ({
          ...l,
          is_default: l.code === lang.code,
          is_active: l.code === lang.code ? true : l.is_active,
        }))
      );

      // Refresh global context
      await refreshLanguages();

      showSuccess(`„${lang.name}“ wurde als neue Standardsprache festgelegt.`);
    } catch (err) {
      console.error('Fehler beim Setzen der Standardsprache:', err);
      setError(err.message || 'Fehler beim Festlegen der Standardsprache.');
    } finally {
      setUpdatingCode(null);
    }
  };

  const activeCount = languages.filter((l) => l.is_active).length;

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-card space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-2xl bg-indigo-50 text-indigo-600">
            <Languages className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                Verfügbare System-Sprachen (i18n)
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                {activeCount} / {languages.length} Aktiv
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Steuern Sie, welche Sprachen im Sprachumschalter für alle Mitarbeiter zur Verfügung stehen.
            </p>
          </div>
        </div>

        <button
          onClick={loadLanguages}
          disabled={loading}
          className="self-start sm:self-auto p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          title="Aktualisieren"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Info Alert */}
      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs text-slate-600 flex items-start space-x-3">
        <Info className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          Deaktivierte Sprachen werden im Sprachwähler in der Sidebar, der Navbar und auf der Login-Seite sofort ausgeblendet. Falls ein Mitarbeiter eine deaktivierte Sprache gewählt hatte, wechselt die Anwendung automatisch auf die <strong>Standardsprache</strong>.
        </p>
      </div>

      {/* Success Notification */}
      {successMessage && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center space-x-2 animate-fade-in">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center space-x-2 animate-fade-in">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Language List / Grid */}
      {loading ? (
        <div className="py-12 text-center space-y-2">
          <Loader2 className="w-7 h-7 text-indigo-600 animate-spin mx-auto" />
          <p className="text-xs text-slate-400 font-medium">Sprachen werden geladen...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {languages.map((lang) => {
            const isUpdating = updatingCode === lang.code;

            return (
              <div
                key={lang.code}
                className={`p-4 sm:p-5 rounded-2xl border transition-all duration-200 flex items-center justify-between gap-4 ${
                  lang.is_active
                    ? 'bg-white border-slate-200/90 shadow-2xs hover:border-indigo-200'
                    : 'bg-slate-50/70 border-slate-200/50 opacity-70'
                }`}
              >
                {/* Language Info */}
                <div className="flex items-center space-x-3.5 min-w-0">
                  <div className="w-11 h-11 rounded-2xl bg-slate-100 flex items-center justify-center text-2xl shadow-inner shrink-0">
                    {lang.flag}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center space-x-2 flex-wrap">
                      <h3 className="text-sm font-bold text-slate-900 truncate">
                        {lang.name}
                      </h3>

                      {lang.is_default && (
                        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          <Star className="w-2.5 h-2.5 fill-current" />
                          <span>Standard</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center space-x-2 mt-0.5 text-xs text-slate-400">
                      <span className="font-medium text-slate-600">{lang.native_name}</span>
                      <span>•</span>
                      <span className="font-mono text-[11px] uppercase bg-slate-100 px-1.5 py-0.2 rounded text-slate-500">
                        {lang.code} ({lang.locale})
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions: Set Default & Toggle Switch */}
                <div className="flex items-center space-x-3 shrink-0">
                  {/* Set Default Button */}
                  {!lang.is_default && lang.is_active && (
                    <button
                      onClick={() => handleSetDefault(lang)}
                      disabled={isUpdating}
                      title="Als Standard-Systemsprache festlegen"
                      className="p-2 rounded-xl text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                    >
                      <Star className="w-4 h-4" />
                    </button>
                  )}

                  {/* Toggle Switch */}
                  <div className="flex items-center space-x-2">
                    <span className={`text-[11px] font-bold ${lang.is_active ? 'text-emerald-600' : 'text-slate-400'}`}>
                      {lang.is_active ? 'Aktiv' : 'Inaktiv'}
                    </span>

                    <button
                      type="button"
                      disabled={isUpdating || (lang.is_default && lang.is_active)}
                      onClick={() => handleToggle(lang)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed ${
                        lang.is_active ? 'bg-indigo-600' : 'bg-slate-300'
                      }`}
                      title={lang.is_default ? 'Standardsprache kann nicht deaktiviert werden' : undefined}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out flex items-center justify-center ${
                          lang.is_active ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      >
                        {isUpdating && <Loader2 className="w-3 h-3 text-indigo-600 animate-spin" />}
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
