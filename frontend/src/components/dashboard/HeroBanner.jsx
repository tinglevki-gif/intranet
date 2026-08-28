import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { RoleBadge } from '../common/Badge';
import { Sparkles, Calendar, Clock, ArrowRight, MessageSquarePlus } from 'lucide-react';

export function HeroBanner() {
  const { user, hasModulePermission } = useAuth();
  const { t, formatDate, formatTime } = useLanguage();
  const [currentDateTime, setCurrentDateTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentDateTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const getGreeting = () => {
    const hours = currentDateTime.getHours();
    if (hours < 12) return t('hero.morning', 'Guten Morgen');
    if (hours < 19) return t('hero.afternoon', 'Guten Tag');
    return t('hero.evening', 'Guten Abend');
  };

  const formattedDate = formatDate(currentDateTime, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const formattedTime = formatTime(currentDateTime);

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#001424] via-[#001E36] to-[#002B49] text-white p-6 sm:p-8 shadow-xl shadow-[#001424]/40 border border-[#003E6B]/60">
      {/* Decorative Tinglev background glows */}
      <div className="absolute top-0 right-0 -mt-8 -mr-8 w-72 h-72 bg-[#009FE3]/15 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 left-1/4 -mb-12 w-64 h-64 bg-[#F05A22]/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* Tinglev signature corner geometric accent slice */}
      <div className="absolute -bottom-10 -right-10 w-28 h-28 bg-gradient-to-tl from-[#F05A22]/20 to-transparent transform rotate-45 pointer-events-none rounded-2xl"></div>

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-3 max-w-2xl">
          {/* Signature Tinglev Orange Accent Line (from screenshot) */}
          <div className="w-16 h-1.5 bg-[#F05A22] rounded-full shadow-sm shadow-[#F05A22]/60"></div>

          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[#009FE3]/20 border border-[#009FE3]/30 text-[#aee0f6] text-xs font-semibold backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5 text-[#009FE3]" />
              <span>{t('hero.tag', 'TINGLEV ELEMENTFABRIK')}</span>
            </span>
            <RoleBadge role={user?.role} customRoleName={user?.custom_role_name} />
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white font-heading">
            {getGreeting()},{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#72ccf0] via-white to-[#009FE3]">
              {user?.full_name?.split(' ')[0]}
            </span>{' '}
            👋
          </h1>

          <p className="text-sm sm:text-base text-slate-300 font-normal leading-relaxed">
            {t('hero.welcome_text_1', 'Willkommen im Intranet-Portal von')}{' '}
            <strong className="text-white font-bold">Tinglev Elementfabrik</strong>.{' '}
            {t('hero.welcome_text_2', 'Hier finden Sie alle zentralen Arbeitsabläufe, Neuigkeiten und Team-Ressourcen.')}
          </p>

          {/* Tinglev Action CTA Buttons */}
          <div className="pt-2 flex flex-wrap items-center gap-3">
            {hasModulePermission('tickets') && (
              <Link
                to="/tickets"
                className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-[#F05A22] hover:bg-[#e0460f] text-white text-xs sm:text-sm font-bold shadow-md shadow-[#F05A22]/30 transition-all hover:scale-102 active:scale-98"
              >
                <MessageSquarePlus className="w-4 h-4" />
                <span>{t('hero.cta_primary', 'Ticket / Anfrage erstellen')}</span>
              </Link>
            )}
            {hasModulePermission('announcements') && (
              <Link
                to="/announcements"
                className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-[#009FE3] hover:bg-[#008DD2] text-white text-xs sm:text-sm font-bold shadow-md shadow-[#009FE3]/25 transition-all hover:scale-102 active:scale-98"
              >
                <span>{t('hero.cta_secondary', 'Mehr erfahren')}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            )}
          </div>
        </div>

        {/* Live Date & Time pill */}
        <div className="flex flex-row lg:flex-col items-center lg:items-end justify-between lg:justify-center p-4 sm:p-5 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 space-y-0 lg:space-y-2 shrink-0">
          <div className="flex items-center space-x-2 text-xs font-medium text-slate-300 capitalize">
            <Calendar className="w-4 h-4 text-[#009FE3]" />
            <span>{formattedDate}</span>
          </div>
          <div className="flex items-center space-x-2 text-xl sm:text-2xl font-bold text-white tracking-wide font-mono">
            <Clock className="w-5 h-5 text-[#F05A22]" />
            <span>{formattedTime}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
