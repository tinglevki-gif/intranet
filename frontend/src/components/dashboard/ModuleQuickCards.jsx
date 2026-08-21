import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  PhoneCall, 
  Network, 
  Calendar, 
  FolderOpen, 
  ArrowRight, 
  Sparkles,
  Users,
  ShieldCheck
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export function ModuleQuickCards() {
  const { t } = useLanguage();
  const navigate = useNavigate();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-indigo-600" />
            <span>{t('module_cards.section_title')}</span>
          </h2>
          <p className="text-xs text-slate-500">{t('module_cards.section_subtitle')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* 1. Telefonverzeichnis Card */}
        <div 
          onClick={() => navigate('/phone-directory')}
          className="group relative bg-white rounded-3xl p-6 border border-slate-100 shadow-card hover:shadow-card-hover transition-all duration-300 transform hover:-translate-y-1 cursor-pointer flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
                <PhoneCall className="w-6 h-6" />
              </div>
              <span className="px-2.5 py-1 text-[11px] font-bold rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                {t('module_cards.phone_badge')}
              </span>
            </div>

            <h3 className="text-base font-extrabold text-slate-900 group-hover:text-blue-600 transition-colors">
              {t('module_cards.phone_title')}
            </h3>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
              {t('module_cards.phone_desc')}
            </p>

            <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
              <div className="flex items-center justify-between p-1.5 rounded-lg bg-slate-50">
                <span className="font-medium text-slate-700 truncate">IT-Helpdesk (#300)</span>
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">Frei</span>
              </div>
              <div className="flex items-center justify-between p-1.5 rounded-lg bg-slate-50">
                <span className="font-medium text-slate-700 truncate">HR-Team (#200)</span>
                <span className="text-[10px] font-mono text-slate-400">08:00 - 17:00</span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-blue-600 group-hover:text-blue-700">
            <span>{t('module_cards.phone_action')}</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* 2. Organigramm Card */}
        <div 
          onClick={() => navigate('/org-chart')}
          className="group relative bg-white rounded-3xl p-6 border border-slate-100 shadow-card hover:shadow-card-hover transition-all duration-300 transform hover:-translate-y-1 cursor-pointer flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-cyan-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
                <Network className="w-6 h-6" />
              </div>
              <span className="px-2.5 py-1 text-[11px] font-bold rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                {t('module_cards.org_badge')}
              </span>
            </div>

            <h3 className="text-base font-extrabold text-slate-900 group-hover:text-indigo-600 transition-colors">
              {t('module_cards.org_title')}
            </h3>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
              {t('module_cards.org_desc')}
            </p>

            <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
              <div className="flex items-center justify-between p-1.5 rounded-lg bg-slate-50">
                <span className="font-medium text-slate-700">Reporting Lines</span>
                <span className="text-[10px] font-bold text-indigo-600">3 Stufen</span>
              </div>
              <div className="flex items-center justify-between p-1.5 rounded-lg bg-slate-50">
                <span className="font-medium text-slate-700">Teams & Leads</span>
                <span className="text-[10px] font-bold text-cyan-600">8 Mitarbeiter</span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-indigo-600 group-hover:text-indigo-700">
            <span>{t('module_cards.org_action')}</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* 3. Unternehmenskalender Card */}
        <div 
          onClick={() => navigate('/calendar')}
          className="group relative bg-white rounded-3xl p-6 border border-slate-100 shadow-card hover:shadow-card-hover transition-all duration-300 transform hover:-translate-y-1 cursor-pointer flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-violet-600 flex items-center justify-center text-white shadow-md shadow-purple-500/20 group-hover:scale-105 transition-transform">
                <Calendar className="w-6 h-6" />
              </div>
              <span className="px-2.5 py-1 text-[11px] font-bold rounded-full bg-purple-50 text-purple-700 border border-purple-100">
                {t('module_cards.calendar_badge')}
              </span>
            </div>

            <h3 className="text-base font-extrabold text-slate-900 group-hover:text-purple-600 transition-colors">
              {t('module_cards.calendar_title')}
            </h3>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
              {t('module_cards.calendar_desc')}
            </p>

            <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
              <div className="flex items-center justify-between p-1.5 rounded-lg bg-slate-50">
                <span className="font-medium text-slate-700 truncate max-w-[140px]">All-Hands Q1</span>
                <span className="text-[10px] font-bold text-indigo-600">28. Feb</span>
              </div>
              <div className="flex items-center justify-between p-1.5 rounded-lg bg-slate-50">
                <span className="font-medium text-slate-700 truncate max-w-[140px]">Product Discovery</span>
                <span className="text-[10px] font-bold text-slate-500">02. Mär</span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-purple-600 group-hover:text-purple-700">
            <span>{t('module_cards.calendar_action')}</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* 4. Dokumentenverwaltung Card */}
        <div 
          onClick={() => navigate('/documents')}
          className="group relative bg-white rounded-3xl p-6 border border-slate-100 shadow-card hover:shadow-card-hover transition-all duration-300 transform hover:-translate-y-1 cursor-pointer flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center text-white shadow-md shadow-amber-500/20 group-hover:scale-105 transition-transform">
                <FolderOpen className="w-6 h-6" />
              </div>
              <span className="px-2.5 py-1 text-[11px] font-bold rounded-full bg-amber-50 text-amber-700 border border-amber-100">
                {t('module_cards.documents_badge')}
              </span>
            </div>

            <h3 className="text-base font-extrabold text-slate-900 group-hover:text-amber-600 transition-colors">
              {t('module_cards.documents_title')}
            </h3>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
              {t('module_cards.documents_desc')}
            </p>

            <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
              <div className="flex items-center justify-between p-1.5 rounded-lg bg-slate-50">
                <span className="font-medium text-slate-700 truncate">Urlaubsantrag_2026.pdf</span>
                <span className="text-[10px] text-slate-400">PDF</span>
              </div>
              <div className="flex items-center justify-between p-1.5 rounded-lg bg-slate-50">
                <span className="font-medium text-slate-700 truncate">Brand_Kit_Tiglev.zip</span>
                <span className="text-[10px] text-slate-400">ZIP</span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-amber-600 group-hover:text-amber-700">
            <span>{t('module_cards.documents_action')}</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>
    </div>
  );
}
