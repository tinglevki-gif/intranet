import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { HeroBanner } from '../components/dashboard/HeroBanner';
import { ModuleQuickCards } from '../components/dashboard/ModuleQuickCards';
import { MetricsGrid } from '../components/dashboard/MetricsGrid';
import { AnnouncementsFeed } from '../components/dashboard/AnnouncementsFeed';
import { QuickLauncher } from '../components/dashboard/QuickLauncher';
import { EventsWidget } from '../components/dashboard/EventsWidget';
import { RefreshCw, AlertCircle } from 'lucide-react';

export function DashboardPage() {
  const { t } = useLanguage();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getDashboardOverview();
      setData(res);
    } catch (err) {
      console.error('Error cargando dashboard:', err);
      setError(err.message || 'Verbindung zum Server fehlgeschlagen.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading && !data) {
    return (
      <div className="py-20 flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-medium text-slate-500">{t('common.loading')}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 max-w-lg mx-auto bg-white rounded-3xl border border-rose-100 shadow-xl text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-bold text-slate-900">{t('common.error_title')}</h3>
        <p className="text-xs text-slate-500">{error}</p>
        <button
          onClick={fetchDashboard}
          className="inline-flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-600/20"
        >
          <RefreshCw className="w-4 h-4" />
          <span>{t('common.retry')}</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      {/* 1. Personalized Corporate Hero Banner */}
      <HeroBanner />

      {/* 2. Phase 2: Core Module Quick Access Cards */}
      <ModuleQuickCards />

      {/* 3. Corporate KPIs Metrics Grid */}
      <MetricsGrid stats={data?.stats} />

      {/* 4. Main Grid: Announcements & Quick Launcher vs Events Agenda */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <AnnouncementsFeed 
            announcements={data?.announcements} 
            onRefresh={fetchDashboard} 
          />
          <QuickLauncher tools={data?.quick_tools} />
        </div>

        <div className="space-y-8">
          <EventsWidget events={data?.upcoming_events} />
        </div>
      </div>
    </div>
  );
}
