import React, { useState, useRef } from 'react';
import { 
  generateExactProductionPlan, 
  parseTischplanText, 
  getElementTextColor 
} from '../../utils/tischplanParser';

export function TischplanReader() {
  const [data, setData] = useState(() => generateExactProductionPlan());
  const [inputFilePath, setInputFilePath] = useState('p:\\Tisch_Planung\\11-09-2026.txt');
  const [tableNotes, setTableNotes] = useState({});
  const fileInputRef = useRef(null);

  const [protocol, setProtocol] = useState({
    h1Temp9: '',
    h1Temp15: '',
    h1Proben: '',
    h1Unterschrift: '',
    h2Temp9: '',
    h2Temp15: '',
    h2Proben: '',
    h2Unterschrift: ''
  });

  const handleProtocolChange = (field, value) => {
    setProtocol(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFileUpload = (file) => {
    if (!file) return;
    setInputFilePath(`p:\\Tisch_Planung\\${file.name}`);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target.result;
        const parsed = parseTischplanText(text, file.name);
        setData(parsed);
      } catch (err) {
        console.error('Fehler beim Parsen der Datei:', err);
      }
    };
    reader.readAsText(file, 'ISO-8859-1');
  };

  const handleNoteChange = (tischId, value) => {
    setTableNotes(prev => ({
      ...prev,
      [tischId]: value
    }));
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="tischplan-container w-full bg-white text-slate-900 font-sans text-xs select-none">
      
      {/* 1. TOP CONTROLS BAR (Exact Desktop WPF Style) */}
      <div className="flex items-center space-x-2 p-2.5 bg-[#f8f9fa] border border-slate-300 rounded-t-xl print:hidden">
        {/* Datei laden button */}
        <button
          onClick={() => fileInputRef.current?.click()}
          className="px-3.5 py-1 bg-[#f0f0f0] hover:bg-[#e4e4e4] active:bg-[#d8d8d8] text-slate-800 font-normal border border-[#999999] rounded-[2px] text-xs shadow-2xs transition-colors cursor-pointer"
        >
          Datei laden
        </button>

        {/* Hidden file input */}
        <input
          type="file"
          ref={fileInputRef}
          accept=".txt,.csv"
          className="hidden"
          onChange={(e) => handleFileUpload(e.target.files[0])}
        />

        {/* Drucken button */}
        <button
          onClick={handlePrint}
          className="px-3.5 py-1 bg-[#f0f0f0] hover:bg-[#e4e4e4] active:bg-[#d8d8d8] text-slate-800 font-normal border border-[#999999] rounded-[2px] text-xs shadow-2xs transition-colors cursor-pointer"
        >
          Drucken
        </button>

        {/* Filepath input text box */}
        <div className="w-80">
          <input
            type="text"
            value={inputFilePath}
            onChange={(e) => setInputFilePath(e.target.value)}
            className="w-full px-2 py-0.5 bg-white border border-[#999999] rounded-[2px] font-mono text-[11px] text-slate-800 focus:outline-none focus:border-blue-500"
            placeholder="p:\Tisch_Planung\..."
          />
        </div>
      </div>

      {/* 2. PRINTABLE MAIN CANVAS CONTAINER */}
      <div className="p-4 sm:p-5 bg-white border border-slate-300 border-t-0 rounded-b-xl shadow-xs space-y-3.5 print:p-0 print:border-none print:shadow-none print:space-y-1.5">
        
        {/* File Metadata & Volume Overview Box */}
        <div className="flex flex-col lg:flex-row items-stretch gap-2.5 text-[10.5px] print:gap-1.5">
          {/* Left: Datei & Datum */}
          <div className="p-2 border border-[#d0d0d0] rounded-[2px] bg-[#fafafa] space-y-0.5 min-w-[250px] print:p-1">
            <div>
              <span className="font-bold text-slate-700">Datei: </span>
              <span className="font-mono text-slate-900">{data?.filePath || 'p:\\Tisch_Planung\\11-09-2026.txt'}</span>
            </div>
            <div>
              <span className="font-bold text-slate-700">Datum: </span>
              <span className="font-mono text-slate-900">{data?.date1 || '11.09.2026'} &nbsp;&nbsp;&nbsp;&nbsp; {data?.date2 || '11.09.2026'}</span>
            </div>
          </div>

          {/* Right: Übersicht Volume Breakdown */}
          <div className="flex-1 p-2 border border-[#d0d0d0] rounded-[2px] bg-[#fafafa] leading-snug print:p-1">
            <span className="font-bold text-slate-800">Übersicht:</span>
            <div className="mt-0.5 text-[10px] print:text-[9px] font-mono text-slate-800 flex flex-wrap gap-x-1">
              {data?.overviewVolumes?.map((item, idx) => (
                <span key={idx} className="whitespace-nowrap">
                  || in <span className="font-semibold">{item.name}</span> = <span className="font-bold text-slate-900">{item.volume}</span>
                </span>
              ))}
              <span className="font-bold text-slate-950 whitespace-nowrap">
                || Gesamtvolumen: {data?.gesamtvolumenStr || '159,213 m³'}
              </span>
              <span className="font-bold text-slate-950 whitespace-nowrap">
                || Gesamtgewicht: {data?.gesamtgewichtStr || '284,03 to'}
              </span>
              <span className="font-bold text-slate-950 whitespace-nowrap">
                || Gesamt-Nettofläche: {data?.gesamtNettoFlaecheStr || '955,849 m²'}
              </span>
              <span className="font-bold text-slate-950 whitespace-nowrap">
                || Gesamt-Netto Gewicht: {data?.gesamtNettoGewichtStr || '280.734 kg'}
              </span>
            </div>
          </div>
        </div>

        {/* 3. HALLE 1 CONTAINER */}
        <div className="p-3 rounded-[3px] border-[1.5px] border-[#F5C2C7] bg-[#FFF5F5] print:p-1.5">
          <h3 className="text-xs font-bold text-[#842029] mb-2 print:mb-1 print:text-[11px]">
            Halle 1
          </h3>

          {/* Top Row: Tische 10 bis 18 */}
          <div className="grid grid-cols-9 gap-1.5 mb-2 items-stretch print:gap-1 print:mb-1">
            {data?.halle1?.rowTop?.map((table) => {
              const tableId = `h1-${table.tischNumber}`;
              return (
                <TableGridBox 
                  key={tableId} 
                  table={table} 
                  tableId={tableId}
                  note={tableNotes[tableId] || ''}
                  onNoteChange={handleNoteChange}
                />
              );
            })}
          </div>

          {/* Bottom Row: Tische 1 bis 9 */}
          <div className="grid grid-cols-9 gap-1.5 mb-2 items-stretch print:gap-1 print:mb-1">
            {data?.halle1?.rowBottom?.map((table) => {
              const tableId = `h1-${table.tischNumber}`;
              return (
                <TableGridBox 
                  key={tableId} 
                  table={table} 
                  tableId={tableId}
                  note={tableNotes[tableId] || ''}
                  onNoteChange={handleNoteChange}
                />
              );
            })}
          </div>

          {/* Halle 1 Footer Totals */}
          <div className="pt-1.5 border-t border-red-200/80 flex flex-wrap items-center gap-x-5 text-[10.5px] print:text-[9.5px]">
            <span className="font-bold text-slate-900">
              Halle 1: <span className="font-mono font-bold text-black">{data?.halle1?.flaecheTotal || '527,343 m²'}</span>
            </span>
            <span className="font-bold text-[#004080]">
              TROCKEN: <span className="font-mono">{data?.halle1?.trocken || '489,971 m²'}</span>
            </span>
            <span className="font-bold text-[#842029]">
              NASS: <span className="font-mono">{data?.halle1?.nass || '37,372 m²'}</span>
            </span>
            <span className="font-semibold text-slate-700">
              Nettofläche: <span className="font-mono">{data?.halle1?.nettoFlaeche || '520,86 m²'}</span>
            </span>
            <span className="font-bold text-[#9A3412]">
              GEWICHT: <span className="font-mono">{data?.halle1?.gewichtTo || '179,76 to'}</span>
            </span>
            <span className="font-semibold text-slate-700">
              Netto Gewicht: <span className="font-mono">{data?.halle1?.nettoGewichtKg || '177.018 kg'}</span>
            </span>
          </div>
        </div>

        {/* 4. HALLE 2 CONTAINER */}
        <div className="p-3 rounded-[3px] border-[1.5px] border-[#FFE69C] bg-[#FFFDF0] print:p-1.5">
          <h3 className="text-xs font-bold text-[#664D03] mb-2 print:mb-1 print:text-[11px]">
            Halle 2
          </h3>

          {/* Top Row: Tische 10 bis 18 */}
          <div className="grid grid-cols-9 gap-1.5 mb-2 items-stretch print:gap-1 print:mb-1">
            {data?.halle2?.rowTop?.map((table) => {
              const tableId = `h2-${table.tischNumber}`;
              return (
                <TableGridBox 
                  key={tableId} 
                  table={table} 
                  tableId={tableId}
                  note={tableNotes[tableId] || ''}
                  onNoteChange={handleNoteChange}
                />
              );
            })}
          </div>

          {/* Bottom Row: Tische 1 bis 9 */}
          <div className="grid grid-cols-9 gap-1.5 mb-2 items-stretch print:gap-1 print:mb-1">
            {data?.halle2?.rowBottom?.map((table) => {
              const tableId = `h2-${table.tischNumber}`;
              return (
                <TableGridBox 
                  key={tableId} 
                  table={table} 
                  tableId={tableId}
                  note={tableNotes[tableId] || ''}
                  onNoteChange={handleNoteChange}
                />
              );
            })}
          </div>


          {/* Halle 2 Footer Totals */}
          <div className="pt-1.5 border-t border-amber-200/80 flex flex-wrap items-center gap-x-5 text-[10.5px] print:text-[9.5px]">
            <span className="font-bold text-slate-900">
              Halle 2: <span className="font-mono font-bold text-black">{data?.halle2?.flaecheTotal || '438,886 m²'}</span>
            </span>
            <span className="font-bold text-[#004080]">
              TROCKEN: <span className="font-mono">{data?.halle2?.trocken || '413,935 m²'}</span>
            </span>
            <span className="font-bold text-[#842029]">
              NASS: <span className="font-mono">{data?.halle2?.nass || '24,951 m²'}</span>
            </span>
            <span className="font-semibold text-slate-700">
              Nettofläche: <span className="font-mono">{data?.halle2?.nettoFlaeche || '434,989 m²'}</span>
            </span>
            <span className="font-bold text-[#9A3412]">
              GEWICHT: <span className="font-mono">{data?.halle2?.gewichtTo || '104,28 to'}</span>
            </span>
            <span className="font-semibold text-slate-700">
              Netto Gewicht: <span className="font-mono">{data?.halle2?.nettoGewichtKg || '103.716 kg'}</span>
            </span>
          </div>
        </div>

        {/* 5. GESAMT SUMMARY ROW */}
        <div className="flex flex-wrap items-center gap-x-6 text-[11px] font-bold text-slate-900 px-1 py-1 print:text-[10px]">
          <span>
            Gesamt: <span className="font-mono font-black">{data?.gesamt?.flaecheTotal || '966,229 m²'}</span>
          </span>
          <span className="text-[#004080]">
            TROCKEN: <span className="font-mono font-black">{data?.gesamt?.trocken || '903,906 m²'}</span>
          </span>
          <span className="text-[#842029]">
            NASS: <span className="font-mono font-black">{data?.gesamt?.nass || '62,323 m²'}</span>
          </span>
          <span>
            Nettofläche: <span className="font-mono font-bold">{data?.gesamt?.nettoFlaeche || '955,849 m²'}</span>
          </span>
          <span className="text-[#9A3412]">
            GEWICHT: <span className="font-mono font-black">{data?.gesamt?.gewichtTo || '284,03 to'}</span>
          </span>
          <span>
            Netto Gewicht: <span className="font-mono font-bold">{data?.gesamt?.nettoGewichtKg || '280.734 kg'}</span>
          </span>
        </div>

        {/* 6. MISCHMEISTER PROTOCOL & SIGNATURE BLOCK */}
        <ProtocolBlock protocol={protocol} onChange={handleProtocolChange} />

      </div>
    </div>
  );
}

