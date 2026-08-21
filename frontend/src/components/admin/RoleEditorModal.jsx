import React, { useState, useEffect } from 'react';
import { 
  X, 
  ShieldCheck, 
  Check, 
  AlertCircle, 
  Lock, 
  Sparkles, 
  Info,
  UtensilsCrossed,
  Navigation,
  TrendingUp,
  Cpu,
  ClipboardCheck,
  CalendarClock,
  GraduationCap,
  PhoneCall,
  Network,
  Users,
  FolderOpen,
  Calendar,
  Server,
  Headphones,
  UserCog,
  Sliders,
  Smile
} from 'lucide-react';
import { api } from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';

export function RoleEditorModal({ isOpen, onClose, role, onSaveSuccess }) {
  const { t } = useLanguage();

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [permissions, setPermissions] = useState({});
  const [catalog, setCatalog] = useState({ levels: [], modules: [] });
  const [loadingCatalog, setLoadingCatalog] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const isSystemRole = role?.is_system_role || false;
  const isEditing = Boolean(role?.id);

  // Icon mapping
  const renderModuleIcon = (iconName) => {
    switch (iconName) {
      case 'UtensilsCrossed': return <UtensilsCrossed className="w-4 h-4" />;
      case 'Navigation': return <Navigation className="w-4 h-4" />;
      case 'TrendingUp': return <TrendingUp className="w-4 h-4" />;
      case 'Cpu': return <Cpu className="w-4 h-4" />;
      case 'ClipboardCheck': return <ClipboardCheck className="w-4 h-4" />;
      case 'CalendarClock': return <CalendarClock className="w-4 h-4" />;
      case 'GraduationCap': return <GraduationCap className="w-4 h-4" />;
      case 'PhoneCall': return <PhoneCall className="w-4 h-4" />;
      case 'Network': return <Network className="w-4 h-4" />;
      case 'Users': return <Users className="w-4 h-4" />;
      case 'FolderOpen': return <FolderOpen className="w-4 h-4" />;
      case 'Calendar': return <Calendar className="w-4 h-4" />;
      case 'Server': return <Server className="w-4 h-4" />;
      case 'Headphones': return <Headphones className="w-4 h-4" />;
      case 'UserCog': return <UserCog className="w-4 h-4" />;
      case 'ShieldCheck': return <ShieldCheck className="w-4 h-4" />;
      case 'Sliders': return <Sliders className="w-4 h-4" />;
      case 'Smile': return <Smile className="w-4 h-4" />;
      default: return <Sparkles className="w-4 h-4" />;
    }
  };

  useEffect(() => {
    async function loadCatalog() {
      try {
        setLoadingCatalog(true);
        const data = await api.getPermissionsCatalog();
        setCatalog(data);
      } catch (err) {
        console.error('Error loading permissions catalog:', err);
      } finally {
        setLoadingCatalog(false);
      }
    }
    if (isOpen) {
      loadCatalog();
    }
  }, [isOpen]);

  useEffect(() => {
    if (role) {
      setName(role.name || '');
      setSlug(role.slug || '');
      setDescription(role.description || '');
      setPermissions(role.permissions ? { ...role.permissions } : {});
    } else {
      setName('');
      setSlug('');
      setDescription('');
      setPermissions({});
    }
    setError(null);
  }, [role, isOpen]);

  // Auto-slugify role name when creating new role
  const handleNameChange = (val) => {
    setName(val);
    if (!isEditing) {
      const generatedSlug = val
        .toUpperCase()
        .replace(/Ä/g, 'AE')
        .replace(/Ö/g, 'OE')
        .replace(/Ü/g, 'UE')
        .replace(/ß/g, 'SS')
        .replace(/[^A-Z0-9]/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_|_$/g, '');
      setSlug(generatedSlug);
    }
  };

  const handleSetPermission = (modKey, levelKey) => {
    setPermissions((prev) => ({
      ...prev,
      [modKey]: levelKey,
    }));
  };

  const handleBulkSet = (levelKey) => {
    const updated = {};
    catalog.modules.forEach((mod) => {
      // If setting admin on admin-only modules for non-system roles, allow full config
      updated[mod.key] = levelKey;
    });
    setPermissions(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Bitte geben Sie einen Rollennamen ein.');
      return;
    }
    if (!slug.trim()) {
      setError('Bitte geben Sie einen eindeutigen Rollenschlüssel (Slug) ein.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      if (isEditing) {
        await api.updateRole(role.id, {
          name: name.trim(),
          description: description.trim() || null,
          permissions,
        });
      } else {
        await api.createRole({
          name: name.trim(),
          slug: slug.trim().toUpperCase(),
          description: description.trim() || null,
          permissions,
        });
      }

      onSaveSuccess();
      onClose();
    } catch (err) {
      console.error('Error saving role:', err);
      setError(err.message || 'Fehler beim Speichern der Rolle.');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  // Group modules by category
  const categories = Array.from(new Set(catalog.modules.map((m) => m.category)));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden transform transition-all my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300 shadow-sm">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-base">
                  {isEditing ? t('admin_roles.modal_edit_title') : t('admin_roles.modal_create_title')}
                </h3>
                {isSystemRole && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30 flex items-center space-x-1">
                    <Lock className="w-3 h-3" />
                    <span>Systemrolle</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                {t('admin_roles.modal_subtitle')}
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

        {/* Modal Form Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6">
          {error && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs font-semibold flex items-center space-x-2.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Role Meta Inputs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                {t('admin_roles.name_label')} <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder={t('admin_roles.name_placeholder')}
                className="w-full px-4 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                {t('admin_roles.slug_label')} <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                disabled={isSystemRole || isEditing}
                value={slug}
                onChange={(e) => setSlug(e.target.value.toUpperCase())}
                placeholder={t('admin_roles.slug_placeholder')}
                className="w-full px-4 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-mono font-bold text-indigo-700 disabled:opacity-75 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              {t('admin_roles.desc_label')}
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('admin_roles.desc_placeholder')}
              className="w-full px-4 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
            />
          </div>

          {/* Permissions Matrix */}
          <div className="pt-4 border-t border-slate-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h4 className="text-sm font-bold text-slate-900">
                  {t('admin_roles.matrix_title')}
                </h4>
                <p className="text-xs text-slate-500">
                  Wählen Sie für jedes Modul die individuelle Berechtigungsstufe dieser Rolle aus.
                </p>
              </div>

              {/* Bulk Quick Actions */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                <button
                  type="button"
                  onClick={() => handleBulkSet('admin')}
                  className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors whitespace-nowrap"
                >
                  ⚡ {t('admin_roles.set_all_admin')}
                </button>
                <button
                  type="button"
                  onClick={() => handleBulkSet('read')}
                  className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors whitespace-nowrap"
                >
                  👁️ {t('admin_roles.set_all_read')}
                </button>
                <button
                  type="button"
                  onClick={() => handleBulkSet('none')}
                  className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors whitespace-nowrap"
                >
                  ❌ {t('admin_roles.set_all_none')}
                </button>
              </div>
            </div>

            {loadingCatalog ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                Lade Berechtigungskatalog...
              </div>
            ) : (
              <div className="space-y-6">
                {categories.map((cat) => {
                  const catModules = catalog.modules.filter((m) => m.category === cat);
                  return (
                    <div key={cat} className="bg-slate-50/60 rounded-2xl p-4 border border-slate-200/70">
                      <div className="text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-3 flex items-center space-x-1.5">
                        <span className="w-2 h-2 rounded-full bg-indigo-500 inline-block"></span>
                        <span>{cat}</span>
                      </div>

                      <div className="space-y-2.5">
                        {catModules.map((mod) => {
                          const currentLevel = permissions[mod.key] || 'none';

                          return (
                            <div
                              key={mod.key}
                              className="bg-white p-3.5 rounded-xl border border-slate-200/80 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-2xs hover:border-slate-300 transition-all"
                            >
                              <div className="flex items-start space-x-3 min-w-0">
                                <div className="p-2 rounded-xl bg-slate-100 text-slate-700 shrink-0 mt-0.5">
                                  {renderModuleIcon(mod.icon)}
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center space-x-2">
                                    <span className="font-bold text-xs sm:text-sm text-slate-900">
                                      {mod.label}
                                    </span>
                                    <span className="font-mono text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                                      {mod.key}
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-slate-500 truncate mt-0.5">
                                    {mod.description}
                                  </p>
                                </div>
                              </div>

                              {/* Access Level Selector */}
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 shrink-0">
                                {[
                                  { key: 'none', label: 'Kein Zugriff', icon: '❌', activeClass: 'bg-rose-50 border-rose-300 text-rose-700' },
                                  { key: 'read', label: 'Nur Lesen', icon: '👁️', activeClass: 'bg-emerald-50 border-emerald-300 text-emerald-700' },
                                  { key: 'read_write', label: 'Bearbeiten', icon: '✏️', activeClass: 'bg-blue-50 border-blue-300 text-blue-700' },
                                  { key: 'admin', label: 'Vollzugriff', icon: '⚡', activeClass: 'bg-purple-50 border-purple-300 text-purple-700 font-bold' },
                                ].map((lvl) => {
                                  const isSelected = currentLevel === lvl.key;
                                  return (
                                    <button
                                      type="button"
                                      key={lvl.key}
                                      onClick={() => handleSetPermission(mod.key, lvl.key)}
                                      className={`px-2.5 py-1.5 rounded-lg text-xs border transition-all flex items-center justify-center space-x-1 font-medium ${
                                        isSelected
                                          ? `${lvl.activeClass} shadow-2xs ring-1 ring-offset-1`
                                          : 'bg-slate-50/80 border-slate-200/80 text-slate-500 hover:bg-slate-100'
                                      }`}
                                    >
                                      <span>{lvl.icon}</span>
                                      <span className="truncate">{lvl.label}</span>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Action Footer */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-xs sm:text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              {t('admin_roles.cancel_btn')}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 active:from-indigo-800 active:to-indigo-900 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-indigo-600/20 transition-all disabled:opacity-50 flex items-center space-x-2"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>{t('admin_roles.saving_btn')}</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>{t('admin_roles.save_btn')}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
