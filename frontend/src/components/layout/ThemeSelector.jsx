import React, { useState, useRef, useEffect } from 'react';
import { Sun, Moon, Monitor, Check } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';

export function ThemeSelector({ variant = 'dropdown', className = '' }) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const options = [
    {
      id: 'standard',
      label: t('theme.standard', 'Standard (System)'),
      desc: t('theme.standard_desc', 'Folgt der Systemeinstellung'),
      icon: Monitor,
    },
    {
      id: 'light',
      label: t('theme.light', 'Clara / Hell'),
      desc: t('theme.light_desc', 'Klares, helles Design'),
      icon: Sun,
    },
    {
      id: 'dark',
      label: t('theme.dark', 'Oscura / Dunkel'),
      desc: t('theme.dark_desc', 'Modernes, augenschonendes Dunkeldesign'),
      icon: Moon,
    },
  ];

  // Current active icon to display in the button
  const ActiveIcon = theme === 'standard' ? Monitor : (theme === 'dark' ? Moon : Sun);

  if (variant === 'pills') {
    return (
      <div className={`inline-flex items-center p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700/60 ${className}`}>
        {options.map((opt) => {
          const Icon = opt.icon;
          const isActive = theme === opt.id;
          return (
            <button
              key={opt.id}
              onClick={() => setTheme(opt.id)}
              title={`${opt.label}: ${opt.desc}`}
              className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                isActive
                  ? 'bg-white dark:bg-[#009FE3] text-[#009FE3] dark:text-white shadow-sm shadow-slate-900/10'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-700/40'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{opt.id === 'standard' ? 'Standard' : opt.id === 'light' ? 'Clara' : 'Oscura'}</span>
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-slate-600 dark:text-slate-300 hover:text-[#009FE3] dark:hover:text-[#009FE3] rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/70 transition-colors focus:outline-none flex items-center justify-center"
        title={t('theme.title', 'Design-Modus')}
        aria-label={t('theme.title', 'Design-Modus')}
      >
        <ActiveIcon className="w-5 h-5 transition-transform duration-200 hover:scale-110" />
        {theme === 'standard' && (
          <span className="absolute bottom-1 right-1 w-1.5 h-1.5 bg-[#009FE3] rounded-full ring-1 ring-white dark:ring-slate-900"></span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-[#0f1d33] rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800/90 py-2.5 z-50 animate-fade-in divide-y divide-slate-100 dark:divide-slate-800">
          <div className="px-3.5 pb-2">
            <p className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              {t('theme.title', 'Design-Modus')}
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {theme === 'standard' 
                ? `${t('theme.standard', 'Standard')} (${resolvedTheme === 'dark' ? t('theme.dark', 'Dunkel') : t('theme.light', 'Hell')})` 
                : (theme === 'dark' ? t('theme.dark', 'Oscura / Dunkel') : t('theme.light', 'Clara / Hell'))}
            </p>
          </div>

          <div className="pt-1.5 px-1 space-y-1">
            {options.map((opt) => {
              const Icon = opt.icon;
              const isSelected = theme === opt.id;
              return (
                <button
                  key={opt.id}
                  onClick={() => {
                    setTheme(opt.id);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-all ${
                    isSelected
                      ? 'bg-[#eef8fd] dark:bg-[#009FE3]/15 text-[#009FE3] font-semibold'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <div className={`p-1.5 rounded-lg ${
                      isSelected 
                        ? 'bg-[#009FE3] text-white' 
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                    }`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold leading-tight truncate">{opt.label}</p>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-tight truncate">{opt.desc}</p>
                    </div>
                  </div>
                  {isSelected && (
                    <Check className="w-4 h-4 text-[#009FE3] shrink-0 ml-2" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
