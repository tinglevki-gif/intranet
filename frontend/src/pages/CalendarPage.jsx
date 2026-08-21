import React, { useState, useEffect, useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { api } from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { EventModal } from '../components/calendar/EventModal';
import { SubscribeModal } from '../components/calendar/SubscribeModal';
import { CalendarSourcesModal } from '../components/calendar/CalendarSourcesModal';
import { 
  Calendar as CalendarIcon, 
  Plus, 
  Rss, 
  Check, 
  Sparkles, 
  Building2, 
  Users, 
  Clock, 
  MapPin, 
  ChevronLeft, 
  ChevronRight,
  Settings,
  Layers,
  RefreshCw
} from 'lucide-react';

export function CalendarPage() {
  const { t, currentLanguage } = useLanguage();
  const { user } = useAuth();
  const calendarRef = useRef(null);

  const [rawEvents, setRawEvents] = useState([]);
  const [sources, setSources] = useState([]);
  const [selectedSourceIds, setSelectedSourceIds] = useState(new Set());
  const [includeInternal, setIncludeInternal] = useState(true);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [toastMessage, setToastMessage] = useState(null);

  // Modal States
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [initialCreateDate, setInitialCreateDate] = useState(null);
  const [isSubscribeModalOpen, setIsSubscribeModalOpen] = useState(false);
  const [isSourcesModalOpen, setIsSourcesModalOpen] = useState(false);

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'IT_ADMIN';

  const categories = [
    { key: 'ALL', label: t('calendar.cat_ALL', 'Alle Kategorien'), color: 'bg-slate-800 text-white' },
    { key: 'TOWNHALL', label: t('calendar.cat_TOWNHALL', 'Townhall & All-Hands'), color: 'bg-purple-600 text-white' },
    { key: 'MEETING', label: t('calendar.cat_MEETING', 'Meetings & Projekte'), color: 'bg-blue-600 text-white' },
    { key: 'HOLIDAY', label: t('calendar.cat_HOLIDAY', 'Feiertage & Brückentage'), color: 'bg-emerald-600 text-white' },
    { key: 'TRAINING', label: t('calendar.cat_TRAINING', 'Schulungen & Workshops'), color: 'bg-amber-600 text-white' },
    { key: 'HR_EVENT', label: t('calendar.cat_HR_EVENT', 'HR & Teamevents'), color: 'bg-rose-600 text-white' },
  ];

  const fetchSources = async () => {
    try {
      const srcList = await api.getCalendarSources();
      setSources(srcList || []);
      // By default select all active source IDs
      const allIds = new Set((srcList || []).map((s) => s.id));
      setSelectedSourceIds(allIds);
    } catch (err) {
      console.warn('Failed to load calendar sources:', err);
    }
  };

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const data = await api.getCalendarEvents(activeCategory);
      setRawEvents(data || []);
    } catch (err) {
      console.error('Error loading calendar events:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSources();
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [activeCategory]);

  const toggleSourceSelection = (sourceId) => {
    const next = new Set(selectedSourceIds);
    if (next.has(sourceId)) {
      next.delete(sourceId);
    } else {
      next.add(sourceId);
    }
    setSelectedSourceIds(next);
  };

  const getEventColors = (evt) => {
    if (evt.is_external) {
      const col = evt.source_color || '#0078D4';
      return { backgroundColor: col, borderColor: col, textColor: '#ffffff' };
    }

    switch (evt.category) {
      case 'TOWNHALL':
        return { backgroundColor: '#8b5cf6', borderColor: '#7c3aed', textColor: '#ffffff' };
      case 'HOLIDAY':
        return { backgroundColor: '#10b981', borderColor: '#059669', textColor: '#ffffff' };
      case 'TRAINING':
        return { backgroundColor: '#f59e0b', borderColor: '#d97706', textColor: '#ffffff' };
      case 'HR_EVENT':
        return { backgroundColor: '#f43f5e', borderColor: '#e11d48', textColor: '#ffffff' };
      case 'COMPANY':
        return { backgroundColor: '#6366f1', borderColor: '#4f46e5', textColor: '#ffffff' };
      default:
        return { backgroundColor: '#3b82f6', borderColor: '#2563eb', textColor: '#ffffff' };
    }
  };

  // Filter and format events for FullCalendar
  const calendarEvents = rawEvents
    .filter((evt) => {
      if (evt.is_external) {
        return selectedSourceIds.has(evt.source_id);
      }
      return includeInternal;
    })
    .map((evt) => {
      const colors = getEventColors(evt);
      const displayTitle = evt.is_external ? `📅 ${evt.title}` : evt.title;

      return {
        id: String(evt.id),
        title: displayTitle,
        start: evt.start_time,
        end: evt.end_time,
        allDay: evt.all_day,
        backgroundColor: colors.backgroundColor,
        borderColor: colors.borderColor,
        textColor: colors.textColor,
        extendedProps: {
          raw: evt,
        },
      };
    });

  const handleEventClick = (clickInfo) => {
    const raw = clickInfo.event.extendedProps.raw;
    setSelectedEvent(raw);
    setIsCreating(false);
    setIsEventModalOpen(true);
  };

  const handleDateClick = (dateClickInfo) => {
    setInitialCreateDate(dateClickInfo.dateStr);
    setIsCreating(true);
    setSelectedEvent(null);
    setIsEventModalOpen(true);
  };

  const handleOpenCreateModal = () => {
    setInitialCreateDate(null);
    setIsCreating(true);
    setSelectedEvent(null);
    setIsEventModalOpen(true);
  };

  const handleSaveEvent = async (eventData) => {
    await api.createCalendarEvent(eventData);
    setToastMessage(t('calendar.event_created_toast', 'Termin erfolgreich erstellt!'));
    setTimeout(() => setToastMessage(null), 3000);
    fetchEvents();
  };

  const handleDeleteEvent = async (eventId) => {
    if (!window.confirm('Möchten Sie diesen Termin wirklich löschen?')) return;
    try {
      await api.deleteCalendarEvent(eventId);
      setIsEventModalOpen(false);
      setToastMessage(t('calendar.event_deleted_toast', 'Termin wurde gelöscht.'));
      setTimeout(() => setToastMessage(null), 3000);
      fetchEvents();
    } catch (err) {
      alert(err.message || 'Fehler beim Löschen des Termins.');
    }
  };

  return (
    <div className="space-y-6 pb-16 animate-fade-in">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-card flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shadow-xs">
            <CalendarIcon className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-900">{t('calendar.title', 'Unternehmenskalender')}</h1>
              <span className="px-2 py-0.5 rounded-full bg-blue-50 text-[#0078D4] border border-blue-200 text-[10px] font-bold">
                Outlook Sync Aktiv
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500">
              {t('calendar.subtitle', 'Zentrale Terminübersicht, Firmenmeilensteine & automatische Outlook 365 Synchronisation')}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Outlook / iCal Sources Admin Button */}
          {isAdmin && (
            <button
              onClick={() => setIsSourcesModalOpen(true)}
              className="flex items-center space-x-2 px-4 py-2.5 bg-blue-50 hover:bg-blue-100 text-[#0078D4] rounded-xl text-xs font-semibold transition-all border border-blue-200"
              title="Outlook Kalender-Feeds verwalten"
            >
              <Settings className="w-4 h-4 text-[#0078D4]" />
              <span>Outlook-Quellen ({sources.length})</span>
            </button>
          )}

          {/* iCal Subscription Button */}
          <button
            onClick={() => setIsSubscribeModalOpen(true)}
            className="flex items-center space-x-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-all shadow-2xs"
          >
            <Rss className="w-4 h-4 text-purple-600" />
            <span>{t('calendar.subscribe_ical', 'iCal abonnieren')}</span>
          </button>

          {/* New Event Button */}
          <button
            onClick={handleOpenCreateModal}
            className="flex items-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-purple-600/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>{t('calendar.add_event', 'Neuer Termin')}</span>
          </button>
        </div>
      </div>

      {/* Category & Outlook Sources Filter Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-card space-y-3">
        {/* Row 1: Categories */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider pl-1 pr-2 shrink-0">
            {t('calendar.filter_category', 'Kategorien')}:
          </span>
          {categories.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center space-x-1.5 shrink-0 ${
                activeCategory === cat.key
                  ? `${cat.color} shadow-sm font-bold`
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <span>{cat.label}</span>
            </button>
          ))}
        </div>

        {/* Row 2: Synchronized Outlook Feeds Filter Checkboxes */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100 text-xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider pl-1 pr-1 flex items-center gap-1.5 shrink-0">
            <Layers className="w-3.5 h-3.5 text-blue-600" />
            <span>Kalender-Ebenen:</span>
          </span>

          <label className="flex items-center gap-1.5 cursor-pointer select-none bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-100 transition-colors">
            <input
              type="checkbox"
              checked={includeInternal}
              onChange={(e) => setIncludeInternal(e.target.checked)}
              className="rounded text-purple-600 focus:ring-purple-500 w-3.5 h-3.5"
            />
            <span className="font-semibold text-slate-700">🏢 Intranet-Termine</span>
          </label>

          {sources.map((src) => {
            const isChecked = selectedSourceIds.has(src.id);
            return (
              <label
                key={src.id}
                className={`flex items-center gap-1.5 cursor-pointer select-none px-2.5 py-1 rounded-lg border transition-colors ${
                  isChecked
                    ? 'bg-blue-50/70 border-blue-200 text-slate-900'
                    : 'bg-slate-50 border-slate-200 text-slate-400 opacity-60'
                }`}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => toggleSourceSelection(src.id)}
                  className="rounded text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                />
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs"
                  style={{ backgroundColor: src.farbe || '#0078D4' }}
                />
                <span className="font-semibold">{src.name}</span>
                {src.anzahl_termine > 0 && (
                  <span className="text-[10px] font-bold text-slate-400">({src.anzahl_termine})</span>
                )}
              </label>
            );
          })}
        </div>
      </div>

      {toastMessage && (
        <div className="p-4 bg-purple-50 border border-purple-200 text-purple-800 text-xs font-semibold rounded-2xl flex items-center space-x-2 animate-fade-in shadow-md">
          <Check className="w-4 h-4 text-purple-600" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main FullCalendar Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-card overflow-hidden">
        {loading && (
          <div className="flex items-center justify-center py-4 text-xs text-slate-400 gap-2">
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-purple-600" />
            <span>Termine und Outlook-Feeds werden synchronisiert...</span>
          </div>
        )}

        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay',
          }}
          locale={currentLanguage === 'de' ? 'de' : currentLanguage === 'pl' ? 'pl' : currentLanguage === 'tr' ? 'tr' : 'en'}
          firstDay={1} // Monday
          events={calendarEvents}
          eventClick={handleEventClick}
          dateClick={handleDateClick}
          editable={false}
          selectable={true}
          dayMaxEvents={3}
          height="auto"
          eventTimeFormat={{
            hour: '2-digit',
            minute: '2-digit',
            meridiem: false,
            hour12: false,
          }}
          buttonText={{
            today: 'Heute',
            month: t('calendar.view_month', 'Monat'),
            week: t('calendar.view_week', 'Woche'),
            day: t('calendar.view_day', 'Tag'),
          }}
        />
      </div>

      {/* Event Details / Creation Modal */}
      <EventModal
        isOpen={isEventModalOpen}
        onClose={() => setIsEventModalOpen(false)}
        event={selectedEvent}
        isCreating={isCreating}
        initialDate={initialCreateDate}
        onSave={handleSaveEvent}
        onDelete={handleDeleteEvent}
      />

      {/* iCal Subscription Modal */}
      <SubscribeModal
        isOpen={isSubscribeModalOpen}
        onClose={() => setIsSubscribeModalOpen(false)}
      />

      {/* SuperAdmin Calendar Sources Management Modal */}
      {isSourcesModalOpen && (
        <CalendarSourcesModal
          isOpen={isSourcesModalOpen}
          onClose={() => setIsSourcesModalOpen(false)}
          onSourcesUpdated={() => {
            fetchSources();
            fetchEvents();
          }}
        />
      )}
    </div>
  );
}
