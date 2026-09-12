import React, { useState, useEffect } from 'react';
import {
  PieChart,
  Table,
  Calendar,
  Building2,
  FileText,
  Truck,
  Plus,
  RefreshCw,
  Moon,
  Sun,
  Search,
  Printer,
  Scale,
  DollarSign,
  Briefcase,
  MapPin,
  Clock,
  ChevronDown,
  CheckCircle,
  X
} from 'lucide-react';
import { api } from '../../services/api';

export function TransportMatrixWidget() {
  const [activeTab, setActiveTab] = useState('kpis'); // 'kpis', 'matrix', 'wochenplan', 'projects', 'cmr'
  const [darkMode, setDarkMode] = useState(false);
  
  // Data states
  const [orders, setOrders] = useState([]);
  const [projects, setProjects] = useState([]);
  const [carriers, setCarriers] = useState([]);
  const [kpis, setKpis] = useState(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [kwFilter, setKwFilter] = useState('All');
  const [carrierFilter, setCarrierFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [wochenplanKw, setWochenplanKw] = useState('KW12');

  // Selected Order for CMR
  const [selectedOrderCmr, setSelectedOrderCmr] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  // New Transport Order Form
  const [newOrder, setNewOrder] = useState({
    id: '',
    kw: '26',
    vehicle_type: '3-Achser',
    trailer_license: '',
    delivery_date: '',
    delivery_time: '08:00',
    element_count: 10,
    gross_weight_kg: 18000,
    transport_type: 'One-Way',
    carrier_code: 'Unbekannt',
    client_name: '',
    unload_site_name: '',
    unload_site_street: '',
    project_number: '',
    agreed_revenue: 500,
    actual_cost: 0,
    toll_cost: 0
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [ordersRes, kpisRes, projectsRes, carriersRes] = await Promise.all([
        api.getTransportOrders(),
        api.getTransportKpis(),
        api.getTransportProjects(),
        api.getTransportCarriers()
      ]);
      setOrders(ordersRes || []);
      setKpis(kpisRes || null);
      setProjects(projectsRes || []);
      setCarriers(carriersRes || []);
    } catch (err) {
      console.error('Fehler beim Laden der Transportdaten:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateOrder = async (e) => {
    e.preventDefault();
    try {
      await api.createTransportOrder(newOrder);
      setShowAddModal(false);
      fetchData();
    } catch (err) {
      alert('Fehler beim Erstellen: ' + err.message);
    }
  };

  // Filtered orders for Datenmatrix
  const filteredOrders = orders.filter(o => {
    const matchesKw = kwFilter === 'All' || o.kw == kwFilter;
    const matchesCarrier = carrierFilter === 'All' || o.carrier_code === carrierFilter;
    const q = searchQuery.toLowerCase();
    const matchesQuery = !searchQuery || (
      (o.id && o.id.toLowerCase().includes(q)) ||
      (o.client_name && o.client_name.toLowerCase().includes(q)) ||
      (o.unload_site_name && o.unload_site_name.toLowerCase().includes(q)) ||
      (o.project_number && o.project_number.toLowerCase().includes(q))
    );
    return matchesKw && matchesCarrier && matchesQuery;
  });

  // Selected Order Object for CMR Print
  const currentCmrOrder = orders.find(o => o.id === selectedOrderCmr);

  return (
    <div className={`flex min-h-[750px] rounded-3xl overflow-hidden border border-slate-200/80 shadow-2xl transition-colors duration-200 ${darkMode ? 'bg-slate-900 text-slate-100' : 'bg-slate-100/70 text-slate-800'}`}>
      
      {/* 1. LEFT SUB-NAVIGATION SIDEBAR */}
      <aside className={`w-64 flex-shrink-0 flex flex-col justify-between border-r ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200/80'} p-5 space-y-6`}>
        <div className="space-y-6">
          {/* App Header Logo */}
          <div className="flex items-center space-x-3 px-2">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-600/30">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black tracking-tight text-slate-900 leading-tight">Tinglev</h2>
              <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest block">TRANSPORTMATRIX 2.0</span>
            </div>
          </div>

          {/* Menu Items */}
          <nav className="space-y-1.5 pt-2">
            {[
              { id: 'kpis', label: 'KPI-Dashboard', icon: PieChart },
              { id: 'matrix', label: 'Datenmatrix', icon: Table },
              { id: 'wochenplan', label: 'Wochenplan Lagerplatz', icon: Calendar },
              { id: 'projects', label: 'Projektverwaltung', icon: Building2 },
              { id: 'cmr', label: 'Dokumente & CMR', icon: FileText }
            ].map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all duration-150 ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-600/25'
                      : darkMode
                      ? 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer Werk Badge */}
        <div className={`p-3.5 rounded-2xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200/70'} flex items-center space-x-3`}>
          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">
            ⚙️
          </div>
          <div>
            <p className="text-xs font-bold text-slate-900">Werk Berlin</p>
            <p className="text-[10px] text-slate-400 font-medium">Altlandsberg Logistik</p>
          </div>
        </div>
      </aside>

      {/* 2. MAIN RIGHT CONTENT AREA */}
      <main className="flex-1 flex flex-col overflow-x-hidden">
        {/* Top Header Controls Bar */}
        <header className={`p-6 border-b ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200/80'} flex flex-col sm:flex-row sm:items-center justify-between gap-4`}>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900">
              {activeTab === 'kpis' && 'KPI-Dashboard'}
              {activeTab === 'matrix' && 'Datenmatrix (Transportliste)'}
              {activeTab === 'wochenplan' && 'Wochenplan Lagerplatz & Disposition'}
              {activeTab === 'projects' && 'Projektkatalog & Kundenstamm'}
              {activeTab === 'cmr' && 'Dokumentengenerator & Frachtbrief (CMR)'}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">
              Steuerung von Transporten, Frachttarifen und Deckungsbeitrag DB I
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold border transition-colors ${
                darkMode ? 'bg-slate-800 text-amber-300 border-slate-700' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4 text-slate-600" />}
              <span>{darkMode ? 'Hell' : 'Dunkel'}</span>
            </button>

            <button
              onClick={fetchData}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold border transition-colors ${
                darkMode ? 'bg-slate-800 text-slate-200 border-slate-700' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Excel neu laden</span>
            </button>

            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-md shadow-blue-600/25 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Neuer Transportauftrag</span>
            </button>
          </div>
        </header>

        {/* Tab Body View Content */}
        <div className="p-6 space-y-6 flex-1 overflow-y-auto">
          
          {/* TAB 1: KPI-DASHBOARD */}
          {activeTab === 'kpis' && (
            <div className="space-y-6 animate-fade-in">
              {/* 4 Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                
                {/* Metric 1 */}
                <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200/70'} shadow-sm space-y-3`}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500">Gesamte Transporte</span>
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                      <Truck className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-3xl font-black text-slate-900 font-mono">1963</span>
                    <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      <CheckCircle className="w-3 h-3 inline mr-0.5" /> Aktiv 2026
                    </span>
                  </div>
                </div>

                {/* Metric 2 */}
                <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200/70'} shadow-sm space-y-3`}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500">Gesamtgewicht (Tonnen)</span>
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                      <Scale className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-3xl font-black text-slate-900 font-mono">38.482,4 t</span>
                    <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                      🏗️ Betonfertigteile
                    </span>
                  </div>
                </div>

                {/* Metric 3 */}
                <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200/70'} shadow-sm space-y-3`}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500">Gesamterlöse</span>
                    <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                      <DollarSign className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-3xl font-black text-slate-900 font-mono">0,00 €</span>
                    <span className="text-[10px] text-slate-400 block font-medium">Vertragliche Frachterlöse</span>
                  </div>
                </div>

                {/* Metric 4 */}
                <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200/70'} shadow-sm space-y-3`}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500">Deckungsbeitrag DB I</span>
                    <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                      💰
                    </div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-3xl font-black text-slate-900 font-mono">354.189,63 €</span>
                    <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      0% Rentabilität
                    </span>
                  </div>
                </div>
              </div>

              {/* 2 Chart Cards */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Donut Chart: Verteilung nach Spedition */}
                <div className={`p-6 rounded-3xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200/70'} shadow-sm space-y-4`}>
                  <h3 className="text-sm font-bold text-slate-900">Verteilung der Transporte nach Spedition</h3>
                  
                  <div className="flex flex-col sm:flex-row items-center justify-around gap-6 pt-2">
                    {/* SVG Donut Chart */}
                    <div className="relative w-48 h-48">
                      <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                        {/* Donut slices */}
                        <circle cx="50" cy="50" r="38" fill="transparent" stroke="#0284C7" strokeWidth="20" strokeDasharray="180 240" />
                        <circle cx="50" cy="50" r="38" fill="transparent" stroke="#10B981" strokeWidth="20" strokeDasharray="25 240" strokeDashoffset="-180" />
                        <circle cx="50" cy="50" r="38" fill="transparent" stroke="#F59E0B" strokeWidth="20" strokeDasharray="15 240" strokeDashoffset="-205" />
                        <circle cx="50" cy="50" r="38" fill="transparent" stroke="#9333EA" strokeWidth="20" strokeDasharray="140 240" strokeDashoffset="-220" />
                        <circle cx="50" cy="50" r="38" fill="transparent" stroke="#F43F5E" strokeWidth="20" strokeDasharray="20 240" strokeDashoffset="-360" />
                      </svg>
                    </div>

                    {/* Chart Legend */}
                    <div className="space-y-2 text-xs font-bold text-slate-700">
                      <div className="flex items-center space-x-2">
                        <span className="w-3.5 h-3.5 rounded-sm bg-[#0284C7] inline-block"></span>
                        <span>Unbekannt</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="w-3.5 h-3.5 rounded-sm bg-[#10B981] inline-block"></span>
                        <span>K (Kühne + Nagel)</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="w-3.5 h-3.5 rounded-sm bg-[#F59E0B] inline-block"></span>
                        <span>T (Tinglev Fuhrpark)</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="w-3.5 h-3.5 rounded-sm bg-[#9333EA] inline-block"></span>
                        <span>k (Krage Spedition)</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="w-3.5 h-3.5 rounded-sm bg-[#F43F5E] inline-block"></span>
                        <span>t (Trans-Sped)</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bar Chart: Deckungsbeitrag DB I nach Spedition */}
                <div className={`p-6 rounded-3xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200/70'} shadow-sm space-y-4`}>
                  <h3 className="text-sm font-bold text-slate-900">Deckungsbeitrag DB I nach Spedition</h3>
                  
                  {/* SVG Bar Chart */}
                  <div className="h-48 pt-4 flex items-end justify-between px-4 border-b border-l border-slate-200 text-xs font-mono">
                    <div className="flex flex-col items-center space-y-2 w-12">
                      <div className="w-8 bg-blue-600 rounded-t-md" style={{ height: '40px' }}></div>
                      <span className="text-[10px] font-bold text-slate-600">Unbekannt</span>
                    </div>

                    <div className="flex flex-col items-center space-y-2 w-12">
                      <div className="w-8 bg-blue-600 rounded-t-md" style={{ height: '40px' }}></div>
                      <span className="text-[10px] font-bold text-slate-600">K</span>
                    </div>

                    <div className="flex flex-col items-center space-y-2 w-12">
                      <div className="w-8 bg-blue-600 rounded-t-md" style={{ height: '5px' }}></div>
                      <span className="text-[10px] font-bold text-slate-600">T</span>
                    </div>

                    <div className="flex flex-col items-center space-y-2 w-12">
                      <div className="w-8 bg-blue-600 rounded-t-md" style={{ height: '140px' }}></div>
                      <span className="text-[10px] font-bold text-slate-600">k</span>
                    </div>

                    <div className="flex flex-col items-center space-y-2 w-12">
                      <div className="w-8 bg-blue-600 rounded-t-md" style={{ height: '10px' }}></div>
                      <span className="text-[10px] font-bold text-slate-600">t</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: DATENMATRIX (TRANSPORTLISTE) */}
          {activeTab === 'matrix' && (
            <div className="space-y-6 animate-fade-in">
              {/* Search & Filters Bar */}
              <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200/70'} shadow-sm space-y-3 sm:space-y-0 sm:flex sm:items-center sm:space-x-4`}>
                
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Suchen nach Nr., Kunde, Bauvorhaben oder Projekt..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={`w-full pl-10 pr-4 py-2 text-xs rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'}`}
                  />
                </div>

                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2 text-xs">
                    <span className="font-bold text-slate-500 whitespace-nowrap">📅 Kalenderwoche (KW):</span>
                    <select
                      value={kwFilter}
                      onChange={(e) => setKwFilter(e.target.value)}
                      className={`px-3 py-1.5 text-xs font-bold rounded-xl border ${darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'}`}
                    >
                      <option value="All">Alle Wochen</option>
                      <option value="26">KW 26</option>
                      <option value="28">KW 28</option>
                      <option value="29">KW 29</option>
                      <option value="12">KW 12</option>
                    </select>
                  </div>

                  <div className="flex items-center space-x-2 text-xs">
                    <span className="font-bold text-slate-500 whitespace-nowrap">🚛 Spediteur:</span>
                    <select
                      value={carrierFilter}
                      onChange={(e) => setCarrierFilter(e.target.value)}
                      className={`px-3 py-1.5 text-xs font-bold rounded-xl border ${darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'}`}
                    >
                      <option value="All">Alle Speditionen</option>
                      <option value="Unbekannt">Unbekannt</option>
                      <option value="K">K (Kühne + Nagel)</option>
                      <option value="T">T (Tinglev Fuhrpark)</option>
                      <option value="k">k (Krage Spedition)</option>
                      <option value="t">t (Trans-Sped)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Data Table */}
              <div className={`rounded-3xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200/70'} shadow-sm overflow-hidden`}>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className={`border-b text-[11px] font-bold uppercase tracking-wider ${darkMode ? 'bg-slate-900/80 border-slate-700 text-slate-400' : 'bg-slate-100/70 border-slate-200 text-slate-600'}`}>
                        <th className="py-3.5 px-4">Auftrags-Nr.</th>
                        <th className="py-3.5 px-4">KW</th>
                        <th className="py-3.5 px-4">Lieferdatum / Zeit</th>
                        <th className="py-3.5 px-4">Transportmittel</th>
                        <th className="py-3.5 px-4">Elemente</th>
                        <th className="py-3.5 px-4">Gewicht (kg)</th>
                        <th className="py-3.5 px-4">Transportart</th>
                        <th className="py-3.5 px-4">Spediteur</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {filteredOrders.length === 0 ? (
                        <tr>
                          <td colSpan="8" className="py-8 text-center text-slate-400 italic">
                            Keine Transporte für diese Filterkriterien vorhanden.
                          </td>
                        </tr>
                      ) : (
                        filteredOrders.map(ord => (
                          <tr key={ord.id} className="hover:bg-slate-50/70 transition-colors">
                            <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                              {ord.id}
                            </td>
                            <td className="py-3.5 px-4">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-100 text-cyan-800">
                                {ord.kw ? `KW ${ord.kw}` : 'KW'}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 font-mono text-slate-600">
                              {ord.delivery_date ? `${ord.delivery_date} ${ord.delivery_time || ''}` : '-'}
                            </td>
                            <td className="py-3.5 px-4 text-slate-700 font-medium">
                              {ord.vehicle_type || '3-Achser'}
                            </td>
                            <td className="py-3.5 px-4 text-slate-700 font-bold">
                              {ord.element_count ? `${ord.element_count} Stk.` : '-'}
                            </td>
                            <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                              {ord.gross_weight_kg ? `${ord.gross_weight_kg.toLocaleString('de-DE')} kg` : '-'}
                            </td>
                            <td className="py-3.5 px-4">
                              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                                ord.transport_type === 'Rundlauf'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}>
                                {ord.transport_type || 'One-Way'}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 font-bold text-slate-800">
                              {ord.carrier_code || 'Unbekannt'}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: WOCHENPLAN LAGERPLATZ */}
          {activeTab === 'wochenplan' && (
            <div className="space-y-6 animate-fade-in">
              <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200/70'} shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4`}>
                <h3 className="text-sm font-bold text-slate-900">Wochenübersicht Lagerplatz & Disposition</h3>
                
                <div className="flex items-center space-x-2 text-xs">
                  <span className="font-bold text-slate-500">Filter Kalenderwoche (KW) wählen:</span>
                  <select
                    value={wochenplanKw}
                    onChange={(e) => setWochenplanKw(e.target.value)}
                    className={`px-3 py-1.5 text-xs font-bold rounded-xl border ${darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'}`}
                  >
                    <option value="KW12">Kalenderwoche KW 12</option>
                    <option value="KW26">Kalenderwoche KW 26</option>
                    <option value="KW29">Kalenderwoche KW 29</option>
                  </select>
                </div>
              </div>

              {/* 5 Column Grid */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {[
                  { name: 'Montag', count: 0, items: [] },
                  {
                    name: 'Dienstag', count: 4, items: [
                      { time: '08:00', vehicle: 'Innenlader', id: 'A25-00556-04', details: '4 Elem / 19.701 kg', dest: 'HKL 2B gespeigelt Lohkampstr.' },
                      { time: '09:30', vehicle: 'Innenlader', id: 'A25-00556-03', details: '3 Elem / 17.747 kg', dest: 'HKL 2B gespeigelt Lohkampstr.' },
                      { time: '11:00', vehicle: 'Innenlader', id: 'A25-00556-02', details: '4 Elem / 18.545 kg', dest: 'HKL 2B gespeigelt Lohkampstr.' },
                      { time: '14:00', vehicle: 'Innenlader', id: 'A25-00556-01', details: '3 Elem / 15.987 kg', dest: 'HKL 2B gespeigelt Lohkampstr.' }
                    ]
                  },
                  {
                    name: 'Mittwoch', count: 4, items: [
                      { time: '08:00', vehicle: 'Innenlader', id: 'A25-00556-08', details: '4 Elem / 16.124 kg', dest: 'HKL 2B gespeigelt Lohkampstr.' },
                      { time: '09:30', vehicle: 'Innenlader', id: 'A25-00556-07', details: '4 Elem / 19.969 kg', dest: 'HKL 2B gespeigelt Lohkampstr.' },
                      { time: '11:00', vehicle: 'Innenlader', id: 'A25-00556-06', details: '3 Elem / 19.341 kg', dest: 'HKL 2B gespeigelt Lohkampstr.' },
                      { time: '14:00', vehicle: 'Innenlader', id: 'A25-00556-05', details: '3 Elem / 19.770 kg', dest: 'HKL 2B gespeigelt Lohkampstr.' }
                    ]
                  },
                  {
                    name: 'Donnerstag', count: 4, items: [
                      { time: '08:00', vehicle: 'Innenlader', id: 'A25-00556-11', details: '2 Elem / 9.541 kg', dest: 'HKL 2B gespeigelt Lohkampstr.' },
                      { time: '09:30', vehicle: 'Innenlader', id: 'A25-00556-10', details: '4 Elem / 15.931 kg', dest: 'HKL 2B gespeigelt Lohkampstr.' },
                      { time: '11:00', vehicle: 'Innenlader', id: 'A25-00556-09', details: '3 Elem / 16.181 kg', dest: 'HKL 2B gespeigelt Lohkampstr.' },
                      { time: '14:00', vehicle: '2-Achser', id: 'A25-00544-01', details: '13 Elem / 21.611 kg', dest: 'EFH Otto/Gläser' }
                    ]
                  },
                  {
                    name: 'Freitag', count: 2, items: [
                      { time: '08:00', vehicle: '2-Achser', id: 'A25-00544-03', details: '14 Elem / 23.079 kg', dest: 'EFH Otto/Gläser' },
                      { time: '09:30', vehicle: '2-Achser', id: 'A25-00544-02', details: '14 Elem / 22.035 kg', dest: 'EFH Otto/Gläser' }
                    ]
                  }
                ].map(day => (
                  <div key={day.name} className={`p-4 rounded-2xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200/70'} space-y-3`}>
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                      <span className="text-xs font-bold text-slate-900">{day.name}</span>
                      <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-mono text-[10px] font-bold flex items-center justify-center">
                        {day.count}
                      </span>
                    </div>

                    {day.items.length === 0 ? (
                      <p className="text-[11px] text-slate-400 italic py-6 text-center">Keine Transporte geplant.</p>
                    ) : (
                      day.items.map((item, i) => (
                        <div key={i} className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1 text-xs">
                          <p className="text-[11px] font-bold text-blue-600 flex items-center space-x-1">
                            <Clock className="w-3 h-3 inline mr-1" />
                            <span>{item.time} Uhr - {item.vehicle}</span>
                          </p>
                          <p className="font-bold text-slate-900">{item.id} <span className="text-slate-500 font-normal">({item.details})</span></p>
                          <p className="text-[10px] text-slate-500 flex items-center space-x-1 pt-0.5">
                            <MapPin className="w-3 h-3 text-amber-500 inline mr-0.5" />
                            <span>{item.dest}</span>
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: PROJEKTVERWALTUNG (PROJEKTKATALOG) */}
          {activeTab === 'projects' && (
            <div className="space-y-6 animate-fade-in">
              <div className={`p-6 rounded-3xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200/70'} shadow-sm space-y-4`}>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Projektkatalog & Kundenstamm</h3>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className={`border-b text-[11px] font-bold uppercase tracking-wider ${darkMode ? 'bg-slate-900/80 border-slate-700 text-slate-400' : 'bg-slate-100/70 border-slate-200 text-slate-600'}`}>
                        <th className="py-3.5 px-4">Projektnummer</th>
                        <th className="py-3.5 px-4">Auftraggeber (Kunde)</th>
                        <th className="py-3.5 px-4">Bauvorhaben / Entladestelle</th>
                        <th className="py-3.5 px-4">Straße</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {projects.map(p => (
                        <tr key={p.project_number} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                            {p.project_number}
                          </td>
                          <td className="py-3.5 px-4 font-bold text-slate-800">
                            {p.client_name}
                          </td>
                          <td className="py-3.5 px-4 text-slate-700">
                            {p.name}
                          </td>
                          <td className="py-3.5 px-4 text-slate-600 font-mono">
                            {p.location}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: DOKUMENTE & CMR */}
          {activeTab === 'cmr' && (
            <div className="space-y-6 animate-fade-in">
              <div className={`p-6 rounded-3xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200/70'} shadow-sm space-y-6`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600 block">Transportauftrag auswählen:</label>
                    <select
                      value={selectedOrderCmr}
                      onChange={(e) => setSelectedOrderCmr(e.target.value)}
                      className={`w-full sm:w-80 px-3.5 py-2 text-xs font-bold rounded-xl border ${darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'}`}
                    >
                      <option value="">-- Transportauftrag auswählen --</option>
                      {orders.map(o => (
                        <option key={o.id} value={o.id}>{o.id} - {o.client_name || o.unload_site_name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center space-x-3 pt-4 sm:pt-0">
                    <button
                      onClick={() => currentCmrOrder && window.print()}
                      disabled={!currentCmrOrder}
                      className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs shadow-md shadow-blue-600/20"
                    >
                      <Printer className="w-4 h-4" />
                      <span>Transportauftrag drucken</span>
                    </button>

                    <button
                      onClick={() => currentCmrOrder && window.print()}
                      disabled={!currentCmrOrder}
                      className="flex items-center space-x-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs shadow-md shadow-amber-600/20"
                    >
                      <FileText className="w-4 h-4" />
                      <span>Frachtbrief (CMR) drucken</span>
                    </button>
                  </div>
                </div>

                {/* Document Display Pane */}
                {!currentCmrOrder ? (
                  <div className="p-16 border-2 border-dashed border-slate-200 rounded-3xl text-center space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                      <FileText className="w-6 h-6" />
                    </div>
                    <p className="text-xs text-slate-500 font-medium">
                      Wählen Sie eine Auftragsnummer aus, um den Transportauftrag oder den Frachtbrief (CMR) anzuzeigen.
                    </p>
                  </div>
                ) : (
                  <div className="border-2 border-slate-800 p-6 space-y-4 text-xs font-sans bg-white text-slate-900 rounded-xl print:p-0">
                    <div className="flex items-center justify-between border-b-2 border-slate-800 pb-4">
                      <div>
                        <h2 className="text-xl font-black uppercase tracking-wider">CMR FRACHTBRIEF</h2>
                        <p className="text-[10px] text-slate-500 uppercase">International Consignment Note</p>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-bold uppercase text-slate-400 block">Frachtbrief-Nr.</span>
                        <span className="text-base font-black font-mono">CMR-{currentCmrOrder.id}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 border-b-2 border-slate-800 pb-4">
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold uppercase text-slate-500 block">1. Absender</span>
                        <p className="font-bold">Tinglev Elementfabrik A/S</p>
                        <p className="text-slate-600">Industrivej 14, DK-6360 Tinglev</p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold uppercase text-slate-500 block">2. Empfänger</span>
                        <p className="font-bold">{currentCmrOrder.client_name}</p>
                        <p className="text-slate-600">{currentCmrOrder.unload_site_name}</p>
                        <p className="text-slate-600">{currentCmrOrder.unload_site_street}</p>
                      </div>
                    </div>

                    <div className="border-b-2 border-slate-800 pb-4">
                      <span className="text-[10px] font-bold uppercase text-slate-500 block mb-2">Bezeichnung des Gutes</span>
                      <table className="w-full text-left font-mono text-xs">
                        <thead>
                          <tr className="border-b border-slate-300">
                            <th className="py-1">KW</th>
                            <th className="py-1">Fahrzeug</th>
                            <th className="py-1">Bezeichnung</th>
                            <th className="py-1 text-right">Gewicht</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="py-1">KW {currentCmrOrder.kw}</td>
                            <td className="py-1">{currentCmrOrder.vehicle_type}</td>
                            <td className="py-1">Betonfertigteile ({currentCmrOrder.element_count || 10} Stk.)</td>
                            <td className="py-1 text-right font-bold">{currentCmrOrder.gross_weight_kg?.toLocaleString('de-DE')} kg</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </main>

      {/* MODAL: CREATE NEW TRANSPORT ORDER */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 space-y-6 shadow-2xl animate-scale-in text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="text-base font-bold text-slate-900">Neuen Transportauftrag anlegen</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 font-bold text-base">✕</button>
            </div>

            <form onSubmit={handleCreateOrder} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Auftrags-Nr. *</label>
                  <input
                    type="text"
                    required
                    placeholder="z.B. A26-00340-01"
                    value={newOrder.id}
                    onChange={(e) => setNewOrder({ ...newOrder, id: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">KW *</label>
                  <input
                    type="text"
                    required
                    placeholder="26"
                    value={newOrder.kw}
                    onChange={(e) => setNewOrder({ ...newOrder, kw: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Transportmittel</label>
                  <select
                    value={newOrder.vehicle_type}
                    onChange={(e) => setNewOrder({ ...newOrder, vehicle_type: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                  >
                    <option value="3-Achser">3-Achser</option>
                    <option value="Innenlader">Innenlader</option>
                    <option value="2-Achser">2-Achser</option>
                    <option value="Tieflader">Tieflader</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Transportart</label>
                  <select
                    value={newOrder.transport_type}
                    onChange={(e) => setNewOrder({ ...newOrder, transport_type: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                  >
                    <option value="One-Way">One-Way</option>
                    <option value="Rundlauf">Rundlauf</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Elemente (Stk)</label>
                  <input
                    type="number"
                    value={newOrder.element_count}
                    onChange={(e) => setNewOrder({ ...newOrder, element_count: parseInt(e.target.value) || 0 })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Gewicht (kg)</label>
                  <input
                    type="number"
                    value={newOrder.gross_weight_kg}
                    onChange={(e) => setNewOrder({ ...newOrder, gross_weight_kg: parseFloat(e.target.value) || 0 })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                  />
                </div>

                <div className="col-span-2">
                  <label className="font-bold text-slate-700 block mb-1">Auftraggeber (Kunde)</label>
                  <input
                    type="text"
                    placeholder="Wohlfühlhaus Bau GmbH"
                    value={newOrder.client_name}
                    onChange={(e) => setNewOrder({ ...newOrder, client_name: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>

                <div className="col-span-2">
                  <label className="font-bold text-slate-700 block mb-1">Bauvorhaben / Entladestelle</label>
                  <input
                    type="text"
                    placeholder="Marina City Haus 2"
                    value={newOrder.unload_site_name}
                    onChange={(e) => setNewOrder({ ...newOrder, unload_site_name: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 text-white rounded-xl font-bold shadow-md shadow-blue-600/20"
                >
                  Transport Anlegen
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
