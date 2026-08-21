import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { ShieldCheck, Sliders, Server, Database, Key, CheckCircle, RefreshCw } from 'lucide-react';
import { RoleBadge } from '../components/common/Badge';
import { LanguageManagementCard } from '../components/admin/LanguageManagementCard';
import { OneDriveConfigCard } from '../components/admin/OneDriveConfigCard';

export function AdminSettingsPage() {
  const { user, menuSections, refreshMenu } = useAuth();
  const { t } = useLanguage();
  const [reseeded, setReseeded] = useState(false);

  const handleReseed = async () => {
    try {
      const token = localStorage.getItem('intranet_token');
      await fetch('http://127.0.0.1:8000/api/v1/auth/seed', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      await refreshMenu();
      setReseeded(true);
      setTimeout(() => setReseeded(false), 3000);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-card flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{t('admin.title')}</h1>
            <p className="text-xs sm:text-sm text-slate-500">
              {t('admin.subtitle')}
            </p>
          </div>
        </div>
        <RoleBadge role={user?.role} />
      </div>

      {/* 1. Dynamic System Languages (i18n) Management Card */}
      <LanguageManagementCard />

      {/* 2. Microsoft OneDrive & SharePoint Cloud Storage Integrations */}
      <OneDriveConfigCard />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Dynamic RBAC Structure Inspection */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-card space-y-6">
          <div className="flex items-center space-x-3 pb-4 border-b border-slate-100">
            <Sliders className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base font-bold text-slate-900">{t('admin.rbac_title')}</h2>
          </div>

          <p className="text-xs text-slate-500">
            {t('admin.rbac_desc')} (<strong className="text-slate-800">{user?.role}</strong>):
          </p>

          <div className="space-y-4">
            {menuSections.map((sec, idx) => {
              const translatedSection = t(`nav_sections.${sec.section}`, sec.section);
              return (
                <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-200/60">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">
                    {translatedSection}
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {sec.items.map((it) => {
                      const translatedLabel = t(`nav_items.${it.key}`, it.label);
                      return (
                        <div key={it.key} className="p-2 bg-white rounded-xl border border-slate-100 flex items-center justify-between text-xs">
                          <span className="font-medium text-slate-800">{translatedLabel}</span>
                          <span className="text-[10px] text-slate-400 font-mono">{it.path}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Backend & Security Parameters */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-card space-y-6">
          <div className="flex items-center space-x-3 pb-4 border-b border-slate-100">
            <Server className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base font-bold text-slate-900">{t('admin.server_title')}</h2>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Key className="w-4 h-4 text-indigo-500" />
                <span className="font-semibold text-slate-700">{t('admin.jwt_label')}</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
                {t('admin.jwt_status')}
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Database className="w-4 h-4 text-indigo-500" />
                <span className="font-semibold text-slate-700">{t('admin.db_label')}</span>
              </div>
              <span className="font-mono text-slate-600">{t('admin.db_status')}</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-indigo-500" />
                <span className="font-semibold text-slate-700">{t('admin.policy_label')}</span>
              </div>
              <span className="font-semibold text-slate-700">{t('admin.policy_status')}</span>
            </div>
          </div>

          {/* Database Seeder Button */}
          <div className="pt-4 border-t border-slate-100">
            <button
              onClick={handleReseed}
              className="w-full flex items-center justify-center space-x-2 p-3 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-xs font-semibold transition-all shadow-md"
            >
              <RefreshCw className="w-4 h-4" />
              <span>{t('admin.reseed_button')}</span>
            </button>
            {reseeded && (
              <p className="mt-2 text-center text-xs text-emerald-600 font-semibold flex items-center justify-center space-x-1">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>{t('admin.reseed_success')}</span>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
