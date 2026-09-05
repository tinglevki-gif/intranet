import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { HeroBanner } from '../components/dashboard/HeroBanner';
import { ModuleQuickCards } from '../components/dashboard/ModuleQuickCards';
import { MetricsGrid } from '../components/dashboard/MetricsGrid';
import { AnnouncementsFeed } from '../components/dashboard/AnnouncementsFeed';
import { QuickLauncher } from '../components/dashboard/QuickLauncher';
import { EventsWidget } from '../components/dashboard/EventsWidget';
import { MinimalDashboard } from '../components/dashboard/MinimalDashboard';
import { DashboardViewToggle } from '../components/dashboard/DashboardViewToggle';
import { DashboardConfigCard } from '../components/admin/DashboardConfigCard';
import { RefreshCw, AlertCircle } from 'lucide-react';

export function DashboardPage() {
  const { t } = useLanguage();
  const { user, hasModulePermission } = useAuth();
  const isSuperAdmin = user?.role === 'ADMIN';

  const [data, setData] = useState(null);
  const [dashboardConfig, setDashboardConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // View mode: 'standard' | 'minimal'
  const [dashboardMode, setDashboardMode] = useState(() => {
    return localStorage.getItem('intranet_dashboard_mode') || 'standard';
  });

  const [configModalOpen, setConfigModalOpen] = useState(false);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const [resData, resConfig] = await Promise.all([
        api.getDashboardOverview(),
        api.getDashboardConfig().catch(() => null),
      ]);
      setData(resData);
      if (resConfig) {
        setDashboardConfig(resConfig);
        // If user hasn't set a preference in localStorage, use global default_mode
        const localPref = localStorage.getItem('intranet_dashboard_mode');
        if (!localPref && resConfig.default_mode) {
          setDashboardMode(resConfig.default_mode);
        }
      }
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

  const handleToggleMode = (mode) => {
    setDashboardMode(mode);
    localStorage.setItem('intranet_dashboard_mode', mode);
  };

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
      <div className="p-8 max-w-lg mx-auto bg-white dark:bg-slate-900 rounded-3xl border border-rose-100 dark:border-rose-900/60 shadow-xl text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">{t('common.error_title')}</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">{error}</p>
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

  const showCalendar = hasModulePermission('calendar');

  return (
    <div className="space-y-6 sm:space-y-8 pb-12 animate-fade-in w-full max-w-full">
      {/* View Mode Toggle Bar */}
      <div className="flex justify-end">
        <DashboardViewToggle
          mode={dashboardMode}
          onToggle={handleToggleMode}
          isSuperAdmin={isSuperAdmin}
          onOpenConfig={() => setConfigModalOpen(true)}
        />
      </div>

      {dashboardMode === 'minimal' ? (
        /* ========================================================= */
        /* MINIMALIST DASHBOARD VIEW                                 */
        /* ========================================================= */
        <MinimalDashboard
          data={data}
          config={dashboardConfig || {}}
          onRefresh={fetchDashboard}
          isSuperAdmin={isSuperAdmin}
          onOpenConfig={() => setConfigModalOpen(true)}
        />
      ) : (
        /* ========================================================= */
        /* STANDARD FULL DASHBOARD VIEW                              */
        /* ========================================================= */
        <div className="space-y-8">
          {/* 1. Personalized Corporate Hero Banner */}
          <HeroBanner />

          {/* 2. Core Module Quick Access Cards */}
          <ModuleQuickCards />

          {/* 3. Corporate KPIs Metrics Grid */}
          <MetricsGrid stats={data?.stats} />

          {/* 4. Main Grid: Announcements & Quick Launcher vs Events Agenda */}
          <div className={`grid grid-cols-1 ${showCalendar ? 'lg:grid-cols-3' : 'lg:grid-cols-1'} gap-8`}>
            <div className={`${showCalendar ? 'lg:col-span-2' : 'w-full'} space-y-8`}>
              <AnnouncementsFeed 
                announcements={data?.announcements} 
                onRefresh={fetchDashboard} 
              />
              <QuickLauncher tools={data?.quick_tools} />
            </div>

            {showCalendar && (
              <div className="space-y-8">
                <EventsWidget events={data?.upcoming_events} />
              </div>
            )}
          </div>
        </div>
      )}

      {/* SuperAdmin Quick Config Modal */}
      {configModalOpen && (
        <DashboardConfigCard
          isModal={true}
          onClose={() => setConfigModalOpen(false)}
          onSaved={(newCfg) => {
            setDashboardConfig(newCfg);
            fetchDashboard();
          }}
        />
      )}
    </div>
  );
}

export default DashboardPage;
