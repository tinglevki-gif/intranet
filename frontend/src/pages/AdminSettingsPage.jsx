import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { ShieldCheck, Sliders, Server, Database, Key, CheckCircle, RefreshCw } from 'lucide-react';
import { RoleBadge } from '../components/common/Badge';
import { LanguageManagementCard } from '../components/admin/LanguageManagementCard';
import { OneDriveConfigCard } from '../components/admin/OneDriveConfigCard';
import { MenuManagementCard } from '../components/admin/MenuManagementCard';
import { BrandingManagementCard } from '../components/admin/BrandingManagementCard';

export function AdminSettingsPage() {
  const { user, refreshMenu } = useAuth();
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
    <div className="space-y-8 pb-12 animate-fade-in">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-card flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{t('admin.title', 'System-Konfiguration & Administration')}</h1>
            <p className="text-xs sm:text-sm text-slate-500">
              {t('admin.subtitle', 'Zentrale Verwaltung von Menüs, Sprachen, Cloud-Speicher und Systemparametern')}
            </p>
          </div>
        </div>
        <RoleBadge role={user?.role} customRoleName={user?.custom_role_name} />
      </div>

      {/* 1. SuperAdmin Company Branding & Logo Customizer */}
      <BrandingManagementCard />

      {/* 2. SuperAdmin Menu & Navigation Management Card (Reorder, Toggle Active, Global Impact) */}
      <MenuManagementCard />

      {/* 2. Dynamic System Languages (i18n) Management Card */}
      <LanguageManagementCard />

      {/* 3. Microsoft OneDrive & SharePoint Cloud Storage Integrations */}
      <OneDriveConfigCard />

      {/* Backend & Security Parameters */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-card space-y-6">
        <div className="flex items-center space-x-3 pb-4 border-b border-slate-100">
          <Server className="w-5 h-5 text-indigo-600" />
          <h2 className="text-base font-bold text-slate-900">{t('admin.server_title', 'Server- & Sicherheitsstatus')}</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Key className="w-4 h-4 text-indigo-500" />
              <span className="font-semibold text-slate-700">{t('admin.jwt_label', 'JWT Auth Token')}</span>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
              {t('admin.jwt_status', 'Aktiv (HS256)')}
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Database className="w-4 h-4 text-indigo-500" />
              <span className="font-semibold text-slate-700">{t('admin.db_label', 'Datenbank')}</span>
            </div>
            <span className="font-mono text-slate-600">{t('admin.db_status', 'SQLite / PostgreSQL')}</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-indigo-500" />
              <span className="font-semibold text-slate-700">{t('admin.policy_label', 'RBAC & Schutz')}</span>
            </div>
            <span className="font-semibold text-slate-700">{t('admin.policy_status', 'Global Erzwungen')}</span>
          </div>
        </div>

        {/* Database Seeder Button */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between flex-wrap gap-4">
          <p className="text-xs text-slate-500">
            Initialisiert fehlende Standard-Datensätze (ohne bestehende Benutzer oder Passwörter zu überschreiben).
          </p>
          <button
            onClick={handleReseed}
            className="flex items-center space-x-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-xs font-semibold transition-all shadow-md"
          >
            <RefreshCw className="w-4 h-4" />
            <span>{t('admin.reseed_button', 'Demodaten synchronisieren')}</span>
          </button>
          {reseeded && (
            <p className="w-full text-center text-xs text-emerald-600 font-semibold flex items-center justify-center space-x-1">
              <CheckCircle className="w-3.5 h-3.5" />
              <span>{t('admin.reseed_success', 'Synchronisation erfolgreich!')}</span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
