import React, { useState, useEffect } from 'react';
import {
  Truck,
  TrendingUp,
  Calendar,
  DollarSign,
  Plus,
  Filter,
  FileText,
  Printer,
  CheckCircle,
  AlertCircle,
  Building,
  UserCheck,
  Search,
  RefreshCw,
  Edit,
  ChevronRight,
  Shield,
  Clock,
  Layers,
  MapPin,
  Phone
} from 'lucide-react';
import { api } from '../../services/api';

export function TransportMatrixWidget() {
  const [activeSubTab, setActiveSubTab] = useState('matrix'); // 'kpis', 'matrix', 'wochenplan', 'carriers', 'cmr'
  const [orders, setOrders] = useState([]);
  const [projects, setProjects] = useState([]);
  const [carriers, setCarriers] = useState([]);
  const [kpis, setKpis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [kwFilter, setKwFilter] = useState('');
  const [carrierFilter, setCarrierFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [showCmrModal, setShowCmrModal] = useState(null);

  // New Order Form State
  const [formData, setFormData] = useState({
    project_id: '',
    carrier_id: '',
    kw: 'KW37',
    delivery_date: '',
    delivery_time: '08:00',
    delivery_address: '',
    vehicle_type: 'Innenlader (Spezial)',
    trailer_license: '',
    driver_name: '',
    driver_phone: '',
    crane_required: true,
    weight_kg: 24000,
    agreed_revenue: 1500,
    actual_cost: 1100,
    toll_cost: 95,
    waiting_cost: 0,
    status: 'Geplant',
    notes: ''
  });

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [ordersData, kpisData, projectsData, carriersData] = await Promise.all([
        api.getTransportOrders({ kw: kwFilter, carrier_id: carrierFilter }),
        api.getTransportKpis(),
        api.getTransportProjects(),
        api.getTransportCarriers()
      ]);
      setOrders(ordersData);
      setKpis(kpisData);
      setProjects(projectsData);
      setCarriers(carriersData);
    } catch (err) {
      console.error('Error fetching TransportMatrix data:', err);
      setError('Fehler beim Laden der Transportdaten.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [kwFilter, carrierFilter]);

  const handleCreateOrder = async (e) => {
    e.preventDefault();
    try {
      await api.createTransportOrder(formData);
      setShowAddModal(false);
      fetchData();
    } catch (err) {
      alert('Fehler beim Erstellen des Transportauftrags: ' + err.message);
    }
  };

  const handleUpdateOrder = async (e) => {
    e.preventDefault();
    if (!editingOrder) return;
    try {
      await api.updateTransportOrder(editingOrder.id, editingOrder);
      setEditingOrder(null);
      fetchData();
    } catch (err) {
      alert('Fehler beim Aktualisieren: ' + err.message);
    }
  };

  const filteredOrders = orders.filter(o => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (o.order_number && o.order_number.toLowerCase().includes(q)) ||
      (o.project_name && o.project_name.toLowerCase().includes(q)) ||
      (o.carrier_name && o.carrier_name.toLowerCase().includes(q)) ||
      (o.driver_name && o.driver_name.toLowerCase().includes(q)) ||
      (o.trailer_license && o.trailer_license.toLowerCase().includes(q))
    );
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Abgeschlossen':
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">Abgeschlossen</span>;
      case 'In Transport':
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">In Transport</span>;
      case 'Verladen':
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200">Verladen</span>;
      case 'Geplant':
      default:
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">Disponiert</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Navigation Sub-Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-2.5 rounded-2xl border border-slate-100 shadow-card">
        <div className="flex items-center space-x-1.5 overflow-x-auto">
          {[
            { id: 'matrix', label: '🚚 Transportmatrix & Disposition', icon: Truck },
            { id: 'kpis', label: '📊 DB1 & Kennzahlen', icon: TrendingUp },
            { id: 'wochenplan', label: '📅 Wochenplan & Lagerplatz', icon: Calendar },
            { id: 'carriers', label: '🏢 Speditionen & Partner', icon: Building },
            { id: 'cmr', label: '📜 CMR Frachtbriefe', icon: FileText }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeSubTab === tab.id
                    ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-xl text-xs font-bold shadow-md shadow-amber-500/20 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Neuer Transport</span>
        </button>
      </div>

      {/* KPI Header Bar */}
      {kpis && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-card space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Gesamtaufträge</span>
            <div className="flex items-baseline justify-between">
              <span className="text-xl font-black text-slate-900 font-mono">{kpis.total_orders}</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">Aktuelle KW</span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-card space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Fracht-Umsatz</span>
            <div className="flex items-baseline justify-between">
              <span className="text-xl font-black text-slate-900 font-mono">€{kpis.total_revenue?.toLocaleString('de-DE')}</span>
              <span className="text-[10px] text-slate-400">Vereinbart</span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-card space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Gesamtkosten (inkl. Maut)</span>
            <div className="flex items-baseline justify-between">
              <span className="text-xl font-black text-rose-600 font-mono">€{kpis.total_cost?.toLocaleString('de-DE')}</span>
              <span className="text-[10px] text-slate-400">Maut: €{kpis.total_toll?.toLocaleString('de-DE')}</span>
            </div>
          </div>

          <div className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white p-4 rounded-2xl shadow-card space-y-1">
            <span className="text-[10px] font-bold text-emerald-100 uppercase tracking-wider block">Deckungsbeitrag 1 (DB1)</span>
            <div className="flex items-baseline justify-between">
              <span className="text-xl font-black font-mono">€{kpis.total_db1?.toLocaleString('de-DE')}</span>
              <span className="text-xs font-bold px-2 py-0.5 rounded-lg bg-white/20 font-mono">{kpis.db1_margin_percent}%</span>
            </div>
          </div>
        </div>
      )}

      {/* Main Tab 1: Transportmatrix & Disposition */}
      {activeSubTab === 'matrix' && (
        <div className="space-y-4 animate-fade-in">
          {/* Controls Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-card flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <div className="flex items-center space-x-2 text-xs font-bold text-slate-600">
                <Filter className="w-4 h-4 text-amber-500" />
                <span>Filter:</span>
              </div>
              <select
                value={kwFilter}
                onChange={(e) => setKwFilter(e.target.value)}
                className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 font-bold"
              >
                <option value="">Alle Wochen (KW)</option>
                <option value="KW36">KW36 - Sep 2026</option>
                <option value="KW37">KW37 - Sep 2026</option>
                <option value="KW38">KW38 - Sep 2026</option>
              </select>

              <select
                value={carrierFilter}
                onChange={(e) => setCarrierFilter(e.target.value)}
                className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 font-bold"
              >
                <option value="">Alle Speditionen</option>
                {carriers.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Suchen (Auftrag, Fahrer, Kennzeichen)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              />
            </div>
          </div>

          {/* Matrix Table */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3.5 px-4">KW & Nr.</th>
                    <th className="py-3.5 px-4">Bauvorhaben & Ziel</th>
                    <th className="py-3.5 px-4">Spedition & Fahrzeug</th>
                    <th className="py-3.5 px-4">Termin & Kran</th>
                    <th className="py-3.5 px-4 text-right">Umsatz (€)</th>
                    <th className="py-3.5 px-4 text-right">Kosten (€)</th>
                    <th className="py-3.5 px-4 text-right">DB1 (€ / %)</th>
                    <th className="py-3.5 px-4 text-center">Status</th>
                    <th className="py-3.5 px-4 text-center">Aktionen</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {loading ? (
                    <tr>
                      <td colSpan="9" className="py-8 text-center text-slate-400">
                        <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2" />
                        Lade Logistik-Daten...
                      </td>
                    </tr>
                  ) : filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan="9" className="py-8 text-center text-slate-400">
                        Keine Transportaufträge gefunden.
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map(ord => {
                      const db1Percent = ord.agreed_revenue > 0 ? ((ord.db1_margin / ord.agreed_revenue) * 100).toFixed(1) : 0;
                      return (
                        <tr key={ord.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3.5 px-4">
                            <span className="px-2 py-0.5 rounded bg-slate-900 text-white font-mono text-[10px] font-bold mr-1.5">
                              {ord.kw}
                            </span>
                            <span className="font-mono font-bold text-slate-800">{ord.order_number}</span>
                          </td>
                          <td className="py-3.5 px-4">
                            <p className="font-bold text-slate-900">{ord.project_name}</p>
                            <p className="text-[11px] text-slate-400 flex items-center space-x-1">
                              <MapPin className="w-3 h-3 text-amber-500 inline" />
                              <span>{ord.delivery_address}</span>
                            </p>
                          </td>
                          <td className="py-3.5 px-4">
                            <p className="font-bold text-slate-800">{ord.carrier_name}</p>
                            <p className="text-[11px] text-slate-500">
                              {ord.vehicle_type} • <span className="font-mono text-slate-700">{ord.trailer_license}</span>
                            </p>
                            {ord.driver_name && (
                              <p className="text-[10px] text-slate-400">
                                👤 {ord.driver_name} ({ord.driver_phone})
                              </p>
                            )}
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-slate-800 font-mono">{ord.delivery_date}</div>
                            <div className="text-[11px] text-slate-500 flex items-center space-x-1">
                              <Clock className="w-3 h-3 text-slate-400" />
                              <span>{ord.delivery_time} Uhr</span>
                              {ord.crane_required && (
                                <span className="ml-1 px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 text-[9px] font-bold">
                                  🏗️ Kran
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                            €{ord.agreed_revenue?.toLocaleString('de-DE')}
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono text-slate-700">
                            <p className="font-bold">€{(ord.actual_cost + ord.toll_cost + ord.waiting_cost)?.toLocaleString('de-DE')}</p>
                            <p className="text-[10px] text-slate-400">Maut: €{ord.toll_cost}</p>
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono">
                            <p className={`font-bold ${ord.db1_margin >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                              €{ord.db1_margin?.toLocaleString('de-DE')}
                            </p>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                              db1Percent >= 20 ? 'bg-emerald-100 text-emerald-800' : db1Percent >= 10 ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                            }`}>
                              {db1Percent}%
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            {getStatusBadge(ord.status)}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <div className="flex items-center justify-center space-x-1">
                              <button
                                onClick={() => setEditingOrder(ord)}
                                title="Bearbeiten"
                                className="p-1.5 hover:bg-slate-200/60 rounded-lg text-slate-600 transition-colors"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setShowCmrModal(ord)}
                                title="CMR Frachtbrief drucken"
                                className="p-1.5 hover:bg-amber-100 rounded-lg text-amber-700 transition-colors"
                              >
                                <Printer className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Main Tab 2: KPI & DB1 Breakdown */}
      {activeSubTab === 'kpis' && kpis && (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-card space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Deckungsbeitrags-Analyse (DB1)</h3>
            <p className="text-xs text-slate-500">
              Der DB1 berechnet sich aus dem vereinbarten Fracht-Kundenpreis abzüglich der effektiven Frachtkosten der Spedition, Mautgebühren und Standzeiten. Target-Marge &gt; 18%.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
              <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-100 space-y-2">
                <span className="text-xs font-bold text-emerald-800">Hohe Rentabilität (&gt; 25%)</span>
                <p className="text-2xl font-black text-emerald-900 font-mono">
                  {orders.filter(o => o.agreed_revenue > 0 && (o.db1_margin / o.agreed_revenue) >= 0.25).length} Transporte
                </p>
                <p className="text-[11px] text-emerald-700">Sehr gute Auslastung & Sonderkonditionen</p>
              </div>

              <div className="p-5 rounded-2xl bg-amber-50 border border-amber-100 space-y-2">
                <span className="text-xs font-bold text-amber-800">Normale Rentabilität (10% - 25%)</span>
                <p className="text-2xl font-black text-amber-900 font-mono">
                  {orders.filter(o => o.agreed_revenue > 0 && (o.db1_margin / o.agreed_revenue) >= 0.10 && (o.db1_margin / o.agreed_revenue) < 0.25).length} Transporte
                </p>
                <p className="text-[11px] text-amber-700">Standard-Strecken & Werksverkehr</p>
              </div>

              <div className="p-5 rounded-2xl bg-rose-50 border border-rose-100 space-y-2">
                <span className="text-xs font-bold text-rose-800">Kritische Rentabilität (&lt; 10%)</span>
                <p className="text-2xl font-black text-rose-900 font-mono">
                  {orders.filter(o => o.agreed_revenue > 0 && (o.db1_margin / o.agreed_revenue) < 0.10).length} Transporte
                </p>
                <p className="text-[11px] text-rose-700">Prüfung von Maut & Leerfahrten erforderlich</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Tab 3: Wochenplan & Lagerplatz */}
      {activeSubTab === 'wochenplan' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-card space-y-6 animate-fade-in">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Wochenplan & Verladeliste (KW37)</h3>
              <p className="text-xs text-slate-500">Übersicht der Auslieferungen pro Wochentag im Werk Tinglev</p>
            </div>
            <span className="px-3 py-1 bg-amber-100 text-amber-800 font-bold text-xs rounded-xl">
              5 Auslieferungen geplant
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag'].map((day, idx) => {
              const dayOrders = orders.filter((o, i) => i % 5 === idx);
              return (
                <div key={day} className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                  <div className="border-b border-slate-200 pb-2">
                    <span className="text-xs font-bold text-slate-900">{day}</span>
                    <span className="text-[10px] text-slate-400 block font-mono">0{8 + idx}. Sep 2026</span>
                  </div>

                  {dayOrders.length === 0 ? (
                    <p className="text-[11px] text-slate-400 italic py-4 text-center">Keine Verladungen</p>
                  ) : (
                    dayOrders.map(o => (
                      <div key={o.id} className="p-3 bg-white rounded-xl border border-slate-200 shadow-sm space-y-1 text-xs">
                        <span className="text-[10px] font-mono font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
                          {o.delivery_time} Uhr
                        </span>
                        <p className="font-bold text-slate-900 truncate">{o.project_name}</p>
                        <p className="text-[10px] text-slate-500">{o.carrier_name}</p>
                        <span className="inline-block text-[9px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-700">
                          {o.vehicle_type}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Tab 4: Speditionen & Partner */}
      {activeSubTab === 'carriers' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-card space-y-6 animate-fade-in">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Speditionspartner & Fuhrpark-Rahmenverträge</h3>
            <p className="text-xs text-slate-500">Zertifizierte Schwerlast- und Spezialtransport-Partner der Tinglev Elementfabrik</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {carriers.map(c => (
              <div key={c.id} className="p-5 rounded-2xl border border-slate-200/80 bg-slate-50/50 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-sm">
                    {c.name.substring(0, 2).toUpperCase()}
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                    Aktiv & Rahmenvertrag
                  </span>
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900">{c.name}</h4>
                  <p className="text-xs text-slate-500">Kreditor-Nr: <span className="font-mono text-slate-700">{c.code}</span></p>
                </div>
                <div className="text-xs space-y-1 text-slate-600 pt-2 border-t border-slate-200">
                  <p className="flex items-center space-x-2">
                    <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                    <span>Kontakt: {c.contact_person}</span>
                  </p>
                  <p className="flex items-center space-x-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span className="font-mono text-[11px]">{c.phone}</span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Tab 5: CMR Generator */}
      {activeSubTab === 'cmr' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-card space-y-4 animate-fade-in">
          <div>
            <h3 className="text-sm font-bold text-slate-900">CMR Frachtbriefe & Frachtunterlagen</h3>
            <p className="text-xs text-slate-500">Generieren und drucken Sie den internationalen CMR-Frachtbrief für Verladungen</p>
          </div>

          <div className="divide-y divide-slate-100">
            {orders.map(o => (
              <div key={o.id} className="py-4 flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono font-bold text-xs text-slate-900">{o.order_number}</span>
                    <span className="text-xs font-bold text-slate-800">• {o.project_name}</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Spedition: {o.carrier_name} ({o.trailer_license}) • Lieferdatum: {o.delivery_date}
                  </p>
                </div>

                <button
                  onClick={() => setShowCmrModal(o)}
                  className="flex items-center space-x-1.5 px-3 py-1.5 bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 rounded-xl text-xs font-bold transition-all"
                >
                  <Printer className="w-4 h-4" />
                  <span>CMR Vorschau & Druck</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL: Create New Transport Order */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 space-y-6 shadow-2xl animate-scale-in my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="text-base font-bold text-slate-900">Neuen Transportauftrag disponieren</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateOrder} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Bauvorhaben / Projekt *</label>
                  <select
                    required
                    value={formData.project_id}
                    onChange={(e) => setFormData({ ...formData, project_id: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                  >
                    <option value="">Projekt auswählen...</option>
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.code} - {p.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Spedition / Frachtführer *</label>
                  <select
                    required
                    value={formData.carrier_id}
                    onChange={(e) => setFormData({ ...formData, carrier_id: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                  >
                    <option value="">Spedition auswählen...</option>
                    {carriers.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Kalenderwoche (KW)</label>
                  <input
                    type="text"
                    value={formData.kw}
                    onChange={(e) => setFormData({ ...formData, kw: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                    placeholder="z.B. KW37"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Fahrzeugtyp</label>
                  <select
                    value={formData.vehicle_type}
                    onChange={(e) => setFormData({ ...formData, vehicle_type: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                  >
                    <option value="Innenlader (Spezial)">Innenlader (Spezial)</option>
                    <option value="Tele-Sattel 3-Achse">Tele-Sattel 3-Achse</option>
                    <option value="Tieflader Schwerlast">Tieflader Schwerlast</option>
                    <option value="Standard Sattelzug">Standard Sattelzug</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Anlieferdatum</label>
                  <input
                    type="date"
                    value={formData.delivery_date}
                    onChange={(e) => setFormData({ ...formData, delivery_date: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Anlieferzeit</label>
                  <input
                    type="time"
                    value={formData.delivery_time}
                    onChange={(e) => setFormData({ ...formData, delivery_time: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="font-bold text-slate-700 block mb-1">Lieferadresse Baustelle</label>
                  <input
                    type="text"
                    value={formData.delivery_address}
                    onChange={(e) => setFormData({ ...formData, delivery_address: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                    placeholder="Straße, PLZ, Ort..."
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Auftraggeber Umsatz (€)</label>
                  <input
                    type="number"
                    value={formData.agreed_revenue}
                    onChange={(e) => setFormData({ ...formData, agreed_revenue: parseFloat(e.target.value) || 0 })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Spedition Kosten (€)</label>
                  <input
                    type="number"
                    value={formData.actual_cost}
                    onChange={(e) => setFormData({ ...formData, actual_cost: parseFloat(e.target.value) || 0 })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Maut-Kosten (€)</label>
                  <input
                    type="number"
                    value={formData.toll_cost}
                    onChange={(e) => setFormData({ ...formData, toll_cost: parseFloat(e.target.value) || 0 })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Auflieger / Kennzeichen</label>
                  <input
                    type="text"
                    value={formData.trailer_license}
                    onChange={(e) => setFormData({ ...formData, trailer_license: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-mono uppercase"
                    placeholder="FL-TR 8840"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 text-white rounded-xl font-bold shadow-md shadow-amber-600/20 hover:bg-amber-700"
                >
                  Transport Speichern
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Edit Transport Order */}
      {editingOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-6 shadow-2xl animate-scale-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="text-base font-bold text-slate-900">Transport {editingOrder.order_number} bearbeiten</h3>
              <button onClick={() => setEditingOrder(null)} className="text-slate-400 font-bold">✕</button>
            </div>

            <form onSubmit={handleUpdateOrder} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Status</label>
                <select
                  value={editingOrder.status}
                  onChange={(e) => setEditingOrder({ ...editingOrder, status: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                >
                  <option value="Geplant">Geplant (Disponiert)</option>
                  <option value="Verladen">Verladen im Werk</option>
                  <option value="In Transport">In Transport auf Straße</option>
                  <option value="Abgeschlossen">Abgeschlossen / Ausgeliefert</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Kunden-Umsatz (€)</label>
                  <input
                    type="number"
                    value={editingOrder.agreed_revenue}
                    onChange={(e) => setEditingOrder({ ...editingOrder, agreed_revenue: parseFloat(e.target.value) || 0 })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Frachtkosten Spedition (€)</label>
                  <input
                    type="number"
                    value={editingOrder.actual_cost}
                    onChange={(e) => setEditingOrder({ ...editingOrder, actual_cost: parseFloat(e.target.value) || 0 })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Fahrer Name</label>
                  <input
                    type="text"
                    value={editingOrder.driver_name || ''}
                    onChange={(e) => setEditingOrder({ ...editingOrder, driver_name: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Fahrer Telefon</label>
                  <input
                    type="text"
                    value={editingOrder.driver_phone || ''}
                    onChange={(e) => setEditingOrder({ ...editingOrder, driver_phone: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setEditingOrder(null)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 text-white rounded-xl font-bold shadow-md shadow-amber-600/20"
                >
                  Änderungen Speichern
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL / PRINT VIEW: CMR Document */}
      {showCmrModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-8 space-y-6 shadow-2xl animate-scale-in my-8 print:p-0 print:shadow-none">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4 print:hidden">
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-amber-600" />
                <h3 className="font-bold text-slate-900 text-base">CMR Internationaler Frachtbrief</h3>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => window.print()}
                  className="flex items-center space-x-2 px-4 py-2 bg-slate-900 text-white font-bold rounded-xl text-xs"
                >
                  <Printer className="w-4 h-4" />
                  <span>Drucken (A4)</span>
                </button>
                <button onClick={() => setShowCmrModal(null)} className="text-slate-400 font-bold text-lg">✕</button>
              </div>
            </div>

            {/* Print Document Content */}
            <div className="border-2 border-slate-800 p-6 space-y-4 text-xs font-sans">
              <div className="flex items-center justify-between border-b-2 border-slate-800 pb-4">
                <div>
                  <h2 className="text-xl font-black uppercase tracking-wider text-slate-900">CMR FRACHTBRIEF</h2>
                  <p className="text-[10px] text-slate-500 uppercase">International Consignment Note • Letttre de Voiture Internationale</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Frachtbrief-Nr.</span>
                  <span className="text-base font-black font-mono text-slate-900">CMR-{showCmrModal.order_number}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-b-2 border-slate-800 pb-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase text-slate-500 block">1. Absender (Name, Anschrift, Land)</span>
                  <p className="font-bold text-slate-900">Tinglev Elementfabrik A/S</p>
                  <p className="text-slate-600">Industrivej 14, DK-6360 Tinglev</p>
                  <p className="text-slate-600">Dänemark (Danmark)</p>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase text-slate-500 block">2. Empfänger (Name, Anschrift, Land)</span>
                  <p className="font-bold text-slate-900">{showCmrModal.project_name}</p>
                  <p className="text-slate-600">{showCmrModal.delivery_address}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-b-2 border-slate-800 pb-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase text-slate-500 block">16. Frachtführer (Name, Anschrift, Land)</span>
                  <p className="font-bold text-slate-900">{showCmrModal.carrier_name}</p>
                  <p className="text-slate-600">Fahrer: {showCmrModal.driver_name || 'N.N.'}</p>
                  <p className="text-slate-600 font-mono">Kennzeichen: {showCmrModal.trailer_license}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase text-slate-500 block">3. Auslieferungsort des Gutes</span>
                  <p className="font-bold text-slate-900">Baustelle {showCmrModal.project_name}</p>
                  <p className="text-slate-600">Liefertermin: <span className="font-mono font-bold">{showCmrModal.delivery_date} ({showCmrModal.delivery_time} Uhr)</span></p>
                </div>
              </div>

              <div className="border-b-2 border-slate-800 pb-4">
                <span className="text-[10px] font-bold uppercase text-slate-500 block mb-2">Bezeichnung des Gutes & Ladungssicherung</span>
                <table className="w-full text-left font-mono">
                  <thead>
                    <tr className="border-b border-slate-300 text-[10px]">
                      <th className="py-1">Anzahl</th>
                      <th className="py-1">Art der Verpackung / Ladung</th>
                      <th className="py-1">Bezeichnung</th>
                      <th className="py-1 text-right">Bruttogewicht (kg)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="py-1">1 Transport</td>
                      <td className="py-1">{showCmrModal.vehicle_type}</td>
                      <td className="py-1">Betonfertigteile (Hohlwände / Fassaden / Binder)</td>
                      <td className="py-1 text-right font-bold">{showCmrModal.weight_kg?.toLocaleString('de-DE')} kg</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="grid grid-cols-3 gap-4 pt-4 text-[10px]">
                <div className="border border-slate-300 p-3 h-20 flex flex-col justify-between">
                  <span className="font-bold uppercase text-slate-400">Unterschrift Absender</span>
                  <span className="border-t border-slate-400 text-slate-400 text-center pt-1">Werk Tinglev</span>
                </div>
                <div className="border border-slate-300 p-3 h-20 flex flex-col justify-between">
                  <span className="font-bold uppercase text-slate-400">Unterschrift Frachtführer</span>
                  <span className="border-t border-slate-400 text-slate-400 text-center pt-1">Fahrer / Carrier</span>
                </div>
                <div className="border border-slate-300 p-3 h-20 flex flex-col justify-between">
                  <span className="font-bold uppercase text-slate-400">Unterschrift Empfänger</span>
                  <span className="border-t border-slate-400 text-slate-400 text-center pt-1">Baustellenleiter</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
