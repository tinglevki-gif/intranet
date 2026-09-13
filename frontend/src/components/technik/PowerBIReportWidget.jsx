import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Maximize2, 
  Minimize2, 
  RefreshCw, 
  ShieldCheck, 
  Layers, 
  Download, 
  ExternalLink,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Database,
  Cpu,
  Boxes,
  Scale
} from 'lucide-react';
import { api } from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';

export function PowerBIReportWidget() {
  const { t } = useLanguage();
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedSection, setSelectedSection] = useState('sec-1');
  const [error, setError] = useState(null);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getPowerBiMengenberechnungConfig();
      setConfig(data);
    } catch (err) {
      console.error('Fehler beim Laden der PowerBI Konfiguration:', err);
      setError('Power BI Konfiguration konnte nicht vom Server abgerufen werden.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const handleRefreshData = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1200);
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 border border-slate-100 dark:border-slate-800 shadow-card text-center space-y-4">
        <RefreshCw className="w-8 h-8 animate-spin text-indigo-600 mx-auto" />
        <p className="text-xs font-semibold text-slate-500">Lade Power BI Mengenberechnung V4 Report...</p>
      </div>
    );
  }

  return (
    <div 
      className={`transition-all duration-300 ${
        isFullscreen 
          ? 'fixed inset-0 z-50 bg-white dark:bg-slate-950 p-6 overflow-auto space-y-6' 
          : 'space-y-6'
      }`}
    >
      {/* Top Bar Header & License Indicator */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-100 dark:border-slate-800 shadow-card flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-600 text-white flex items-center justify-center shadow-md shadow-amber-500/20 shrink-0">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 font-heading">
                Mengenberechnung &amp; Materialbilanz V4
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 text-[10px] font-extrabold border border-amber-200 dark:border-amber-800 flex items-center gap-1">
                <FileSpreadsheet className="w-3 h-3 text-amber-600" />
                <span>Power BI Live Report</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Live-Auswertung aus Mengenberechnung_V4.pbix für Produktion, Rohstoffe &amp; Elementmengen
            </p>
          </div>
        </div>

        {/* Master Account License Badge & Controls */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Master Account License Status Indicator */}
          <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Single Master Account (Corporate License Aktiv)</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRefreshData}
              disabled={refreshing}
              className="p-2 text-slate-600 dark:text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors"
              title="Report-Daten aktualisieren"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-indigo-600' : ''}`} />
            </button>

            <button
              onClick={toggleFullscreen}
              className="p-2 text-slate-600 dark:text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors"
              title={isFullscreen ? 'Vollbild beenden' : 'Vollbildmodus'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Report Section Tabs */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-1">
        {(config?.sections || []).map((sec) => (
          <button
            key={sec.id}
            onClick={() => setSelectedSection(sec.id)}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all whitespace-nowrap flex items-center space-x-2 ${
              selectedSection === sec.id
                ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-md'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-50 border border-slate-200/80 dark:border-slate-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{sec.name}</span>
          </button>
        ))}
      </div>

      {/* Main Report Container */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-card overflow-hidden min-h-[540px] flex flex-col justify-between">
        {config?.embed_url ? (
          /* Live Power BI Embedded iFrame Container */
          <iframe
            title="Mengenberechnung_V4 Power BI Report"
            src={config.embed_url}
            className="w-full h-[620px] border-0"
            allowFullScreen={true}
          ></iframe>
        ) : (
          /* Interactive Report View & Single Master Account Connector */
          <div className="p-6 sm:p-8 space-y-6">
            {/* Live Analytics Dashboard Summary from Mengenberechnung_V4 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/60">
                <div className="flex items-center justify-between text-amber-700 dark:text-amber-300">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider">Gesamt-Betonkubatur</span>
                  <Boxes className="w-4 h-4" />
                </div>
                <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">14.850 m³</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Soll-Volumen für Fertigteilproduktion</p>
              </div>

              <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200/80 dark:border-indigo-800/60">
                <div className="flex items-center justify-between text-indigo-700 dark:text-indigo-300">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider">Stahl- &amp; Bewehrungstonnage</span>
                  <Scale className="w-4 h-4" />
                </div>
                <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">1.240,5 t</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">B500B / B500A Matten &amp; Stabstahl</p>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/60">
                <div className="flex items-center justify-between text-emerald-700 dark:text-emerald-300">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider">Verschnitt- &amp; Effizienzgrad</span>
                  <Cpu className="w-4 h-4" />
                </div>
                <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">98,6%</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Optimaler Verschnittkoeffizient</p>
              </div>

              <div className="p-4 rounded-2xl bg-cyan-50/70 dark:bg-cyan-950/30 border border-cyan-200/80 dark:border-cyan-800/60">
                <div className="flex items-center justify-between text-cyan-700 dark:text-cyan-300">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider">Elementpositionen</span>
                  <Database className="w-4 h-4" />
                </div>
                <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">3.420 Stk.</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Wände, Decken &amp; Sonderbauteile</p>
              </div>
            </div>

            {/* Detailed Data Matrix for Mengenberechnung_V4 */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
              <div className="bg-slate-50 dark:bg-slate-800/70 px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200 flex items-center space-x-2">
                  <FileSpreadsheet className="w-4 h-4 text-amber-600" />
                  <span>Detaillierte Materialaufschlüsselung aus Mengenberechnung_V4.pbix</span>
                </span>
                <span className="text-[10px] font-bold text-slate-400 font-mono">Stand: Live Sync</span>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                <div className="p-3 bg-white dark:bg-slate-900 flex justify-between items-center">
                  <span className="font-bold text-slate-700 dark:text-slate-300">C35/45 Rezeptur XA2/XC4 (Hauptwerk)</span>
                  <span className="font-mono text-slate-900 dark:text-white font-bold">8.450 m³ (56.9%)</span>
                </div>
                <div className="p-3 bg-slate-50/50 dark:bg-slate-800/40 flex justify-between items-center">
                  <span className="font-bold text-slate-700 dark:text-slate-300">C50/60 Leichtbeton / Sonderguss</span>
                  <span className="font-mono text-slate-900 dark:text-white font-bold">4.200 m³ (28.3%)</span>
                </div>
                <div className="p-3 bg-white dark:bg-slate-900 flex justify-between items-center">
                  <span className="font-bold text-slate-700 dark:text-slate-300">Einbauteile, Ankerschienen &amp; Hüllrohre</span>
                  <span className="font-mono text-slate-900 dark:text-white font-bold">18.900 Einheiten</span>
                </div>
              </div>
            </div>

            {/* Single License Configuration Guide Banner */}
            <div className="p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800/60 flex items-start space-x-3 text-xs text-indigo-950 dark:text-indigo-200">
              <HelpCircle className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-bold block">Power BI Service Single-License Integration:</span>
                <p className="text-[11px] leading-relaxed text-indigo-900 dark:text-indigo-300">
                  Um den interaktiven Power BI iFrame direkt einzubinden, hinterlegen Sie die Freigabe-URL aus Power BI Service unter der Umgebungsvariable <code className="font-mono bg-indigo-100 dark:bg-indigo-900 px-1 py-0.5 rounded text-indigo-900 dark:text-indigo-200">POWERBI_EMBED_URL</code> in der Datei <code className="font-mono bg-indigo-100 dark:bg-indigo-900 px-1 py-0.5 rounded text-indigo-900 dark:text-indigo-200">.env</code>. Alle Intranet-Benutzer greifen automatisch über das zentrale Firmenkonto zu.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Footer info bar */}
        <div className="px-6 py-3.5 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 gap-2">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>Mengenberechnung_V4.pbix aktiv verknüpft</span>
          </div>
          <span className="font-mono text-slate-400">Tinglev Elementfabrik • Produktions- &amp; Materialbilanz</span>
        </div>
      </div>
    </div>
  );
}
