import React, { useState, useRef } from 'react';
import { 
  generateExactProductionPlan, 
  parseTischplanText, 
  getElementTextColor 
} from '../../utils/tischplanParser';

export function TischplanReader() {
  const [data, setData] = useState(() => generateExactProductionPlan());
  const [inputFilePath, setInputFilePath] = useState('P:\\Tisch_Planung\\24-08-2026.txt');
  const fileInputRef = useRef(null);

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

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="tischplan-container w-full bg-white text-slate-900 font-sans text-xs select-none">
      
      {/* 1. TOP CONTROLS BAR (Exact Desktop Style) */}
      <div className="flex items-center space-x-2 p-3 bg-[#f8f9fa] border border-slate-300 rounded-t-xl print:hidden">
        {/* Datei laden button */}
        <button
          onClick={() => fileInputRef.current?.click()}
          className="px-3.5 py-1.5 bg-[#f0f0f0] hover:bg-[#e4e4e4] active:bg-[#d8d8d8] text-slate-800 font-normal border border-[#999999] rounded-[3px] text-xs shadow-2xs transition-colors cursor-pointer"
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
          className="px-3.5 py-1.5 bg-[#f0f0f0] hover:bg-[#e4e4e4] active:bg-[#d8d8d8] text-slate-800 font-normal border border-[#999999] rounded-[3px] text-xs shadow-2xs transition-colors cursor-pointer"
        >
          Drucken
        </button>

        {/* Filepath input text box */}
        <div className="flex-1 max-w-md">
          <input
            type="text"
            value={inputFilePath}
            onChange={(e) => setInputFilePath(e.target.value)}
            className="w-full px-2.5 py-1 bg-white border border-[#999999] rounded-[3px] font-mono text-[11px] text-slate-800 focus:outline-none focus:border-blue-500"
            placeholder="p:\Tisch_Planung\..."
          />
        </div>
      </div>

      {/* 2. PRINTABLE MAIN CANVAS CONTAINER */}
      <div className="p-4 sm:p-5 bg-white border border-slate-300 border-t-0 rounded-b-xl shadow-xs space-y-4 print:p-0 print:border-none print:shadow-none print:space-y-2">
        
        {/* File Metadata & Volume Overview Box */}
        <div className="flex flex-col lg:flex-row items-stretch gap-3 text-[11px] print:gap-2">
          {/* Left: Datei & Datum */}
          <div className="p-2 border border-[#d0d0d0] rounded-[2px] bg-[#fafafa] space-y-1 min-w-[260px] print:p-1.5">
            <div>
              <span className="font-bold text-slate-700">Datei: </span>
              <span className="font-mono text-slate-900">{data?.filePath || 'p:\\Tisch_Planung\\24-08-2026.txt'}</span>
            </div>
            <div>
              <span className="font-bold text-slate-700">Datum: </span>
              <span className="font-mono text-slate-900">{data?.date1 || '24.08.2026'} &nbsp;&nbsp;&nbsp;&nbsp; {data?.date2 || '24.08.2026'}</span>
            </div>
          </div>

          {/* Right: Übersicht Volume Breakdown */}
          <div className="flex-1 p-2 border border-[#d0d0d0] rounded-[2px] bg-[#fafafa] leading-snug print:p-1.5">
            <span className="font-bold text-slate-800">Übersicht:</span>
            <div className="mt-0.5 text-[10.5px] print:text-[9.5px] font-mono text-slate-800 flex flex-wrap gap-x-1.5">
              {data?.overviewVolumes?.map((item, idx) => (
                <span key={idx} className="whitespace-nowrap">
                  || in <span className="font-semibold">{item.name}</span> = <span className="font-bold text-slate-900">{item.volume}</span>
                </span>
              ))}
              <span className="font-bold text-slate-950 whitespace-nowrap">
                || Gesamtvolumen: {data?.gesamtvolumenStr || '162,408 m³'}
              </span>
            </div>
          </div>
        </div>

        {/* 3. HALLE 1 CONTAINER */}
        <div className="p-3.5 rounded-[4px] border-[1.5px] border-[#F5C2C7] bg-[#FFF5F5] print:p-2">
          <h3 className="text-sm font-bold text-[#842029] mb-3 print:mb-1.5 print:text-xs">
            Halle 1
          </h3>

          {/* Top Row: Tische 10 bis 18 */}
          <div className="grid grid-cols-9 gap-2 mb-3 print:gap-1.5 print:mb-1.5">
            {data?.halle1?.rowTop?.map((table) => (
              <TableGridBox key={`h1-top-${table.tischNumber}`} table={table} />
            ))}
          </div>

          {/* Bottom Row: Tische 1 bis 9 */}
          <div className="grid grid-cols-9 gap-2 mb-3 print:gap-1.5 print:mb-1.5">
            {data?.halle1?.rowBottom?.map((table) => (
              <TableGridBox key={`h1-bot-${table.tischNumber}`} table={table} />
            ))}
          </div>

          {/* Halle 1 Footer Totals */}
          <div className="pt-2 border-t border-red-200/80 flex items-center space-x-6 text-[11px] font-bold print:pt-1 print:text-[10px]">
            <span className="text-slate-900">
              Halle 1: <span className="font-mono font-bold text-black">{data?.halle1?.flaecheTotal || '483,553 m²'}</span>
            </span>
            <span className="text-[#004080]">
              TROCKEN: <span className="font-mono font-bold">{data?.halle1?.trocken || '448,903 m²'}</span>
            </span>
            <span className="text-[#842029]">
              NASS: <span className="font-mono font-bold">{data?.halle1?.nass || '34,65 m²'}</span>
            </span>
          </div>
        </div>

        {/* 4. HALLE 2 CONTAINER */}
        <div className="p-3.5 rounded-[4px] border-[1.5px] border-[#FFE69C] bg-[#FFFDF0] print:p-2">
          <h3 className="text-sm font-bold text-[#664D03] mb-3 print:mb-1.5 print:text-xs">
            Halle 2
          </h3>

          {/* Top Row: Tische 10 bis 18 */}
          <div className="grid grid-cols-9 gap-2 mb-3 print:gap-1.5 print:mb-1.5">
            {data?.halle2?.rowTop?.map((table) => (
              <TableGridBox key={`h2-top-${table.tischNumber}`} table={table} />
            ))}
          </div>

          {/* Bottom Row: Tische 1 bis 9 */}
          <div className="grid grid-cols-9 gap-2 mb-3 print:gap-1.5 print:mb-1.5">
            {data?.halle2?.rowBottom?.map((table) => (
              <TableGridBox key={`h2-bot-${table.tischNumber}`} table={table} />
            ))}
          </div>

          {/* Halle 2 Footer Totals */}
          <div className="pt-2 border-t border-amber-200/80 flex items-center space-x-6 text-[11px] font-bold print:pt-1 print:text-[10px]">
            <span className="text-slate-900">
              Halle 2: <span className="font-mono font-bold text-black">{data?.halle2?.flaecheTotal || '425,925 m²'}</span>
            </span>
            <span className="text-[#004080]">
              TROCKEN: <span className="font-mono font-bold">{data?.halle2?.trocken || '410,794 m²'}</span>
            </span>
            <span className="text-[#842029]">
              NASS: <span className="font-mono font-bold">{data?.halle2?.nass || '15,131 m²'}</span>
            </span>
          </div>
        </div>

        {/* Gesamt Footer */}
        <div className="text-[12px] font-bold text-slate-900 px-1 print:text-[11px]">
          Gesamt: <span className="font-mono text-black">{data?.gesamtFlaecheStr || '909,478 m²'}</span>
        </div>

        {/* 5. PROTOCOL & SIGNATURES BOX (Mischmeister & Labor) */}
        <div className="p-3 rounded-[4px] border-[1.5px] border-[#B6D4FE] bg-[#F8FAFF] space-y-3 print:p-2 print:space-y-1.5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-[11px] print:grid-cols-2 print:gap-4 print:text-[10px]">
            {/* Halle 1 Protocol */}
            <div className="space-y-2 print:space-y-1">
              <div className="font-bold text-slate-900">Halle 1</div>
              <div className="text-slate-700">
                <span className="font-medium">Temperatur:</span> &nbsp;&nbsp; 
                9:00 Uhr: <span className="inline-block w-24 border-b border-slate-500"></span> &nbsp;&nbsp;&nbsp;&nbsp; 
                15:00 Uhr: <span className="inline-block w-24 border-b border-slate-500"></span>
              </div>
              <div className="text-slate-700">
                <span className="font-medium">Probenanzahl Halle 1:</span> <span className="inline-block w-40 border-b border-slate-500"></span>
              </div>
              <div className="pt-2 print:pt-1 text-slate-700">
                <span className="font-medium">Datum/Unterschrift:</span> <span className="inline-block w-48 border-b border-slate-500"></span>
                <span className="block text-[9.5px] print:text-[8.5px] text-slate-500 mt-0.5">Mischmeister</span>
              </div>
            </div>

            {/* Halle 2 Protocol */}
            <div className="space-y-2 print:space-y-1">
              <div className="font-bold text-slate-900">Halle 2</div>
              <div className="text-slate-700">
                <span className="font-medium">Temperatur:</span> &nbsp;&nbsp; 
                9:00 Uhr: <span className="inline-block w-24 border-b border-slate-500"></span> &nbsp;&nbsp;&nbsp;&nbsp; 
                15:00 Uhr: <span className="inline-block w-24 border-b border-slate-500"></span>
              </div>
              <div className="text-slate-700">
                <span className="font-medium">Probenanzahl Halle 2:</span> <span className="inline-block w-40 border-b border-slate-500"></span>
              </div>
              <div className="pt-2 print:pt-1 text-slate-700">
                <span className="font-medium">Datum/Unterschrift:</span> <span className="inline-block w-48 border-b border-slate-500"></span>
                <span className="block text-[9.5px] print:text-[8.5px] text-slate-500 mt-0.5">Mischmeister</span>
              </div>
            </div>
          </div>

          {/* Official Mischmeister Small Note */}
          <div className="pt-2 border-t border-blue-200/60 text-[9px] print:text-[8px] italic text-slate-500 leading-tight">
            Hinweis für Mischmeister: Temperaturen eintragen - produzierte Tische wird mit Unterschrift quittiert - Rezeptabweichungen werden auf den Tischen markiert - Nicht produzierte Tische/Elemente werden markiert
          </div>
        </div>

      </div>
    </div>
  );
}

