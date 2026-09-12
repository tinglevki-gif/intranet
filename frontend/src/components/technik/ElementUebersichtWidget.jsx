import React, { useState } from 'react';
import { Upload, Download, Printer, RefreshCw, Layers } from 'lucide-react';
import { api } from '../../services/api';

export function ElementUebersichtWidget() {
  const [kstFile, setKstFile] = useState(null);
  const [prjattFile, setPrjattFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isEvaluated, setIsEvaluated] = useState(false);
  const [data, setData] = useState(null);

  const handleFileUpload = async (e) => {
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
      await runEvaluation(kst || kstFile, prjatt || prjattFile);
    }
  };

  const runEvaluation = async (kst = kstFile, prjatt = prjattFile) => {
    setLoading(true);
    try {
      const res = await api.parseElementUebersicht(kst, prjatt);
      setData(res);
      setIsEvaluated(true);
    } catch (err) {
      console.error('Fehler bei Auswertung:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setIsEvaluated(false);
    setData(null);
    setKstFile(null);
    setPrjattFile(null);
  };

  const handleExportCsv = () => {
    if (!data || !data.elements) return;
    const headers = 'Element-Nr;Laenge (m);Hoehe (m);Dicke (cm);Flaeche (m2);Gewicht (kg);Betonguete\n';
    const rows = data.elements.map((el) => 
      `${el.element_nummer};${el.laenge_m || ''};${el.hoehe_m || ''};${el.dicke_cm || ''};${el.flaeche_m2 || ''};${el.gewicht_kg || ''};${el.betonguete || ''}`
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

  const projektNr = isEvaluated && data ? data.projekt_nr : '0';
  const sachnummer = isEvaluated && data ? data.sachnummer : '0';

  return (
    <div className="bg-[#F8FAFC] p-4 sm:p-6 rounded-xl border border-slate-200 shadow-md font-sans text-slate-800 space-y-4 print:p-0 print:bg-white print:border-none print:shadow-none">
      
      {/* HEADER CONTROL BAR (Matching WPF Desktop Toolbar) */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        
        {/* Left Toolbar Inputs & Buttons */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          
          {/* Projektnummer Box */}
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-slate-700 w-24">Projektnummer</span>
            <input
              type="text"
              readOnly
              value={projektNr}
              className="w-20 px-2 py-1 bg-[#FFFDE7] border border-slate-300 font-bold text-center text-slate-900 rounded shadow-inner"
            />
          </div>

          {/* Sachnummer Box */}
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-slate-700 w-24 sm:w-auto">Sachnummer</span>
            <input
              type="text"
              readOnly
              value={sachnummer}
              className="w-20 px-2 py-1 bg-[#FFFDE7] border border-slate-300 font-bold text-center text-slate-900 rounded shadow-inner"
            />
          </div>

          {/* Action Buttons Group (Replicating Windows Desktop Buttons) */}
          <div className="flex items-center space-x-1.5 pl-2">
            <button
              disabled={!isEvaluated}
              className="px-3 py-1 bg-[#F1F5F9] border border-slate-300 rounded text-slate-700 font-medium hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-all"
            >
              Letzte KST
            </button>

            {/* Hidden File Picker triggered by Browse */}
            <label className="cursor-pointer px-3 py-1 bg-[#F1F5F9] border border-slate-300 rounded text-slate-700 font-medium hover:bg-slate-200 shadow-sm transition-all">
              Browse
              <input
                type="file"
                multiple
                accept=".kst,.dat,.KST,.DAT"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>

            {/* Auswerten Button */}
            <button
              onClick={() => runEvaluation()}
              disabled={loading}
              className="px-3 py-1 bg-[#E2F0D9] hover:bg-[#C8E6C9] border border-[#A2D193] text-emerald-950 font-bold rounded shadow-sm transition-all flex items-center space-x-1"
            >
              {loading && <RefreshCw className="w-3 h-3 animate-spin mr-1" />}
              <span>Auswerten</span>
            </button>

            {/* Clear Button */}
            <button
              onClick={handleClear}
              className="px-3 py-1 bg-[#E2F0D9] hover:bg-[#C8E6C9] border border-[#A2D193] text-emerald-950 font-bold rounded shadow-sm transition-all"
            >
              Clear
            </button>

            {/* CSV Button */}
            <button
              onClick={handleExportCsv}
              disabled={!isEvaluated}
              className="px-3 py-1 bg-[#F1F5F9] border border-slate-300 rounded text-slate-700 font-medium hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-all"
            >
              -&gt; CSV
            </button>

            {/* Print Button */}
            <button
              onClick={handlePrint}
              disabled={!isEvaluated}
              className="px-3 py-1 bg-[#F1F5F9] border border-slate-300 rounded text-slate-700 font-medium hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-all"
            >
              Print
            </button>
          </div>
        </div>

        {/* Right Title Header (ELEMENT - PREVIEW 1.2) */}
        <div className="text-right shrink-0">
          <h2 className="text-2xl sm:text-3xl font-extrabold font-serif tracking-wider text-[#475569] uppercase">
            ELEMENT - PREVIEW 1.2
          </h2>
          <p className="text-[10px] tracking-widest text-slate-500 font-bold uppercase">
            SETZT EINE VORHANDENE KST-DATEI VORAUS
          </p>
          <p className="text-[9px] tracking-wider text-slate-400 font-mono">
            VERSION - 1.2.0.6
          </p>
        </div>
      </div>

      {/* MAIN SCREEN BODY */}
      {!isEvaluated ? (
        /* INITIAL STATE BEFORE FILE LOAD (Matching Screenshot 1) */
        <div className="py-32 flex flex-col items-center justify-center text-center space-y-4">
          <p className="text-slate-700 text-lg sm:text-xl font-normal font-sans">
            Anzeige erst nach erfolgreicher Auswertung sichtbar
          </p>
        </div>
      ) : (
        /* EVALUATED DASHBOARD VIEW (Matching Screenshot 2 Pixel-for-Pixel) */
        <div className="space-y-4 animate-fade-in text-xs">
          
          {/* TOP THREE-COLUMN GRID */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
            
            {/* COLUMN 1 (Width: 3.5 / 12) */}
            <div className="lg:col-span-3 space-y-3">
              
              {/* Elementliste (1) */}
              <div className="bg-white rounded border border-slate-300 shadow-sm p-2.5">
                <h4 className="font-semibold text-slate-800 border-b border-slate-200 pb-1 mb-2">
                  Elementliste ({data?.elements?.length || 0})
                </h4>
                <div className="max-h-40 overflow-y-auto space-y-2 font-sans text-[11px] pr-1">
                  {data?.elements?.map((el, idx) => (
                    <div key={idx} className="bg-slate-50 p-2 rounded border border-slate-200 space-y-0.5">
                      <div className="flex justify-between font-bold text-slate-900">
                        <span>Element: {el.element_nummer}</span>
                        <span>Fläche: {el.flaeche_m2} m²</span>
                      </div>
                      <div className="text-slate-600 truncate">
                        Betongüte: {el.betonguete}
                      </div>
                      <div className="flex justify-between text-slate-700">
                        <span>Länge: {el.laenge_m} m</span>
                        <span>Höhe: {el.hoehe_m} m</span>
                      </div>
                      <div className="flex justify-between text-slate-700">
                        <span>Dicke: {el.dicke_cm} cm</span>
                        <span>Gewicht: {el.gewicht_to} to</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Elementhöhen (2) */}
              <div className="bg-white rounded border border-slate-300 shadow-sm p-2.5">
                <h4 className="font-semibold text-slate-800 border-b border-slate-200 pb-1 mb-2">
                  Elementhöhen ({data?.elementhoehen?.length || 0})
                </h4>
                <div className="space-y-1 text-[11px]">
                  {data?.elementhoehen?.map((h, i) => (
                    <div key={i} className="flex justify-between text-slate-700">
                      <span>Elementhöhe: {h.hoehe_m} m</span>
                      <span className="font-medium">Anzahl: {h.anzahl}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bewehrungsmatten (8) */}
              <div className="bg-[#FDF2F2] rounded border border-rose-200 p-2.5">
                <h4 className="font-semibold text-slate-800 border-b border-rose-200 pb-1 mb-2">
                  Bewehrungsmatten (8)
                </h4>
                <div className="space-y-1.5 text-[11px]">
                  {data?.bewehrungsmatten?.items?.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-slate-800 font-medium">
                      <span>{item.name} :</span>
                      <span>{item.gewicht_kg} kg = {item.stk} Stk</span>
                    </div>
                  ))}
                  <div className="border-t border-rose-200 pt-1 flex justify-between font-bold text-slate-900">
                    <span>Mattengewichte Gesamt :</span>
                    <span>{data?.bewehrungsmatten?.gesamtgewicht_kg} kg</span>
                  </div>
                </div>
              </div>

              {/* Betonstahl (ohne Matten) */}
              <div className="bg-[#FDF2F2] rounded border border-rose-200 p-2.5">
                <h4 className="font-semibold text-slate-800 border-b border-rose-200 pb-1 mb-2">
                  Betonstahl (ohne Matten)
                </h4>
                <div className="space-y-1 text-[11px]">
                  {data?.betonstahl?.items?.map((st, i) => (
                    <div key={i} className="flex justify-between text-slate-700">
                      <span>Ø {st.diameter} Gesamtgewicht:</span>
                      <span className="font-medium">{st.gewicht_kg} kg</span>
                    </div>
                  ))}
                  <div className="border-t border-rose-200 pt-1 flex justify-between font-bold text-slate-900 mt-1">
                    <span>Betonstahl Gesamt:</span>
                    <span>{data?.betonstahl?.gesamtgewicht_kg} kg</span>
                  </div>
                </div>
              </div>

              {/* Anschlusseisen (11) */}
              <div className="bg-[#FDF2F2] rounded border border-rose-200 p-2.5">
                <h4 className="font-semibold text-slate-800 border-b border-rose-200 pb-1 mb-1.5">
                  Anschlusseisen (11)
                </h4>
                <p className="text-rose-600 font-bold text-[11px]">
                  {data?.anschlusseisen || 'Keine WD-Verbindung erkannt'}
                </p>
              </div>

              {/* Hülsendübel (12) */}
              <div className="bg-[#E8F5E9] rounded border border-emerald-200 p-2.5">
                <h4 className="font-semibold text-slate-800 border-b border-emerald-200 pb-1 mb-1">
                  Hülsendübel (12)
                </h4>
                <p className="text-slate-600 text-[11px]">
                  {data?.huelsenduebel || 'Keine Hülsendübel vorhanden.'}
                </p>
              </div>
            </div>

            {/* COLUMN 2 (Width: 5.5 / 12) */}
            <div className="lg:col-span-6 space-y-3">
              
              {/* Fläche nach Betongüten gruppiert (6) */}
              <div className="bg-[#E8F5E9] rounded border border-emerald-200 p-2.5">
                <h4 className="font-semibold text-slate-800 border-b border-emerald-200 pb-1 mb-2">
                  Fläche nach Betongüten gruppiert (6)
                </h4>
                <div className="space-y-1 text-[11px]">
                  {data?.betongueten_flaeche?.map((bg, idx) => (
                    <div key={idx} className="flex justify-between text-slate-800 font-medium">
                      <span>in {bg.guete} :</span>
                      <span className="font-bold">{bg.flaeche_m2} m²</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Elementanzahl nach Betongüten gruppiert (4) */}
              <div className="bg-[#E8F5E9] rounded border border-emerald-200 p-2.5">
                <h4 className="font-semibold text-slate-800 border-b border-emerald-200 pb-1 mb-2">
                  Elementanzahl nach Betongüten gruppiert (4)
                </h4>
                <div className="space-y-1 text-[11px]">
                  {data?.betongueten_anzahl?.map((bg, idx) => (
                    <div key={idx} className="flex space-x-3 text-slate-800 font-medium">
                      <span className="w-6 font-bold">{bg.anzahl}</span>
                      <span>Elemente in {bg.guete}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Volumen nach Betongüten gruppiert (13) */}
              <div className="bg-[#E8F5E9] rounded border border-emerald-200 p-2.5">
                <h4 className="font-semibold text-slate-800 border-b border-emerald-200 pb-1 mb-2">
                  Volumen nach Betongüten gruppiert (13)
                </h4>
                <div className="space-y-1 text-[11px]">
                  {data?.betongueten_volumen?.map((bg, idx) => (
                    <div key={idx} className="flex justify-between text-slate-800 font-medium">
                      <span>in {bg.guete} :</span>
                      <span className="font-bold">{bg.volumen_m3} m³</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Stapel mit Gewichte (10) & Stapel mit Elementen */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-white rounded border border-slate-300 p-2.5">
                  <h4 className="font-semibold text-slate-800 border-b border-slate-200 pb-1 mb-1.5">
                    Stapel mit Gewichte (10)
                  </h4>
                  <div className="text-[11px] text-slate-700">
                    {data?.stapel_gewichte?.map((st, i) => (
                      <div key={i} className="flex justify-between">
                        <span>Stapel {st.stapel_nr}: {st.gewicht_to} to</span>
                        <span>Trailerzahl: {st.trailerzahl}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded border border-slate-300 p-2.5">
                  <h4 className="font-semibold text-slate-800 border-b border-slate-200 pb-1 mb-1.5">
                    Stapel mit Elementen
                  </h4>
                  <div className="text-[11px] text-slate-700">
                    {data?.stapel_elemente?.map((st, i) => (
                      <div key={i}>{st.description}</div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Elektro-Bauteile (7) & Maueranker (9) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-[#E8F5E9] rounded border border-emerald-200 p-2.5">
                  <h4 className="font-semibold text-slate-800 border-b border-emerald-200 pb-1 mb-1">
                    Elektro-Bauteile (7)
                  </h4>
                  <p className="text-slate-600 text-[11px]">
                    {data?.elektro_bauteile || 'Keine Elektro-Einbauteile gefunden.'}
                  </p>
                </div>

                <div className="bg-[#E8F5E9] rounded border border-emerald-200 p-2.5">
                  <h4 className="font-semibold text-slate-800 border-b border-emerald-200 pb-1 mb-1">
                    Maueranker (9)
                  </h4>
                  <p className="text-slate-600 text-[11px]">
                    {data?.maueranker || 'Keine Maueranker gefunden.'}
                  </p>
                </div>
              </div>

              {/* Warennummern (AU + EBT) */}
              <div className="bg-[#E0F7FA] rounded border border-cyan-300 p-2.5">
                <h4 className="font-semibold text-slate-800 border-b border-cyan-300 pb-1 mb-2">
                  Warennummern (AU + EBT)
                </h4>
                <div className="max-h-36 overflow-y-auto space-y-1 text-[11px] pr-1">
                  {data?.ebt_items?.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-slate-800 font-medium border-b border-cyan-100/60 pb-0.5">
                      <span>{item.display}</span>
                      <span className="font-bold shrink-0 ml-2">Menge : {item.wmenge}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* COLUMN 3 (Width: 3.5 / 12 - Right Panel & Summary Boxes) */}
            <div className="lg:col-span-3 space-y-3">
              
              {/* Betonsorten nass / trocken (5) */}
              <div className="bg-white rounded border border-slate-300 p-2.5 space-y-2">
                <h4 className="font-semibold text-slate-800 border-b border-slate-200 pb-1">
                  Betonsorten nass / trocken (5)
                </h4>
                <div className="space-y-1 text-[11px]">
                  <div className="flex justify-between text-slate-700">
                    <span>Fläche im Nassverfahren :</span>
                    <span className="font-medium">{data?.nass_trocken?.flaeche_nass_m2} m² ({data?.nass_trocken?.prozent_nass}%)</span>
                  </div>
                  <div className="flex justify-between text-slate-700">
                    <span>Fläche im Trockenverfahren :</span>
                    <span className="font-medium">{data?.nass_trocken?.flaeche_trocken_m2} m² ({data?.nass_trocken?.prozent_trocken}%)</span>
                  </div>
                  <div className="border-t border-slate-200 pt-1 flex justify-between font-bold text-slate-900">
                    <span>Fläche Gesamt :</span>
                    <span>{data?.nass_trocken?.flaeche_gesamt_m2} m²</span>
                  </div>
                  <div className="flex justify-between text-slate-700">
                    <span>Elemente Nass :</span>
                    <span>{data?.nass_trocken?.elemente_nass}</span>
                  </div>
                </div>

                {/* Legend Chart box (Blue vs Light Blue) */}
                <div className="bg-slate-50 p-2 border border-slate-200 rounded flex items-center space-x-4 text-[11px] justify-center mt-2">
                  <div className="flex items-center space-x-1.5">
                    <span className="w-3 h-3 bg-slate-900 inline-block border border-slate-700"></span>
                    <span className="text-slate-700 font-medium">Nassverfahren</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <span className="w-3 h-3 bg-cyan-200 inline-block border border-cyan-400"></span>
                    <span className="text-slate-700 font-medium">Trockenverfahren</span>
                  </div>
                </div>
              </div>

              {/* Elementanzahl & Wendeelemente KPI Card (Yellow Box) */}
              <div className="bg-[#FFF9C4] rounded border border-amber-300 p-3 space-y-2">
                <div className="flex justify-between items-center text-[12px] font-semibold text-slate-800">
                  <span>Elementanzahl:</span>
                  <input
                    type="text"
                    readOnly
                    value={data?.elementanzahl || 0}
                    className="w-16 px-2 py-0.5 bg-white border border-amber-300 text-center font-bold text-slate-900 rounded shadow-inner"
                  />
                </div>
                <div className="flex justify-between items-center text-[12px] font-semibold text-slate-800">
                  <span>davon Wendeelemente:</span>
                  <input
                    type="text"
                    readOnly
                    value={data?.wendeelemente || 0}
                    className="w-16 px-2 py-0.5 bg-white border border-amber-300 text-center font-bold text-slate-900 rounded shadow-inner"
                  />
                </div>
              </div>

              {/* schwerstes Element Box */}
              <div className="bg-[#FFF9C4] rounded border border-amber-300 p-2.5">
                <h5 className="font-semibold text-slate-800 border-b border-amber-200 pb-1 mb-1">
                  schwerstes Element
                </h5>
                <p className="text-slate-800 text-[11px] font-medium">
                  {data?.schwerstes_element || 'Element 26 ist mit 7,072 kg das schwerste Element.'}
                </p>
              </div>

              {/* Dachschrägen Box */}
              <div className="bg-[#FFF9C4] rounded border border-amber-300 p-2.5">
                <h5 className="font-semibold text-slate-800 mb-0.5">
                  Dachschrägen
                </h5>
                <p className="text-slate-600 text-[11px]">
                  {data?.dachschraegen}
                </p>
              </div>

              {/* Customer & Project Box */}
              <div className="bg-white rounded border border-slate-300 p-3 space-y-1 text-[11px]">
                <div className="flex justify-between text-slate-700">
                  <span className="font-medium text-slate-600">Kunde:</span>
                  <span className="font-bold text-slate-900">{data?.auftraggeber}</span>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span className="font-medium text-slate-600">Projekt:</span>
                  <span className="font-bold text-slate-900">{data?.bauvorhaben}</span>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span className="font-medium text-slate-600">Bearbeiter:</span>
                  <span className="font-bold text-slate-900">{data?.bearbeiter}</span>
                </div>
              </div>
            </div>

          </div>

          {/* BOTTOM FULL-WIDTH CONSOLE LOG PANEL */}
          <div className="bg-white rounded border border-slate-300 shadow-sm p-3 font-mono text-[11px]">
            <div className="max-h-24 overflow-y-auto space-y-0.5 text-slate-700">
              {data?.logs?.map((logLine, idx) => (
                <div key={idx}>{logLine}</div>
              ))}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
