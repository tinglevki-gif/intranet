import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  DollarSign, 
  Users, 
  Briefcase, 
  FileSpreadsheet, 
  Download, 
  CheckCircle2, 
  ChevronRight, 
  BarChart3, 
  Target, 
  Percent, 
  Building2,
  FolderOpen,
  Cloud,
  ExternalLink,
  Copy,
  Check,
  Sparkles,
  ShieldCheck,
  Layers
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../services/api';

const DEFAULT_ONEDRIVE_URL = 'https://tiglevelementfabrik-my.sharepoint.com/personal/vertrieb_tiglev_de/Documents/Vertrieb_Projekte_2026';

export function VertriebPage() {
  const { t } = useLanguage();
  const [pipelineStage, setPipelineStage] = useState('ALL');
  const [oneDriveUrl, setOneDriveUrl] = useState(DEFAULT_ONEDRIVE_URL);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function loadSetting() {
      try {
        const data = await api.getSetting('onedrive_vertrieb_url');
        if (data && data.value) {
          setOneDriveUrl(data.value);
        }
      } catch (err) {
        console.warn('OneDrive URL konnte nicht dynamisch geladen werden, verwende Standardwert:', err);
      }
    }
    loadSetting();
  }, []);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(oneDriveUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const deals = [
    {
      id: 'D-2026-042',
      customer: 'Nordbau Generalunternehmung GmbH',
      project: 'Wohnkomplex Hafencity (180 Wohneinheiten)',
      volume: '1.450.000 €',
      elements: '540 Betonfertigteilwände & Decken',
      stage: 'ANGEBOT',
      stageLabel: 'Angebot abgegeben',
      probability: '75%',
      contactPerson: 'Dipl.-Ing. Markus Becker',
      dueDate: '15. Sep 2026',
    },
    {
      id: 'D-2026-045',
      customer: 'Kieler Förde Immobilien AG',
      project: 'Logistikhalle Gewerbepark Süd',
      volume: '820.000 €',
      elements: '120 Spannbetonbinder & Stützen',
      stage: 'VERHANDLUNG',
      stageLabel: 'Endverhandlung',
      probability: '90%',
      contactPerson: 'Carsten Vogt',
      dueDate: '28. Aug 2026',
    },
    {
      id: 'D-2026-048',
      customer: 'Baltic Real Estate Development ApS',
      project: 'Bürocampus Sonderburg (DK)',
      volume: '2.100.000 €',
      elements: 'Architekturbeton-Fassadenelemente',
      stage: 'QUALIFIKATION',
      stageLabel: 'Statik-Prüfung',
      probability: '50%',
      contactPerson: 'Mette Frederiksen',
      dueDate: '30. Okt 2026',
    },
    {
      id: 'D-2026-051',
      customer: 'Städtische Wohnungsbau Flensburg',
      project: 'Quartier Sandberg Nachverdichtung',
      volume: '640.000 €',
      elements: 'Modulare Treppenhaus-Elemente',
      stage: 'GEWONNEN',
      stageLabel: 'Auftrag erteilt',
      probability: '100%',
      contactPerson: 'Helge Peters',
      dueDate: '01. Aug 2026',
    }
  ];

  const salesDocuments = [
    { title: 'Tiglev Produktkatalog Betonfertigteile 2026 (PDF)', size: '14.2 MB', category: 'Katalog' },
    { title: 'Preisliste Standard-Wand- und Deckenelemente Q3/2026 (XLSX)', size: '2.4 MB', category: 'Preise' },
    { title: 'Zertifikate, Leistungserklärungen & CE-Kennzeichnung (ZIP)', size: '8.8 MB', category: 'Normen' },
    { title: 'Unternehmenspräsentation Tiglev Elementfabrik (PPTX)', size: '21.5 MB', category: 'Präsentation' },
  ];

  const getStageBadge = (stage) => {
    switch (stage) {
      case 'QUALIFIKATION':
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">Statik & Vorprüfung</span>;
      case 'ANGEBOT':
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">Angebot versandt</span>;
      case 'VERHANDLUNG':
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">Schlussverhandlung</span>;
      case 'GEWONNEN':
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">Auftrag erteilt</span>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-8 pb-16 animate-fade-in">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-card flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Vertrieb & Sales Dashboard</h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Pipeline-Übersicht, Großprojekte, Auftragsabschlüsse und Cloud-Vertriebsunterlagen
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-xs font-semibold">
          <span className="px-3 py-1.5 rounded-2xl bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold">
            Pipeline: 5.010.000 €
          </span>
        </div>
      </div>

      {/* Prominent Microsoft OneDrive / SharePoint Cloud Access Card */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-indigo-800/40">
        {/* Ambient Glow */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-blue-500/15 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-200 text-xs font-bold tracking-wide backdrop-blur-md">
              <Cloud className="w-3.5 h-3.5 text-indigo-300" />
              <span>Microsoft OneDrive & SharePoint Integration</span>
            </div>

            <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
              <FolderOpen className="w-6 h-6 text-indigo-400 shrink-0" />
              <span>Vertriebs-Ordner in OneDrive öffnen</span>
            </h2>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Zentraler Cloud-Speicher für Leistungsverzeichnisse (GAEB), Kalkulationstabellen, BIM-/CAD-Elementpläne, Kundenverträge und aktuelle Präsentationen der Tiglev Elementfabrik.
            </p>

            <div className="flex items-center space-x-2 text-[11px] text-indigo-300/80 font-mono pt-1">
              <span className="text-slate-400">Pfad:</span>
              <span className="bg-slate-800/80 px-2 py-0.5 rounded-md border border-slate-700/60 truncate max-w-xs sm:max-w-md">
                OneDrive &gt; Tiglev Elementfabrik &gt; Vertrieb &amp; Projekte 2026
              </span>
            </div>
          </div>

          <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 shrink-0">
            {/* Direct Open Button */}
            <a
              href={oneDriveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center space-x-2 px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs sm:text-sm transition-all duration-200 shadow-lg shadow-indigo-600/40 hover:shadow-indigo-500/50 hover:scale-[1.02] active:scale-[0.98]"
            >
              <FolderOpen className="w-4 h-4" />
              <span>Vertriebs-Ordner öffnen</span>
              <ExternalLink className="w-4 h-4 ml-1 opacity-80" />
            </a>

            {/* Copy Link Button */}
            <button
              onClick={handleCopyLink}
              className="inline-flex items-center justify-center space-x-2 px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs sm:text-sm transition-all duration-200 border border-white/15 backdrop-blur-sm"
              title="OneDrive-Link in die Zwischenablage kopieren"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-300">Kopiert!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-slate-300" />
                  <span>Link kopieren</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-card">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Monatsumsatz Q3</p>
            <DollarSign className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900 mt-1">3.42 Mio. €</p>
          <p className="text-[11px] text-emerald-600 font-semibold mt-1">114% des Quartalsziels</p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-card">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Offene Angebote</p>
            <Briefcase className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-2xl font-extrabold text-blue-600 mt-1">12 Projekte</p>
          <p className="text-[11px] text-slate-400 font-medium mt-1">Im Wert von 6.8 Mio. €</p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-card">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Abschlussquote</p>
            <Percent className="w-4 h-4 text-purple-500" />
          </div>
          <p className="text-2xl font-extrabold text-purple-600 mt-1">68.5%</p>
          <p className="text-[11px] text-emerald-600 font-semibold mt-1">+4.2% gegenüber Vorjahr</p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-card">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Neukunden 2026</p>
            <Users className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900 mt-1">+18 Firmen</p>
          <p className="text-[11px] text-slate-400 font-medium mt-1">Deutschland & Dänemark</p>
        </div>
      </div>

      {/* Sales Pipeline Table */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-card overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-extrabold text-slate-900">Aktuelle Großprojekte & Angebote</h2>
            <p className="text-xs text-slate-400">Verfolgung von Vorprüfung bis zur finalen Auftragsvergabe</p>
          </div>
          <span className="px-3 py-1 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl">
            {deals.length} aktive Deals
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">
              <tr>
                <th className="px-6 py-4">Kunde & Projekt</th>
                <th className="px-6 py-4">Auftragsvolumen</th>
                <th className="px-6 py-4">Elemente</th>
                <th className="px-6 py-4">Status & Phase</th>
                <th className="px-6 py-4">Wahrscheinlichkeit</th>
                <th className="px-6 py-4">Entscheidung bis</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {deals.map((deal) => (
                <tr key={deal.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-900 text-sm">{deal.customer}</div>
                    <div className="text-slate-500 text-xs">{deal.project}</div>
                    <div className="text-[11px] text-slate-400 font-mono mt-0.5">Ansprechpartner: {deal.contactPerson}</div>
                  </td>
                  <td className="px-6 py-4 font-mono font-bold text-slate-900 text-sm">
                    {deal.volume}
                  </td>
                  <td className="px-6 py-4 text-slate-600">
                    {deal.elements}
                  </td>
                  <td className="px-6 py-4">
                    {getStageBadge(deal.stage)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full" 
                          style={{ width: deal.probability }}
                        ></div>
                      </div>
                      <span className="font-mono font-bold text-slate-800 text-[11px]">{deal.probability}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-mono text-slate-600">
                    {deal.dueDate}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sales Documents & Downloads */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-card space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-extrabold text-slate-900">Vertriebsunterlagen & Broschüren</h2>
            <p className="text-xs text-slate-400">Offizielle Datenblätter und Preisübersichten für Kundenpräsentationen</p>
          </div>

          <a
            href={oneDriveUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="self-start sm:self-auto inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-indigo-50 text-indigo-700 text-xs font-bold transition-colors border border-slate-200"
          >
            <Cloud className="w-3.5 h-3.5 text-indigo-600" />
            <span>Alle Dateien in OneDrive öffnen</span>
            <ExternalLink className="w-3.5 h-3.5 opacity-70" />
          </a>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          {salesDocuments.map((doc, idx) => (
            <div key={idx} className="p-4 rounded-2xl bg-slate-50 hover:bg-indigo-50/50 border border-slate-200/80 transition-colors flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-xl bg-white border border-slate-200 text-indigo-600 shadow-2xs">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900">{doc.title}</p>
                  <p className="text-[11px] text-slate-400">{doc.category} • {doc.size}</p>
                </div>
              </div>
              <button 
                onClick={() => alert(`Download gestartet: ${doc.title}`)}
                className="p-2 rounded-xl bg-white hover:bg-indigo-600 text-indigo-600 hover:text-white border border-slate-200 transition-colors shadow-2xs"
                title="Herunterladen"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
