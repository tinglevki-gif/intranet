import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-[#f8fafc] flex">
      {/* Dynamic Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col md:pl-72 min-w-0">
        <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

        <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto animate-fade-in">
          <Outlet />
        </main>

        <footer className="px-8 py-4 text-center text-xs text-slate-400 border-t border-slate-200/60 bg-white/50 mt-auto">
          {t('brand.rights')} • {t('brand.version')}
        </footer>
      </div>
    </div>
  );
}
