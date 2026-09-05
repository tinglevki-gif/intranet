import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Network, 
  Phone, 
  Calendar as CalendarIcon, 
  FolderOpen, 
  Utensils, 
  Sparkles, 
  Clock, 
  ChevronRight, 
  ExternalLink, 
  Bot, 
  Users, 
  Palmtree, 
  TicketCheck, 
  CalendarDays, 
  SlidersHorizontal,
  Megaphone,
  Pin,
  ArrowRight,
  ShieldCheck,
  Building,
  CheckCircle2,
  HelpCircle,
  Eye
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { UserAvatar } from '../common/UserAvatar';
import { AnnouncementModal } from './AnnouncementModal';

export function MinimalDashboard({ 
  data, 
  config = {}, 
  onRefresh, 
  isSuperAdmin = false, 
  onOpenConfig 
}) {
  const { user } = useAuth();
  const { t, formatDate } = useLanguage();
  const navigate = useNavigate();

  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Real-time clock for minimalist top bar
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Time-based greeting in German
  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return t('hero.morning', 'Guten Morgen');
    if (hour < 18) return t('hero.afternoon', 'Guten Tag');
    return t('hero.evening', 'Guten Abend');
  };

  // Fallback defaults for config
  const showHero = config.show_hero_greeting !== false;
  const customMotto = config.custom_motto || 'TINGLEV ELEMENTFABRIK • DIGITALER ARBEITSPLATZ';
  const showModules = config.show_quick_modules !== false;
  const modulesStyle = config.quick_modules_style || 'pills';
  const showKpis = config.show_kpi_metrics !== false;
  const kpiStyle = config.kpi_metrics_style || 'inline_badges';
  const showAnnouncements = config.show_announcements !== false;
  const announcementsLimit = config.announcements_limit || 3;
  const showTools = config.show_quick_tools !== false;
  const showEvents = config.show_events !== false;
  const eventsLimit = config.events_limit || 3;

  // Filter & limit announcements
  const announcementsList = (data?.announcements || []).slice(0, announcementsLimit);
  const eventsList = (data?.upcoming_events || []).slice(0, eventsLimit);
  const toolsList = (data?.quick_tools || []).slice(0, 6);

  // Quick module chips list
  const quickModules = [
    {
      key: 'org-chart',
      title: t('nav_items.org-chart', 'Organigramm'),
      desc: 'Hierarchie & Teams',
      path: '/org-chart',
      icon: Network,
      color: 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border-indigo-200/80 dark:border-indigo-800'
    },
    {
      key: 'phone-directory',
      title: t('nav_items.phone-directory', 'Telefonverzeichnis'),
      desc: 'Durchwahlen & Standorte',
      path: '/phone-directory',
      icon: Phone,
      color: 'bg-cyan-50 dark:bg-cyan-950/40 text-cyan-600 dark:text-cyan-400 border-cyan-200/80 dark:border-cyan-800'
    },
    {
      key: 'documents',
      title: t('nav_items.documents', 'Dokumentenablage'),
      desc: 'Dateien & KI-Suche',
      path: '/documents',
      icon: FolderOpen,
      color: 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-200/80 dark:border-amber-800'
    },
    {
      key: 'calendar',
      title: t('nav_items.calendar', 'Unternehmenskalender'),
      desc: 'Termine & iCal',
      path: '/calendar',
      icon: CalendarIcon,
      color: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200/80 dark:border-emerald-800'
    },
    {
      key: 'kantine',
      title: t('nav_items.kantine', 'Kantine & Menü'),
      desc: 'Wochen-Speiseplan',
      path: '/kantine',
      icon: Utensils,
      color: 'bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 border-orange-200/80 dark:border-orange-800'
    },
    {
      key: 'schulungen',
      title: t('nav_items.schulungen', 'Schulungen & KI'),
      desc: 'Handbücher & RAG Bot',
      path: '/schulungen',
      icon: Bot,
      color: 'bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 border-purple-200/80 dark:border-purple-800'
    },
  ];

  return (
    <div className="space-y-6 pb-12 animate-fade-in w-full max-w-full">
      {/* ========================================================= */}
      {/* 1. COMPACT MINIMALIST HEADER BANNER                       */}
      {/* ========================================================= */}
      {showHero && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-100 dark:border-slate-800 shadow-card flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all">
          <div className="flex items-center space-x-3.5 min-w-0">
            <UserAvatar
              src={user?.avatar_url}
              name={user?.full_name}
              size="lg"
              className="ring-2 ring-tinglev-blue/30 shadow-xs shrink-0"
              rounded="rounded-2xl"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center space-x-2 flex-wrap">
                <span className="text-xs font-bold text-tinglev-blue dark:text-cyan-400 uppercase tracking-wider">
                  {getGreeting()},
                </span>
                <span className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-slate-100 truncate">
                  {user?.full_name || 'Mitarbeiter'}
                </span>
              </div>
              <p className="text-xs text-slate-400 dark:text-slate-500 font-medium truncate mt-0.5">
                {customMotto}
              </p>
            </div>
          </div>

          {/* Date, Time & Quick Action */}
          <div className="flex flex-wrap items-center gap-2.5 text-xs font-semibold shrink-0">
            <div className="flex items-center space-x-2 px-3 py-1.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 font-mono text-slate-700 dark:text-slate-200">
              <Clock className="w-3.5 h-3.5 text-tinglev-blue" />
              <span>{currentTime.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })} Uhr</span>
              <span className="text-slate-300 dark:text-slate-600">•</span>
              <span>{currentTime.toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: 'short' })}</span>
            </div>

            {isSuperAdmin && onOpenConfig && (
              <button
                type="button"
                onClick={onOpenConfig}
                className="p-2 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-800 transition-colors"
                title="Minimal-Dashboard anpassen"
              >
                <SlidersHorizontal className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 2. MINIMALIST MODULE QUICK-ACCESS (PILLS OR CARDS)        */}
      {/* ========================================================= */}
      {showModules && (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center space-x-1.5">
              <Sparkles className="w-3.5 h-3.5 text-tinglev-blue" />
              <span>Kernmodule &amp; Schnellzugriff</span>
            </span>
          </div>

          {modulesStyle === 'pills' ? (
            /* SLEEK PILLS BAR */
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
              {quickModules.map((mod) => {
                const IconComponent = mod.icon;
                return (
                  <button
                    key={mod.key}
                    type="button"
                    onClick={() => navigate(mod.path)}
                    className="flex items-center space-x-2.5 p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs hover:shadow-md hover:border-tinglev-blue/50 dark:hover:border-tinglev-blue/50 transition-all text-left group"
                  >
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center border shrink-0 ${mod.color}`}>
                      <IconComponent className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-tinglev-blue truncate block">
                        {mod.title}
                      </span>
                      <span className="text-[10px] text-slate-400 truncate block">
                        {mod.desc}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            /* COMPACT MINI-CARDS */
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {quickModules.map((mod) => {
                const IconComponent = mod.icon;
                return (
                  <button
                    key={mod.key}
                    type="button"
                    onClick={() => navigate(mod.path)}
                    className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-card hover:shadow-lg hover:-translate-y-0.5 transition-all text-left flex flex-col justify-between group"
                  >
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center border mb-3 ${mod.color}`}>
                      <IconComponent className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-tinglev-blue truncate">
                        {mod.title}
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                        {mod.desc}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* 3. INLINE KPI METRICS INDICATORS                          */}
      {/* ========================================================= */}
      {showKpis && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
          {/* Active Employees */}
          <div className="p-3 sm:p-3.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-2xs flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <Users className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block truncate">
                {t('metrics.stat_team_title', 'Aktive Mitarbeiter')}
              </span>
              <div className="flex items-baseline space-x-1 mt-0.5">
                <span className="text-sm font-extrabold text-slate-900 dark:text-slate-100 font-mono">
                  {data?.stats?.active_users_count || 14}
                </span>
                <span className="text-[10px] text-slate-400">Team</span>
              </div>
            </div>
          </div>

          {/* Vacation Days */}
          <div className="p-3 sm:p-3.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-2xs flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <Palmtree className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block truncate">
                {t('metrics.stat_vacations_title', 'Resturlaub')}
              </span>
              <div className="flex items-baseline space-x-1 mt-0.5">
                <span className="text-sm font-extrabold text-slate-900 dark:text-slate-100 font-mono">
                  {data?.stats?.vacation_days_left || 24}
                </span>
                <span className="text-[10px] text-slate-400">Tage</span>
              </div>
            </div>
          </div>

          {/* Open Tickets */}
          <div className="p-3 sm:p-3.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-2xs flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
              <TicketCheck className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block truncate">
                {t('metrics.stat_tickets_title', 'Offene Anträge')}
              </span>
              <div className="flex items-baseline space-x-1 mt-0.5">
                <span className="text-sm font-extrabold text-slate-900 dark:text-slate-100 font-mono">
                  {data?.stats?.pending_requests_count || 1}
                </span>
                <span className="text-[10px] text-purple-600 font-semibold">in Prüfung</span>
              </div>
            </div>
          </div>

          {/* Next Company Event */}
          <div className="p-3 sm:p-3.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-2xs flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <CalendarDays className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block truncate">
                {t('metrics.stat_events_title', 'Nächstes Event')}
              </span>
              <div className="flex items-baseline space-x-1 mt-0.5">
                <span className="text-xs font-extrabold text-slate-900 dark:text-slate-100 truncate">
                  {data?.upcoming_events?.[0]?.title || 'Quartals-Meeting'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 4. MAIN 2-COLUMN MINIMALIST STREAM (NEWS + AGENDA & TOOLS) */}
      {/* ========================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN (7 Cols): Important Company Bulletins & News */}
        <div className="lg:col-span-7 space-y-4">
          {showAnnouncements && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-100 dark:border-slate-800 shadow-card space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center space-x-2">
                  <Megaphone className="w-4 h-4 text-tinglev-blue" />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    {t('announcements.title', 'Aktuelle Mitteilungen & News')}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/announcements')}
                  className="text-xs font-bold text-tinglev-blue hover:underline flex items-center space-x-1"
                >
                  <span>Alle anzeigen</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {announcementsList.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400">
                  Keine neuen Mitteilungen vorhanden.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {announcementsList.map((ann) => (
                    <div
                      key={ann.id}
                      onClick={() => setSelectedAnnouncement(ann)}
                      className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-100 dark:border-slate-800 cursor-pointer transition-all flex items-start justify-between gap-3 group"
                    >
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center space-x-2 flex-wrap">
                          {ann.is_pinned && (
                            <span className="inline-flex items-center space-x-1 px-2 py-0.2 rounded-md bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 text-[10px] font-extrabold border border-amber-200 dark:border-amber-800">
                              <Pin className="w-2.5 h-2.5 fill-current" />
                              <span>Wichtig</span>
                            </span>
                          )}
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            {ann.category || 'Allgemein'}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            • {new Date(ann.created_at || Date.now()).toLocaleDateString('de-DE', { day: '2-digit', month: 'short' })}
                          </span>
                        </div>

                        <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-tinglev-blue truncate">
                          {ann.title}
                        </h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
                          {ann.summary || ann.content}
                        </p>
                      </div>

                      <div className="p-2 rounded-xl bg-white dark:bg-slate-700 text-slate-400 group-hover:text-tinglev-blue shadow-2xs shrink-0 transition-colors">
                        <Eye className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN (5 Cols): Upcoming Events & Tools Quick Launcher */}
        <div className="lg:col-span-5 space-y-4">
          {/* Upcoming Events Agenda */}
          {showEvents && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-100 dark:border-slate-800 shadow-card space-y-3.5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center space-x-2">
                  <CalendarDays className="w-4 h-4 text-emerald-600" />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    {t('events.title', 'Nächste Firmentermine')}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/calendar')}
                  className="text-xs font-bold text-emerald-600 hover:underline flex items-center space-x-1"
                >
                  <span>Kalender</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {eventsList.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400">
                  Keine anstehenden Termine in den nächsten Tagen.
                </div>
              ) : (
                <div className="space-y-2">
                  {eventsList.map((ev) => (
                    <div
                      key={ev.id}
                      onClick={() => navigate('/calendar')}
                      className="p-3 rounded-2xl bg-slate-50/80 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-100 dark:border-slate-800 cursor-pointer transition-colors flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center space-x-3 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-mono text-center flex flex-col justify-center shrink-0 border border-emerald-200/60 dark:border-emerald-800">
                          <span className="text-[11px] font-extrabold leading-none">
                            {new Date(ev.start_time).getDate()}
                          </span>
                          <span className="text-[9px] uppercase font-bold text-emerald-600 leading-none mt-0.5">
                            {new Date(ev.start_time).toLocaleDateString('de-DE', { month: 'short' })}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                            {ev.title}
                          </h4>
                          <p className="text-[10px] text-slate-400 truncate">
                            {ev.location || 'Hauptsitz Tinglev'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Quick Launcher Shortcuts */}
          {showTools && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-100 dark:border-slate-800 shadow-card space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  {t('tools.title', 'Schnellzugriff & Portale')}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {toolsList.map((tl, i) => (
                  <a
                    key={i}
                    href={tl.url || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2.5 rounded-xl bg-slate-50 hover:bg-indigo-50/70 dark:bg-slate-800/60 dark:hover:bg-slate-800 border border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-indigo-600 transition-colors flex items-center justify-between text-xs font-semibold group"
                  >
                    <span className="truncate">{tl.title}</span>
                    <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-indigo-600 shrink-0 ml-1" />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Announcement Detail Modal */}
      {selectedAnnouncement && (
        <AnnouncementModal
          announcement={selectedAnnouncement}
          onClose={() => setSelectedAnnouncement(null)}
        />
      )}
    </div>
  );
}

export default MinimalDashboard;
