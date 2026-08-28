import React, { useState, useEffect, useRef } from 'react';
import { 
  Users, 
  UserPlus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Shield, 
  CheckCircle2, 
  XCircle, 
  RefreshCw, 
  AlertCircle, 
  Building, 
  Phone, 
  MapPin, 
  UserCheck, 
  Sparkles,
  SlidersHorizontal,
  Upload,
  Download,
  FileSpreadsheet,
  FileCode,
  ChevronDown
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { UserAvatar } from '../components/common/UserAvatar';
import { UserModal } from '../components/admin/UserModal';
import { DeleteConfirmModal } from '../components/admin/DeleteConfirmModal';
import { PermissionsModal } from '../components/admin/PermissionsModal';
import { UserImportModal } from '../components/admin/UserImportModal';

export function AdminUsersPage() {
  const { user: currentUser, updateUser, refreshUser } = useAuth();
  const { t } = useLanguage();

  const [users, setUsers] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('ALL');
  const [selectedRole, setSelectedRole] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Import / Export state
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [exportDropdownOpen, setExportDropdownOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const exportDropdownRef = useRef(null);

  // Permissions Matrix Modal
  const [isPermissionsModalOpen, setIsPermissionsModalOpen] = useState(false);
  const [userForPermissions, setUserForPermissions] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Close export dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (exportDropdownRef.current && !exportDropdownRef.current.contains(event.target)) {
        setExportDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleExport = async (format) => {
    try {
      setExporting(true);
      setExportDropdownOpen(false);
      await api.exportAdminUsers(format, {
        query: searchQuery,
        department: selectedDepartment,
        role: selectedRole,
        is_active: selectedStatus === 'ALL' ? undefined : selectedStatus,
      });
      showToast(format === 'json' ? 'Benutzerdaten als JSON exportiert' : 'Benutzerdaten als Excel (CSV) exportiert');
    } catch (err) {
      alert(err.message || 'Fehler beim Exportieren');
    } finally {
      setExporting(false);
    }
  };

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {
        query: searchQuery,
        department: selectedDepartment,
        role: selectedRole,
        is_active: selectedStatus === 'ALL' ? undefined : selectedStatus === 'ACTIVE',
        limit: 100,
      };

      const response = await api.getAdminUsers(params);
      setUsers(response.items || []);
      setTotalCount(response.total || 0);
    } catch (err) {
      console.error('Failed to load admin users:', err);
      setError(err.message || 'Fehler beim Laden der Benutzerliste');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadUsers();
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery, selectedDepartment, selectedRole, selectedStatus]);

  // Handle Create or Update
  const handleSaveUser = async (formData, userId) => {
    let saved;
    if (userId) {
      saved = await api.updateAdminUser(userId, formData);
      showToast(t('admin_users.toast_updated'));
      if (currentUser && userId === currentUser.id) {
        await refreshUser();
      }
    } else {
      saved = await api.createAdminUser(formData);
      showToast(t('admin_users.toast_created'));
    }
    await loadUsers();
    return saved;
  };

  // Handle Delete
  const handleConfirmDelete = async (userId) => {
    try {
      setDeleteLoading(true);
      await api.deleteAdminUser(userId);
      setIsDeleteModalOpen(false);
      setUserToDelete(null);
      showToast(t('admin_users.toast_deleted'));
      await loadUsers();
    } catch (err) {
      alert(err.message || 'Fehler beim Löschen des Benutzers');
    } finally {
      setDeleteLoading(false);
    }
  };

  const openCreateModal = () => {
    setUserToEdit(null);
    setIsModalOpen(true);
  };

  const openEditModal = (userItem) => {
    setUserToEdit(userItem);
    setIsModalOpen(true);
  };

  const openDeleteDialog = (userItem) => {
    if (userItem.id === currentUser?.id) {
      alert(t('admin_users.self_delete_forbidden'));
      return;
    }
    setUserToDelete(userItem);
    setIsDeleteModalOpen(true);
  };

  // Role Badge Helper
  const getRoleBadge = (role, customRoleName) => {
    switch (role) {
      case 'ADMIN':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
            <Shield className="w-3 h-3 mr-1 text-purple-600" />
            SuperAdmin
          </span>
        );
      case 'MANAGEMENT':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-extrabold bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs">
            <Shield className="w-3 h-3 mr-1 text-amber-600" />
            Geschäftsführung
          </span>
        );
      case 'IT_ADMIN':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-bold bg-sky-100 text-sky-800 border border-sky-200">
            <Shield className="w-3 h-3 mr-1 text-sky-600" />
            IT-Administration
          </span>
        );
      case 'TECHNIK':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-bold bg-cyan-100 text-cyan-800 border border-cyan-200">
            Technik & Statik
          </span>
        );
      case 'SALES':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
            Vertriebsabteilung
          </span>
        );
      case 'PRODUKTION':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-bold bg-orange-100 text-orange-800 border border-orange-200">
            Produktion & Planung
          </span>
        );
      case 'ABWICKLUNG':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-bold bg-violet-100 text-violet-800 border border-violet-200">
            Auftragsabwicklung
          </span>
        );
      case 'ACCOUNTING':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            Finanzbuchhaltung
          </span>
        );
      case 'CONTROLLING_QS':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-bold bg-teal-100 text-teal-800 border border-teal-200">
            Qualitätssicherung (QS)
          </span>
        );
      case 'RECEPTION':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-bold bg-pink-100 text-pink-800 border border-pink-200">
            Empfang & Rezeption
          </span>
        );
      case 'BUSINESS_DEV':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
            Geschäftsentwicklung
          </span>
        );
      case 'HR_MANAGER':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
            <Users className="w-3 h-3 mr-1 text-rose-600" />
            Personalwesen (HR)
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
            {customRoleName || 'Mitarbeiter'}
          </span>
        );
    }
  };

  // Stats
  const activeCount = users.filter((u) => u.is_active).length;
  const adminCount = users.filter((u) => u.role === 'ADMIN').length;

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center space-x-2 border border-slate-700 animate-fade-in text-xs font-semibold">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 space-y-1.5">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-bold uppercase tracking-wider">
            <Shield className="w-3.5 h-3.5 text-indigo-300" />
            <span>SuperAdmin Console</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-heading">
            {t('admin_users.title')}
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
            {t('admin_users.subtitle')}
          </p>
        </div>

        <div className="relative z-10 flex flex-wrap items-center gap-2.5">
          {/* Import Button */}
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="flex items-center space-x-1.5 px-4 py-2.5 bg-white/10 hover:bg-white/20 active:bg-white/30 text-white text-xs sm:text-sm font-bold rounded-2xl border border-white/20 backdrop-blur-md transition-all hover:scale-[1.02]"
            title="Mitarbeiter per CSV/JSON importieren"
          >
            <Upload className="w-4 h-4 text-indigo-300" />
            <span>{t('admin_users.import_users_btn')}</span>
          </button>

          {/* Export Dropdown */}
          <div className="relative" ref={exportDropdownRef}>
            <button
              onClick={() => setExportDropdownOpen(!exportDropdownOpen)}
              disabled={exporting}
              className="flex items-center space-x-1.5 px-4 py-2.5 bg-white/10 hover:bg-white/20 active:bg-white/30 text-white text-xs sm:text-sm font-bold rounded-2xl border border-white/20 backdrop-blur-md transition-all hover:scale-[1.02] disabled:opacity-50"
            >
              {exporting ? (
                <RefreshCw className="w-4 h-4 text-indigo-300 animate-spin" />
              ) : (
                <Download className="w-4 h-4 text-indigo-300" />
              )}
              <span>{exporting ? 'Wird exportiert...' : t('admin_users.export_users_btn')}</span>
              <ChevronDown className={`w-3.5 h-3.5 text-indigo-300 transition-transform ${exportDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {exportDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-slate-100 py-1.5 z-30 text-slate-800 animate-fade-in">
                <button
                  type="button"
                  onClick={() => handleExport('csv')}
                  className="w-full px-4 py-2 text-left text-xs font-bold hover:bg-indigo-50 hover:text-indigo-600 flex items-center space-x-2 transition-colors"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  <span>{t('admin_users.export_csv')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleExport('json')}
                  className="w-full px-4 py-2 text-left text-xs font-bold hover:bg-indigo-50 hover:text-indigo-600 flex items-center space-x-2 transition-colors"
                >
                  <FileCode className="w-4 h-4 text-blue-600" />
                  <span>{t('admin_users.export_json')}</span>
                </button>
              </div>
            )}
          </div>

          {/* Add User Button */}
          <button
            onClick={openCreateModal}
            className="flex items-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 active:from-indigo-700 active:to-violet-700 text-white text-xs sm:text-sm font-bold rounded-2xl shadow-lg shadow-indigo-600/30 transition-all hover:scale-[1.02]"
          >
            <UserPlus className="w-4 h-4" />
            <span>{t('admin_users.add_user_btn')}</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-card flex items-center space-x-4">
          <div className="p-3 rounded-2xl bg-indigo-50 text-indigo-600">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              {t('admin_users.stat_total_users')}
            </p>
            <p className="text-2xl font-extrabold text-slate-900 font-mono mt-0.5">{totalCount}</p>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-card flex items-center space-x-4">
          <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              {t('admin_users.stat_active_users')}
            </p>
            <p className="text-2xl font-extrabold text-emerald-600 font-mono mt-0.5">{activeCount}</p>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-card flex items-center space-x-4">
          <div className="p-3 rounded-2xl bg-purple-50 text-purple-600">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              {t('admin_users.stat_admins')}
            </p>
            <p className="text-2xl font-extrabold text-purple-600 font-mono mt-0.5">{adminCount}</p>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-100 shadow-card space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('admin_users.search_placeholder')}
              className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium"
            />
          </div>

          {/* Department Filter */}
          <select
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
            className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium text-slate-700"
          >
            <option value="ALL">🏢 {t('admin_users.filter_all_departments')}</option>
            <option value="Geschäftsführung">Geschäftsführung</option>
            <option value="Geschäftsentwicklung">Geschäftsentwicklung</option>
            <option value="Rezeption">Rezeption & Empfang</option>
            <option value="Vertriebsabteilung">Vertriebsabteilung</option>
            <option value="Kontrolle">Kontrolle & QS</option>
            <option value="Technik">Technik & Statik</option>
            <option value="Buchhaltung">Buchhaltung & Finanzen</option>
            <option value="Produktion \ Planung">Produktion \ Planung</option>
            <option value="Abwicklung">Abwicklung & Disposition</option>
            <option value="IT \ SuperAdmin">IT \ SuperAdmin</option>
          </select>

          {/* Role Filter */}
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium text-slate-700"
          >
            <option value="ALL">🛡️ {t('admin_users.filter_all_roles')}</option>
            <option value="ADMIN">SuperAdmin</option>
            <option value="IT_ADMIN">IT-Administration</option>
            <option value="MANAGEMENT">Geschäftsführung</option>
            <option value="BUSINESS_DEV">Geschäftsentwicklung</option>
            <option value="RECEPTION">Rezeption</option>
            <option value="SALES">Vertrieb</option>
            <option value="CONTROLLING_QS">Kontrolle & QS</option>
            <option value="TECHNIK">Technik</option>
            <option value="ACCOUNTING">Buchhaltung</option>
            <option value="PRODUKTION">Produktion</option>
            <option value="ABWICKLUNG">Abwicklung</option>
            <option value="HR_MANAGER">HR-Manager</option>
            <option value="EMPLOYEE">Mitarbeiter</option>
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium text-slate-700"
          >
            <option value="ALL">⚡ {t('admin_users.filter_all_statuses')}</option>
            <option value="ACTIVE">{t('admin_users.status_active')}</option>
            <option value="INACTIVE">{t('admin_users.status_inactive')}</option>
          </select>
        </div>
      </div>

      {/* Users Data Table */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-card overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <RefreshCw className="w-6 h-6 animate-spin text-indigo-600 mx-auto" />
            <p className="text-xs font-semibold">Benutzerdaten werden geladen...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-rose-600 space-y-2">
            <AlertCircle className="w-8 h-8 mx-auto" />
            <p className="text-xs font-bold">{error}</p>
          </div>
        ) : users.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-3">
            <Users className="w-10 h-10 mx-auto text-slate-300" />
            <p className="text-xs font-semibold">Keine Benutzer mit den ausgewählten Kriterien gefunden.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-5">{t('admin_users.col_user')}</th>
                  <th className="py-3.5 px-4">{t('admin_users.col_role')}</th>
                  <th className="py-3.5 px-4">{t('admin_users.col_department')}</th>
                  <th className="py-3.5 px-4">{t('admin_users.col_contact')}</th>
                  <th className="py-3.5 px-4">{t('admin_users.col_supervisor')}</th>
                  <th className="py-3.5 px-4">{t('admin_users.col_status')}</th>
                  <th className="py-3.5 px-5 text-right">{t('admin_users.col_actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {users.map((userItem) => {
                  const isCurrent = userItem.id === currentUser?.id;

                  return (
                    <tr 
                      key={userItem.id} 
                      className={`hover:bg-slate-50/80 transition-colors ${isCurrent ? 'bg-indigo-50/20' : ''}`}
                    >
                      {/* User & Email */}
                      <td className="py-3.5 px-5">
                        <div className="flex items-center space-x-3">
                          <UserAvatar
                            src={userItem.avatar_url}
                            name={userItem.full_name}
                            size="sm"
                            className="shrink-0 shadow-xs"
                            rounded="rounded-full"
                          />
                          <div>
                            <div className="flex items-center space-x-1.5">
                              <p className="font-bold text-slate-900 leading-tight">{userItem.full_name}</p>
                              {isCurrent && (
                                <span className="px-1.5 py-0.5 text-[9px] font-extrabold rounded-md bg-indigo-100 text-indigo-700">
                                  Ich (Du)
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-400 font-mono mt-0.5">{userItem.email}</p>
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="py-3.5 px-4">
                        {getRoleBadge(userItem.role, userItem.custom_role_name)}
                      </td>

                      {/* Department & Position */}
                      <td className="py-3.5 px-4">
                        <p className="font-bold text-slate-800">{userItem.position}</p>
                        <p className="text-[11px] text-slate-400">{userItem.department}</p>
                      </td>

                      {/* Phone & Location */}
                      <td className="py-3.5 px-4">
                        <p className="font-semibold text-slate-700 font-mono">{userItem.phone || '–'}</p>
                        <p className="text-[11px] text-slate-400">{userItem.location}</p>
                      </td>

                      {/* Supervisor */}
                      <td className="py-3.5 px-4">
                        {userItem.supervisor_name ? (
                          <div>
                            <p className="font-semibold text-slate-800">{userItem.supervisor_name}</p>
                            <span className="text-[10px] text-slate-400">
                              {userItem.subordinates_count > 0 ? `${userItem.subordinates_count} Untergebene` : 'Mitarbeiter'}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">Root / C-Level</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        {userItem.is_active ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5"></span>
                            {t('admin_users.status_active')}
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-100 text-slate-500 border border-slate-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mr-1.5"></span>
                            {t('admin_users.status_inactive')}
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-5 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          <button
                            onClick={() => {
                              setUserForPermissions(userItem);
                              setIsPermissionsModalOpen(true);
                            }}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="Modul-Berechtigungen (Matrix) verwalten"
                          >
                            <SlidersHorizontal className="w-4 h-4 text-indigo-500" />
                          </button>

                          <button
                            onClick={() => openEditModal(userItem)}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="Bearbeiten"
                          >
                            <Edit className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => openDeleteDialog(userItem)}
                            disabled={isCurrent}
                            className={`p-1.5 rounded-lg transition-colors ${
                              isCurrent 
                                ? 'text-slate-300 cursor-not-allowed opacity-40' 
                                : 'text-slate-500 hover:text-rose-600 hover:bg-rose-50'
                            }`}
                            title={isCurrent ? t('admin_users.self_delete_forbidden') : 'Löschen'}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Permissions Matrix Modal */}
      <PermissionsModal
        isOpen={isPermissionsModalOpen}
        onClose={() => {
          setIsPermissionsModalOpen(false);
          setUserForPermissions(null);
        }}
        user={userForPermissions}
        onSaveSuccess={() => {
          showToast('Modul-Berechtigungen erfolgreich aktualisiert');
          loadUsers();
        }}
      />

      {/* Create / Edit Modal */}
      <UserModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveUser}
        userToEdit={userToEdit}
        availableSupervisors={users}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        userToDelete={userToDelete}
        loading={deleteLoading}
      />

      {/* User Import Modal */}
      <UserImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={() => {
          showToast(t('admin_users.toast_imported'));
          loadUsers();
        }}
      />
    </div>
  );
}
