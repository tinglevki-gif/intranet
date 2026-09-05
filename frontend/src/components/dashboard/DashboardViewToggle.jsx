import React from 'react';
import { LayoutDashboard, Sparkles, SlidersHorizontal } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export function DashboardViewToggle({ 
  mode = 'standard', 
  onToggle, 
  isSuperAdmin = false, 
  onOpenConfig 
}) {
  const { t } = useLanguage();

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-1.5 sm:p-2 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
      {/* Mode Switcher Pills */}
      <div className="flex items-center p-0.5 bg-slate-100 dark:bg-slate-800/80 rounded-xl">
        <button
          type="button"
          onClick={() => onToggle('standard')}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
            mode === 'standard'
              ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-xs'
              : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
          title={t('dashboard_mode.standard_desc', 'Vollständiges Dashboard mit allen Widgets')}
        >
          <LayoutDashboard className="w-3.5 h-3.5 text-tinglev-blue" />
          <span>{t('dashboard_mode.standard', 'Standard-Ansicht')}</span>
        </button>

        <button
          type="button"
          onClick={() => onToggle('minimal')}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
            mode === 'minimal'
              ? 'bg-white dark:bg-slate-700 text-tinglev-blue shadow-xs'
              : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
          title={t('dashboard_mode.minimal_desc', 'Fokussierte, schlanke Arbeitsansicht mit schnellen Zugriffen')}
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>{t('dashboard_mode.minimal', 'Minimal-Ansicht')}</span>
        </button>
      </div>

      {/* SuperAdmin Quick Customize Button */}
      {isSuperAdmin && onOpenConfig && (
        <button
          type="button"
          onClick={onOpenConfig}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 text-xs font-semibold border border-indigo-200/80 dark:border-indigo-800 transition-colors shadow-2xs"
          title="Minimal-Dashboard Widgets und Standardansicht anpassen"
        >
          <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
          <span className="hidden sm:inline">{t('dashboard_mode.customize_btn', 'Minimal-Ansicht anpassen')}</span>
        </button>
      )}
    </div>
  );
}

export default DashboardViewToggle;
