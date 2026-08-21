import React, { useState } from 'react';
import { 
  Cpu, 
  Wrench, 
  Activity, 
  AlertTriangle, 
  CheckCircle2, 
  HardDrive, 
  Gauge, 
  Send, 
  RotateCw, 
  Zap, 
  Layers 
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export function TechnikPage() {
  const { t } = useLanguage();
  const [ticketSubmitted, setTicketSubmitted] = useState(false);
  const [ticketData, setTicketData] = useState({
    plant: 'Halle 1 - Mischanlage',
    priority: 'MITTEL',
    description: '',
  });

  const machines = [
    {
      id: 'M-101',
      name: 'Beton-Zentralmischanlage Teka TPZ 3000',
      location: 'Werk Tinglev - Halle 1',
      status: 'OPERATIONAL',
      uptime: '99.4%',
      temperature: '48°C (Normal)',
      lastMaintenance: '12.08.2026',
      nextInspection: '12.11.2026',
      load: '82%',
    },
    {
      id: 'M-102',
      name: 'Spannbett-Schneideanlage Weckenmann Vollautomat',
      location: 'Werk Tinglev - Halle 2',
      status: 'OPERATIONAL',
      uptime: '98.8%',
      temperature: '52°C (Optimal)',
      lastMaintenance: '04.08.2026',
      nextInspection: '04.10.2026',
      load: '74%',
    },
    {
      id: 'M-103',
      name: 'Portalkrananlage Demag 32t Schwerlast',
      location: 'Freilager & Verladung Nord',
      status: 'MAINTENANCE_DUE',
      uptime: '96.2%',
      temperature: '38°C (Standby)',
      lastMaintenance: '20.05.2026',
      nextInspection: 'In 4 Tagen fällig',
      load: '60%',
    },
    {
      id: 'M-104',
      name: 'Bewehrungsbiegezentrum Schnell automatisiert',
      location: 'Flechthalle & Stahlbearbeitung',
      status: 'OPERATIONAL',
      uptime: '99.9%',
      temperature: '42°C (Normal)',
      lastMaintenance: '15.07.2026',
      nextInspection: '15.01.2027',
      load: '91%',
    }
  ];

  const handleTicketSubmit = (e) => {
    e.preventDefault();
    setTicketSubmitted(true);
    setTimeout(() => {
      setTicketSubmitted(false);
      setTicketData({ plant: 'Halle 1 - Mischanlage', priority: 'MITTEL', description: '' });
    }, 4000);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'OPERATIONAL':
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center space-x-1"><CheckCircle2 className="w-3 h-3 text-emerald-600" /><span>Betriebsbereit (100%)</span></span>;
      case 'MAINTENANCE_DUE':
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 flex items-center space-x-1"><AlertTriangle className="w-3 h-3 text-amber-600" /><span>Wartung fällig</span></span>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-8 pb-16 animate-fade-in">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-card flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-slate-800 to-indigo-900 text-white flex items-center justify-center shadow-md shadow-slate-900/20">
            <Cpu className="w-6 h-6 text-indigo-300" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Technik & Geräteverwaltung</h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Produktionsanlagen, Maschinen-Telemetrie, Instandhaltung und Technischer Support
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-xs font-semibold text-slate-700 bg-slate-50 p-3 rounded-2xl border border-slate-100">
          <Activity className="w-4 h-4 text-emerald-500 animate-pulse" />
          <span>Gesamt-Produktionsauslastung: <strong className="text-emerald-600 font-mono">82.4%</strong></span>
        </div>
      </div>

      {/* Telemetry Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-card">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Betriebsbereite Anlagen</p>
          <p className="text-2xl font-extrabold text-emerald-600 mt-1">4 / 4 Online</p>
          <p className="text-[11px] text-slate-400 mt-1">Keine ungeplanten Stillstände</p>
        </div>
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-card">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Gesamtstromverbrauch</p>
          <p className="text-2xl font-extrabold text-slate-900 mt-1">1.420 kW/h</p>
          <p className="text-[11px] text-emerald-600 font-semibold mt-1">Im Normalbereich</p>
        </div>
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-card">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Druckluft & Hydraulik</p>
          <p className="text-2xl font-extrabold text-indigo-600 mt-1">7.8 bar</p>
          <p className="text-[11px] text-slate-400 mt-1">Konstanter Netzdruck</p>
        </div>
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-card">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Öl- & Filterwechsel</p>
          <p className="text-2xl font-extrabold text-amber-600 mt-1">1 Anstehend</p>
          <p className="text-[11px] text-slate-400 mt-1">Portalkran Demag 32t</p>
        </div>
      </div>

      {/* Machine Status Cards */}
      <div className="space-y-4">
        <h2 className="text-base font-extrabold text-slate-900">Produktionsstraßen & Hauptmaschinen</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {machines.map((m) => (
            <div key={m.id} className="bg-white rounded-3xl p-6 border border-slate-100 shadow-card space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-0.5 rounded-md bg-slate-900 text-white font-mono text-[11px] font-bold">
                      {m.id}
                    </span>
                    <h3 className="font-bold text-slate-900 text-sm">{m.name}</h3>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">{m.location}</p>
                </div>
                {getStatusBadge(m.status)}
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs border-t border-slate-100 pt-3">
                <div className="bg-slate-50 p-2.5 rounded-2xl">
                  <span className="text-[10px] text-slate-400 block">Verfügbarkeit (Uptime):</span>
                  <span className="font-bold text-slate-800 font-mono">{m.uptime}</span>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-2xl">
                  <span className="text-[10px] text-slate-400 block">Aktuelle Auslastung:</span>
                  <span className="font-bold text-indigo-600 font-mono">{m.load}</span>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-2xl">
                  <span className="text-[10px] text-slate-400 block">Sensortemperatur:</span>
                  <span className="font-bold text-slate-800 font-mono">{m.temperature}</span>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-2xl">
                  <span className="text-[10px] text-slate-400 block">Nächste Wartung:</span>
                  <span className="font-bold text-slate-800 font-mono">{m.nextInspection}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Support Ticket Submission */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-card space-y-4">
        <div>
          <h2 className="text-base font-extrabold text-slate-900">Technischen Support / Störungsmeldung erfassen</h2>
          <p className="text-xs text-slate-400">Direkte Benachrichtigung des Instandhaltungsteams vor Ort</p>
        </div>

        {ticketSubmitted ? (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs font-bold flex items-center space-x-2 animate-fade-in">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>Störungsmeldung wurde erfolgreich an die Werkstatt & Instandhaltung übermittelt!</span>
          </div>
        ) : (
          <form onSubmit={handleTicketSubmit} className="space-y-4 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Betroffene Anlage / Bereich
                </label>
                <select
                  value={ticketData.plant}
                  onChange={(e) => setTicketData({ ...ticketData, plant: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value="Halle 1 - Mischanlage">Halle 1 - Mischanlage Teka TPZ</option>
                  <option value="Halle 2 - Schneideanlage">Halle 2 - Schneideanlage Weckenmann</option>
                  <option value="Freilager - Portalkran">Freilager - Demag Portalkran 32t</option>
                  <option value="Bewehrungszentrum">Bewehrungszentrum Flechthalle</option>
                  <option value="Sonstige Werkstatteinheit">Sonstige Werkstatteinheit / Fuhrpark</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Dringlichkeit / Priorität
                </label>
                <select
                  value={ticketData.priority}
                  onChange={(e) => setTicketData({ ...ticketData, priority: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value="NIEDRIG">Niedrig (Wartungshinweis)</option>
                  <option value="MITTEL">Mittel (Einschränkung ohne Stillstand)</option>
                  <option value="HOCH">Hoch (Stillstand droht)</option>
                  <option value="KRITISCH">Kritisch (Notfall / Sofortiger Produktionsstopp)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Fehlerbeschreibung / Symptom
              </label>
              <textarea
                required
                rows={3}
                value={ticketData.description}
                onChange={(e) => setTicketData({ ...ticketData, description: e.target.value })}
                placeholder="Bitte beschreiben Sie Geräusche, Fehlercodes auf dem Steuerpult oder betroffene Bauteile..."
                className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              ></textarea>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="flex items-center space-x-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-md shadow-slate-900/20 transition-all"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Meldung absenden</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
