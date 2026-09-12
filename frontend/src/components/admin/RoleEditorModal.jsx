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
  Smile,
  Megaphone,
  Wifi,
  Search,
  Mail,
  Briefcase,
  ExternalLink
} from 'lucide-react';
import { api, getAvatarUrl } from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';
import { useModalClose } from '../../hooks/useModalClose';

const DEFAULT_FALLBACK_MODULES = [
  { key: 'announcements', label: 'Mitteilungen & News', category: 'Hauptbereich', icon: 'Megaphone', description: 'Unternehmensbekanntmachungen, News-Feed und Eilmeldungen.' },
  { key: 'phone-directory', label: 'Telefonverzeichnis', category: 'Hauptbereich', icon: 'PhoneCall', description: 'Interne Durchwahlen, Mobilnummern und Schnellkontakte.' },
  { key: 'org-chart', label: 'Organigramm & Hierarchie', category: 'Hauptbereich', icon: 'Network', description: 'Unternehmenshierarchie und Abteilungsstruktur.' },
  { key: 'directory', label: 'Team- & Mitarbeiterverzeichnis', category: 'Hauptbereich', icon: 'Users', description: 'Kollegenübersicht, Standorte und Abteilungsfilter.' },
  { key: 'kantine', label: 'Kantine (Speiseplan & Bestellung)', category: 'Hauptbereich', icon: 'UtensilsCrossed', description: 'Wochenspeiseplan, Essensvorbestellungen und Nährwertangaben.' },
  { key: 'gps', label: 'GPS (Fahrzeugortung & Flotte)', category: 'Hauptbereich', icon: 'Navigation', description: 'Live-Flottenverfolgung, Routen und Baustellenanlieferungen.' },
  { key: 'vertrieb', label: 'Vertrieb & Kalkulation', category: 'Hauptbereich', icon: 'TrendingUp', description: 'Vertriebs-Dashboard, Kundenangebote und CRM-Kennzahlen.' },
  { key: 'technik', label: 'Technik & Instandhaltung', category: 'Hauptbereich', icon: 'Cpu', description: 'Geräteverwaltung, Maschinen-Wartungsintervalle und CAD-Systeme.' },
  { key: 'abwicklung', label: 'Auftragsabwicklung & QS', category: 'Hauptbereich', icon: 'ClipboardCheck', description: 'Fertigungsprozess, Statik-Freigaben und Beton-Druckprüfungen.' },
  { key: 'planung', label: 'Ressourcen- & Projektplanung', category: 'Hauptbereich', icon: 'CalendarClock', description: 'Kapazitätsplanung, Schichtpläne und Baustellen-Terminierung.' },
  { key: 'schulungen', label: 'Schulungen & KI-Wissensassistent', category: 'Hauptbereich', icon: 'GraduationCap', description: 'Benutzerhandbücher, Sicherheitsunterweisungen und RAG-Chatbot.' },
  { key: 'wlan', label: 'WLAN für Mitarbeiter', category: 'Hauptbereich', icon: 'Wifi', description: 'Zugangsdaten und QR-Code für das Mitarbeiter-WLAN.' },
  
  { key: 'documents', label: 'Dokumentenablage & KI-Suche', category: 'Arbeitsbereich', icon: 'FolderOpen', description: 'Zentraler Speicher für Verträge, Richtlinien und semantische KI-Suche.' },
  { key: 'calendar', label: 'Unternehmensweiter Kalender', category: 'Arbeitsbereich', icon: 'Calendar', description: 'Terminplanung, Firmen-Events, Feiertage und iCal-Abonnement.' },
  
  { key: 'hr-requests', label: 'Anträge & Urlaubsverwaltung', category: 'Personal & HR', icon: 'ClipboardCheck', description: 'Urlaubsanträge, Gleitzeitausgleich und Krankmeldungen.' },
  { key: 'performance', label: 'Feedback & Mitarbeiterklima', category: 'Personal & HR', icon: 'Smile', description: 'Mitarbeiterbefragungen, Puls-Checks und Leistungsfeedback.' },
  
  { key: 'it-management', label: 'IT-Infrastruktur & Sicherheit', category: 'IT & Systeme', icon: 'Server', description: 'Serverstatus, VPN-Tunnel, Firewall und Lizenzverwaltung.' },
  { key: 'it-helpdesk', label: 'IT-Helpdesk & Support-Tickets', category: 'IT & Systeme', icon: 'Headphones', description: 'Ticketerstellung, Störungsmeldungen und Service Level Agreements.' },
  
  { key: 'admin-users', label: 'Benutzerverwaltung (CRUD & Profile)', category: 'Administration', icon: 'UserCog', description: 'Mitarbeiter anlegen, Rollen zuweisen, Passwörter & Avatare verwalten.' },
  { key: 'admin-roles', label: 'Rollen & Berechtigungs-Matrix (RBAC)', category: 'Administration', icon: 'ShieldCheck', description: 'Rollen erstellen, Rechte pro Modul konfigurieren und Berechtigungen steuern.' },
  { key: 'admin-settings', label: 'Systemkonfiguration & Audit-Logs', category: 'Administration', icon: 'Sliders', description: 'Globale Intranet-Parameter, Branding und Sicherheitsaudits.' }
];

