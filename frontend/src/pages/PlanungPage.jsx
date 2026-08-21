import React, { useState } from 'react';
import { 
  CalendarClock, 
  Layers, 
  Users, 
  Clock, 
  BarChart, 
  CheckCircle2, 
  Calendar, 
  ChevronRight, 
  Sliders, 
  Sparkles,
  TrendingUp,
  Building
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export function PlanungPage() {
  const { t } = useLanguage();
  const [selectedShift, setSelectedShift] = useState('FRUEH');

  const productionLanes = [
    {
      name: 'Fertigungslinie 1: Spannbeton-Decken',
      hall: 'Halle 1 Nord',
      capacity: '92%',
      capacityLabel: 'Hoch ausgelastet',
      currentProject: 'Wohnquartier Hafencity HH (Charge 4)',
      shiftLead: 'Jürgen Thomsen',
      dailyOutput: '420 m² / Tag',
    },
    {
      name: 'Fertigungslinie 2: Massive Wandelemente & Sandwichwände',
      hall: 'Halle 2 Süd',
      capacity: '78%',
      capacityLabel: 'Optimal',
      currentProject: 'Bürocampus Sonderburg (DK)',
      shiftLead: 'Maik Hansen',
      dailyOutput: '310 m² / Tag',
    },
    {
      name: 'Fertigungslinie 3: Sonderbauteile, Treppen & Podeste',
      hall: 'Halle 3 Manufaktur',
      capacity: '65%',
      capacityLabel: 'Freie Kapazitäten verfügbar',
      currentProject: 'Schulzentrum Sonderburg',
      shiftLead: 'Dennis Möller',
      dailyOutput: '18 Elemente / Tag',
    },
    {
      name: 'Fertigungslinie 4: Bewehrungsflechterei & Stahlbau',
      hall: 'Zentrales Biegezentrum',
      capacity: '85%',
      capacityLabel: 'Gut ausgelastet',
      currentProject: 'Vorbereitung Gewerbepark Tinglev',
      shiftLead: 'Stefan Petersen',
      dailyOutput: '14.5 t Stahl / Tag',
    }
  ];

  const shiftPlans = {
    FRUEH: [
      { role: 'Schichtleiter Fertigung', person: 'Jürgen Thomsen', team: 'Halle 1 (14 Mitarbeiter)', time: '06:00 – 14:30 Uhr' },
      { role: 'Mischanlagen-Operator', person: 'Lars Christiansen', team: 'Zentralmischer', time: '05:30 – 14:00 Uhr' },
      { role: 'Kranführer & Verladung', person: 'Torsten Lorenzen', team: 'Freilager Nord', time: '06:00 – 14:30 Uhr' },
      { role: 'QS-Prüftechniker (Labor)', person: 'Dr. Anne Paulsen', team: 'Baustofflabor', time: '07:00 – 15:30 Uhr' },
    ],
    SPAET: [
      { role: 'Schichtleiter Fertigung', person: 'Maik Hansen', team: 'Halle 2 & 3 (12 Mitarbeiter)', time: '14:15 – 22:45 Uhr' },
      { role: 'Ausschalarbeiten & Nachbehandlung', person: 'Henning Boyens', team: 'Klimakammern', time: '14:30 – 23:00 Uhr' },
      { role: 'Rüst- & Reinigungsteam', person: 'Kadir Yilmaz', team: 'Schalungswerkstatt', time: '15:00 – 23:30 Uhr' },
    ]
  };

  return (
    <div className="space-y-8 pb-16 animate-fade-in">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-card flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20">
            <CalendarClock className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Ressourcen- & Projektplanung</h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Kapazitätsauslastung der Fertigungslinien, Schichtpläne und langfristige Werksbelegung
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-xs font-semibold">
          <span className="px-3 py-1.5 rounded-2xl bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold">
            Werksauslastung: 80.0%
          </span>
        </div>
      </div>

      {/* Production Lane Capacity Cards */}
      <div className="space-y-4">
        <h2 className="text-base font-extrabold text-slate-900">Kapazitätsauslastung Fertigungsstraßen</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {productionLanes.map((lane, idx) => (
            <div key={idx} className="bg-white rounded-3xl p-6 border border-slate-100 shadow-card space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">{lane.name}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">{lane.hall}</p>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                  {lane.capacityLabel}
                </span>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-500">Belegung</span>
                  <span className="text-indigo-600 font-mono">{lane.capacity}</span>
                </div>
                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full" 
                    style={{ width: lane.capacity }}
                  ></div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs border-t border-slate-100 pt-3">
                <div className="bg-slate-50 p-2.5 rounded-2xl">
                  <span className="text-[10px] text-slate-400 block">Laufendes Projekt:</span>
                  <span className="font-bold text-slate-800 truncate block">{lane.currentProject}</span>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-2xl">
                  <span className="text-[10px] text-slate-400 block">Schichtleitung:</span>
                  <span className="font-bold text-slate-800 truncate block">{lane.shiftLead}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Shift Plan */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-card space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-extrabold text-slate-900">Aktueller Schichtplan (Werk Tinglev)</h2>
            <p className="text-xs text-slate-400">Personal- und Schichtzuteilung für die laufende Produktionswoche</p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setSelectedShift('FRUEH')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                selectedShift === 'FRUEH'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Frühschicht (06:00 – 14:30)
            </button>
            <button
              onClick={() => setSelectedShift('SPAET')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                selectedShift === 'SPAET'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Spätschicht (14:15 – 22:45)
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {shiftPlans[selectedShift].map((plan, idx) => (
            <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
              <span className="text-[10px] font-mono text-indigo-600 font-bold block">{plan.time}</span>
              <p className="text-xs font-bold text-slate-900">{plan.role}</p>
              <p className="text-xs text-slate-700 font-semibold">{plan.person}</p>
              <p className="text-[11px] text-slate-400">{plan.team}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
