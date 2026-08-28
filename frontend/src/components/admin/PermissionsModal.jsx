import React, { useState, useEffect } from 'react';
import * as LucideIcons from 'lucide-react';
import { 
  X, 
  ShieldCheck, 
  ShieldAlert, 
  Save, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  RefreshCw, 
  Check, 
  SlidersHorizontal 
} from 'lucide-react';
import { api } from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';

export function PermissionsModal({ isOpen, onClose, user, onSaveSuccess }) {
  const { t } = useLanguage();
  const { user: currentUser, refreshMenu, refreshUser } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [permissionData, setPermissionData] = useState(null);
  const [selectedModules, setSelectedModules] = useState([]);

  // Dynamic icon mapping helper
  const renderModuleIcon = (iconName) => {
    const IconComponent = LucideIcons[iconName] || LucideIcons.Sparkles;
    return <IconComponent className="w-5 h-5" />;
  };

  useEffect(() => {
    if (isOpen && user?.id) {
      loadPermissions();
    }
  }, [isOpen, user]);

  const loadPermissions = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getUserPermissions(user.id);
      setPermissionData(data);
      setSelectedModules(data.allowed_modules || []);
    } catch (err) {
      console.error('Failed to load user permissions:', err);
      setError(err.message || 'Fehler beim Laden der Berechtigungen');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !user) return null;

  const handleToggleModule = (key) => {
    setSelectedModules((prev) => {
      if (prev.includes(key)) {
        return prev.filter((m) => m !== key);
      } else {
        return [...prev, key];
      }
    });
  };

  const handleSelectAll = () => {
    if (permissionData?.available_modules) {
      setSelectedModules(permissionData.available_modules.map((m) => m.key));
    }
  };

  const handleDeselectAll = () => {
    setSelectedModules([]);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await api.updateUserPermissions(user.id, selectedModules);
      
      // If current user modified their own permissions, refresh active session and dynamic navigation
      if (currentUser && currentUser.id === user.id) {
        await refreshUser();
        await refreshMenu();
      }

      if (onSaveSuccess) {
        onSaveSuccess(selectedModules);
      }
      onClose();
    } catch (err) {
      console.error('Failed to save permissions:', err);
      setError(err.message || 'Fehler beim Speichern der Berechtigungen');
    } finally {
      setSaving(false);
    }
  };

  const isAdmin = user.role === 'ADMIN';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-2xl overflow-hidden my-8 transform transition-all">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-indigo-500/20 border border-indigo-400/30">
              <SlidersHorizontal className="w-5 h-5 text-indigo-300" />
            </div>
            <div>
              <h3 className="font-bold text-base font-heading">
                Berechtigungs-Matrix (Granular Access Control)
              </h3>
              <p className="text-xs text-indigo-200">
                {user.full_name} • {user.email} ({user.role})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold flex items-center space-x-2 animate-fade-in">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* SuperAdmin Notice */}
          {isAdmin && (
            <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-2xl flex items-center space-x-3 text-indigo-900 text-xs">
              <ShieldCheck className="w-5 h-5 text-indigo-600 shrink-0" />
              <div>
                <p className="font-bold">SuperAdmin Vollzugriff</p>
                <p className="text-[11px] text-indigo-700 mt-0.5">
                  Als SuperAdmin besitzt dieses Konto systemweit uneingeschränkten Zugriff auf sämtliche Module und Konfigurationen.
                </p>
              </div>
            </div>
          )}

          {/* Action Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-100">
            <span className="text-xs font-bold text-slate-700">
              Freigeschaltete Module: <span className="text-indigo-600 font-mono">{selectedModules.length}</span> von {permissionData?.available_modules?.length || 0}
            </span>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={handleSelectAll}
                className="px-3 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-colors"
              >
                Alle auswählen
              </button>
              <button
                type="button"
                onClick={handleDeselectAll}
                className="px-3 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-colors"
              >
                Alle abwählen
              </button>
            </div>
          </div>

          {/* Module List / Matrix */}
          {loading ? (
            <div className="py-12 text-center space-y-3">
              <RefreshCw className="w-6 h-6 animate-spin text-indigo-600 mx-auto" />
              <p className="text-xs text-slate-400">Berechtigungen werden geladen...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[380px] overflow-y-auto pr-1">
              {permissionData?.available_modules?.map((mod) => {
                const isSelected = selectedModules.includes(mod.key);

                return (
                  <div
                    key={mod.key}
                    onClick={() => handleToggleModule(mod.key)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start space-x-3 select-none ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-50/40 ring-1 ring-indigo-500/20'
                        : 'border-slate-200 bg-white hover:border-slate-300 opacity-75'
                    }`}
                  >
                    {/* Checkbox Switch */}
                    <div className="pt-0.5">
                      <div className={`w-5 h-5 rounded-lg flex items-center justify-center transition-colors ${
                        isSelected ? 'bg-indigo-600 text-white' : 'border border-slate-300 bg-white'
                      }`}>
                        {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                    </div>

                    {/* Icon & Title */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className={`p-1.5 rounded-lg ${
                          isSelected ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {renderModuleIcon(mod.icon)}
                        </span>
                        <div>
                          <p className="text-xs font-bold text-slate-900 leading-tight truncate">
                            {mod.label}
                          </p>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {mod.category}
                          </span>
                        </div>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-2 line-clamp-2 leading-relaxed">
                        {mod.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Modal Footer */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Abbrechen
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="flex items-center space-x-2 px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-xl shadow-md shadow-indigo-600/20 transition-all disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{saving ? 'Wird gespeichert...' : 'Berechtigungen speichern'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