export function RoleEditorModal({ isOpen, onClose, role, onSaveSuccess }) {
  const { t } = useLanguage();
  useModalClose(isOpen, onClose);

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [permissions, setPermissions] = useState({});
  const [catalog, setCatalog] = useState({ levels: [], modules: [] });
  const [loadingCatalog, setLoadingCatalog] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('PERMISSIONS'); // 'PERMISSIONS' | 'USERS'
  const [userSearch, setUserSearch] = useState('');

  const isSystemRole = role?.is_system_role || false;
  const isEditing = Boolean(role?.id);
  const assignedUsers = role?.assigned_users || [];

  const filteredAssignedUsers = assignedUsers.filter((u) => {
    if (!userSearch.trim()) return true;
    const q = userSearch.toLowerCase().trim();
    return (
      u.full_name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.department?.toLowerCase().includes(q) ||
      u.position?.toLowerCase().includes(q)
    );
  });

  // Icon mapping
  const renderModuleIcon = (iconName) => {
    switch (iconName) {
      case 'Megaphone': return <Megaphone className="w-4 h-4" />;
      case 'Wifi': return <Wifi className="w-4 h-4" />;
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
        if (data && data.modules) {
          setCatalog(data);
        }
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
    setActiveTab('PERMISSIONS');
    setUserSearch('');
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

  const activeModules = catalog?.modules?.length > 0 ? catalog.modules : DEFAULT_FALLBACK_MODULES;

  const handleSetPermission = (modKey, levelKey) => {
    setPermissions((prev) => ({
      ...prev,
      [modKey]: levelKey,
    }));
  };

  const handleBulkSet = (levelKey) => {
    const updated = {};
    activeModules.forEach((mod) => {
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
  const categories = Array.from(new Set(activeModules.map((m) => m.category)));

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in overflow-y-auto"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden transform transition-all my-8"
        onClick={(e) => e.stopPropagation()}
      >
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

        {/* Navigation Tabs */}
        <div className="flex items-center space-x-2 px-6 pt-4 border-b border-slate-100 bg-slate-50/50 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('PERMISSIONS')}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-t-2xl text-xs font-bold transition-all border-b-2 ${
              activeTab === 'PERMISSIONS'
                ? 'bg-white text-indigo-600 border-indigo-600 shadow-2xs'
                : 'text-slate-500 hover:text-slate-800 border-transparent hover:bg-slate-100'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Berechtigungs-Matrix (21 Module)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('USERS')}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-t-2xl text-xs font-bold transition-all border-b-2 ${
              activeTab === 'USERS'
                ? 'bg-white text-indigo-600 border-indigo-600 shadow-2xs'
                : 'text-slate-500 hover:text-slate-800 border-transparent hover:bg-slate-100'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Zugewiesene Mitarbeiter ({assignedUsers.length})</span>
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

          {/* TAB 1: PERMISSIONS MATRIX */}
          {activeTab === 'PERMISSIONS' && (
            <div className="pt-4 border-t border-slate-100 animate-fade-in">
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

              <div className="space-y-6">
                {categories.map((cat) => {
                  const catModules = activeModules.filter((m) => m.category === cat);
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
            </div>
          )}

          {/* TAB 2: ASSIGNED EMPLOYEES */}
          {activeTab === 'USERS' && (
            <div className="pt-4 border-t border-slate-100 space-y-4 animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                    <span>Zugewiesene Mitarbeiter</span>
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-bold bg-indigo-100 text-indigo-700">
                      {assignedUsers.length} {assignedUsers.length === 1 ? 'Mitarbeiter' : 'Mitarbeiter'}
                    </span>
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Alle Mitarbeiter, die aktuell dieser Rolle zugewiesen sind.
                  </p>
                </div>

                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="text"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    placeholder="Mitarbeiter suchen..."
                    className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              </div>

              {filteredAssignedUsers.length === 0 ? (
                <div className="py-12 text-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 p-6 space-y-3">
                  <Users className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="text-xs font-semibold text-slate-500">
                    {assignedUsers.length === 0
                      ? 'Derzeit sind dieser Rolle keine Mitarbeiter zugewiesen.'
                      : 'Keine passenden Mitarbeiter für die Suche gefunden.'}
                  </p>
                  {assignedUsers.length === 0 && (
                    <a
                      href="/admin/users"
                      className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-xl text-xs font-bold transition-colors"
                    >
                      <span>Mitarbeiter in der Benutzerverwaltung zuweisen</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[380px] overflow-y-auto pr-1">
                  {filteredAssignedUsers.map((u) => (
                    <div
                      key={u.id}
                      className="p-3.5 bg-white rounded-2xl border border-slate-200/80 shadow-2xs hover:border-indigo-300 transition-all flex items-center space-x-3.5"
                    >
                      {/* Avatar */}
                      {u.avatar_url ? (
                        <img
                          src={getAvatarUrl(u.avatar_url)}
                          alt={u.full_name}
                          className="w-10 h-10 rounded-xl object-cover border border-slate-200 shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
                          {u.full_name
                            ? u.full_name
                                .split(' ')
                                .map((n) => n[0])
                                .join('')
                                .toUpperCase()
                                .slice(0, 2)
                            : 'U'}
                        </div>
                      )}

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-bold text-xs text-slate-900 truncate">
                            {u.full_name}
                          </span>
                          <span
                            className={`w-2 h-2 rounded-full shrink-0 ${
                              u.is_active ? 'bg-emerald-500' : 'bg-slate-300'
                            }`}
                            title={u.is_active ? 'Konto aktiv' : 'Konto inaktiv'}
                          />
                        </div>

                        <p className="text-[11px] text-slate-500 truncate flex items-center space-x-1 mt-0.5">
                          <Briefcase className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>{u.position || 'Mitarbeiter'} • {u.department || 'General'}</span>
                        </p>

                        <p className="text-[10.5px] text-indigo-600 font-mono truncate mt-0.5 flex items-center space-x-1">
                          <Mail className="w-3 h-3 text-indigo-400 shrink-0" />
                          <span>{u.email}</span>
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

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

