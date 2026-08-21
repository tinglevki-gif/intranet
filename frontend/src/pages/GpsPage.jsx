import React, { useState } from 'react';
import { 
  Navigation, 
  Truck, 
  MapPin, 
  Gauge, 
  Fuel, 
  Radio, 
  ShieldAlert, 
  Clock, 
  CheckCircle2, 
  Search,
  Filter,
  ArrowUpRight
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export function GpsPage() {
  const { t } = useLanguage();
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState(null);

  const fleetVehicles = [
    {
      id: 'LKW-01',
      plate: 'SL-TF 101',
      name: 'MAN TGX 26.510 (Schwerlastzug)',
      driver: 'Klaus Lindemann',
      location: 'A7 Rtg. Hamburg (km 124)',
      destination: 'Großbaustelle Hafencity HH',
      status: 'ON_ROUTE',
      speed: '78 km/h',
      fuel: '78%',
      payload: '24.5 t Betonbinder',
      temp: '4.2°C',
      eta: '14:45 Uhr',
      lat: 53.5511,
      lon: 9.9937,
    },
    {
      id: 'LKW-02',
      plate: 'SL-TF 102',
      name: 'Mercedes-Benz Actros 2548 (Innenlader)',
      driver: 'Jonas Nissen',
      location: 'Werk Tinglev (Ladezone 3)',
      destination: 'Wohnquartier Flensburg-Nord',
      status: 'LOADING',
      speed: '0 km/h',
      fuel: '92%',
      payload: '18.0 t Wandelemente',
      temp: '21.0°C',
      eta: '16:00 Uhr',
      lat: 54.9333,
      lon: 9.2500,
    },
    {
      id: 'LKW-03',
      plate: 'SL-TF 103',
      name: 'Volvo FH16 750 (Tieflader)',
      driver: 'Lars Holm',
      location: 'B200 Rtg. Husum',
      destination: 'Logistikzentrum Süd',
      status: 'ON_ROUTE',
      speed: '65 km/h',
      fuel: '64%',
      payload: '32.0 t Brückenträger',
      temp: '6.0°C',
      eta: '15:15 Uhr',
      lat: 54.4812,
      lon: 9.0522,
    },
    {
      id: 'LKW-04',
      plate: 'SL-TF 104',
      name: 'Scania R500 (Pritschenzug mit Kran)',
      driver: 'Torben Madsen',
      location: 'Baustelle Kiel Förde',
      destination: 'Rückfahrt Werk Tinglev',
      status: 'UNLOADING',
      speed: '0 km/h',
      fuel: '45%',
      payload: 'Entladung läuft (90%)',
      temp: '18.5°C',
      eta: '17:30 Uhr',
      lat: 54.3233,
      lon: 10.1228,
    },
    {
      id: 'SPR-01',
      plate: 'SL-TF 201',
      name: 'Mercedes Sprinter (Montage- & Servicewagen)',
      driver: 'Svenja Brodersen',
      location: 'Kundentermin Sonderburg (DK)',
      destination: 'Werk Tinglev',
      status: 'IDLE',
      speed: '0 km/h',
      fuel: '88%',
      payload: 'Werkzeug & Messtechnik',
      temp: '19.0°C',
      eta: '18:00 Uhr',
      lat: 54.9090,
      lon: 9.7922,
    }
  ];

  const getStatusBadge = (status) => {
    switch (status) {
      case 'ON_ROUTE':
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center space-x-1"><Radio className="w-3 h-3 text-emerald-600 animate-pulse" /><span>In Fahrt</span></span>;
      case 'LOADING':
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">Wird beladen</span>;
      case 'UNLOADING':
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">Baustelle / Entladung</span>;
      case 'IDLE':
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">Bereit / Stand</span>;
      default:
        return null;
    }
  };

  const filteredVehicles = fleetVehicles.filter((v) => {
    const matchesFilter = filterStatus === 'ALL' || v.status === filterStatus;
    const matchesQuery = 
      v.plate.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.driver.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.destination.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesQuery;
  });

  return (
    <div className="space-y-8 pb-16 animate-fade-in">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-card flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-500 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
            <Navigation className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">GPS & Flottenüberwachung</h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Live-Telematik, Fahrzeugortung und Logistik-Status der Tiglev Elementfabrik Flotte
            </p>
          </div>
        </div>

        {/* Live Status Indicators */}
        <div className="flex items-center space-x-2 text-xs font-bold">
          <span className="px-3 py-1.5 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
            <span>5 Fahrzeuge aktiv</span>
          </span>
          <span className="px-3 py-1.5 rounded-2xl bg-slate-100 text-slate-700">
            GPS Signal: 100%
          </span>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-card">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Aktive Touren</p>
          <p className="text-2xl font-extrabold text-slate-900 mt-1">3 LKW</p>
          <p className="text-[11px] text-emerald-600 font-semibold mt-1">Alle im Zeitplan</p>
        </div>
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-card">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Gesamt-Tonnage heute</p>
          <p className="text-2xl font-extrabold text-blue-600 mt-1">94.5 t</p>
          <p className="text-[11px] text-slate-400 font-medium mt-1">Fertigteile & Beton</p>
        </div>
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-card">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Durchschnittsverbrauch</p>
          <p className="text-2xl font-extrabold text-slate-900 mt-1">28.4 L</p>
          <p className="text-[11px] text-emerald-600 font-semibold mt-1">-3.2% unter Soll</p>
        </div>
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-card">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Nächste UVV / Wartung</p>
          <p className="text-2xl font-extrabold text-slate-900 mt-1">12 Tage</p>
          <p className="text-[11px] text-amber-600 font-semibold mt-1">LKW-02 Werkstatttermin</p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-card flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto">
          {['ALL', 'ON_ROUTE', 'LOADING', 'UNLOADING', 'IDLE'].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                filterStatus === st
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20 font-bold'
                  : 'bg-slate-100/80 text-slate-600 hover:bg-slate-200/70'
              }`}
            >
              {st === 'ALL' ? 'Alle Fahrzeuge' : st === 'ON_ROUTE' ? 'In Fahrt' : st === 'LOADING' ? 'Beladung' : st === 'UNLOADING' ? 'Entladung' : 'Bereit'}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Kennzeichen, Fahrer oder Ziel suchen..."
            className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Vehicles Fleet List */}
      <div className="space-y-4">
        {filteredVehicles.map((veh) => (
          <div
            key={veh.id}
            onClick={() => setSelectedVehicle(veh)}
            className={`bg-white rounded-3xl p-6 border shadow-card hover:shadow-lg transition-all cursor-pointer ${
              selectedVehicle?.id === veh.id ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-slate-100'
            }`}
          >
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <Truck className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="px-2.5 py-0.5 rounded-lg bg-slate-900 text-white font-mono text-xs font-bold">
                      {veh.plate}
                    </span>
                    <h3 className="font-bold text-base text-slate-900">{veh.name}</h3>
                    {getStatusBadge(veh.status)}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Fahrer: <span className="font-bold text-slate-800">{veh.driver}</span> • Fracht: <span className="font-semibold text-slate-700">{veh.payload}</span>
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div className="bg-slate-50 p-2.5 rounded-2xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 block">Standort:</span>
                  <span className="font-bold text-slate-800 truncate block">{veh.location}</span>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-2xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 block">Zielort:</span>
                  <span className="font-bold text-slate-800 truncate block">{veh.destination}</span>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-2xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 block">Geschwindigkeit:</span>
                  <span className="font-bold text-slate-800 font-mono">{veh.speed}</span>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-2xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 block">Tank / Akku:</span>
                  <span className="font-bold text-emerald-600 font-mono">{veh.fuel}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
