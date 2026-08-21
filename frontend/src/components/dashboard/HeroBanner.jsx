import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { RoleBadge } from '../common/Badge';
import { Sparkles, Calendar, Clock } from 'lucide-react';

export function HeroBanner() {
  const { user } = useAuth();
  const { t, formatDate, formatTime } = useLanguage();
  const [currentDateTime, setCurrentDateTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentDateTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const getGreeting = () => {
    const hours = currentDateTime.getHours();
    if (hours < 12) return t('hero.morning');
    if (hours < 19) return t('hero.afternoon');
    return t('hero.evening');
  };

  const formattedDate = formatDate(currentDateTime, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const formattedTime = formatTime(currentDateTime);

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 shadow-xl shadow-indigo-950/20 border border-slate-800">
      {/* Decorative background glows */}
      <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 left-1/3 -mb-12 w-64 h-64 bg-violet-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-3 max-w-2xl">
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-200 text-xs font-semibold backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>{t('hero.tag')}</span>
            </span>
            <RoleBadge role={user?.role} />
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white font-heading">
            {getGreeting()}, <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-white to-violet-300">{user?.full_name?.split(' ')[0]}</span> 👋
          </h1>

          <p className="text-sm sm:text-base text-slate-300 font-normal">
            {t('hero.welcome_text_1')}{' '}
            <strong className="text-white font-semibold">{t('hero.welcome_text_notifs')}</strong>{' '}
            {t('hero.welcome_text_2')}{' '}
            <strong className="text-white font-semibold">{t('hero.welcome_text_pinned')}</strong>{' '}
            {t('hero.welcome_text_3')}
          </p>
        </div>

        {/* Live Date & Time pill */}
        <div className="flex flex-col sm:flex-row md:flex-col items-start md:items-end justify-center p-4 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 space-y-1">
          <div className="flex items-center space-x-2 text-xs font-medium text-slate-300 capitalize">
            <Calendar className="w-4 h-4 text-indigo-400" />
            <span>{formattedDate}</span>
          </div>
          <div className="flex items-center space-x-2 text-xl font-bold text-white tracking-wide font-mono">
            <Clock className="w-5 h-5 text-indigo-400" />
            <span>{formattedTime}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
