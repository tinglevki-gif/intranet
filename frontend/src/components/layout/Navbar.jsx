import React, { useState, useRef, useEffect } from 'react';
import { 
  Menu, 
  Search, 
  Bell, 
  LogOut, 
  ChevronDown,
  Sparkles,
  CheckCheck,
  Check
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { RoleBadge } from '../common/Badge';
import { WeatherWidget } from './WeatherWidget';
import { UserAvatar } from '../common/UserAvatar';
import { GlobalSearchBar } from './GlobalSearchBar';
import { ThemeSelector } from './ThemeSelector';

const NOTIFICATIONS_STORAGE_KEY = 'intranet_read_notif_ids';

export function Navbar({ onToggleSidebar }) {
  const { user, logout } = useAuth();
  const { t, language, setLanguage, languages, currentLanguage } = useLanguage();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);

  // Load read notification IDs from localStorage
  const [readNotifIds, setReadNotifIds] = useState(() => {
    try {
      const stored = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const userMenuRef = useRef(null);
  const notifMenuRef = useRef(null);
  const langMenuRef = useRef(null);

  // Close menus on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setShowUserMenu(false);
      }
      if (notifMenuRef.current && !notifMenuRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
      if (langMenuRef.current && !langMenuRef.current.contains(e.target)) {
        setShowLangMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const notifications = [
    { id: 1, title: t('navbar.notif_1_title'), desc: t('navbar.notif_1_desc'), time: t('navbar.notif_1_time') },
    { id: 2, title: t('navbar.notif_2_title'), desc: t('navbar.notif_2_desc'), time: t('navbar.notif_2_time') },
    { id: 3, title: t('navbar.notif_3_title'), desc: t('navbar.notif_3_desc'), time: t('navbar.notif_3_time') },
  ];

  const unreadCount = notifications.filter(n => !readNotifIds.includes(n.id)).length;

  const handleMarkAllAsRead = () => {
    const allIds = notifications.map(n => n.id);
    setReadNotifIds(allIds);
    try {
      localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(allIds));
    } catch (e) {
      console.error('Error saving read notifications:', e);
    }
  };

  const handleMarkAsRead = (id) => {
    if (!readNotifIds.includes(id)) {
      const updated = [...readNotifIds, id];
      setReadNotifIds(updated);
      try {
        localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {
        console.error('Error saving read notification:', e);
      }
    }
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 md:px-8 glass-nav">
      {/* Left side: Hamburger & Search */}
      <div className="flex items-center space-x-4 flex-1 max-w-xl">
        <button
          onClick={onToggleSidebar}
          className="p-2 text-slate-500 rounded-xl hover:bg-slate-100 md:hidden focus:outline-none"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Global Multi-Entity Unified Search Bar */}
        <GlobalSearchBar />
      </div>

      {/* Right side: Weather Widget, Status, Notifications, User Menu */}
      <div className="flex items-center space-x-2 sm:space-x-3">
        {/* Open-Meteo Weather Widget */}
        <WeatherWidget />

        {/* Live Status indicator */}
        <div className="hidden 2xl:flex items-center space-x-2 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>{t('navbar.systems_operational')}</span>
        </div>

        {/* Visual Theme Selector (Standard / Clara / Oscura) */}
        <ThemeSelector />

        {/* Notification Bell */}
        <div className="relative" ref={notifMenuRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 text-slate-600 hover:text-[#009FE3] rounded-xl hover:bg-slate-100 transition-colors focus:outline-none"
            title={t('navbar.notifications')}
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#F05A22] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#F05A22] ring-2 ring-white"></span>
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-3xl shadow-2xl border border-slate-100 py-3 z-50 animate-fade-in">
              <div className="flex items-center justify-between px-4 pb-2.5 border-b border-slate-100">
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-slate-900 text-sm">{t('navbar.notifications')}</span>
                  {unreadCount > 0 && (
                    <span className="px-2 py-0.5 text-[10px] font-extrabold bg-[#F05A22]/10 text-[#F05A22] rounded-full">
                      {unreadCount}
                    </span>
                  )}
                </div>
                {unreadCount > 0 ? (
                  <button
                    onClick={handleMarkAllAsRead}
                    className="text-[11px] font-medium text-[#009FE3] hover:text-[#0070A8] hover:underline cursor-pointer flex items-center space-x-1 focus:outline-none transition-colors"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    <span>{t('navbar.mark_all_read')}</span>
                  </button>
                ) : (
                  <span className="text-[11px] font-medium text-emerald-600 flex items-center space-x-1">
                    <Check className="w-3.5 h-3.5" />
                    <span>{t('navbar.all_read')}</span>
                  </span>
                )}
              </div>
              <div className="divide-y divide-slate-50 max-h-80 overflow-y-auto">
                {notifications.map((notif) => {
                  const isUnread = !readNotifIds.includes(notif.id);
                  return (
                    <div 
                      key={notif.id} 
                      onClick={() => handleMarkAsRead(notif.id)}
                      className={`p-3.5 hover:bg-slate-50 transition-colors flex items-start space-x-3 cursor-pointer ${isUnread ? 'bg-[#eef8fd]/70' : 'opacity-80'}`}
                    >
                      <div className={`p-2 rounded-xl mt-0.5 shrink-0 ${isUnread ? 'bg-[#F05A22]/10 text-[#F05A22]' : 'bg-slate-100 text-slate-400'}`}>
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <p className={`text-xs truncate ${isUnread ? 'font-bold text-slate-900' : 'font-medium text-slate-700'}`}>
                            {notif.title}
                          </p>
                          {isUnread && (
                            <span className="w-1.5 h-1.5 rounded-full bg-[#009FE3] shrink-0"></span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5 leading-snug">{notif.desc}</p>
                        <span className="text-[10px] text-slate-400 mt-1 block">{notif.time}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Dropdown */}
        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center space-x-2.5 p-1.5 rounded-xl hover:bg-slate-100 transition-colors focus:outline-none"
          >
            <UserAvatar
              src={user?.avatar_url}
              name={user?.full_name}
              size="sm"
              className="ring-2 ring-[#009FE3]/30 shrink-0"
              rounded="rounded-xl"
            />
            <div className="hidden sm:block text-left">
              <p className="text-xs font-bold text-slate-800 leading-tight">{user?.full_name}</p>
              <p className="text-[11px] text-slate-500">{user?.position}</p>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-400 hidden sm:block" />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-72 bg-white rounded-3xl shadow-2xl border border-slate-100 py-2 z-50 animate-fade-in">
              <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50 rounded-t-3xl">
                <p className="text-sm font-bold text-slate-900">{user?.full_name}</p>
                <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                <div className="mt-2">
                  <RoleBadge role={user?.role} customRoleName={user?.custom_role_name} />
                </div>
              </div>

              <div className="py-1">
                <div className="px-4 py-2 text-xs text-slate-600 flex items-center justify-between">
                  <span className="text-slate-400">{t('navbar.location')}</span>
                  <span className="font-medium">{user?.location || 'München'}</span>
                </div>
                <div className="px-4 py-2 text-xs text-slate-600 flex items-center justify-between">
                  <span className="text-slate-400">{t('navbar.department')}</span>
                  <span className="font-medium truncate max-w-[130px]">{user?.department}</span>
                </div>
              </div>

              {/* Theme Preference in User Drawer */}
              <div className="px-4 py-2.5 border-t border-slate-100 bg-slate-50/40">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{t('theme.label', 'Thema')}</span>
                </div>
                <ThemeSelector variant="pills" className="w-full flex justify-between" />
              </div>

              <div className="pt-2 border-t border-slate-100">
                <button
                  onClick={logout}
                  className="w-full flex items-center space-x-2 px-4 py-2.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors text-left rounded-b-3xl"
                >
                  <LogOut className="w-4 h-4" />
                  <span>{t('navbar.logout')}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
