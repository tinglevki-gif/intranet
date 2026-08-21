import React, { useState } from 'react';
import { 
  ClipboardCheck, 
  CheckCircle, 
  Clock, 
  FileCheck2, 
  ShieldCheck, 
  Truck, 
  Layers, 
  Building, 
  Search, 
  AlertCircle, 
  ArrowRight 
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export function AbwicklungPage() {
  const { t } = useLanguage();
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const orders = [
    {
      id: 'AUF-2026-881',
      project: 'Gewerbepark Tinglev Süd - Bürogebäude B',
      client: 'Dansk Byggeri A/S',
      volume: '340 m³ Stahlbeton',
      step: 'PRODUKTION',
      stepLabel: 'Fertigung & Betonguss (75%)',
      deliveryDate: '02. Sep 2026',
      qaApproved: true,
      staticsApproved: true,
      logisticsPlanned: true,
      elementsCount: '48 Hohlwandelemente',
    },
    {
      id: 'AUF-2026-885',
      project: 'Hafencity Hamburg - Baufeld 102',
      client: 'Nordbau Generalunternehmung GmbH',
      volume: '680 m³ Architekturbeton',
      step: 'QUALITAETSSICHERUNG',
      stepLabel: 'Endkontrolle & Festigkeitsprüfung',
      deliveryDate: '28. Aug 2026',
      qaApproved: false,
      staticsApproved: true,
      logisticsPlanned: true,
      elementsCount: '120 Fassadenplatten',
    },
    {
      id: 'AUF-2026-889',
      project: 'Schulzentrum Sonderburg Erweiterungsbau',
      client: 'Kommunalverwaltung Sonderburg',
      volume: '190 m³ Spannbeton',
      step: 'FREIGABE',
      stepLabel: 'Statische Freigabe & Prüfingenieur',
      deliveryDate: '20. Sep 2026',
      qaApproved: false,
      staticsApproved: false,
      logisticsPlanned: false,
      elementsCount: '14 Treppenläufe & Podeste',
    },
    {
      id: 'AUF-2026-892',
      project: 'Logistikzentrum Flensburg-Handewitt',
      client: 'Scandic Transport & Warehousing',
      volume: '510 m³ Trägerkonstruktion',
      step: 'VERSANDBEREIT',
      stepLabel: 'Freigabe erteilt • Verladung läuft',
      deliveryDate: '26. Aug 2026 (Morgen)',
      qaApproved: true,
      staticsApproved: true,
      logisticsPlanned: true,
      elementsCount: '36 Spannbetonbinder',
    }
  ];

  const getStepBadge = (step) => {
    switch (step) {
      case 'FREIGABE':
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">1. Freigabe & Statik</span>;
      case 'PRODUKTION':
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">2. In Produktion</span>;
      case 'QUALITAETSSICHERUNG':
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200">3. QS-Prüfung (Labor)</span>;
      case 'VERSANDBEREIT':
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">4. Versandbereit</span>;
      default:
        return null;
    }
  };

  const filteredOrders = orders.filter((o) => {
    const matchesFilter = activeFilter === 'ALL' || o.step === activeFilter;
    const matchesSearch = 
      o.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.project.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.client.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-8 pb-16 animate-fade-in">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-card flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-rose-600 text-white flex items-center justify-center shadow-md shadow-amber-500/20">
            <ClipboardCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Auftragsabwicklung & Prozessübersicht</h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Prozesskette von der statischen Freigabe, Fertigung und Qualitätssicherung bis zur Baustellenlogistik
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-xs font-semibold">
          <span className="px-3 py-1.5 rounded-2xl bg-amber-50 text-amber-800 border border-amber-200 font-bold">
            {orders.length} laufende Aufträge
          </span>
        </div>
      </div>

      {/* Process Flow Diagram / Overview */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-card">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
          Standard-Auftragsprozess Tiglev Elementfabrik
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
            <span className="text-[10px] font-bold text-amber-600 uppercase">Schritt 1</span>
            <p className="text-xs font-bold text-slate-900">Statik & Werkplanung</p>
            <p className="text-[11px] text-slate-400">Prüfstatik, Bewehrungspläne & Freigabe</p>
          </div>
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
            <span className="text-[10px] font-bold text-blue-600 uppercase">Schritt 2</span>
            <p className="text-xs font-bold text-slate-900">Betonfertigung & Härtung</p>
            <p className="text-[11px] text-slate-400">Schalung, Einlegeteile, Guss & Klimakammer</p>
          </div>
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
            <span className="text-[10px] font-bold text-purple-600 uppercase">Schritt 3</span>
            <p className="text-xs font-bold text-slate-900">QS & Festigkeitsprüfung</p>
            <p className="text-[11px] text-slate-400">Druckprüfung, Maßtoleranz & CE-Kennzeichnung</p>
          </div>
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
            <span className="text-[10px] font-bold text-emerald-600 uppercase">Schritt 4</span>
            <p className="text-xs font-bold text-slate-900">Just-in-Time Baustellenanlieferung</p>
            <p className="text-[11px] text-slate-400">Schwerlasttransport & Kranverladung</p>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-card flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto">
          {['ALL', 'FREIGABE', 'PRODUKTION', 'QUALITAETSSICHERUNG', 'VERSANDBEREIT'].map((st) => (
            <button
              key={st}
              onClick={() => setActiveFilter(st)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                activeFilter === st
                  ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20 font-bold'
                  : 'bg-slate-100/80 text-slate-600 hover:bg-slate-200/70'
              }`}
            >
              {st === 'ALL' ? 'Alle Aufträge' : st === 'FREIGABE' ? '1. Freigabe' : st === 'PRODUKTION' ? '2. Produktion' : st === 'QUALITAETSSICHERUNG' ? '3. QS' : '4. Versand'}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Auftrags-Nr. oder Bauvorhaben..."
            className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
          />
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {filteredOrders.map((ord) => (
          <div key={ord.id} className="bg-white rounded-3xl p-6 border border-slate-100 shadow-card space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="px-2.5 py-0.5 rounded-md bg-slate-900 text-white font-mono text-xs font-bold">
                    {ord.id}
                  </span>
                  <h3 className="font-bold text-base text-slate-900">{ord.project}</h3>
                  {getStepBadge(ord.step)}
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Auftraggeber: <span className="font-bold text-slate-800">{ord.client}</span> • Lieferumfang: <span className="font-semibold text-slate-700">{ord.elementsCount} ({ord.volume})</span>
                </p>
              </div>

              <div className="flex items-center space-x-4 text-xs">
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block">Geplante Auslieferung:</span>
                  <span className="font-bold text-slate-900 font-mono">{ord.deliveryDate}</span>
                </div>
              </div>
            </div>

            {/* QA & Compliance Badges */}
            <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-slate-100 text-xs">
              <span className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-xl font-bold ${
                ord.staticsApproved ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-400'
              }`}>
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Statik-Freigabe</span>
              </span>

              <span className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-xl font-bold ${
                ord.qaApproved ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
              }`}>
                <FileCheck2 className="w-3.5 h-3.5" />
                <span>{ord.qaApproved ? 'QS Werkszeugnis liegt vor' : 'QS-Prüfung ausstehend'}</span>
              </span>

              <span className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-xl font-bold ${
                ord.logisticsPlanned ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-400'
              }`}>
                <Truck className="w-3.5 h-3.5" />
                <span>Logistik & Fuhrpark disponiert</span>
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
