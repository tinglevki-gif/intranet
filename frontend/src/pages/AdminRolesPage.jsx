import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Plus, 
  Search, 
  Lock, 
  Edit3, 
  Trash2, 
  Users, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles,
  Key,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import { api } from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { RoleEditorModal } from '../components/admin/RoleEditorModal';

export function AdminRolesPage() {
  const { t } = useLanguage();

  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  const loadRoles = async () => {
    try {
      setLoading(true);
      const data = await api.getRoles();
      setRoles(data || []);
    } catch (err) {
      console.error('Error loading roles:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRoles();
  }, []);

  const handleOpenCreateModal = () => {
    setSelectedRole(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (role) => {
    setSelectedRole(role);
    setIsModalOpen(true);
  };

  const handleDeleteRole = async (role) => {
    if (role.is_system_role) {
      alert(t('admin_roles.delete_system_role_error'));
      return;
    }

    if (role.users_count > 0) {
      alert(`Die Rolle "${role.name}" kann nicht gelöscht werden, da ihr noch ${role.users_count} Benutzer zugewiesen sind.`);
      return;
    }

    if (window.confirm(`Möchten Sie die Rolle "${role.name}" (#${role.slug}) wirklich unwiderruflich löschen?`)) {
      try {
        await api.deleteRole(role.id);
        showToast(`Rolle "${role.name}" wurde erfolgreich gelöscht.`);
        loadRoles();
      } catch (err) {
        alert(err.message || 'Fehler beim Löschen der Rolle');
      }
    }
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const filteredRoles = roles.filter((r) => {
    const query = search.toLowerCase().trim();
    if (!query) return true;
    return (
      r.name.toLowerCase().includes(query) ||
      r.slug.toLowerCase().includes(query) ||
      (r.description && r.description.toLowerCase().includes(query))
    );
  });

  const countActivePermissions = (perms) => {
    if (!perms) return 0;
    return Object.values(perms).filter((lvl) => lvl && lvl !== 'none').length;
  };

  return (
    <div className="space-y-8 pb-16 animate-fade-in">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 p-4 bg-slate-900 text-white rounded-2xl shadow-xl flex items-center space-x-3 border border-slate-800 animate-slide-up">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs sm:text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-card flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/20">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 font-heading">
              {t('admin_roles.title')}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              {t('admin_roles.subtitle')}
            </p>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={handleOpenCreateModal}
          className="flex items-center space-x-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-2xl text-xs sm:text-sm font-bold shadow-md shadow-indigo-600/20 transition-all shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>{t('admin_roles.create_btn')}</span>
        </button>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-100 shadow-card flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rollen nach Name, Schlüssel oder Beschreibung durchsuchen..."
            className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
          />
        </div>

        <div className="text-xs font-semibold text-slate-400 hidden sm:block">
          {filteredRoles.length} {filteredRoles.length === 1 ? 'Rolle konfiguriert' : 'Rollen konfiguriert'}
        </div>
      </div>

      {/* Roles Grid */}
      {loading ? (
        <div className="py-20 text-center text-slate-400 text-sm font-medium">
          Rollen & Berechtigungen werden geladen...
        </div>
      ) : filteredRoles.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-100 shadow-card">
          <Key className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-sm text-slate-500 font-medium">Keine passenden Rollen gefunden.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRoles.map((role) => {
            const activeCount = countActivePermissions(role.permissions);
            const totalModules = 19;

            return (
              <div
                key={role.id}
                className="bg-white rounded-3xl p-6 border border-slate-100 shadow-card hover:shadow-card-hover transition-all duration-300 transform hover:-translate-y-1 flex flex-col justify-between group"
              >
                <div>
                  {/* Top Badges */}
                  <div className="flex items-start justify-between gap-2">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border flex items-center space-x-1 ${
                        role.is_system_role
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}
                    >
                      {role.is_system_role && <Lock className="w-2.5 h-2.5" />}
                      <span>
                        {role.is_system_role
                          ? t('admin_roles.system_role_badge')
                          : t('admin_roles.custom_role_badge')}
                      </span>
                    </span>

                    <span className="font-mono text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-lg">
                      #{role.slug}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-lg font-bold text-slate-900 mt-3 group-hover:text-indigo-600 transition-colors">
                    {role.name}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed line-clamp-2 min-h-[32px]">
                    {role.description || 'Keine Beschreibung hinterlegt.'}
                  </p>

                  {/* Metrics & Permissions Summary */}
                  <div className="mt-4 pt-4 border-t border-slate-50 space-y-2.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400 font-medium flex items-center space-x-1.5">
                        <Users className="w-3.5 h-3.5" />
                        <span>{t('admin_roles.users_assigned')}</span>
                      </span>
                      <span className="font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-lg">
                        {role.users_count} {role.users_count === 1 ? 'Benutzer' : 'Benutzer'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400 font-medium">
                        {t('admin_roles.active_modules')}
                      </span>
                      <span className="font-bold text-indigo-600 bg-indigo-50/80 px-2 py-0.5 rounded-lg">
                        {activeCount} / {totalModules} aktiv
                      </span>
                    </div>

                    {/* Progress indicator */}
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          role.slug === 'ADMIN'
                            ? 'bg-purple-600'
                            : activeCount > 10
                            ? 'bg-indigo-600'
                            : 'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.min(100, Math.round((activeCount / totalModules) * 100))}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                {/* Actions Footer */}
                <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <button
                    onClick={() => handleOpenEditModal(role)}
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 font-bold text-xs transition-colors"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>{t('admin_roles.edit_btn')}</span>
                  </button>

                  <button
                    onClick={() => handleDeleteRole(role)}
                    disabled={role.is_system_role || role.users_count > 0}
                    title={
                      role.is_system_role
                        ? 'Systemrollen können nicht gelöscht werden'
                        : role.users_count > 0
                        ? 'Rolle ist noch Benutzern zugewiesen'
                        : 'Rolle löschen'
                    }
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-slate-400 disabled:cursor-not-allowed"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Role Editor Modal */}
      <RoleEditorModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        role={selectedRole}
        onSaveSuccess={() => {
          showToast(selectedRole ? 'Rolle erfolgreich aktualisiert.' : 'Neue Rolle erfolgreich erstellt.');
          loadRoles();
        }}
      />
    </div>
  );
}
