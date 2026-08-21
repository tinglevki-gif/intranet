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
  ChevronRight 
} from 'lucide-react';

export function CalendarPage() {
  const { t, currentLanguage } = useLanguage();
  const { user } = useAuth();
  const calendarRef = useRef(null);

  const [rawEvents, setRawEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [toastMessage, setToastMessage] = useState(null);

  // Modal States
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [initialCreateDate, setInitialCreateDate] = useState(null);
  const [isSubscribeModalOpen, setIsSubscribeModalOpen] = useState(false);

  const categories = [
    { key: 'ALL', label: t('calendar.cat_ALL'), color: 'bg-slate-800 text-white' },
    { key: 'TOWNHALL', label: t('calendar.cat_TOWNHALL'), color: 'bg-purple-600 text-white' },
    { key: 'MEETING', label: t('calendar.cat_MEETING'), color: 'bg-blue-600 text-white' },
    { key: 'HOLIDAY', label: t('calendar.cat_HOLIDAY'), color: 'bg-emerald-600 text-white' },
    { key: 'TRAINING', label: t('calendar.cat_TRAINING'), color: 'bg-amber-600 text-white' },
    { key: 'HR_EVENT', label: t('calendar.cat_HR_EVENT'), color: 'bg-rose-600 text-white' },
  ];

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
    fetchEvents();
  }, [activeCategory]);

  const getEventColors = (cat) => {
    switch (cat) {
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

  // Format events for FullCalendar
  const calendarEvents = rawEvents.map((evt) => {
    const colors = getEventColors(evt.category);
    return {
      id: String(evt.id),
      title: evt.title,
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
    setToastMessage(t('calendar.event_created_toast'));
    setTimeout(() => setToastMessage(null), 3000);
    fetchEvents();
  };

  const handleDeleteEvent = async (eventId) => {
    if (!window.confirm('Möchten Sie diesen Termin wirklich löschen?')) return;
    try {
      await api.deleteCalendarEvent(eventId);
      setIsEventModalOpen(false);
      setToastMessage(t('calendar.event_deleted_toast'));
      setTimeout(() => setToastMessage(null), 3000);
      fetchEvents();
    } catch (err) {
      alert(err.message || 'Fehler beim Löschen des Termins.');
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-card flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shadow-xs">
            <CalendarIcon className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{t('calendar.title')}</h1>
            <p className="text-xs sm:text-sm text-slate-500">
              {t('calendar.subtitle')}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          {/* iCal Subscription Button */}
          <button
            onClick={() => setIsSubscribeModalOpen(true)}
            className="flex items-center space-x-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-all shadow-2xs"
          >
            <Rss className="w-4 h-4 text-purple-600" />
            <span>{t('calendar.subscribe_ical')}</span>
          </button>

          {/* New Event Button */}
          <button
            onClick={handleOpenCreateModal}
            className="flex items-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-purple-600/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>{t('calendar.add_event')}</span>
          </button>
        </div>
      </div>

      {/* Category Filter Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-card flex items-center gap-2 overflow-x-auto">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider pl-2 pr-1 hidden sm:inline">
          {t('calendar.filter_category')}
        </span>
        {categories.map((cat) => (
          <button
            key={cat.key}
            onClick={() => setActiveCategory(cat.key)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center space-x-1.5 ${
              activeCategory === cat.key
                ? `${cat.color} shadow-sm font-bold`
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <span>{cat.label}</span>
          </button>
        ))}
      </div>

      {toastMessage && (
        <div className="p-4 bg-purple-50 border border-purple-200 text-purple-800 text-xs font-semibold rounded-2xl flex items-center space-x-2 animate-fade-in shadow-md">
          <Check className="w-4 h-4 text-purple-600" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main FullCalendar Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-card overflow-hidden">
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
            month: t('calendar.view_month'),
            week: t('calendar.view_week'),
            day: t('calendar.view_day'),
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
    </div>
  );
}
