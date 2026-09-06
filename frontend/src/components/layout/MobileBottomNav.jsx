import React from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Truck, Clock, Wrench, Menu, Building2, User } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { UserAvatar } from '../common/UserAvatar';

export function MobileBottomNav({ onToggleSidebar }) {
  const { t } = useLanguage();
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const isGpsPage = location.pathname === '/gps';
  const queryParams = new URLSearchParams(location.search);
  const currentTab = queryParams.get('tab') || 'MAP';

  const handleTabClick = (tabName) => {
    navigate(`/gps?tab=${tabName}`);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#001E36]/95 backdrop-blur-xl border-t border-slate-200/80 dark:border-[#002B49] pb-safe md:hidden shadow-2xl transition-all">
      <div className="grid grid-cols-4 h-16 items-center px-2">
        {/* 1. Flotte / Karte */}
        <button
          onClick={() => handleTabClick('MAP')}
          className={`flex flex-col items-center justify-center space-y-1 h-full py-1 transition-all group ${
            isGpsPage && currentTab === 'MAP'
              ? 'text-sky-600 dark:text-[#38BDF8] font-bold'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <div className={`p-1 rounded-xl transition-all ${
            isGpsPage && currentTab === 'MAP' ? 'bg-sky-100 dark:bg-sky-500/20 scale-110 shadow-xs' : ''
          }`}>
            <Truck className="w-5 h-5" />
          </div>
          <span className="text-[10px] tracking-tight">Flotte</span>
        </button>

        {/* 2. Ladezeiten / Werksstatus */}
        <button
          onClick={() => handleTabClick('STAYS')}
          className={`flex flex-col items-center justify-center space-y-1 h-full py-1 transition-all group ${
            isGpsPage && (currentTab === 'STAYS' || currentTab === 'DEMURRAGE' || currentTab === 'DISPATCH')
              ? 'text-sky-600 dark:text-[#38BDF8] font-bold'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <div className={`p-1 rounded-xl transition-all ${
            isGpsPage && (currentTab === 'STAYS' || currentTab === 'DEMURRAGE' || currentTab === 'DISPATCH')
              ? 'bg-sky-100 dark:bg-sky-500/20 scale-110 shadow-xs'
              : ''
          }`}>
            <Clock className="w-5 h-5" />
          </div>
          <span className="text-[10px] tracking-tight">Ladezeiten</span>
        </button>

        {/* 3. Wartung */}
        <button
          onClick={() => handleTabClick('MAINTENANCE')}
          className={`flex flex-col items-center justify-center space-y-1 h-full py-1 transition-all group ${
            isGpsPage && currentTab === 'MAINTENANCE'
              ? 'text-sky-600 dark:text-[#38BDF8] font-bold'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <div className={`p-1 rounded-xl transition-all ${
            isGpsPage && currentTab === 'MAINTENANCE'
              ? 'bg-sky-100 dark:bg-sky-500/20 scale-110 shadow-xs'
              : ''
          }`}>
            <Wrench className="w-5 h-5" />
          </div>
          <span className="text-[10px] tracking-tight">Wartung</span>
        </button>

        {/* 4. Menü / Profil */}
        <button
          onClick={onToggleSidebar}
          className="flex flex-col items-center justify-center space-y-1 h-full py-1 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all group"
        >
          <div className="p-1 rounded-xl group-hover:bg-slate-100 dark:group-hover:bg-[#002B49] transition-colors relative">
            <Menu className="w-5 h-5" />
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-sky-500"></span>
          </div>
          <span className="text-[10px] tracking-tight">Menü</span>
        </button>
      </div>
    </nav>
  );
}
