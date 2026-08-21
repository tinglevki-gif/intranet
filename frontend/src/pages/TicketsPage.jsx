import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Headphones,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Flame,
  UserCheck,
  Send,
  Lock,
  MessageSquare,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Tag,
  Sparkles,
  LayoutGrid,
  List,
  Calendar,
  X,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  FolderOpen,
  Laptop,
  Cpu,
  Building,
  TrendingUp,
  HelpCircle,
  Check
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { ticketService } from '../services/ticketService';
import { getAvatarUrl } from '../services/api';

// Status styling & translation helpers
const STATUS_CONFIG = {
  OFFEN: { label: 'Offen', bg: 'bg-blue-50 text-blue-700 border-blue-200', dot: 'bg-blue-500', icon: Clock },
  IN_BEARBEITUNG: { label: 'In Bearbeitung', bg: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500', icon: RefreshCw },
  WARTET_AUF_BENUTZER: { label: 'Wartet auf Rückmeldung', bg: 'bg-purple-50 text-purple-700 border-purple-200', dot: 'bg-purple-500', icon: MessageSquare },
  GELOEST: { label: 'Gelöst', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500', icon: CheckCircle2 },
  GESCHLOSSEN: { label: 'Geschlossen', bg: 'bg-slate-100 text-slate-700 border-slate-300', dot: 'bg-slate-500', icon: Check }
};

const PRIORITY_CONFIG = {
  NIEDRIG: { label: 'Niedrig', bg: 'bg-slate-100 text-slate-700 border-slate-200', badge: 'text-slate-600', icon: null },
  MITTEL: { label: 'Mittel', bg: 'bg-blue-50 text-blue-700 border-blue-200', badge: 'text-blue-600', icon: null },
  HOCH: { label: 'Hoch', bg: 'bg-orange-50 text-orange-700 border-orange-200', badge: 'text-orange-600', icon: AlertTriangle },
  KRITISCH: { label: 'Kritisch', bg: 'bg-rose-50 text-rose-700 border-rose-300 animate-pulse', badge: 'text-rose-600 font-bold', icon: Flame }
};

const CATEGORY_CONFIG = {
  IT_SUPPORT: { label: 'IT-Support & Helpdesk', icon: Laptop, color: 'text-indigo-600 bg-indigo-50 border-indigo-200' },
  HARDWARE: { label: 'Hardware & Geräte', icon: Cpu, color: 'text-blue-600 bg-blue-50 border-blue-200' },
  SOFTWARE: { label: 'Software & Lizenzen', icon: FolderOpen, color: 'text-violet-600 bg-violet-50 border-violet-200' },
  VERTRIEB: { label: 'Vertrieb & Projekte', icon: TrendingUp, color: 'text-amber-600 bg-amber-50 border-amber-200' },
  GEBAEUDE: { label: 'Gebäude & Facility', icon: Building, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
  ALLGEMEIN: { label: 'Allgemeine Anfrage', icon: HelpCircle, color: 'text-slate-600 bg-slate-50 border-slate-200' }
};

export function TicketsPage() {
  const { user } = useAuth();
  const { t } = useLanguage();

  // State Management
  const [activeTab, setActiveTab] = useState('my_tickets'); // 'my_tickets' | 'all_tickets' | 'knowledge_base'
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'kanban'
  const [loading, setLoading] = useState(true);
  const [tickets, setTickets] = useState([]);
  const [stats, setStats] = useState(null);
  const [supportUsers, setSupportUsers] = useState([]);

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  // Modals & Drawers
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [detailTicketId, setDetailTicketId] = useState(null);
  const [detailTicket, setDetailTicket] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Knowledge Base State
  const [kbSearchQuery, setKbSearchQuery] = useState('');
  const [kbCategoryFilter, setKbCategoryFilter] = useState('ALL');
  const [kbResults, setKbResults] = useState([]);
  const [kbLoading, setKbLoading] = useState(false);
  const [expandedKbId, setExpandedKbId] = useState(null);

  // Check if current user is support/admin
  const isSupportStaff = useMemo(() => {
    if (!user) return false;
    return (
      user.role === 'ADMIN' ||
      user.role === 'IT_ADMIN' ||
      (user.allowed_modules && user.allowed_modules.includes('it-helpdesk'))
    );
  }, [user]);

  // Fetch Tickets & Stats
  const fetchTickets = useCallback(async () => {
    setLoading(true);
    try {
      const isMyTicketsTab = activeTab === 'my_tickets';
      const [ticketsRes, statsRes] = await Promise.all([
        ticketService.getTickets({
          status: statusFilter,
          prioritaet: priorityFilter,
          kategorie: categoryFilter,
          query: searchQuery,
          only_my_tickets: isMyTicketsTab
        }),
        ticketService.getTicketStats()
      ]);

      setTickets(ticketsRes?.items || []);
      setStats(statsRes || null);
    } catch (err) {
      console.error('Failed to load tickets:', err);
    } finally {
      setLoading(false);
    }
  }, [activeTab, statusFilter, priorityFilter, categoryFilter, searchQuery]);

  // Fetch Knowledge Base
  const fetchKnowledgeBase = useCallback(async () => {
    setKbLoading(true);
    try {
      const res = await ticketService.searchKnowledgeBase({
        q: kbSearchQuery,
        kategorie: kbCategoryFilter
      });
      setKbResults(res?.results || []);
    } catch (err) {
      console.error('Failed to fetch knowledge base:', err);
    } finally {
      setKbLoading(false);
    }
  }, [kbSearchQuery, kbCategoryFilter]);

  // Fetch Support Users for Assignment dropdown
  useEffect(() => {
    const loadSupportUsers = async () => {
      const usersList = await ticketService.getUsers();
      setSupportUsers(usersList);
    };
    loadSupportUsers();
  }, []);

  // Initial & Tab-switch triggers
  useEffect(() => {
    if (activeTab === 'knowledge_base') {
      fetchKnowledgeBase();
    } else {
      fetchTickets();
    }
  }, [activeTab, fetchTickets, fetchKnowledgeBase]);

  // Fetch Single Ticket Details
  const handleOpenDetail = async (ticketId) => {
    setDetailTicketId(ticketId);
    setDetailLoading(true);
    try {
      const ticket = await ticketService.getTicketDetail(ticketId);
      setDetailTicket(ticket);
    } catch (err) {
      console.error('Failed to load ticket detail:', err);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleCloseDetail = () => {
    setDetailTicketId(null);
    setDetailTicket(null);
    fetchTickets();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-fade-in">
      {/* 1. Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden border border-slate-800">
        <div className="absolute right-0 top-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 px-3 py-1 bg-indigo-500/20 border border-indigo-400/30 rounded-full text-xs font-semibold text-indigo-300 backdrop-blur-sm">
              <Headphones className="w-3.5 h-3.5 text-indigo-400" />
              <span>Unternehmensweiter IT-Helpdesk & Support</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight font-heading text-white">
              Ticket-System & Wissensdatenbank
            </h1>
            <p className="text-slate-300 text-sm max-w-2xl leading-relaxed">
              Erfassen Sie Störungsmeldungen, verfolgen Sie Bearbeitungsstände in Echtzeit und nutzen Sie die Lösungs-Wissensdatenbank für schnelle Selbsthilfe.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setCreateModalOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold text-sm shadow-lg shadow-indigo-500/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Plus className="w-4 h-4" />
              <span>Neues Ticket erfassen</span>
            </button>
          </div>
        </div>

        {/* KPI Metrics Quick Bar */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 pt-6 mt-6 border-t border-slate-800/80">
            <div className="bg-slate-800/60 backdrop-blur-md rounded-2xl p-3.5 border border-slate-700/50">
              <span className="text-xs font-medium text-slate-400 block">Gesamt Tickets</span>
              <span className="text-xl font-bold text-white mt-1 block">{stats.total}</span>
            </div>
            <div className="bg-slate-800/60 backdrop-blur-md rounded-2xl p-3.5 border border-slate-700/50">
              <span className="text-xs font-medium text-blue-400 block">Offen</span>
              <span className="text-xl font-bold text-white mt-1 block">{stats.offen}</span>
            </div>
            <div className="bg-slate-800/60 backdrop-blur-md rounded-2xl p-3.5 border border-slate-700/50">
              <span className="text-xs font-medium text-amber-400 block">In Bearbeitung</span>
              <span className="text-xl font-bold text-white mt-1 block">{stats.in_bearbeitung}</span>
            </div>
            <div className="bg-slate-800/60 backdrop-blur-md rounded-2xl p-3.5 border border-slate-700/50">
              <span className="text-xs font-medium text-emerald-400 block">Gelöst (Archiv)</span>
              <span className="text-xl font-bold text-white mt-1 block">{stats.geloest}</span>
            </div>
            <div className="bg-slate-800/60 backdrop-blur-md rounded-2xl p-3.5 border border-slate-700/50">
              <span className="text-xs font-medium text-rose-400 block">Kritische Fälle</span>
              <span className="text-xl font-bold text-rose-300 mt-1 block flex items-center gap-1.5">
                {stats.kritisch > 0 && <Flame className="w-4 h-4 text-rose-500 animate-bounce" />}
                {stats.kritisch}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* 2. Main Navigation Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-2">
        <div className="flex items-center gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('my_tickets')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all ${
              activeTab === 'my_tickets'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>Meine Tickets</span>
          </button>

          <button
            onClick={() => setActiveTab('all_tickets')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all ${
              activeTab === 'all_tickets'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Headphones className="w-4 h-4" />
            <span>Alle Unternehmens-Tickets</span>
            {isSupportStaff && (
              <span className="ml-1.5 px-2 py-0.5 text-[10px] font-bold bg-indigo-500/30 text-indigo-100 rounded-full">
                Support
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('knowledge_base')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all ${
              activeTab === 'knowledge_base'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-200'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Lösungs-Wissensdatenbank</span>
            <span className="ml-1.5 px-2 py-0.5 text-[10px] font-bold bg-emerald-100 text-emerald-800 rounded-full">
              KI / Search
            </span>
          </button>
        </div>

        {activeTab !== 'knowledge_base' && (
          <div className="flex items-center gap-2 self-end sm:self-auto bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'list' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Listenansicht"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'kanban' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Kanban-Board"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* 3. Tab Contents */}
      {activeTab === 'knowledge_base' ? (
        <KnowledgeBaseView
          searchQuery={kbSearchQuery}
          setSearchQuery={setKbSearchQuery}
          categoryFilter={kbCategoryFilter}
          setCategoryFilter={setKbCategoryFilter}
          results={kbResults}
          loading={kbLoading}
          expandedId={expandedKbId}
          setExpandedId={setExpandedKbId}
          onOpenTicket={handleOpenDetail}
        />
      ) : (
        <div className="space-y-6">
          {/* Filters Bar */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col md:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Ticket suchen nach Nr (TK-2026-...), Titel oder Stichwort..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="ALL">Status: Alle</option>
                <option value="OFFEN">Offen</option>
                <option value="IN_BEARBEITUNG">In Bearbeitung</option>
                <option value="WARTET_AUF_BENUTZER">Wartet auf Benutzer</option>
                <option value="GELOEST">Gelöst</option>
                <option value="GESCHLOSSEN">Geschlossen</option>
              </select>

              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="px-3 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="ALL">Priorität: Alle</option>
                <option value="KRITISCH">Kritisch</option>
                <option value="HOCH">Hoch</option>
                <option value="MITTEL">Mittel</option>
                <option value="NIEDRIG">Niedrig</option>
              </select>

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="ALL">Kategorie: Alle</option>
                <option value="IT_SUPPORT">IT-Support</option>
                <option value="HARDWARE">Hardware</option>
                <option value="SOFTWARE">Software</option>
                <option value="VERTRIEB">Vertrieb</option>
                <option value="GEBAEUDE">Gebäude</option>
                <option value="ALLGEMEIN">Allgemein</option>
              </select>
            </div>
          </div>

          {/* Ticket Listing / Kanban */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-slate-100">
              <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin mb-3" />
              <p className="text-sm font-medium text-slate-500">Lade Tickets & Vorgänge...</p>
            </div>
          ) : tickets.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 p-8">
              <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Headphones className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Keine Tickets gefunden</h3>
              <p className="text-sm text-slate-500 max-w-md mx-auto mt-1">
                Zu den ausgewählten Filterkriterien liegen derzeit keine Vorgänge vor.
              </p>
              <button
                onClick={() => setCreateModalOpen(true)}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-semibold text-xs transition-colors"
              >
                <Plus className="w-4 h-4" /> Neues Ticket erstellen
              </button>
            </div>
          ) : viewMode === 'kanban' ? (
            <TicketsKanbanBoard tickets={tickets} onOpenDetail={handleOpenDetail} />
          ) : (
            <TicketsListView tickets={tickets} onOpenDetail={handleOpenDetail} />
          )}
        </div>
      )}

      {/* 4. Modal "Neues Ticket erfassen" mit Smart-Assist */}
      {createModalOpen && (
        <CreateTicketModal
          isOpen={createModalOpen}
          onClose={() => setCreateModalOpen(false)}
          onCreated={() => {
            setCreateModalOpen(false);
            fetchTickets();
          }}
        />
      )}

      {/* 5. Detail- & Bearbeitungs-Dialog */}
      {detailTicketId && (
        <TicketDetailModal
          ticketId={detailTicketId}
          ticket={detailTicket}
          loading={detailLoading}
          isSupportStaff={isSupportStaff}
          supportUsers={supportUsers}
          onClose={handleCloseDetail}
          onRefresh={() => handleOpenDetail(detailTicketId)}
        />
      )}
    </div>
  );
}

// =========================================================================
// SUB-COMPONENT: LIST VIEW
// =========================================================================
function TicketsListView({ tickets, onOpenDetail }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="divide-y divide-slate-100">
        {tickets.map((ticket) => {
          const statusConf = STATUS_CONFIG[ticket.status] || STATUS_CONFIG.OFFEN;
          const priorityConf = PRIORITY_CONFIG[ticket.prioritaet] || PRIORITY_CONFIG.MITTEL;
          const categoryConf = CATEGORY_CONFIG[ticket.kategorie] || CATEGORY_CONFIG.ALLGEMEIN;
          const CategoryIcon = categoryConf.icon;

          return (
            <div
              key={ticket.id}
              onClick={() => onOpenDetail(ticket.id)}
              className="p-4 hover:bg-slate-50/80 transition-all cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 group"
            >
              <div className="flex items-start gap-3.5">
                <div className={`p-2.5 rounded-xl border ${categoryConf.color} shrink-0 mt-0.5`}>
                  <CategoryIcon className="w-5 h-5" />
                </div>

                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                      {ticket.ticket_nr}
                    </span>
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${statusConf.bg}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${statusConf.dot}`}></span>
                      {statusConf.label}
                    </span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${priorityConf.bg}`}>
                      {priorityConf.label}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                    {ticket.titel}
                  </h4>

                  <p className="text-xs text-slate-500 line-clamp-1">
                    {ticket.beschreibung}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between md:justify-end gap-6 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100 text-xs text-slate-500">
                {/* Creator / Assignee */}
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="block font-semibold text-slate-800">{ticket.ersteller_name}</span>
                    <span className="block text-[11px] text-slate-400">
                      {new Date(ticket.erstellt_am).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                    </span>
                  </div>
                  {ticket.zugewiesen_an_name && (
                    <div className="flex items-center gap-1.5 bg-indigo-50 text-indigo-700 px-2 py-1 rounded-lg border border-indigo-200/60" title={`Zugewiesen an: ${ticket.zugewiesen_an_name}`}>
                      <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                      <span className="text-[11px] font-semibold">{ticket.zugewiesen_an_name}</span>
                    </div>
                  )}
                </div>

                {/* Messages count */}
                <div className="flex items-center gap-1 text-slate-400" title={`${ticket.messages_count} Nachrichten`}>
                  <MessageSquare className="w-4 h-4" />
                  <span className="font-semibold text-slate-600">{ticket.messages_count}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// =========================================================================
// SUB-COMPONENT: KANBAN BOARD VIEW
// =========================================================================
function TicketsKanbanBoard({ tickets, onOpenDetail }) {
  const columns = [
    { id: 'OFFEN', title: 'Offen / Neu', color: 'border-blue-500', bg: 'bg-blue-50/40' },
    { id: 'IN_BEARBEITUNG', title: 'In Bearbeitung', color: 'border-amber-500', bg: 'bg-amber-50/40' },
    { id: 'WARTET_AUF_BENUTZER', title: 'Wartet auf Benutzer', color: 'border-purple-500', bg: 'bg-purple-50/40' },
    { id: 'GELOEST', title: 'Gelöst / Archiv', color: 'border-emerald-500', bg: 'bg-emerald-50/40' }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {columns.map((col) => {
        const colTickets = tickets.filter((t) => t.status === col.id || (col.id === 'GELOEST' && t.status === 'GESCHLOSSEN'));

        return (
          <div key={col.id} className={`rounded-2xl border border-slate-200 bg-slate-50/60 p-3.5 flex flex-col h-full`}>
            <div className={`flex items-center justify-between pb-3 mb-3 border-b-2 ${col.color}`}>
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700">{col.title}</h3>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-white border border-slate-200 text-slate-600">
                {colTickets.length}
              </span>
            </div>

            <div className="space-y-3 flex-1 overflow-y-auto max-h-[600px] pr-1">
              {colTickets.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-400">Keine Tickets</div>
              ) : (
                colTickets.map((t) => {
                  const prioConf = PRIORITY_CONFIG[t.prioritaet] || PRIORITY_CONFIG.MITTEL;
                  return (
                    <div
                      key={t.id}
                      onClick={() => onOpenDetail(t.id)}
                      className="bg-white rounded-xl p-3.5 border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer space-y-2 group"
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-mono text-[11px] font-bold text-slate-600">{t.ticket_nr}</span>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${prioConf.bg}`}>
                          {prioConf.label}
                        </span>
                      </div>

                      <h4 className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-2">
                        {t.titel}
                      </h4>

                      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-100">
                        <span>{t.ersteller_name}</span>
                        <div className="flex items-center gap-1">
                          <MessageSquare className="w-3 h-3" />
                          <span>{t.messages_count}</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// =========================================================================
// SUB-COMPONENT: CREATE TICKET MODAL WITH SMART ASSIST
// =========================================================================
function CreateTicketModal({ isOpen, onClose, onCreated }) {
  const [titel, setTitel] = useState('');
  const [kategorie, setKategorie] = useState('IT_SUPPORT');
  const [prioritaet, setPrioritaet] = useState('MITTEL');
  const [beschreibung, setBeschreibung] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Smart-Assist Suggestions State
  const [suggestions, setSuggestions] = useState([]);
  const [assistLoading, setAssistLoading] = useState(false);
  const [selectedSolution, setSelectedSolution] = useState(null);

  // Live Smart-Assist Search with debounce
  useEffect(() => {
    if (titel.trim().length < 3) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      setAssistLoading(true);
      try {
        const res = await ticketService.suggestSolutions({
          titel,
          kategorie,
          beschreibung
        });
        setSuggestions(res?.suggestions || []);
      } catch (err) {
        console.error('Smart assist fetch failed:', err);
      } finally {
        setAssistLoading(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [titel, kategorie, beschreibung]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!titel.trim() || !beschreibung.trim()) {
      setError('Bitte füllen Sie Titel und Problembeschreibung vollständig aus.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await ticketService.createTicket({
        titel: titel.trim(),
        beschreibung: beschreibung.trim(),
        kategorie,
        prioritaet
      });
      onCreated();
    } catch (err) {
      setError(err.message || 'Fehler beim Erstellen des Tickets.');
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
      <div className="bg-white rounded-3xl max-w-3xl w-full p-6 md:p-8 shadow-2xl border border-slate-100 my-8">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <Headphones className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 font-heading">Neues Support-Ticket erfassen</h2>
              <p className="text-xs text-slate-500">Beschreiben Sie Ihr Anliegen so detailliert wie möglich.</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-5">
          {/* Titel */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Titel / Kurzbeschreibung <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="z. B. 2FA-Einrichtung für neues Firmen-Smartphone..."
              value={titel}
              onChange={(e) => setTitel(e.target.value)}
              className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Smart-Assist Live Widget */}
          {suggestions.length > 0 && (
            <div className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl space-y-2 animate-fade-in">
              <div className="flex items-center gap-2 text-emerald-800 text-xs font-bold">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span>Smart Assist: Mögliche Sofortlösung in der Wissensdatenbank gefunden!</span>
              </div>
              <p className="text-xs text-emerald-700">
                Für ähnliche Probleme liegt bereits ein dokumentierter Lösungsweg vor:
              </p>
              <div className="space-y-2 pt-1">
                {suggestions.map((sug) => (
                  <div
                    key={sug.id}
                    onClick={() => setSelectedSolution(selectedSolution?.id === sug.id ? null : sug)}
                    className="bg-white p-3 rounded-xl border border-emerald-200 shadow-sm hover:border-emerald-400 cursor-pointer transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] font-bold text-slate-500">{sug.ticket_nr}</span>
                        <span className="text-xs font-bold text-slate-900">{sug.titel}</span>
                      </div>
                      <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${selectedSolution?.id === sug.id ? 'rotate-180' : ''}`} />
                    </div>

                    {selectedSolution?.id === sug.id && (
                      <div className="mt-2.5 pt-2.5 border-t border-emerald-100 text-xs space-y-2 text-slate-700 animate-fade-in">
                        <div>
                          <span className="font-bold text-emerald-800 block">Lösungsschritte:</span>
                          <p className="mt-0.5 text-slate-600 bg-emerald-50/50 p-2 rounded-lg leading-relaxed whitespace-pre-line">
                            {sug.loesungsschritte}
                          </p>
                        </div>
                        <div className="flex items-center justify-between pt-1">
                          <span className="text-[11px] text-slate-500">Gelöst durch: <strong>{sug.techniker_name}</strong></span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onClose();
                            }}
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold text-xs"
                          >
                            ✓ Hat mein Problem gelöst (Abbrechen)
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Kategorie & Priorität */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Kategorie
              </label>
              <select
                value={kategorie}
                onChange={(e) => setKategorie(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="IT_SUPPORT">IT-Support & Helpdesk</option>
                <option value="HARDWARE">Hardware & Geräte</option>
                <option value="SOFTWARE">Software & Lizenzen</option>
                <option value="VERTRIEB">Vertrieb & Projekte</option>
                <option value="GEBAEUDE">Gebäude & Facility</option>
                <option value="ALLGEMEIN">Allgemeine Anfrage</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Priorität
              </label>
              <select
                value={prioritaet}
                onChange={(e) => setPrioritaet(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="NIEDRIG">Niedrig (Keine Eile)</option>
                <option value="MITTEL">Mittel (Regulärer Betrieb)</option>
                <option value="HOCH">Hoch (Arbeit behindert)</option>
                <option value="KRITISCH">Kritisch (Betriebsstillstand)</option>
              </select>
            </div>
          </div>

          {/* Problembeschreibung */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Detaillierte Problembeschreibung <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={4}
              placeholder="Bitte schildern Sie das Problem möglichst genau: Welche Fehlermeldung tritt auf? An welchem Arbeitsplatz / Gerät?"
              value={beschreibung}
              onChange={(e) => setBeschreibung(e.target.value)}
              className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
            ></textarea>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-md shadow-indigo-200 transition-all disabled:opacity-50"
            >
              {submitting ? 'Ticket wird gesendet...' : 'Ticket erstellen'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// =========================================================================
// SUB-COMPONENT: TICKET DETAIL & CHAT MODAL
// =========================================================================
function TicketDetailModal({ ticketId, ticket, loading, isSupportStaff, supportUsers, onClose, onRefresh }) {
  const [replyText, setReplyText] = useState('');
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);

  // Status Change Dialog
  const [resolveDialogOpen, setResolveDialogOpen] = useState(false);
  const [solutionDoc, setSolutionDoc] = useState('');
  const [solutionTags, setSolutionTags] = useState('');
  const [resolveSubmitting, setResolveSubmitting] = useState(false);
  const [resolveError, setResolveError] = useState(null);

  if (loading || !ticket) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center">
          <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-3" />
          <p className="text-sm font-medium text-slate-600">Ticket-Verlauf wird geladen...</p>
        </div>
      </div>
    );
  }

  const statusConf = STATUS_CONFIG[ticket.status] || STATUS_CONFIG.OFFEN;
  const priorityConf = PRIORITY_CONFIG[ticket.prioritaet] || PRIORITY_CONFIG.MITTEL;

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!replyText.trim()) return;

    setSendingMessage(true);
    try {
      await ticketService.addTicketMessage(ticketId, {
        nachricht: replyText.trim(),
        ist_interne_notiz: isInternalNote
      });
      setReplyText('');
      onRefresh();
    } catch (err) {
      alert(err.message || 'Fehler beim Senden der Nachricht.');
    } finally {
      setSendingMessage(false);
    }
  };

  const handleAssignChange = async (userId) => {
    try {
      const assignedId = userId ? parseInt(userId) : null;
      await ticketService.assignTicket(ticketId, assignedId);
      onRefresh();
    } catch (err) {
      alert(err.message || 'Fehler bei der Zuweisung.');
    }
  };

  const handleDirectStatusChange = async (newStatus) => {
    if (newStatus === 'GELOEST') {
      setResolveDialogOpen(true);
      return;
    }

    try {
      await ticketService.updateTicketStatus(ticketId, { status: newStatus });
      onRefresh();
    } catch (err) {
      alert(err.message || 'Fehler bei der Statusänderung.');
    }
  };

  const handleConfirmResolve = async (e) => {
    e.preventDefault();
    if (!solutionDoc.trim() || solutionDoc.trim().length < 5) {
      setResolveError('Bitte dokumentieren Sie die Lösungsschritte (mindestens 5 Zeichen).');
      return;
    }

    setResolveSubmitting(true);
    setResolveError(null);

    try {
      const tagsList = solutionTags
        .split(',')
        .map((t) => t.trim())
        .filter((t) => t.length > 0);

      await ticketService.updateTicketStatus(ticketId, {
        status: 'GELOEST',
        loesung_dokumentation: solutionDoc.trim(),
        loesungs_schlagwoerter: tagsList
      });

      setResolveDialogOpen(false);
      onRefresh();
    } catch (err) {
      setResolveError(err.message || 'Fehler beim Abschließen des Tickets.');
    } finally {
      setResolveSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 md:p-4 overflow-y-auto animate-fade-in">
      <div className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl border border-slate-100 flex flex-col max-h-[90vh] my-4 overflow-hidden">
        {/* 1. Header */}
        <div className="p-5 md:p-6 border-b border-slate-200 bg-slate-50/70 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-slate-200 text-slate-800">
                {ticket.ticket_nr}
              </span>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${statusConf.bg}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${statusConf.dot}`}></span>
                {statusConf.label}
              </span>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${priorityConf.bg}`}>
                Priorität: {priorityConf.label}
              </span>
            </div>

            <h2 className="text-lg md:text-xl font-bold text-slate-900">{ticket.titel}</h2>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
              <span>Erstellt von: <strong>{ticket.ersteller_name}</strong> ({ticket.ersteller_department || 'Mitarbeiter'})</span>
              <span>•</span>
              <span>Am {new Date(ticket.erstellt_am).toLocaleString('de-DE')}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end md:self-auto">
            {/* Quick Actions for Support */}
            {isSupportStaff && (
              <div className="flex items-center gap-2">
                <select
                  value={ticket.zugewiesen_an_id || ''}
                  onChange={(e) => handleAssignChange(e.target.value)}
                  className="px-3 py-1.5 text-xs font-semibold bg-white border border-slate-300 rounded-xl text-slate-700"
                >
                  <option value="">Zuweisen an...</option>
                  {supportUsers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.full_name} ({u.role})
                    </option>
                  ))}
                </select>

                <button
                  onClick={() => handleDirectStatusChange('GELOEST')}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1 shadow-sm"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Als gelöst markieren</span>
                </button>
              </div>
            )}

            <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-200">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 2. Chat Timeline & Solution Box */}
        <div className="flex-1 overflow-y-auto p-5 md:p-6 space-y-4">
          {/* Solution Banner if Solved */}
          {ticket.status === 'GELOEST' && ticket.loesung_dokumentation && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-2">
              <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Dokumentierte Lösung (Wissensdatenbank):</span>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line bg-white/80 p-3 rounded-xl border border-emerald-100">
                {ticket.loesung_dokumentation}
              </p>
              {ticket.loesungs_schlagwoerter && ticket.loesungs_schlagwoerter.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {ticket.loesungs_schlagwoerter.map((tag, idx) => (
                    <span key={idx} className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-md text-[10px] font-semibold">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Timeline Messages */}
          <div className="space-y-3">
            {ticket.messages && ticket.messages.length > 0 ? (
              ticket.messages.map((msg) => {
                const isInternal = msg.ist_interne_notiz;

                return (
                  <div
                    key={msg.id}
                    className={`p-4 rounded-2xl border transition-all ${
                      isInternal
                        ? 'bg-amber-50/80 border-amber-200 text-slate-800'
                        : 'bg-white border-slate-200 shadow-sm text-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{msg.autor_name}</span>
                        {msg.autor_role && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600">
                            {msg.autor_role}
                          </span>
                        )}
                        {isInternal && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-200 text-amber-900">
                            <Lock className="w-3 h-3" /> Interne IT-Notiz
                          </span>
                        )}
                      </div>
                      <span className="text-slate-400 text-[11px]">
                        {new Date(msg.erstellt_am).toLocaleString('de-DE')}
                      </span>
                    </div>

                    <p className="text-xs leading-relaxed whitespace-pre-line text-slate-700">
                      {msg.nachricht}
                    </p>
                  </div>
                );
              })
            ) : (
              <p className="text-center py-6 text-xs text-slate-400">Keine Nachrichten vorhanden.</p>
            )}
          </div>
        </div>

        {/* 3. Reply / Message Composer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200">
          <form onSubmit={handleSendMessage} className="space-y-2">
            {isSupportStaff && (
              <div className="flex items-center gap-3 text-xs pb-1">
                <button
                  type="button"
                  onClick={() => setIsInternalNote(false)}
                  className={`px-3 py-1 rounded-lg font-semibold transition-colors ${
                    !isInternalNote ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  💬 Öffentliche Antwort
                </button>
                <button
                  type="button"
                  onClick={() => setIsInternalNote(true)}
                  className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg font-semibold transition-colors ${
                    isInternalNote ? 'bg-amber-600 text-white shadow-sm' : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  <Lock className="w-3.5 h-3.5" /> Interne Notiz (nur IT)
                </button>
              </div>
            )}

            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder={
                  isInternalNote
                    ? 'Interne Notiz für Techniker erfassen (unsichtbar für Mitarbeiter)...'
                    : 'Antwort zum Ticket verfassen...'
                }
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                className={`flex-1 px-4 py-2.5 text-xs bg-white border rounded-xl focus:outline-none focus:ring-2 ${
                  isInternalNote
                    ? 'border-amber-300 focus:ring-amber-400 bg-amber-50/40'
                    : 'border-slate-300 focus:ring-indigo-500'
                }`}
              />
              <button
                type="submit"
                disabled={sendingMessage || !replyText.trim()}
                className={`px-5 py-2.5 text-xs font-semibold text-white rounded-xl shadow-md transition-all flex items-center gap-1.5 disabled:opacity-50 ${
                  isInternalNote ? 'bg-amber-600 hover:bg-amber-700' : 'bg-indigo-600 hover:bg-indigo-700'
                }`}
              >
                <Send className="w-3.5 h-3.5" />
                <span>Senden</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Resolve Dialog Modal */}
      {resolveDialogOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-fade-in">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Lösung dokumentieren & archivieren</h3>
                <p className="text-xs text-slate-500">Diese Dokumentation wird in die Wissensdatenbank aufgenommen.</p>
              </div>
            </div>

            {resolveError && (
              <div className="p-3 bg-rose-50 text-rose-700 border border-rose-200 text-xs rounded-xl">
                {resolveError}
              </div>
            )}

            <form onSubmit={handleConfirmResolve} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Exakter Lösungsweg / Ursache <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Welche Schritte haben das Problem behoben? (z. B. Kabel ausgetauscht, 2FA zurückgesetzt, Lizenz auf Server erneuert...)"
                  value={solutionDoc}
                  onChange={(e) => setSolutionDoc(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                ></textarea>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Schlagwörter für die Suche (kommagetrennt)
                </label>
                <input
                  type="text"
                  placeholder="z. B. 2FA, Smartphone, VPN, iPhone"
                  value={solutionTags}
                  onChange={(e) => setSolutionTags(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setResolveDialogOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  disabled={resolveSubmitting}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-emerald-200"
                >
                  {resolveSubmitting ? 'Wird gespeichert...' : 'Lösung speichern & schließen'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// =========================================================================
// SUB-COMPONENT: KNOWLEDGE BASE VIEW
// =========================================================================
function KnowledgeBaseView({
  searchQuery,
  setSearchQuery,
  categoryFilter,
  setCategoryFilter,
  results,
  loading,
  expandedId,
  setExpandedId,
  onOpenTicket
}) {
  const categories = [
    { id: 'ALL', label: 'Alle Themen' },
    { id: 'IT_SUPPORT', label: 'IT-Support' },
    { id: 'HARDWARE', label: 'Hardware' },
    { id: 'SOFTWARE', label: 'Software' },
    { id: 'VERTRIEB', label: 'Vertrieb' },
    { id: 'GEBAEUDE', label: 'Gebäude' }
  ];

  return (
    <div className="space-y-6">
      {/* Search Header Banner */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="max-w-2xl">
          <h2 className="text-xl font-bold text-slate-900 font-heading">
            Lösungs-Wissensdatenbank & Best Practices
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Durchsuchen Sie alle dokumentierten Lösungen behobener Fälle nach Stichworten, Geräten oder Fehlermeldungen.
          </p>
        </div>

        {/* Big Search Bar */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-indigo-500" />
          <input
            type="text"
            placeholder="Suchbegriff eingeben (z. B. 2FA, Allplan, DisplayPort, VPN, Klimaanlage)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3.5 text-sm bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
          />
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategoryFilter(cat.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                categoryFilter === cat.id
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Results List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-3xl border border-slate-100">
          <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin mb-3" />
          <p className="text-sm font-medium text-slate-500">Durchsuche Lösungsdatenbank...</p>
        </div>
      ) : results.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 p-8">
          <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-800">Keine dokumentierten Lösungen gefunden</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            Versuchen Sie einen anderen Suchbegriff oder wählen Sie eine andere Kategorie.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {results.map((item) => {
            const isExpanded = expandedId === item.id;
            const categoryConf = CATEGORY_CONFIG[item.kategorie] || CATEGORY_CONFIG.ALLGEMEIN;
            const CategoryIcon = categoryConf.icon;

            return (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden transition-all hover:border-indigo-300"
              >
                <div
                  onClick={() => setExpandedId(isExpanded ? null : item.id)}
                  className="p-4 md:p-5 flex items-center justify-between gap-4 cursor-pointer select-none"
                >
                  <div className="flex items-start gap-3.5">
                    <div className={`p-2.5 rounded-xl border ${categoryConf.color} shrink-0 mt-0.5`}>
                      <CategoryIcon className="w-5 h-5" />
                    </div>

                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                          {item.ticket_nr}
                        </span>
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Gelöst & Verifiziert
                        </span>
                        {item.relevance_score && (
                          <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                            Relevanz: {item.relevance_score}
                          </span>
                        )}
                      </div>

                      <h3 className="text-base font-bold text-slate-900 hover:text-indigo-600 transition-colors">
                        {item.titel}
                      </h3>
                    </div>
                  </div>

                  <button className="p-2 text-slate-400 hover:text-slate-600">
                    <ChevronDown className={`w-5 h-5 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                  </button>
                </div>

                {isExpanded && (
                  <div className="px-5 pb-5 pt-2 border-t border-slate-100 bg-slate-50/50 space-y-4 animate-fade-in text-xs">
                    {/* Problem Description */}
                    <div>
                      <span className="font-bold text-slate-700 uppercase tracking-wider text-[11px] block mb-1">
                        📌 Ursprüngliche Problemstellung:
                      </span>
                      <p className="text-slate-600 bg-white p-3 rounded-xl border border-slate-200 leading-relaxed">
                        {item.problembeschreibung}
                      </p>
                    </div>

                    {/* Verified Solution */}
                    <div>
                      <span className="font-bold text-emerald-800 uppercase tracking-wider text-[11px] block mb-1 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        Dokumentierter Lösungsweg:
                      </span>
                      <div className="text-slate-800 bg-emerald-50/80 border border-emerald-200 p-3.5 rounded-xl leading-relaxed whitespace-pre-line font-medium">
                        {item.loesungsschritte}
                      </div>
                    </div>

                    {/* Metadata & Tags */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-slate-500">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <Tag className="w-3.5 h-3.5 text-slate-400" />
                        {item.loesungs_schlagwoerter && item.loesungs_schlagwoerter.length > 0 ? (
                          item.loesungs_schlagwoerter.map((tag, idx) => (
                            <span key={idx} className="px-2 py-0.5 bg-slate-200/80 text-slate-700 rounded-md font-semibold text-[10px]">
                              {tag}
                            </span>
                          ))
                        ) : (
                          <span className="text-slate-400">Keine Tags</span>
                        )}
                      </div>

                      <div className="flex items-center gap-3">
                        <span>Gelöst von: <strong>{item.techniker_name}</strong></span>
                        <button
                          onClick={() => onOpenTicket(item.id)}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-white hover:bg-slate-100 text-indigo-600 font-semibold rounded-lg border border-slate-200 transition-colors shadow-xs"
                        >
                          <ExternalLink className="w-3.5 h-3.5" /> Vorgang öffnen
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
