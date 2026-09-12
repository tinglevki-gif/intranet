import React, { useState, useEffect } from 'react';
import {
  FileText,
  Upload,
  Layers,
  Box,
  Scale,
  Maximize2,
  Download,
  Printer,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Building,
  User,
  MapPin,
  ListFilter,
  Cpu,
  RefreshCw
} from 'lucide-react';
import { api } from '../../services/api';

export function ElementUebersichtWidget() {
  const [kstFile, setKstFile] = useState(null);
  const [prjattFile, setPrjattFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const [activeTab, setActiveTab] = useState('ELEMENTS'); // 'ELEMENTS' | 'REBAR' | 'EBT'

  const loadData = async (kst = null, prjatt = null) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.parseElementUebersicht(kst, prjatt);
      setData(res);
    } catch (err) {
      setError(err.message || 'Fehler beim Analysieren der CAD-Dateien.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initial load with built-in demo dataset for seamless experience
    loadData();
  }, []);

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    let kst = null;
    let prjatt = null;

    files.forEach((f) => {
      const name = f.name.toLowerCase();
      if (name.endsWith('.kst')) kst = f;
      if (name.includes('prjatt') || name.endsWith('.dat')) prjatt = f;
    });

    if (kst) setKstFile(kst);
    if (prjatt) setPrjattFile(prjatt);

    if (kst || prjatt) {
      loadData(kst || kstFile, prjatt || prjattFile);
    }
  };

  const handleExportCsv = () => {
    if (!data || !data.elements || data.elements.length === 0) return;

    const headers = 'Element-Nr;Laenge (mm);Breite (mm);Dicke (m);Volumen (m3);Gewicht (t);Flaeche (m2);Stapel-Nr\n';
    const rows = data.elements.map((el) => 
      `${el.element_nummer};${el.laenge_mm};${el.breite_mm};${el.dicke_m};${el.volumen_m3};${el.gewicht_t};${el.flaeche_m2};${el.stapel_nr}`
    ).join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Elementuebersicht_${data.projekt_nr || 'Export'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  const kpis = data?.kpi_stats || {};
  const elements = data?.elements || [];
  const rebar = data?.rebar_counts || {};
  const fittings = data?.fittings_counts || {};
  const ebtItems = data?.ebt_items || [];

  return (
    <div className="space-y-6 animate-fade-in print:p-0 print:m-0">
      {/* File Upload & Demo Loader Controls */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-card flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-sm sm:text-base">
              Allplan CAD / Nemetschek Export Import (.KST &amp; PrjAtt.dat)
            </h3>
            <p className="text-xs text-slate-400">
              Automatische Analyse von Betonfertigteilen, Kubatur ($m^3$), Tonnagen ($t$), Flächen ($m^2$) und Armierung
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3 shrink-0">
          <label className="cursor-pointer inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition-all border border-indigo-200">
            <Upload className="w-4 h-4 text-indigo-600" />
            <span>Dateien wählen (.KST / PrjAtt)</span>
            <input
              type="file"
              multiple
              accept=".kst,.dat,.KST,.DAT"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>

          <button
            onClick={() => loadData(null, null)}
            disabled={loading}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-all disabled:opacity-50"
            title="Demo-Datensatz neu laden"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Demo laden</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs font-bold flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Project Metadata Card */}
      {data && (
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-slate-800 space-y-6 print:bg-none print:text-slate-900 print:p-4 print:border-b print:border-slate-300">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                <Building className="w-3.5 h-3.5" />
                <span>Projekt-Nr: <strong className="font-mono text-white">{data.projekt_nr}</strong></span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                {data.bauvorhaben}
              </h2>
              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300 pt-1">
                <span className="flex items-center space-x-1.5">
                  <User className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Auftraggeber: <strong>{data.auftraggeber}</strong></span>
                </span>
                <span className="flex items-center space-x-1.5">
                  <MapPin className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Ort: <strong>{data.plz_ort} {data.strasse}</strong></span>
                </span>
                {data.bearbeiter && (
                  <span className="text-slate-400 font-mono">
                    Bearbeiter: {data.bearbeiter}
                  </span>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-2 shrink-0 print:hidden">
              <button
                onClick={handlePrint}
                className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-all border border-white/15 backdrop-blur-sm"
              >
                <Printer className="w-4 h-4 text-indigo-300" />
                <span>Drucken</span>
              </button>
              <button
                onClick={handleExportCsv}
                className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md shadow-indigo-600/30"
              >
                <Download className="w-4 h-4" />
                <span>CSV-Export</span>
              </button>
            </div>
          </div>

          {/* KPI Summary Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Elemente Gesamt</span>
              <span className="text-xl sm:text-2xl font-black text-white font-mono mt-0.5 block">{kpis.gesamt_elemente || 0}</span>
              <span className="text-[10px] text-indigo-300 font-semibold">{kpis.v_elemente_anzahl || 0} Wand-Elemente</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Gesamtfläche</span>
              <span className="text-xl sm:text-2xl font-black text-emerald-400 font-mono mt-0.5 block">{kpis.gesamt_flaeche_m2 || 0} $m^2$</span>
              <span className="text-[10px] text-slate-400">Schalungsfläche</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Gesamtvolumen</span>
              <span className="text-xl sm:text-2xl font-black text-cyan-400 font-mono mt-0.5 block">{kpis.gesamt_volumen_m3 || 0} $m^3$</span>
              <span className="text-[10px] text-slate-400">Betonkubatur</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Gesamtgewicht</span>
              <span className="text-xl sm:text-2xl font-black text-amber-400 font-mono mt-0.5 block">{kpis.gesamt_gewicht_t || 0} t</span>
              <span className="text-[10px] text-slate-400">Fertigteiltonnage</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Transport-Stapel</span>
              <span className="text-xl sm:text-2xl font-black text-purple-300 font-mono mt-0.5 block">{kpis.stapel_anzahl || 0}</span>
              <span className="text-[10px] text-purple-300 font-semibold">SLBSTACK Einheiten</span>
            </div>
          </div>
        </div>
      )}

      {/* Main Tabbed Data Section */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-card overflow-hidden">
        {/* Internal Sub-Nav Tabs */}
        <div className="flex items-center space-x-2 px-6 pt-5 border-b border-slate-100 overflow-x-auto print:hidden">
          <button
            onClick={() => setActiveTab('ELEMENTS')}
            className={`pb-3.5 px-3 text-xs font-bold border-b-2 transition-all flex items-center space-x-2 shrink-0 ${
              activeTab === 'ELEMENTS'
                ? 'border-indigo-600 text-indigo-600 font-extrabold'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Box className="w-4 h-4" />
            <span>Betonfertigteile ({elements.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('REBAR')}
            className={`pb-3.5 px-3 text-xs font-bold border-b-2 transition-all flex items-center space-x-2 shrink-0 ${
              activeTab === 'REBAR'
                ? 'border-indigo-600 text-indigo-600 font-extrabold'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Cpu className="w-4 h-4" />
            <span>Bewehrung &amp; Einbauteile</span>
          </button>
          <button
            onClick={() => setActiveTab('EBT')}
            className={`pb-3.5 px-3 text-xs font-bold border-b-2 transition-all flex items-center space-x-2 shrink-0 ${
              activeTab === 'EBT'
                ? 'border-indigo-600 text-indigo-600 font-extrabold'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <ListFilter className="w-4 h-4" />
            <span>EBT-Stückliste ({ebtItems.length})</span>
          </button>
        </div>

        {/* TAB 1: ELEMENTS TABLE */}
        {activeTab === 'ELEMENTS' && (
          <div className="overflow-x-auto p-6">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-3">#</th>
                  <th className="py-3 px-3">Element-Nr</th>
                  <th className="py-3 px-3">Länge (mm)</th>
                  <th className="py-3 px-3">Breite (mm)</th>
                  <th className="py-3 px-3">Dicke (m)</th>
                  <th className="py-3 px-3">Fläche ($m^2$)</th>
                  <th className="py-3 px-3">Volumen ($m^3$)</th>
                  <th className="py-3 px-3">Gewicht (t)</th>
                  <th className="py-3 px-3">Stapel</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                {elements.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-400 text-xs">
                      Keine Elemente in der ausgewählten Datei gefunden.
                    </td>
                  </tr>
                ) : (
                  elements.map((el, idx) => (
                    <tr key={el.id || idx} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5 px-3 text-slate-400 font-mono text-[11px]">{idx + 1}</td>
                      <td className="py-2.5 px-3 font-bold text-slate-900">
                        {el.element_nummer}
                        {el.ist_v_element && (
                          <span className="ml-1.5 px-1.5 py-0.2 rounded text-[9px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                            Wand-V
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 font-mono">{el.laenge_mm}</td>
                      <td className="py-2.5 px-3 font-mono">{el.breite_mm}</td>
                      <td className="py-2.5 px-3 font-mono">{el.dicke_m}</td>
                      <td className="py-2.5 px-3 font-mono font-semibold text-emerald-600">{el.flaeche_m2}</td>
                      <td className="py-2.5 px-3 font-mono font-semibold text-cyan-600">{el.volumen_m3}</td>
                      <td className="py-2.5 px-3 font-mono font-semibold text-amber-600">{el.gewicht_t}</td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200 font-mono font-bold text-[10px]">
                          Stapel #{el.stapel_nr || 1}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 2: REINFORCEMENT & FITTINGS SUMMARY */}
        {activeTab === 'REBAR' && (
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Q-Mesh Steel */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
                  <span>Bewehrungsstahlliste (Matten &amp; Rundstahl)</span>
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {Object.entries(rebar).map(([k, count]) => (
                    <div key={k} className="p-2.5 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-700">{k}</span>
                      <span className="text-xs font-bold font-mono bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md">
                        {count} Stk
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Fittings & Accessories */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-600"></span>
                  <span>Einbauteile, Elektro &amp; Aussparungen</span>
                </h4>
                <div className="space-y-2 text-xs">
                  <div className="p-2.5 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
                    <span className="font-semibold text-slate-700">Elektrodosen 1er / 2er / 3er / 4er</span>
                    <span className="font-bold font-mono text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md">
                      {fittings.e_dose_1 + fittings.e_dose_2 + fittings.e_dose_3 + fittings.e_dose_4} Dosen
                    </span>
                  </div>
                  <div className="p-2.5 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
                    <span className="font-semibold text-slate-700">Conduit-Rohre (PSM25 / PSM32)</span>
                    <span className="font-bold font-mono text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md">
                      {fittings.psm25 + fittings.psm32} Stk
                    </span>
                  </div>
                  <div className="p-2.5 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
                    <span className="font-semibold text-slate-700">Styropor-Aussparungskörper (EL-Styro)</span>
                    <span className="font-bold font-mono text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md">
                      {fittings.styro} Stk
                    </span>
                  </div>
                  <div className="p-2.5 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
                    <span className="font-semibold text-slate-700">Schräge Kanten &amp; Fase</span>
                    <span className="font-bold font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                      {fittings.schraege_kanten} Stk
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: EBT BOM LIST */}
        {activeTab === 'EBT' && (
          <div className="overflow-x-auto p-6">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-3">Artikel-Nr (WNummer)</th>
                  <th className="py-3 px-3">Menge</th>
                  <th className="py-3 px-3">Einheit</th>
                  <th className="py-3 px-3">Beschreibung / Kommentar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                {ebtItems.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-400 text-xs">
                      Keine EBT-Stücklistenpositionen vorhanden.
                    </td>
                  </tr>
                ) : (
                  ebtItems.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-900">{item.wnummer}</td>
                      <td className="py-2.5 px-3 font-mono font-bold text-indigo-600">{item.wmenge}</td>
                      <td className="py-2.5 px-3 font-semibold text-slate-500">{item.unit || 'Stk'}</td>
                      <td className="py-2.5 px-3 text-slate-800">{item.comment}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