/**
 * Individual Table Grid Box with Editable Note Line right above bottom footer
 */
function TableGridBox({ table, tableId, note, onNoteChange }) {
  const hasElements = table?.elements && table.elements.length > 0;

  // Format header text to highlight ROT in red
  const renderHeader = (headerText) => {
    if (!headerText) return null;
    const parts = headerText.split('ROT');
    if (parts.length > 1) {
      return (
        <div className="text-center font-bold text-[10px] print:text-[9px] text-slate-900 truncate mb-0.5">
          {parts[0]} <span className="text-[#D32F2F] font-extrabold">ROT</span> {parts[1]}
        </div>
      );
    }
    return (
      <div className="text-center font-bold text-[10px] print:text-[9px] text-slate-900 truncate mb-0.5">
        {headerText}
      </div>
    );
  };

  return (
    <div className="flex flex-col items-center w-full h-full justify-between">
      {/* Table Header */}
      {renderHeader(table?.headerText)}

      {/* Table Content Box (Harmonious Auto Height to show all elements without scrollbars) */}
      <div className="w-full bg-white border border-[#b8b8b8] rounded-[2px] p-1 flex flex-col justify-between min-h-[112px] h-full shadow-2xs">
        
        {/* Top: Elements list area (all elements fully visible) */}
        <div className="flex-1 space-y-0.5 font-mono text-[7.5px] print:text-[6.5px] leading-[9.5px] print:leading-[8px] pb-1">
          {hasElements ? (
            table.elements.map((elText, idx) => (
              <div 
                key={idx} 
                className="truncate font-semibold"
                style={{ color: getElementTextColor(elText) }}
                title={elText}
              >
                {elText}
              </div>
            ))
          ) : (
            <div className="h-full flex items-center justify-center text-[8px] text-slate-300 italic min-h-[40px]">
              {/* Empty space */}
            </div>
          )}
        </div>


        {/* Middle/Bottom: Interactive Anmerkung / Annotation Line */}
        <div className="pt-0.5">
          <input
            type="text"
            value={note}
            onChange={(e) => onNoteChange(tableId, e.target.value)}
            placeholder="..."
            title="Anotationen / Anmerkungen eintragen"
            className="w-full bg-transparent font-mono text-[8px] print:text-[7px] text-[#DC2626] font-bold focus:outline-none focus:bg-amber-50/70 border-b border-transparent hover:border-slate-300 focus:border-blue-400 px-0.5 py-0 truncate transition-colors"
          />
        </div>

        {/* Tisch Footer Bar (Line + Area m² + Weight to) */}
        <div className="pt-0.5 border-t border-[#b8b8b8] flex items-center justify-between font-mono text-[8px] print:text-[7px] text-slate-800 font-bold px-0.5">
          <span className="truncate">{table?.flaecheStr || '0 m²'}</span>
          {table?.weightStr && table.weightStr !== '0,00 to' && (
            <span className="text-slate-600 font-semibold whitespace-nowrap pl-1">{table.weightStr}</span>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Interactive Mischmeister Protocol & Signature Block
 */
function ProtocolBlock({ protocol, onChange }) {
  return (
    <div className="p-3 rounded-[3px] border-[1.5px] border-[#B6D4FE] bg-[#F8FAFF] space-y-2.5 print:p-1.5 print:space-y-1">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-[10.5px] print:grid-cols-2 print:gap-3 print:text-[9.5px]">
        {/* Halle 1 Protocol */}
        <div className="space-y-1.5 print:space-y-0.5">
          <div className="font-bold text-slate-900">Halle 1</div>
          <div className="text-slate-700 flex flex-wrap items-center gap-x-1.5">
            <span className="font-medium">Temperatur:</span> &nbsp;
            <span>9:00 Uhr:</span>
            <input
              type="text"
              value={protocol?.h1Temp9 || ''}
              onChange={(e) => onChange('h1Temp9', e.target.value)}
              className="w-24 border-b border-slate-600 bg-transparent text-slate-900 font-mono text-[11px] px-1 focus:outline-none focus:border-blue-600 focus:bg-amber-50/70 transition-colors"
            />
            &nbsp;&nbsp;
            <span>15:00 Uhr:</span>
            <input
              type="text"
              value={protocol?.h1Temp15 || ''}
              onChange={(e) => onChange('h1Temp15', e.target.value)}
              className="w-24 border-b border-slate-600 bg-transparent text-slate-900 font-mono text-[11px] px-1 focus:outline-none focus:border-blue-600 focus:bg-amber-50/70 transition-colors"
            />
          </div>
          <div className="text-slate-700 flex items-center gap-x-2">
            <span className="font-medium">Probenanzahl Halle 1:</span>
            <input
              type="text"
              value={protocol?.h1Proben || ''}
              onChange={(e) => onChange('h1Proben', e.target.value)}
              className="w-44 border-b border-slate-600 bg-transparent text-slate-900 font-mono text-[11px] px-1 focus:outline-none focus:border-blue-600 focus:bg-amber-50/70 transition-colors"
            />
          </div>
          <div className="pt-1 text-slate-700 flex flex-col">
            <div className="flex items-center gap-x-2">
              <span className="font-medium">Datum/Unterschrift:</span>
              <input
                type="text"
                value={protocol?.h1Unterschrift || ''}
                onChange={(e) => onChange('h1Unterschrift', e.target.value)}
                className="w-52 border-b border-slate-600 bg-transparent text-slate-900 font-mono text-[11px] px-1 focus:outline-none focus:border-blue-600 focus:bg-amber-50/70 transition-colors"
              />
            </div>
            <span className="block text-[9px] text-slate-500 mt-0.5">Mischmeister</span>
          </div>
        </div>

        {/* Halle 2 Protocol */}
        <div className="space-y-1.5 print:space-y-0.5">
          <div className="font-bold text-slate-900">Halle 2</div>
          <div className="text-slate-700 flex flex-wrap items-center gap-x-1.5">
            <span className="font-medium">Temperatur:</span> &nbsp;
            <span>9:00 Uhr:</span>
            <input
              type="text"
              value={protocol?.h2Temp9 || ''}
              onChange={(e) => onChange('h2Temp9', e.target.value)}
              className="w-24 border-b border-slate-600 bg-transparent text-slate-900 font-mono text-[11px] px-1 focus:outline-none focus:border-blue-600 focus:bg-amber-50/70 transition-colors"
            />
            &nbsp;&nbsp;
            <span>15:00 Uhr:</span>
            <input
              type="text"
              value={protocol?.h2Temp15 || ''}
              onChange={(e) => onChange('h2Temp15', e.target.value)}
              className="w-24 border-b border-slate-600 bg-transparent text-slate-900 font-mono text-[11px] px-1 focus:outline-none focus:border-blue-600 focus:bg-amber-50/70 transition-colors"
            />
          </div>
          <div className="text-slate-700 flex items-center gap-x-2">
            <span className="font-medium">Probenanzahl Halle 2:</span>
            <input
              type="text"
              value={protocol?.h2Proben || ''}
              onChange={(e) => onChange('h2Proben', e.target.value)}
              className="w-44 border-b border-slate-600 bg-transparent text-slate-900 font-mono text-[11px] px-1 focus:outline-none focus:border-blue-600 focus:bg-amber-50/70 transition-colors"
            />
          </div>
          <div className="pt-1 text-slate-700 flex flex-col">
            <div className="flex items-center gap-x-2">
              <span className="font-medium">Datum/Unterschrift:</span>
              <input
                type="text"
                value={protocol?.h2Unterschrift || ''}
                onChange={(e) => onChange('h2Unterschrift', e.target.value)}
                className="w-52 border-b border-slate-600 bg-transparent text-slate-900 font-mono text-[11px] px-1 focus:outline-none focus:border-blue-600 focus:bg-amber-50/70 transition-colors"
              />
            </div>
            <span className="block text-[9px] text-slate-500 mt-0.5">Mischmeister</span>
          </div>
        </div>
      </div>

      {/* Official Mischmeister Small Note */}
      <div className="pt-1.5 border-t border-blue-200/60 text-[8.5px] print:text-[7.5px] italic text-slate-500 leading-tight">
        Hinweis für Mischmeister: Temperaturen eintragen - produzierte Tische wird mit Unterschrift quittiert - Rezeptabweichungen werden auf den Tischen markiert - Nicht produzierte Tische/Elemente werden markiert
      </div>
    </div>
  );
}

