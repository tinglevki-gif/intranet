import React from 'react';
import { useLanguage } from '../../context/LanguageContext';

export function LanguageSelector({ compact = false }) {
  const { language, setLanguage, languages } = useLanguage();

  return (
    <div className="flex flex-wrap items-center gap-1.5 pt-1.5">
      {languages.map((lang) => {
        const isActive = language === lang.code;
        return (
          <button
            key={lang.code}
            onClick={() => setLanguage(lang.code)}
            title={`${lang.label || lang.name} (${lang.flag})`}
            className={`group relative flex items-center justify-center transition-all duration-200 rounded-lg text-xs font-semibold ${
              isActive
                ? 'bg-indigo-600/90 text-white shadow-sm shadow-indigo-500/40 ring-1.5 ring-indigo-400/80 px-2 py-1'
                : 'bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white px-1.5 py-1'
            }`}
          >
            <span className="text-sm leading-none mr-1 filter drop-shadow-xs">{lang.flag}</span>
            <span className={`text-[10px] uppercase font-bold tracking-wider ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`}>
              {lang.code}
            </span>

            {/* Active glow indicator */}
            {isActive && (
              <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-2 h-0.5 bg-indigo-300 rounded-full"></span>
            )}
          </button>
        );
      })}
    </div>
  );
}
