import React from 'react';
import { Calendar, Cake, Users, MapPin, Clock, Sparkles } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export function EventsWidget({ events }) {
  const { t } = useLanguage();

  const getEventBadge = (type) => {
    switch (type) {
      case 'townhall':
        return { label: t('events.townhall'), icon: Sparkles, bg: 'bg-purple-50 text-purple-700 border-purple-200' };
      case 'birthday':
        return { label: t('events.birthday'), icon: Cake, bg: 'bg-rose-50 text-rose-700 border-rose-200' };
      case 'holiday':
        return { label: t('events.holiday'), icon: Calendar, bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      default:
        return { label: t('events.meeting'), icon: Users, bg: 'bg-blue-50 text-blue-700 border-blue-200' };
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-card">
      <div className="flex items-center space-x-3 pb-6 border-b border-slate-100">
        <div className="p-2.5 rounded-2xl bg-[#eef8fd] text-[#009FE3]">
          <Calendar className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-900">{t('events.title')}</h2>
          <p className="text-xs text-slate-500">{t('events.subtitle')}</p>
        </div>
      </div>

      <div className="mt-6 space-y-3.5">
        {(events || []).map((evt) => {
          const badge = getEventBadge(evt.type);
          const BadgeIcon = badge.icon;
          const timeDisplay = evt.time === 'Todo el día' ? t('events.all_day') : evt.time;

          return (
            <div
              key={evt.id}
              className="p-4 rounded-2xl bg-slate-50/50 hover:bg-white border border-slate-100 hover:border-[#72ccf0] hover:shadow-md transition-all group"
            >
              <div className="flex items-start justify-between">
                <span className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${badge.bg}`}>
                  <BadgeIcon className="w-3 h-3 mr-1" />
                  {badge.label}
                </span>
                <span className="text-xs font-bold text-[#009FE3]">
                  {evt.date}
                </span>
              </div>

              <h4 className="text-xs sm:text-sm font-bold text-slate-900 mt-2 group-hover:text-[#009FE3] transition-colors">
                {evt.title}
              </h4>

              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-400">
                {timeDisplay && (
                  <div className="flex items-center space-x-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span>{timeDisplay}</span>
                  </div>
                )}
                {evt.location && (
                  <div className="flex items-center space-x-1">
                    <MapPin className="w-3 h-3 text-slate-400" />
                    <span className="truncate max-w-[150px]">{evt.location}</span>
                  </div>
                )}
                {evt.attendees_count && (
                  <div className="flex items-center space-x-1">
                    <Users className="w-3 h-3 text-slate-400" />
                    <span>{evt.attendees_count} {t('events.confirmed')}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
