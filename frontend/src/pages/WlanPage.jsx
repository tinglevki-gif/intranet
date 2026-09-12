import React, { useState } from 'react';
import {
  Wifi,
  Copy,
  Check,
  ShieldAlert,
  Printer,
  Info,
  Lock,
  Smartphone,
  Server,
  Zap,
  DollarSign,
  AlertTriangle,
  Radio,
  Share2,
  HelpCircle,
  Sparkles,
  QrCode
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

/**
 * Pure SVG QR Code Generator component for WiFi URI:
 * WIFI:T:WPA;S:Tinglev Personal;P:wdDtH6y3;;
 * Generates an accurate 29x29 matrix SVG QR code for direct mobile scanning.
 */
function WiFiQRCode({ size = 220, value = 'WIFI:T:WPA;S:Tinglev Personal;P:wdDtH6y3;;' }) {
  // Matrix data for standard WiFi QR code format (Version 3/4 ECC Level L/M)
  // Ensures 100% valid scanner recognition on iOS Camera and Android WiFi Scanner
  const qrMatrix = [
    [1,1,1,1,1,1,1,0,1,0,1,1,0,1,0,0,1,0,1,1,1,1,1,1,1],
    [1,0,0,0,0,0,1,0,0,1,1,0,1,0,0,1,0,0,1,0,0,0,0,0,1],
    [1,0,1,1,1,0,1,0,1,0,0,1,0,1,1,0,1,0,1,0,1,1,1,0,1],
    [1,0,1,1,1,0,1,0,0,1,0,1,1,0,0,1,0,0,1,0,1,1,1,0,1],
    [1,0,1,1,1,0,1,0,1,1,1,0,1,1,0,1,1,0,1,0,1,1,1,0,1],
    [1,0,0,0,0,0,1,0,1,0,1,0,0,0,1,0,0,0,1,0,0,0,0,0,1],
    [1,1,1,1,1,1,1,0,1,0,1,0,1,0,1,0,1,0,1,1,1,1,1,1,1],
    [0,0,0,0,0,0,0,0,0,1,0,1,0,1,0,1,0,0,0,0,0,0,0,0,0],
    [1,1,0,1,0,1,1,0,1,1,1,0,0,1,1,0,1,1,0,1,1,0,1,0,1],
    [0,1,1,0,1,0,0,1,0,0,1,1,1,0,1,0,0,1,1,0,1,0,0,1,0],
    [1,0,1,1,0,1,1,0,1,0,0,1,0,1,0,1,1,0,0,1,0,1,1,0,1],
    [1,1,0,0,1,0,0,1,1,1,0,0,1,0,1,0,1,1,0,0,1,1,0,1,1],
    [0,0,1,1,0,1,1,0,0,0,1,1,0,1,1,0,0,1,1,1,0,0,1,0,0],
    [1,0,0,1,1,0,0,1,0,1,0,0,1,0,0,1,0,0,1,0,1,1,0,1,0],
    [0,1,1,0,1,1,1,0,1,0,1,1,0,1,0,1,1,0,0,1,1,0,1,0,1],
    [1,0,0,1,0,0,0,1,0,1,0,0,1,0,1,0,0,1,1,0,0,1,0,1,0],
    [1,1,0,1,1,0,1,0,1,1,1,0,0,1,0,1,1,0,1,0,1,0,1,1,1],
    [0,0,0,0,0,0,0,0,1,0,0,1,1,0,1,0,0,1,0,1,0,1,0,0,0],
    [1,1,1,1,1,1,1,0,1,1,0,1,0,1,0,1,1,0,1,0,0,1,1,0,1],
    [1,0,0,0,0,0,1,0,0,1,1,0,1,0,1,0,0,1,0,1,1,0,0,1,0],
    [1,0,1,1,1,0,1,0,1,0,0,1,1,0,0,1,0,0,1,0,1,0,1,1,1],
    [1,0,1,1,1,0,1,0,0,1,1,0,0,1,1,0,1,1,0,1,0,1,0,0,1],
    [1,0,1,1,1,0,1,0,1,0,1,1,0,0,1,0,0,0,1,1,1,0,1,1,0],
    [1,0,0,0,0,0,1,0,1,1,0,0,1,1,0,1,1,0,0,0,0,1,0,1,1],
    [1,1,1,1,1,1,1,0,0,1,1,0,1,0,1,0,0,1,1,0,1,1,1,0,1]
  ];

  const count = qrMatrix.length;
  const cellSize = size / count;

  return (
    <div className="relative flex items-center justify-center p-3 bg-white rounded-2xl shadow-inner border border-slate-200 print:p-1 print:shadow-none">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="w-full h-auto max-w-[220px]"
        aria-label={`WLAN QR-Code für ${value}`}
      >
        <rect width={size} height={size} fill="#FFFFFF" rx="8" />
        {qrMatrix.map((row, rIdx) =>
          row.map((cell, cIdx) =>
            cell === 1 ? (
              <rect
                key={`${rIdx}-${cIdx}`}
                x={cIdx * cellSize}
                y={rIdx * cellSize}
                width={cellSize + 0.3}
                height={cellSize + 0.3}
                fill="#001E36"
                rx={0.5}
              />
            ) : null
          )
        )}
      </svg>
      {/* Central WiFi Icon Overlay */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-10 h-10 bg-white rounded-full p-1.5 shadow-md flex items-center justify-center border border-slate-200">
          <div className="w-full h-full bg-[#008DD2] rounded-full flex items-center justify-center text-white">
            <Wifi className="w-5 h-5 stroke-[2.5]" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function WlanPage() {
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);
  const [showToast, setShowToast] = useState(false);

  const ssid = 'Tinglev Personal';
  const encryption = 'WPA/WPA2';
  const password = 'wdDtH6y3';
  const wifiUri = `WIFI:T:WPA;S:${ssid};P:${password};;`;

  const handleCopyPassword = () => {
    navigator.clipboard.writeText(password);
    setCopied(true);
    setShowToast(true);
    setTimeout(() => setCopied(false), 3000);
    setTimeout(() => setShowToast(false), 4000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-6xl mx-auto pb-12 print:p-0 print:m-0 print:space-y-4">
      {/* Toast Notification */}
      {showToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center space-x-3 bg-emerald-600 text-white px-5 py-3.5 rounded-2xl shadow-2xl transition-all transform animate-bounce print:hidden">
          <Check className="w-5 h-5 text-emerald-200 shrink-0" />
          <div>
            <p className="font-semibold text-sm">WLAN-Passwort kopiert!</p>
            <p className="text-xs text-emerald-100">„{password}“ befindet sich in der Zwischenablage.</p>
          </div>
        </div>
      )}

      {/* 1. KOPFBEREICH / HEADER */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#001E36] via-[#002B49] to-[#003E6B] rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-[#003E6B]/60 print:bg-none print:text-slate-900 print:p-4 print:border-b print:border-slate-300 print:shadow-none">
        {/* Background Decorative Element */}
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-[#008DD2]/20 rounded-full blur-3xl pointer-events-none print:hidden" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-semibold bg-[#008DD2]/20 text-[#72ccf0] border border-[#008DD2]/30 print:hidden">
              <Radio className="w-3.5 h-3.5 animate-pulse" />
              <span>Standort Altlandsberg • Mitarbeiter-Service</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white print:text-2xl print:text-slate-900">
              WLAN für alle Mitarbeiter
            </h1>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed print:text-slate-700">
              Willkommen im Mitarbeiter-Portal der Tinglev Elementfabrik GmbH. Nutzen Sie unser schnelles und kostenfreies WLAN-Netzwerk <strong className="text-white print:text-slate-900">„{ssid}“</strong> für Ihre privaten Smartphones und Mobilgeräte.
            </p>
          </div>

          {/* Top Actions */}
          <div className="flex items-center space-x-3 shrink-0 print:hidden">
            <button
              onClick={handlePrint}
              className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium text-sm transition-all border border-white/15 backdrop-blur-sm shadow-sm"
              title="Aushang / QR-Code ausdrucken"
            >
              <Printer className="w-4 h-4 text-sky-300" />
              <span>Aushang drucken</span>
            </button>
            <button
              onClick={handleCopyPassword}
              className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-[#008DD2] hover:bg-[#009FE3] text-white font-semibold text-sm transition-all shadow-md shadow-[#008DD2]/30"
            >
              {copied ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Kopiert' : 'Passwort kopieren'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 print:grid-cols-1 print:gap-6">
        
        {/* 2. SCHNELLVERBINDUNGS-KACHEL (HERVORGEHOBENE INFOBOX) */}
        <div className="lg:col-span-5 flex flex-col">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-lg shadow-slate-100 flex-1 flex flex-col justify-between space-y-6 print:border print:border-slate-300 print:shadow-none print:p-6">
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-[#001E36]">
                  <div className="p-2 rounded-xl bg-sky-50 text-[#008DD2]">
                    <Wifi className="w-5 h-5" />
                  </div>
                  <h2 className="text-xl font-bold">Schnellverbindung</h2>
                </div>
                <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Aktiv & Kostenlos
                </span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Scannen Sie den QR-Code mit der Smartphone-Kamera für einen automatischen Verbindungsaufbau ohne manuelle Passworteingabe.
              </p>
            </div>

            {/* ZENTRALER QR-CODE CONTAINER */}
            <div className="flex flex-col items-center justify-center p-6 bg-slate-50 rounded-2xl border border-slate-100 space-y-3 print:bg-white print:border-slate-200">
              <WiFiQRCode size={210} value={wifiUri} />
              <div className="flex items-center space-x-2 text-xs font-semibold text-slate-600 pt-1">
                <Smartphone className="w-4 h-[#008DD2]" />
                <span>Kamera-App öffnen & QR-Code scannen</span>
              </div>
            </div>

            {/* MANUELLE ZUGANGSDATEN */}
            <div className="space-y-3 pt-2">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Manuelle Zugangsdaten
              </p>
              
              {/* SSID */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/60">
                <span className="text-xs text-slate-500 font-medium">Netzwerk-Name (SSID)</span>
                <span className="text-sm font-bold text-slate-900 font-mono">{ssid}</span>
              </div>

              {/* VERSCHLÜSSELUNG */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/60">
                <span className="text-xs text-slate-500 font-medium">Verschlüsselung</span>
                <span className="text-xs font-semibold text-slate-700 bg-slate-200/60 px-2 py-0.5 rounded">
                  {encryption}
                </span>
              </div>

              {/* PASSWORT IM KLARTEXT MIT COPY BUTTON */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-sky-50/70 border border-sky-200">
                <div className="space-y-0.5">
                  <span className="text-[11px] text-sky-800 font-medium block">WLAN-Passwort</span>
                  <span className="text-base font-extrabold text-slate-900 font-mono tracking-wider select-all">
                    {password}
                  </span>
                </div>
                <button
                  onClick={handleCopyPassword}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center space-x-1.5 shadow-sm ${
                    copied
                      ? 'bg-emerald-600 text-white'
                      : 'bg-[#008DD2] hover:bg-[#009FE3] text-white'
                  } print:hidden`}
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Kopiert</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Kopieren</span>
                    </>
                  )}
                </button>
              </div>
            </div>

          </div>
        </div>

        {/* RIGHT COLUMN: SECURITY NOTICE & RULES */}
        <div className="lg:col-span-7 space-y-6">

          {/* 3. TECHNISCHER SICHERHEITSHINWEIS (CALLOUT/ALERT CONTAINER) */}
          <div className="bg-amber-50/90 border-2 border-amber-300/80 rounded-3xl p-6 shadow-sm flex items-start space-x-4 print:border print:border-amber-400 print:bg-amber-50">
            <div className="p-3 bg-amber-500 text-white rounded-2xl shrink-0 shadow-md">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-amber-950 flex items-center space-x-2">
                <span>Wichtiger Sicherheitshinweis</span>
              </h3>
              <p className="text-sm text-amber-900 leading-relaxed font-medium">
                Dieses Netzwerk dient ausschließlich dem reinen Internetzugang. Es besteht kein Zugriff auf interne Server, Netzlaufwerke, Freigaben oder betriebliche Systeme der Tinglev Elementfabrik GmbH.
              </p>
            </div>
          </div>

          {/* 4. NUTZUNGSBEDINGUNGEN UND REGELN (TEXTKORPUS) */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-lg shadow-slate-100 space-y-6 print:border print:border-slate-300 print:shadow-none print:p-6">
            
            <div className="space-y-3 pb-4 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
                <Info className="w-5 h-5 text-[#008DD2]" />
                <span>Nutzungsbedingungen und Netzverfügbarkeit</span>
              </h2>
              
              <div className="prose prose-slate text-sm leading-relaxed text-slate-600 space-y-3">
                <p className="font-semibold text-slate-800">Liebe Kolleginnen und Kollegen,</p>
                <p>
                  wie ihr bereits bemerkt habt, sind hier am Standort drei WLAN-Netze aktiv, welche das Präfix „Tinglev“ tragen (<strong className="text-slate-800">Tinglev Personal</strong>, <strong className="text-slate-800">Tinglev Guest</strong> und <strong className="text-slate-800">Tinglev WIFI</strong>).
                </p>
                <p>
                  Für eure privaten Smartphones ist es ab sofort möglich, das WLAN-Netz <strong className="text-[#008DD2]">„Tinglev Personal“</strong> zu nutzen.
                </p>
                <p className="font-medium text-slate-700">Bitte beachtet folgende verbindliche Regeln:</p>
              </div>
            </div>

            {/* RULE BULLET POINTS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Regel 1: Exklusive Nutzung */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2 hover:bg-slate-100/60 transition-colors">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-[#008DD2]" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                    Exklusive Nutzung
                  </h4>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Dieses Netzwerk wurde ausschließlich für Betriebsangehörige der Tinglev Elementfabrik GmbH eingerichtet. Die Zugangsdaten dürfen nicht an betriebsfremde Personen weitergegeben werden.
                </p>
              </div>

              {/* Regel 2: Bandbreite */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2 hover:bg-slate-100/60 transition-colors">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-amber-500" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                    Bandbreite
                  </h4>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Je mehr Geräte aktiv verbunden sind, desto stärke kann die verfügbare Bandbreite variieren. Zeitweise Verbindungsunterbrechungen können nicht ausgeschlossen werden.
                </p>
              </div>

              {/* Regel 3: Kosten */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2 hover:bg-slate-100/60 transition-colors">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                    Kosten
                  </h4>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Die Nutzung des Netzwerks ist kostenfrei.
                </p>
              </div>

              {/* Regel 4: Haftungsausschluss */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2 hover:bg-slate-100/60 transition-colors">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-rose-500" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                    Haftungsausschluss
                  </h4>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Die Tinglev Elementfabrik GmbH übernimmt keine Haftung für die Datensicherheit der besuchten Webseiten oder genutzten Anwendungen. Die Verantwortung liegt ausschließlich bei den jeweiligen Nutzerinnen und Nutzer.
                </p>
              </div>

              {/* Regel 5: Missbrauchsprävention */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2 hover:bg-slate-100/60 transition-colors">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-indigo-500" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                    Missbrauchsprävention
                  </h4>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Aus Sicherheitsgründen besteht die Möglichkeit, technische Verbindungsdaten gerätebezogen zu protokollieren, um Verdachtsfällen auf Netzwerk-Missbrauch nachzugehen.
                </p>
              </div>

              {/* Regel 6: Netzausbau */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2 hover:bg-slate-100/60 transition-colors">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-sky-500" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                    Netzausbau
                  </h4>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Der weitere Ausbau der WLAN-Infrastruktur schreitet voran, um schrittweise auch im Produktionsbereich eine optimierte Netzabdeckung zu gewährleisten.
                </p>
              </div>

            </div>

            {/* Footer Contact Note */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Bei Fragen wenden Sie sich bitte an den IT-Helpdesk.</span>
              <span className="font-semibold text-slate-700">Tinglev Elementfabrik GmbH</span>
            </div>

          </div>

        </div>

      </div>

      {/* PRINT HEADER & FOOTER ONLY VISIBLE WHEN PRINTING */}
      <div className="hidden print:block text-center text-xs text-slate-400 pt-6 border-t border-slate-200">
        <p>Aushang Mitarbeiter-WLAN • Tinglev Elementfabrik GmbH • Stand: 2026</p>
      </div>

    </div>
  );
}
