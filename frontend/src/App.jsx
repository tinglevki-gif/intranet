import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { AppLayout } from './components/layout/AppLayout';

import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { PhoneDirectoryPage } from './pages/PhoneDirectoryPage';
import { OrgChartPage } from './pages/OrgChartPage';
import { DirectoryPage } from './pages/DirectoryPage';
import { DocumentsPage } from './pages/DocumentsPage';
import { CalendarPage } from './pages/CalendarPage';
import { AnnouncementsPage } from './pages/AnnouncementsPage';
import { ITManagementPage } from './pages/ITManagementPage';
import { AdminSettingsPage } from './pages/AdminSettingsPage';
import { AdminUsersPage } from './pages/AdminUsersPage';
import { AdminRolesPage } from './pages/AdminRolesPage';

// 6 New Hauptbereich Pages
import { KantinePage } from './pages/KantinePage';
import { GpsPage } from './pages/GpsPage';
import { VertriebPage } from './pages/VertriebPage';
import { TechnikPage } from './pages/TechnikPage';
import { AbwicklungPage } from './pages/AbwicklungPage';
import { PlanungPage } from './pages/PlanungPage';
import { SchulungenPage } from './pages/SchulungenPage';
import { TicketsPage } from './pages/TicketsPage';

// Placeholder view for secondary HR / IT sub-modules
function PlaceholderModule({ title, description, badge }) {
  const { t } = useLanguage();
  return (
    <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-card text-center max-w-2xl mx-auto my-12 space-y-4 animate-fade-in">
      {badge && (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
          {badge}
        </span>
      )}
      <h2 className="text-2xl font-extrabold text-slate-900">{title}</h2>
      <p className="text-sm text-slate-500 max-w-md mx-auto leading-relaxed">{description}</p>
      <div className="pt-4">
        <a
          href="/"
          className="inline-flex items-center px-4 py-2 text-xs font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors"
        >
          ← {t('common.back_to_dashboard')}
        </a>
      </div>
    </div>
  );
}

export function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Authentication Route */}
            <Route path="/login" element={<LoginPage />} />

            {/* Protected Intranet Application Routes */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              {/* 1. Hauptbereich / Main Hub */}
              <Route index element={<DashboardPage />} />
              <Route path="announcements" element={<AnnouncementsPage />} />
              <Route path="news" element={<AnnouncementsPage />} />
              <Route path="mitteilungszentrale" element={<AnnouncementsPage />} />

              <Route
                path="phone-directory"
                element={
                  <ProtectedRoute requiredModule="phone-directory">
                    <PhoneDirectoryPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="org-chart"
                element={
                  <ProtectedRoute requiredModule="org-chart">
                    <OrgChartPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="directory"
                element={
                  <ProtectedRoute requiredModule="directory">
                    <DirectoryPage />
                  </ProtectedRoute>
                }
              />

              {/* 6 Hauptbereich Module Routes with Granular Permissions */}
              <Route
                path="kantine"
                element={
                  <ProtectedRoute requiredModule="kantine">
                    <KantinePage />
                  </ProtectedRoute>
                }
              />
              <Route path="hauptbereich/kantine" element={<Navigate to="/kantine" replace />} />

              <Route
                path="gps"
                element={
                  <ProtectedRoute requiredModule="gps">
                    <GpsPage />
                  </ProtectedRoute>
                }
              />
              <Route path="hauptbereich/gps" element={<Navigate to="/gps" replace />} />

              <Route
                path="vertrieb"
                element={
                  <ProtectedRoute requiredModule="vertrieb">
                    <VertriebPage />
                  </ProtectedRoute>
                }
              />
              <Route path="hauptbereich/vertrieb" element={<Navigate to="/vertrieb" replace />} />

              <Route
                path="technik"
                element={
                  <ProtectedRoute requiredModule="technik">
                    <TechnikPage />
                  </ProtectedRoute>
                }
              />
              <Route path="hauptbereich/technik" element={<Navigate to="/technik" replace />} />

              <Route
                path="abwicklung"
                element={
                  <ProtectedRoute requiredModule="abwicklung">
                    <AbwicklungPage />
                  </ProtectedRoute>
                }
              />
              <Route path="hauptbereich/abwicklung" element={<Navigate to="/abwicklung" replace />} />

              <Route
                path="planung"
                element={
                  <ProtectedRoute requiredModule="planung">
                    <PlanungPage />
                  </ProtectedRoute>
                }
              />
              <Route path="hauptbereich/planung" element={<Navigate to="/planung" replace />} />

              <Route
                path="schulungen"
                element={
                  <ProtectedRoute requiredModule="schulungen">
                    <SchulungenPage />
                  </ProtectedRoute>
                }
              />
              <Route path="hauptbereich/schulungen" element={<Navigate to="/schulungen" replace />} />

              {/* 2. Arbeitsbereich / Workplace */}
              <Route
                path="documents"
                element={
                  <ProtectedRoute requiredModule="documents">
                    <DocumentsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="calendar"
                element={
                  <ProtectedRoute requiredModule="calendar">
                    <CalendarPage />
                  </ProtectedRoute>
                }
              />

              {/* 3. Personal & HR (HR_MANAGER & ADMIN) */}
              <Route
                path="hr/requests"
                element={
                  <ProtectedRoute allowedRoles={['HR_MANAGER', 'ADMIN']}>
                    <PlaceholderModule
                      title="Urlaubs- & Abwesenheitsverwaltung"
                      description="HR-Management-Portal: Genehmigung von Urlaubsanträgen, Zeitausgleich und Krankmeldungen."
                      badge="HR_Admin Bereich"
                    />
                  </ProtectedRoute>
                }
              />
              <Route
                path="hr/performance"
                element={
                  <ProtectedRoute allowedRoles={['HR_MANAGER', 'ADMIN']}>
                    <PlaceholderModule
                      title="Mitarbeitergespräche & Performance"
                      description="Zielvereinbarungen (OKRs), Quartals-Reviews und Zufriedenheitsumfragen."
                      badge="HR_Admin Bereich"
                    />
                  </ProtectedRoute>
                }
              />

              {/* 4. IT & Systeme */}
              <Route path="tickets" element={<TicketsPage />} />
              <Route path="it-helpdesk" element={<Navigate to="/tickets" replace />} />
              <Route path="it/helpdesk" element={<TicketsPage />} />
              <Route
                path="it/management"
                element={
                  <ProtectedRoute allowedRoles={['IT_ADMIN', 'ADMIN']}>
                    <ITManagementPage />
                  </ProtectedRoute>
                }
              />

              {/* 5. Administration (SuperAdmin / ADMIN) */}
              <Route
                path="admin/users"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN']}>
                    <AdminUsersPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="admin/roles"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN']}>
                    <AdminRolesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="admin/settings"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN']}>
                    <AdminSettingsPage />
                  </ProtectedRoute>
                }
              />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </LanguageProvider>
  );
}
