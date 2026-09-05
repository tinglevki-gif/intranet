import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Sparkles, 
  SlidersHorizontal, 
  Save, 
  RotateCcw, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Eye, 
  Layers, 
  MessageSquare, 
  CalendarDays, 
  Wrench, 
  Activity,
  X
} from 'lucide-react';
import { api } from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';

export function DashboardConfigCard({ onSaved, isModal = false, onClose }) {
  const { t } = useLanguage();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Form State
  const [defaultMode, setDefaultMode] = useState('standard');
  const [showHeroGreeting, setShowHeroGreeting] = useState(true);
  const [customMotto, setCustomMotto] = useState('TINGLEV ELEMENTFABRIK • DIGITALER ARBEITSPLATZ');
  const [showQuickModules, setShowQuickModules] = useState(true);
  const [quickModulesStyle, setQuickModulesStyle] = useState('pills');
  const [showKpiMetrics, setShowKpiMetrics] = useState(true);
  const [showAnnouncements, setShowAnnouncements] = useState(true);
  const [announcementsLimit, setAnnouncementsLimit] = useState(3);
  const [showQuickTools, setShowQuickTools] = useState(true);
  const [showEvents, setShowEvents] = useState(true);
  const [eventsLimit, setEventsLimit] = useState(3);

  const loadConfig = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const res = await api.getDashboardConfig();
      if (res) {
        setDefaultMode(res.default_mode || 'standard');
        setShowHeroGreeting(res.show_hero_greeting !== false);
        setCustomMotto(res.custom_motto || 'TINGLEV ELEMENTFABRIK • DIGITALER ARBEITSPLATZ');
        setShowQuickModules(res.show_quick_modules !== false);
        setQuickModulesStyle(res.quick_modules_style || 'pills');
        setShowKpiMetrics(res.show_kpi_metrics !== false);
        setShowAnnouncements(res.show_announcements !== false);
        setAnnouncementsLimit(res.announcements_limit || 3);
        setShowQuickTools(res.show_quick_tools !== false);
        setShowEvents(res.show_events !== false);
        setEventsLimit(res.events_limit || 3);
      }
    } catch (err) {
      console.error('Fehler beim Laden der Dashboard-Konfiguration:', err);
      setErrorMsg(err.message || 'Konfiguration konnte nicht geladen werden.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConfig();
  }, []);

  const handleSave = async (e) => {
    e?.preventDefault?.();
    setSaving(true);
    setErrorMsg('');
    try {
      const payload = {
        default_mode: defaultMode,
        show_hero_greeting: showHeroGreeting,
        custom_motto: customMotto.trim(),
        show_quick_modules: showQuickModules,
        quick_modules_style: quickModulesStyle,
        show_kpi_metrics: showKpiMetrics,
        show_announcements: showAnnouncements,
        announcements_limit: Number(announcementsLimit) || 3,
        show_quick_tools: showQuickTools,
        show_events: showEvents,
        events_limit: Number(eventsLimit) || 3,
      };

      const updated = await api.updateDashboardConfig(payload);
      setSuccessMsg(t('dashboard_config.toast_saved', 'Minimal-Dashboard Konfiguration erfolgreich gespeichert!'));
      setTimeout(() => setSuccessMsg(''), 3500);
      onSaved?.(updated);
    } catch (err) {
      console.error('Fehler beim Speichern:', err);
      setErrorMsg(err.message || 'Speichern der Konfiguration fehlgeschlagen.');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!window.confirm('Möchten Sie die Minimal-Dashboard Konfiguration wirklich auf die Standard-Werkseinstellungen zurücksetzen?')) {
      return;
    }

    setSaving(true);
    setErrorMsg('');
    try {
      const res = await api.resetDashboardConfig();
      setDefaultMode(res.default_mode || 'standard');
      setShowHeroGreeting(res.show_hero_greeting !== false);
      setCustomMotto(res.custom_motto || 'TINGLEV ELEMENTFABRIK • DIGITALER ARBEITSPLATZ');
      setShowQuickModules(res.show_quick_modules !== false);
      setQuickModulesStyle(res.quick_modules_style || 'pills');
      setShowKpiMetrics(res.show_kpi_metrics !== false);
      setShowAnnouncements(res.show_announcements !== false);
      setAnnouncementsLimit(res.announcements_limit || 3);
      setShowQuickTools(res.show_quick_tools !== false);
      setShowEvents(res.show_events !== false);
      setEventsLimit(res.events_limit || 3);

      setSuccessMsg(t('dashboard_config.toast_reset', 'Standardeinstellungen erfolgreich wiederhergestellt!'));
      setTimeout(() => setSuccessMsg(''), 3500);
      onSaved?.(res);
    } catch (err) {
      setErrorMsg(err.message || 'Zurücksetzen fehlgeschlagen.');
    } finally {
      setSaving(false);
    }
  };

  const content = (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold shadow-xs">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 font-heading">
                {t('dashboard_config.title', 'Minimal-Dashboard Konfiguration')}
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 text-[10px] font-extrabold border border-amber-200 dark:border-amber-800">
                SuperAdmin
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {t('dashboard_config.subtitle', 'Passen Sie die sichtbaren Widgets, Limits und das Standard-Layout der Minimal-Ansicht für alle Mitarbeiter an')}
            </p>
          </div>
        </div>

        {isModal && onClose && (
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors self-start sm:self-auto"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-semibold rounded-2xl flex items-center space-x-2 animate-fade-in shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-200 text-xs font-semibold rounded-2xl flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {loading ? (
        <div className="py-12 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
          <Loader2 className="w-5 h-5 animate-spin text-amber-600" />
          <span>Lade Konfiguration...</span>
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-6">
          {/* 1. Global Default Dashboard Mode */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-3">
            <div className="flex items-center space-x-2">
              <LayoutDashboard className="w-4 h-4 text-tinglev-blue" />
              <label className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                {t('dashboard_config.default_mode_label', 'Standard-Dashboard für neue Benutzer')}
              </label>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <button
                type="button"
                onClick={() => setDefaultMode('standard')}
                className={`p-3.5 rounded-xl border text-left flex items-start space-x-3 transition-all ${
                  defaultMode === 'standard'
                    ? 'bg-white dark:bg-slate-800 border-tinglev-blue ring-2 ring-tinglev-blue/10 shadow-xs'
                    : 'bg-white/60 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                }`}
              >
                <div className="w-4 h-4 rounded-full border-2 border-tinglev-blue flex items-center justify-center mt-0.5 shrink-0">
                  {defaultMode === 'standard' && <div className="w-2 h-2 rounded-full bg-tinglev-blue"></div>}
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block">
                    {t('dashboard_config.mode_standard_opt', 'Standard-Dashboard (Vollständig)')}
                  </span>
                  <span className="text-[11px] text-slate-500 block mt-0.5">
                    Zeigt alle Widgets, vollen Heldenbanner, Metrikkarten und Feeds
                  </span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setDefaultMode('minimal')}
                className={`p-3.5 rounded-xl border text-left flex items-start space-x-3 transition-all ${
                  defaultMode === 'minimal'
                    ? 'bg-white dark:bg-slate-800 border-amber-500 ring-2 ring-amber-500/10 shadow-xs'
                    : 'bg-white/60 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                }`}
              >
                <div className="w-4 h-4 rounded-full border-2 border-amber-500 flex items-center justify-center mt-0.5 shrink-0">
                  {defaultMode === 'minimal' && <div className="w-2 h-2 rounded-full bg-amber-500"></div>}
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block">
                    {t('dashboard_config.mode_minimal_opt', 'Minimal-Dashboard (Kompakt)')}
                  </span>
                  <span className="text-[11px] text-slate-500 block mt-0.5">
                    Startet direkt in der schnellen, fokussierten Minimalansicht
                  </span>
                </div>
              </button>
            </div>
          </div>

          {/* 2. Motto & Custom Greeting Text */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              {t('dashboard_config.custom_motto_label', 'Firmenmotto / Begrüßungstext')}
            </label>
            <input
              type="text"
              value={customMotto}
              onChange={(e) => setCustomMotto(e.target.value)}
              placeholder="z. B. TINGLEV ELEMENTFABRIK • DIGITALER ARBEITSPLATZ"
              className="w-full px-4 py-2.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            />
          </div>

          {/* 3. Widgets Configuration Grid */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
              <Layers className="w-3.5 h-3.5 text-amber-500" />
              <span>{t('dashboard_config.section_widgets', 'Sichtbare Widgets & Komponenten')}</span>
            </label>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {/* Toggle: Compact Greeting Header */}
              <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 flex items-center justify-between">
                <div className="min-w-0 flex-1 pr-3">
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block">
                    Kompakter Begrüßungs-Header
                  </span>
                  <span className="text-[11px] text-slate-500 block">Avatar, Begrüßung, Uhrzeit & Datum</span>
                </div>
                <input
                  type="checkbox"
                  checked={showHeroGreeting}
                  onChange={(e) => setShowHeroGreeting(e.target.checked)}
                  className="w-5 h-5 rounded text-amber-600 focus:ring-amber-500"
                />
              </div>

              {/* Toggle: Quick Modules */}
              <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 flex items-center justify-between">
                <div className="min-w-0 flex-1 pr-3">
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block">
                    Modul-Schnellzugriff (Organigramm, Tel, Dok)
                  </span>
                  <div className="flex items-center space-x-2 mt-1">
                    <select
                      value={quickModulesStyle}
                      onChange={(e) => setQuickModulesStyle(e.target.value)}
                      disabled={!showQuickModules}
                      className="text-[11px] px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold border border-slate-200 dark:border-slate-600"
                    >
                      <option value="pills">Farbige Pills</option>
                      <option value="cards">Mini-Karten</option>
                    </select>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={showQuickModules}
                  onChange={(e) => setShowQuickModules(e.target.checked)}
                  className="w-5 h-5 rounded text-amber-600 focus:ring-amber-500"
                />
              </div>

              {/* Toggle: KPIs */}
              <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 flex items-center justify-between">
                <div className="min-w-0 flex-1 pr-3">
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block">
                    KPI-Schlüsselindikatoren
                  </span>
                  <span className="text-[11px] text-slate-500 block">Urlaubstage, Team, offene Anträge</span>
                </div>
                <input
                  type="checkbox"
                  checked={showKpiMetrics}
                  onChange={(e) => setShowKpiMetrics(e.target.checked)}
                  className="w-5 h-5 rounded text-amber-600 focus:ring-amber-500"
                />
              </div>

              {/* Toggle: Announcements & Limit */}
              <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 flex items-center justify-between">
                <div className="min-w-0 flex-1 pr-3">
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block">
                    Wichtige Unternehmensmitteilungen
                  </span>
                  <div className="flex items-center space-x-1.5 mt-1 text-[11px] text-slate-500">
                    <span>Limit:</span>
                    <select
                      value={announcementsLimit}
                      onChange={(e) => setAnnouncementsLimit(Number(e.target.value))}
                      disabled={!showAnnouncements}
                      className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold border border-slate-200 dark:border-slate-600"
                    >
                      <option value={1}>1 Beitrag</option>
                      <option value={2}>2 Beiträge</option>
                      <option value={3}>3 Beiträge</option>
                      <option value={5}>5 Beiträge</option>
                    </select>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={showAnnouncements}
                  onChange={(e) => setShowAnnouncements(e.target.checked)}
                  className="w-5 h-5 rounded text-amber-600 focus:ring-amber-500"
                />
              </div>

              {/* Toggle: Events Agenda */}
              <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 flex items-center justify-between">
                <div className="min-w-0 flex-1 pr-3">
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block">
                    Nächste Firmentermine (Agenda)
                  </span>
                  <div className="flex items-center space-x-1.5 mt-1 text-[11px] text-slate-500">
                    <span>Limit:</span>
                    <select
                      value={eventsLimit}
                      onChange={(e) => setEventsLimit(Number(e.target.value))}
                      disabled={!showEvents}
                      className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold border border-slate-200 dark:border-slate-600"
                    >
                      <option value={1}>1 Termin</option>
                      <option value={2}>2 Termine</option>
                      <option value={3}>3 Termine</option>
                      <option value={5}>5 Termine</option>
                    </select>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={showEvents}
                  onChange={(e) => setShowEvents(e.target.checked)}
                  className="w-5 h-5 rounded text-amber-600 focus:ring-amber-500"
                />
              </div>

              {/* Toggle: Tools Quick Launcher */}
              <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 flex items-center justify-between">
                <div className="min-w-0 flex-1 pr-3">
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block">
                    Tools &amp; Portale (Schnellstarter)
                  </span>
                  <span className="text-[11px] text-slate-500 block">Direktlinks zu Arbeitswerkzeugen</span>
                </div>
                <input
                  type="checkbox"
                  checked={showQuickTools}
                  onChange={(e) => setShowQuickTools(e.target.checked)}
                  className="w-5 h-5 rounded text-amber-600 focus:ring-amber-500"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleReset}
              disabled={saving}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold transition-colors disabled:opacity-50"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Standard wiederherstellen</span>
            </button>

            <button
              type="submit"
              disabled={saving}
              className="flex items-center space-x-2 px-6 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-2xl text-xs font-bold shadow-md shadow-amber-600/20 transition-all disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>{saving ? 'Wird gespeichert...' : 'Dashboard-Konfiguration speichern'}</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );

  if (isModal) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in overflow-y-auto">
        <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-3xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-8 max-h-[92vh] overflow-y-auto my-auto">
          {content}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-100 dark:border-slate-800 shadow-card">
      {content}
    </div>
  );
}

export default DashboardConfigCard;