/**
 * Individual Table Grid Box (Exact reproduction of WPF table card)
 */
function TableGridBox({ table }) {
  const hasElements = table?.elements && table.elements.length > 0;

  // Format header text to highlight ROT in red
  const renderHeader = (headerText) => {
    if (!headerText) return null;
    const parts = headerText.split('ROT');
    if (parts.length > 1) {
      return (
        <div className="text-center font-bold text-[10.5px] print:text-[9.5px] text-slate-900 truncate mb-1">
          {parts[0]} <span className="text-[#D32F2F] font-extrabold">ROT</span> {parts[1]}
        </div>
      );
    }
    return (
      <div className="text-center font-bold text-[10.5px] print:text-[9.5px] text-slate-900 truncate mb-1">
        {headerText}
      </div>
    );
  };

  return (
    <div className="flex flex-col items-center">
      {/* Table Header */}
      {renderHeader(table?.headerText)}

      {/* Table Content Box */}
      <div className="w-full bg-white border border-[#b8b8b8] rounded-[2px] p-1 h-24 print:h-[78px] overflow-y-auto print:overflow-hidden overflow-x-hidden shadow-2xs">
        {hasElements ? (
          <div className="space-y-0.5 font-mono text-[8px] print:text-[7px] leading-[10px] print:leading-[8.5px]">
            {table.elements.map((elText, idx) => (
              <div 
                key={idx} 
                className="truncate font-semibold"
                style={{ color: getElementTextColor(elText) }}
                title={elText}
              >
                {elText}
              </div>
            ))}
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-[9px] text-slate-300 italic">
            {/* Empty space */}
          </div>
        )}
      </div>

      {/* Below Table Area Label */}
      <div className="text-center font-mono text-[9px] print:text-[8px] text-slate-800 mt-1 font-semibold">
        {table?.flaecheStr || '0 m²'}
      </div>
    </div>
  );
}

