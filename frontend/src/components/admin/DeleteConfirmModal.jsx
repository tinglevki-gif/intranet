import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export function DeleteConfirmModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  userToDelete, 
  loading = false 
}) {
  const { t } = useLanguage();

  if (!isOpen || !userToDelete) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-md overflow-hidden transform transition-all">
        <div className="p-6 text-center">
          <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-6 h-6" />
          </div>

          <h3 className="text-lg font-bold text-slate-900 mb-2">
            {t('admin_users.delete_confirm_title')}
          </h3>

          <p className="text-xs text-slate-500 mb-4 leading-relaxed">
            {t('admin_users.delete_confirm_desc')}
          </p>

          {/* User info preview box */}
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 text-left flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
              {userToDelete.full_name?.charAt(0) || 'U'}
            </div>
            <div className="truncate">
              <p className="text-xs font-bold text-slate-900 truncate">{userToDelete.full_name}</p>
              <p className="text-[11px] text-slate-500 truncate">{userToDelete.email}</p>
              <p className="text-[10px] text-indigo-600 font-semibold">{userToDelete.position} • {userToDelete.department}</p>
            </div>
          </div>

          <div className="flex items-center justify-center space-x-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
            >
              {t('admin_users.cancel_btn')}
            </button>
            <button
              type="button"
              onClick={() => onConfirm(userToDelete.id)}
              disabled={loading}
              className="flex items-center space-x-1.5 px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 active:bg-rose-800 rounded-xl shadow-md shadow-rose-600/20 transition-all disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{loading ? 'Wird gelöscht...' : t('admin_users.delete_btn')}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
