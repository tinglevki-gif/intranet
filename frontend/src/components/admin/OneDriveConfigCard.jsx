import React, { useState, useEffect } from 'react';
import { 
  Cloud, 
  FolderOpen, 
  ExternalLink, 
  Save, 
  RotateCcw, 
  Check, 
  AlertCircle, 
  Loader2, 
  Link2,
  Sparkles,
  HelpCircle
} from 'lucide-react';
import { api } from '../../services/api';

export function OneDriveConfigCard() {
  const [vertriebUrl, setVertriebUrl] = useState('');
  const [defaultVertriebUrl, setDefaultVertriebUrl] = useState('');
  const [technikUrl, setTechnikUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState(null);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const showSuccess = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3500);
  };

  const loadSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      const settings = await api.getAdminSettings();
      const vertriebSetting = settings.find((s) => s.key === 'onedrive_vertrieb_url');
      if (vertriebSetting) {
        setVertriebUrl(vertriebSetting.value);
        setDefaultVertriebUrl(vertriebSetting.default_value);
      }
      const technikSetting = settings.find((s) => s.key === 'onedrive_technik_url');
      if (technikSetting) {
        setTechnikUrl(technikSetting.value);
      }
    } catch (err) {
      console.error('Fehler beim Laden der Integrationseinstellungen:', err);
      setError(err.message || 'Einstellungen konnten nicht geladen werden.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleSave = async (key, value) => {
    if (!value.trim()) {
      setError('Die URL darf nicht leer sein.');
      return;
    }

    try {
      setSavingKey(key);
      setError(null);
      await api.updateSetting(key, value.trim());
      showSuccess('OneDrive / SharePoint Ziel-URL wurde erfolgreich aktualisiert.');
    } catch (err) {
      console.error('Fehler beim Speichern der URL:', err);
      setError(err.message || 'Speichern fehlgeschlagen.');
    } finally {
      setSavingKey(null);
    }
  };

  const handleReset = async (key) => {
    try {
      setSavingKey(key);
      setError(null);
      const res = await api.resetSetting(key);
      if (key === 'onedrive_vertrieb_url') {
        setVertriebUrl(res.value);
      } else if (key === 'onedrive_technik_url') {
        setTechnikUrl(res.value);
      }
      showSuccess('Einstellung wurde auf den System-Standardwert zurückgesetzt.');
    } catch (err) {
      console.error('Fehler beim Zurücksetzen:', err);
      setError(err.message || 'Zurücksetzen fehlgeschlagen.');
    } finally {
      setSavingKey(null);
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-card space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-2xl bg-indigo-50 text-indigo-600">
            <Cloud className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                Microsoft OneDrive &amp; SharePoint Integrationen
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                Live Aktiv
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Konfigurieren Sie direkte Speicher- und Ordnerverknüpfungen für Fachabteilungen (z. B. Vertrieb, Technik).
            </p>
          </div>
        </div>
      </div>

      {/* Success Notification */}
      {successMsg && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center space-x-2 animate-fade-in">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center space-x-2 animate-fade-in">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="py-8 text-center space-y-2">
          <Loader2 className="w-6 h-6 text-indigo-600 animate-spin mx-auto" />
          <p className="text-xs text-slate-400 font-medium">Lade OneDrive-Konfigurationen...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* 1. Vertriebs-Ordner Konfiguration */}
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center space-x-2.5">
                <FolderOpen className="w-4 h-4 text-indigo-600 shrink-0" />
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                  Modul: Vertrieb &amp; Kalkulation
                </span>
              </div>
              <span className="text-[11px] text-slate-400 font-mono">
                Key: onedrive_vertrieb_url
              </span>
            </div>

            <p className="text-xs text-slate-600">
              Ziel-URL des Microsoft OneDrive / SharePoint-Ordners für Kundenangebote, Leistungsverzeichnisse und Vertriebsunterlagen:
            </p>

            <div className="space-y-3">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Link2 className="w-4 h-4 text-slate-400" />
                </div>
                <input
                  type="url"
                  value={vertriebUrl}
                  onChange={(e) => setVertriebUrl(e.target.value)}
                  placeholder="https://company-my.sharepoint.com/personal/.../Documents/..."
                  className="w-full pl-10 pr-4 py-2.5 bg-white rounded-xl border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono transition-all shadow-2xs"
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleSave('onedrive_vertrieb_url', vertriebUrl)}
                    disabled={savingKey === 'onedrive_vertrieb_url'}
                    className="inline-flex items-center space-x-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-500/20 disabled:opacity-50"
                  >
                    {savingKey === 'onedrive_vertrieb_url' ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Save className="w-3.5 h-3.5" />
                    )}
                    <span>Speichern</span>
                  </button>

                  <a
                    href={vertriebUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold border border-slate-200 transition-colors shadow-2xs"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                    <span>Link testen</span>
                  </a>
                </div>

                {vertriebUrl !== defaultVertriebUrl && (
                  <button
                    onClick={() => handleReset('onedrive_vertrieb_url')}
                    disabled={savingKey === 'onedrive_vertrieb_url'}
                    className="inline-flex items-center space-x-1 px-3 py-1.5 text-xs text-slate-500 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Standard wiederherstellen</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
