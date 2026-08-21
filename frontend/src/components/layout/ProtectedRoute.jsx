import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { ShieldAlert, Lock, ArrowLeft } from 'lucide-react';

export function ProtectedRoute({ children, allowedRoles, requiredModule }) {
  const { isAuthenticated, user, loading, hasModulePermission } = useAuth();
  const { t } = useLanguage();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-medium text-slate-300">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 1. Role-based check
  if (allowedRoles && allowedRoles.length > 0) {
    const hasRolePermission = user?.role === 'ADMIN' || allowedRoles.includes(user?.role);
    if (!hasRolePermission) {
      return (
        <div className="p-8 max-w-lg mx-auto text-center mt-12 bg-white rounded-3xl border border-rose-100 shadow-xl animate-fade-in">
          <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">{t('common.access_denied_title')}</h2>
          <p className="text-sm text-slate-600 mb-6">
            {t('common.access_denied_desc')} ({user?.role})
          </p>
          <a
            href="/"
            className="inline-flex items-center space-x-2 px-4 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors shadow-md shadow-indigo-600/20"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{t('common.back_to_dashboard')}</span>
          </a>
        </div>
      );
    }
  }

  // 2. Granular Module Permission check
  if (requiredModule) {
    const hasModPerm = hasModulePermission(requiredModule);
    if (!hasModPerm) {
      return (
        <div className="p-8 max-w-lg mx-auto text-center mt-12 bg-white rounded-3xl border border-amber-100 shadow-xl animate-fade-in">
          <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8" />
          </div>
          <span className="px-3 py-1 rounded-full text-[11px] font-extrabold bg-amber-50 text-amber-800 border border-amber-200 uppercase tracking-wider mb-2 inline-block">
            HTTP 403 • Modul gesperrt
          </span>
          <h2 className="text-xl font-extrabold text-slate-900 mb-2">Zugriff auf dieses Modul eingeschränkt</h2>
          <p className="text-xs text-slate-600 mb-6 leading-relaxed">
            Ihr Benutzerkonto besitzt derzeit keine Freigabe für das Modul <strong className="font-mono text-slate-900">"{requiredModule}"</strong>. 
            Bitte wenden Sie sich an Ihren <strong>SuperAdmin</strong>, um die Berechtigung freizuschalten.
          </p>
          <a
            href="/"
            className="inline-flex items-center space-x-2 px-4 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors shadow-md shadow-indigo-600/20"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{t('common.back_to_dashboard')}</span>
          </a>
        </div>
      );
    }
  }

  return children;
}
