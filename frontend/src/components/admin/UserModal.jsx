import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import * as LucideIcons from 'lucide-react';
import { 
  X, 
  User, 
  Mail, 
  Shield, 
  Building, 
  Briefcase, 
  MapPin, 
  Phone, 
  Smartphone, 
  UserCheck, 
  Lock, 
  Save, 
  AlertCircle,
  Camera,
  Trash2,
  Upload,
  RefreshCw,
  UtensilsCrossed,
  SlidersHorizontal,
  Search,
  Check,
  Eye,
  EyeOff,
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import { api, getAvatarUrl } from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';

// Intranet modules list for module access control
const INTRANET_MODULES = [
  { key: 'announcements', label: 'Mitteilungen & News', category: 'Hauptbereich', icon: 'Megaphone', description: 'Unternehmensbekanntmachungen, News-Feed und Eilmeldungen.' },
  { key: 'phone-directory', label: 'Telefonverzeichnis', category: 'Hauptbereich', icon: 'PhoneCall', description: 'Durchwahlen, Mobilnummern und Kontaktschnellaktionen.' },
  { key: 'org-chart', label: 'Organigramm', category: 'Hauptbereich', icon: 'Network', description: 'Interaktive Unternehmenshierarchie und Baumstruktur.' },
  { key: 'directory', label: 'Teamverzeichnis', category: 'Hauptbereich', icon: 'Users', description: 'Mitarbeiterübersicht und Abteilungsfilter.' },
  { key: 'kantine', label: 'Kantine & Speiseplan', category: 'Hauptbereich', icon: 'UtensilsCrossed', description: 'Wochen-Speiseplan, Tagesgerichte und Essensvorbestellung.' },
  { key: 'gps', label: 'GPS & Flottenortung', category: 'Hauptbereich', icon: 'Navigation', description: 'Live-Telematik, Fahrzeugstatus und Routenüberwachung.' },
  { key: 'vertrieb', label: 'Vertrieb & Sales', category: 'Hauptbereich', icon: 'TrendingUp', description: 'Sales-Pipeline, Großprojekte und Vertriebsunterlagen.' },
  { key: 'technik', label: 'Technik & Geräte', category: 'Hauptbereich', icon: 'Cpu', description: 'Maschinen-Telemetrie, Wartungspläne und Support-Tickets.' },
  { key: 'abwicklung', label: 'Auftragsabwicklung', category: 'Hauptbereich', icon: 'ClipboardCheck', description: 'Auftragstracking von Statik-Freigabe bis Baustellenlogistik.' },
  { key: 'planung', label: 'Ressourcen & Planung', category: 'Hauptbereich', icon: 'CalendarClock', description: 'Kapazitätsauslastung der Fertigungslinien und Schichtpläne.' },
  { key: 'schulungen', label: 'Schulungen & Handbücher', category: 'Hauptbereich', icon: 'GraduationCap', description: 'Benutzerhandbücher, Videoanleitungen und interaktiver KI-Chatbot.' },
  { key: 'wlan', label: 'WLAN für Mitarbeiter', category: 'Hauptbereich', icon: 'Wifi', description: 'Zugangsdaten und QR-Code für Mitarbeiter-WLAN.' },
  { key: 'documents', label: 'Dokumentenablage & KI', category: 'Arbeitsbereich', icon: 'FolderOpen', description: 'Zentraler Dokumentenspeicher mit semantischer KI-Vektorsuche.' },
  { key: 'calendar', label: 'Unternehmenskalender', category: 'Arbeitsbereich', icon: 'Calendar', description: 'Terminverwaltung, Feiertage und iCal-Kalendersynchronisation.' },
  { key: 'tickets', label: 'IT-Helpdesk & Tickets', category: 'IT & Systeme', icon: 'Headphones', description: 'Störungsmeldungen, Supportanfragen und Ticketbearbeitung.' },
  { key: 'hr-requests', label: 'Urlaubs- & Abwesenheitsverwaltung', category: 'Personal & HR', icon: 'Clock', description: 'Urlaubsanträge, Zeitausgleich und Krankmeldungen.' },
  { key: 'performance', label: 'Mitarbeitergespräche & Performance', category: 'Personal & HR', icon: 'Award', description: 'Zielvereinbarungen (OKRs) und Mitarbeiter-Feedback.' },
  { key: 'it-management', label: 'IT-Infrastruktur & Sicherheit', category: 'IT & Systeme', icon: 'Server', description: 'Serverstatus, 2FA-Überwachung und Sicherheitsmanagement.' },
  { key: 'admin-users', label: 'Benutzerverwaltung', category: 'Administration', icon: 'UserCheck', description: 'Mitarbeiterkonten verwalten und Passwörter zurücksetzen.' },
  { key: 'admin-roles', label: 'Rollen & Berechtigungen', category: 'Administration', icon: 'SlidersHorizontal', description: 'Custom Roles (RBAC) und Rechtegruppen definieren.' },
  { key: 'admin-settings', label: 'System-Einstellungen', category: 'Administration', icon: 'Settings', description: 'Systemweite Parameter, Branding und Integrationen.' },
];

const ALL_MODULE_KEYS = INTRANET_MODULES.map((m) => m.key);

export function UserModal({ 
  isOpen, 
  onClose, 
  onSave, 
  userToEdit = null, 
  availableSupervisors = [] 
}) {
  const { t } = useLanguage();
  const isEditing = !!userToEdit;
  const fileInputRef = useRef(null);

  const [activeTab, setActiveTab] = useState('data'); // 'data' | 'modules'

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    full_name: '',
    email: '',
    role: 'EMPLOYEE',
    custom_role_id: null,
    department: 'Softwareentwicklung',
    position: 'Full Stack Entwickler',
    location: 'Tinglev HQ Brandenburg',
    phone: '',
    mobile: '',
    supervisor_id: '',
    avatar_url: '',
    password: '',
    is_active: true,
  });

  const [manageCanteen, setManageCanteen] = useState(false);
  const [supervisorIds, setSupervisorIds] = useState([]);
  const [departmentsList, setDepartmentsList] = useState([]);
  const [allowedModules, setAllowedModules] = useState(ALL_MODULE_KEYS);
  const [moduleSearch, setModuleSearch] = useState('');

  // Avatar file state
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarRemoved, setAvatarRemoved] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [availableRoles, setAvailableRoles] = useState([]);

  // Helper to render dynamic module icons
  const renderModuleIcon = (iconName) => {
    const IconComp = LucideIcons[iconName] || LucideIcons.Sparkles;
    return <IconComp className="w-4 h-4" />;
  };

  useEffect(() => {
    async function loadRoles() {
      try {
        const data = await api.getRoles();
        if (data && data.length > 0) {
          setAvailableRoles(data);
        }
      } catch (err) {
        console.error('Error fetching roles in UserModal:', err);
      }
    }
    if (isOpen) {
      loadRoles();
    }
  }, [isOpen]);

  useEffect(() => {
    if (userToEdit) {
      setFormData({
        first_name: userToEdit.first_name || '',
        last_name: userToEdit.last_name || '',
        full_name: userToEdit.full_name || '',
        email: userToEdit.email || '',
        role: userToEdit.role || 'EMPLOYEE',
        custom_role_id: userToEdit.custom_role_id || null,
        department: userToEdit.department || 'General',
        position: userToEdit.position || 'Mitarbeiter',
        location: userToEdit.location || 'Tinglev HQ Brandenburg',
        phone: userToEdit.phone || '',
        mobile: userToEdit.mobile || '',
        supervisor_id: userToEdit.supervisor_id ? String(userToEdit.supervisor_id) : '',
        avatar_url: userToEdit.avatar_url || '',
        password: '',
        is_active: userToEdit.is_active !== undefined ? userToEdit.is_active : true,
      });
      setAvatarPreview(getAvatarUrl(userToEdit.avatar_url));
      setManageCanteen(
        userToEdit.can_manage_canteen === true ||
        userToEdit.custom_permissions?.manage_canteen === true ||
        (Array.isArray(userToEdit.allowed_modules) && userToEdit.allowed_modules.includes('manage_canteen'))
      );

      // Allowed modules initialization
      if (Array.isArray(userToEdit.allowed_modules)) {
        setAllowedModules(userToEdit.allowed_modules);
      } else {
        setAllowedModules(ALL_MODULE_KEYS);
      }

      let sups = [];
      if (Array.isArray(userToEdit.supervisor_ids) && userToEdit.supervisor_ids.length > 0) {
        sups = userToEdit.supervisor_ids.map(Number);
      } else if (userToEdit.supervisor_id) {
        sups = [Number(userToEdit.supervisor_id)];
      }
      setSupervisorIds(sups);

      let depts = [];
      if (Array.isArray(userToEdit.departments) && userToEdit.departments.length > 0) {
        depts = userToEdit.departments.map(String);
      } else if (userToEdit.department) {
        depts = [String(userToEdit.department)];
      } else {
        depts = ['Geschäftsentwicklung'];
      }
      setDepartmentsList(depts);
    } else {
      setFormData({
        first_name: '',
        last_name: '',
        full_name: '',
        email: '',
        role: 'EMPLOYEE',
        custom_role_id: null,
        department: 'Softwareentwicklung',
        position: 'Entwickler',
        location: 'Tinglev HQ Brandenburg',
        phone: '',
        mobile: '',
        supervisor_id: '',
        avatar_url: '',
        password: '',
        is_active: true,
      });
      setAvatarPreview(null);
      setManageCanteen(false);
      setSupervisorIds([]);
      setDepartmentsList(['Softwareentwicklung']);
      setAllowedModules(ALL_MODULE_KEYS);
    }
    setAvatarFile(null);
    setAvatarRemoved(false);
    setError(null);
    setActiveTab('data');
    setModuleSearch('');
  }, [userToEdit, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => {
      const updated = {
        ...prev,
        [name]: type === 'checkbox' ? checked : value,
      };

      if (name === 'first_name' || name === 'last_name') {
        const fn = name === 'first_name' ? value : prev.first_name;
        const ln = name === 'last_name' ? value : prev.last_name;
        updated.full_name = `${fn || ''} ${ln || ''}`.trim();
      }

      return updated;
    });
  };

  const handleFileSelect = (file) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Bitte wählen Sie eine gültige Bilddatei (JPG, PNG, WebP oder GIF) aus.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Das Bild ist zu groß. Die maximale Dateigröße beträgt 5 MB.');
      return;
    }

    setError(null);
    setAvatarFile(file);
    setAvatarRemoved(false);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleFileInputChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleRemoveAvatar = () => {
    setAvatarFile(null);
    setAvatarPreview(null);
    setAvatarRemoved(true);
    setFormData((prev) => ({ ...prev, avatar_url: '' }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleAddSupervisor = (e) => {
    const val = parseInt(e.target.value, 10);
    if (val && !supervisorIds.includes(val)) {
      setSupervisorIds([...supervisorIds, val]);
    }
  };

  const handleRemoveSupervisor = (idToRemove) => {
    setSupervisorIds(supervisorIds.filter((id) => id !== idToRemove));
  };

  const handleAddDepartment = (deptName) => {
    if (!deptName) return;
    if (!departmentsList.includes(deptName)) {
      setDepartmentsList([...departmentsList, deptName]);
    }
  };

  const handleRemoveDepartment = (deptToRemove) => {
    if (departmentsList.length <= 1) return;
    setDepartmentsList(departmentsList.filter((d) => d !== deptToRemove));
  };

  // Module toggle handlers
  const handleToggleModule = (key) => {
    setAllowedModules((prev) => {
      if (prev.includes(key)) {
        return prev.filter((k) => k !== key);
      } else {
        return [...prev, key];
      }
    });
  };

  const handleSelectAllModules = () => {
    setAllowedModules(ALL_MODULE_KEYS);
  };

  const handleDeselectAllModules = () => {
    setAllowedModules([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!formData.email || !formData.email.includes('@')) {
      setError('Bitte geben Sie eine gültige geschäftliche E-Mail-Adresse ein.');
      return;
    }

    if (!isEditing && (!formData.password || formData.password.length < 4)) {
      setError('Das Initialpasswort muss mindestens 4 Zeichen lang sein.');
      return;
    }

    if (isEditing && formData.password && formData.password.length < 4) {
      setError('Das neue Passwort muss mindestens 4 Zeichen lang sein.');
      return;
    }

    try {
      setLoading(true);

      let finalAvatarUrl = formData.avatar_url;

      if (!isEditing && avatarFile) {
        const tempUpload = await api.uploadTempAvatar(avatarFile);
        finalAvatarUrl = tempUpload.avatar_url;
      }

      if (isEditing && avatarRemoved) {
        finalAvatarUrl = null;
      }

      // Sanitized integers and payload properties to avoid 422 errors
      const primarySupId = supervisorIds.length > 0 ? Number(supervisorIds[0]) : null;
      const cleanSupervisorIds = supervisorIds.map(Number).filter((id) => !isNaN(id) && id > 0);

      const payload = {
        first_name: formData.first_name?.trim() || '',
        last_name: formData.last_name?.trim() || '',
        full_name: formData.full_name?.trim() || '',
        email: formData.email?.trim().toLowerCase() || '',
        role: formData.role || 'EMPLOYEE',
        custom_role_id: formData.custom_role_id ? Number(formData.custom_role_id) : null,
        department: departmentsList[0] || formData.department || 'General',
        departments: departmentsList,
        position: formData.position?.trim() || 'Mitarbeiter',
        location: formData.location?.trim() || 'Tinglev HQ Brandenburg',
        phone: formData.phone?.trim() || null,
        mobile: formData.mobile?.trim() || null,
        avatar_url: finalAvatarUrl,
        supervisor_id: primarySupId,
        supervisor_ids: cleanSupervisorIds,
        allowed_modules: allowedModules,
        is_active: formData.is_active,
        custom_permissions: {
          ...(userToEdit?.custom_permissions || {}),
          manage_canteen: manageCanteen,
        },
      };

      if (formData.password && formData.password.trim()) {
        payload.password = formData.password.trim();
      }

      const savedUser = await onSave(payload, userToEdit ? userToEdit.id : null);

      if (isEditing && avatarFile && userToEdit?.id) {
        await api.uploadUserAvatar(userToEdit.id, avatarFile);
      }

      onClose();
    } catch (err) {
      console.error('Error saving user:', err);
      setError(err.message || 'Fehler beim Speichern des Benutzers');
    } finally {
      setLoading(false);
    }
  };

  const filteredSupervisors = availableSupervisors.filter(
    (s) => !userToEdit || s.id !== userToEdit.id
  );

  const filteredModules = INTRANET_MODULES.filter((m) => {
    if (!moduleSearch) return true;
    const q = moduleSearch.toLowerCase();
    return (
      m.label.toLowerCase().includes(q) ||
      m.category.toLowerCase().includes(q) ||
      m.key.toLowerCase().includes(q) ||
      m.description.toLowerCase().includes(q)
    );
  });

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-md animate-fade-in overflow-hidden">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-2xl sm:max-w-3xl max-h-[92vh] flex flex-col my-auto overflow-hidden z-[10000] transform transition-all">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white relative shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors focus:outline-none"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 shrink-0">
              <User className="w-5 h-5 text-indigo-300" />
            </div>
            <div>
              <h3 className="font-bold text-base font-heading">
                {isEditing ? t('admin_users.modal_edit_title') : t('admin_users.modal_create_title')}
              </h3>
              <p className="text-xs text-indigo-200">
                {isEditing ? `${formData.full_name} (#${userToEdit.id})` : 'Tiglev Elementfabrik Intranet'}
              </p>
            </div>
          </div>

          {/* Modal Header Tabs */}
          <div className="flex space-x-2 mt-4 pt-2 border-t border-white/10">
            <button
              type="button"
              onClick={() => setActiveTab('data')}
              className={`flex items-center space-x-2 px-4 py-1.5 text-xs font-bold rounded-xl transition-all ${
                activeTab === 'data'
                  ? 'bg-white text-indigo-950 shadow-md'
                  : 'text-indigo-200 hover:bg-white/10 hover:text-white'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Stammdaten & Profil</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('modules')}
              className={`flex items-center space-x-2 px-4 py-1.5 text-xs font-bold rounded-xl transition-all ${
                activeTab === 'modules'
                  ? 'bg-white text-indigo-950 shadow-md'
                  : 'text-indigo-200 hover:bg-white/10 hover:text-white'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>
                Aktive Module ({allowedModules.length}/{INTRANET_MODULES.length})
              </span>
            </button>
          </div>
        </div>

        {/* Modal Form Container */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {/* Scrollable Form Body */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 max-h-[calc(92vh-140px)]">
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold flex items-center space-x-2 animate-fade-in">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* TAB 1: STAMMDATEN & PROFIL */}
            {activeTab === 'data' && (
              <div className="space-y-4">
                {/* AVATAR UPLOAD & PREVIEW SECTION */}
                <div 
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`p-3.5 rounded-2xl border-2 transition-all ${
                    isDragging 
                      ? 'border-indigo-500 bg-indigo-50/50' 
                      : 'border-dashed border-slate-200 bg-slate-50/60 hover:border-indigo-300'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-4">
                    <div className="relative group cursor-pointer shrink-0" onClick={() => fileInputRef.current?.click()}>
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white font-extrabold text-2xl shadow-md ring-4 ring-white">
                        {avatarPreview ? (
                          <img 
                            src={avatarPreview} 
                            alt="Avatar Preview" 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span>{formData.full_name?.charAt(0) || 'U'}</span>
                        )}
                      </div>

                      <div className="absolute inset-0 bg-slate-900/50 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Camera className="w-5 h-5 text-white" />
                      </div>
                    </div>

                    <div className="flex-1 text-center sm:text-left space-y-1">
                      <p className="text-xs font-bold text-slate-800">
                        Profilbild {isEditing ? 'ändern' : 'hochladen'}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Bild hierher ziehen oder Datei auswählen (JPG, PNG, WebP • max. 5 MB)
                      </p>

                      <div className="flex items-center justify-center sm:justify-start space-x-2 pt-1">
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleFileInputChange}
                          accept="image/png, image/jpeg, image/webp, image/gif"
                          className="hidden"
                        />

                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:border-indigo-300 text-indigo-600 hover:text-indigo-700 text-xs font-bold rounded-xl shadow-2xs transition-colors"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>Foto auswählen</span>
                        </button>

                        {(avatarPreview || formData.avatar_url) && (
                          <button
                            type="button"
                            onClick={handleRemoveAvatar}
                            className="inline-flex items-center space-x-1 px-3 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                            title="Profilbild auf Standard zurücksetzen"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Foto entfernen</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Form Fields Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      {t('admin_users.first_name')} *
                    </label>
                    <input
                      type="text"
                      name="first_name"
                      value={formData.first_name}
                      onChange={handleChange}
                      required
                      placeholder="z. B. Max"
                      className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      {t('admin_users.last_name')} *
                    </label>
                    <input
                      type="text"
                      name="last_name"
                      value={formData.last_name}
                      onChange={handleChange}
                      required
                      placeholder="z. B. Mustermann"
                      className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center space-x-1">
                      <Mail className="w-3 h-3 text-slate-400" />
                      <span>{t('admin_users.email')} *</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      placeholder="m.mustermann@empresa.com"
                      className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center space-x-1">
                      <Shield className="w-3 h-3 text-indigo-500" />
                      <span>{t('admin_users.role')} *</span>
                    </label>
                    <select
                      name="role"
                      value={formData.role}
                      onChange={(e) => {
                        const selectedSlug = e.target.value;
                        const selectedRoleObj = availableRoles.find((r) => r.slug === selectedSlug);
                        setFormData((prev) => ({
                          ...prev,
                          role: selectedSlug,
                          custom_role_id: selectedRoleObj ? selectedRoleObj.id : prev.custom_role_id,
                        }));
                      }}
                      className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-semibold text-slate-800"
                    >
                      {availableRoles.length > 0 ? (
                        availableRoles.map((r) => (
                          <option key={r.id} value={r.slug}>
                            {r.name} {r.is_system_role ? '(System)' : '(Benutzerdefiniert)'}
                          </option>
                        ))
                      ) : (
                        <>
                          <option value="EMPLOYEE">Mitarbeiter (Standard)</option>
                          <option value="HR_MANAGER">HR-Manager (Personal)</option>
                          <option value="IT_ADMIN">IT-Administrator (Systeme)</option>
                          <option value="ADMIN">SuperAdmin (Vollzugriff)</option>
                        </>
                      )}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center justify-between">
                      <span className="flex items-center space-x-1">
                        <Building className="w-3 h-3 text-slate-400" />
                        <span>{t('admin_users.department')} (Multi-Abteilung) *</span>
                      </span>
                      {departmentsList.length > 1 && (
                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          {departmentsList.length} Abteilungen
                        </span>
                      )}
                    </label>

                    <div className="flex flex-wrap items-center gap-1.5 mb-1.5 min-h-[34px] p-1.5 bg-slate-50 border border-slate-200 rounded-xl">
                      {departmentsList.map((dept) => (
                        <span
                          key={dept}
                          className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-lg text-xs font-bold bg-white text-slate-800 border border-slate-200 shadow-xs"
                        >
                          <span>{dept}</span>
                          {departmentsList.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveDepartment(dept)}
                              className="text-slate-400 hover:text-rose-600 rounded-full p-0.5 transition-colors ml-1"
                              title="Abteilung entfernen"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          )}
                        </span>
                      ))}
                    </div>

                    <select
                      onChange={(e) => {
                        if (e.target.value) {
                          handleAddDepartment(e.target.value);
                          e.target.value = '';
                        }
                      }}
                      className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium"
                    >
                      <option value="">+ weitere Abteilung hinzufügen...</option>
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
                      <option value="General">Allgemein (General)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center space-x-1">
                      <Briefcase className="w-3 h-3 text-slate-400" />
                      <span>{t('admin_users.position')} *</span>
                    </label>
                    <input
                      type="text"
                      name="position"
                      value={formData.position}
                      onChange={handleChange}
                      required
                      placeholder="z. B. Senior Cloud Engineer"
                      className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center space-x-1">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      <span>{t('admin_users.location')}</span>
                    </label>
                    <select
                      name="location"
                      value={formData.location}
                      onChange={handleChange}
                      className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium text-slate-800"
                    >
                      <option value="Tinglev HQ Brandenburg">Tinglev HQ (Brandenburg, DE 🇩🇪)</option>
                      <option value="Berlin Office">Berlin (DE 🇩🇪)</option>
                      <option value="München Headquarter">München (DE 🇩🇪)</option>
                      <option value="Frankfurt Office">Frankfurt (DE 🇩🇪)</option>
                      <option value="Hamburg Office">Hamburg (DE 🇩🇪)</option>
                      {formData.location && ![
                        'Tinglev HQ Brandenburg',
                        'Berlin Office',
                        'München Headquarter',
                        'Frankfurt Office',
                        'Hamburg Office'
                      ].includes(formData.location) && (
                        <option value={formData.location}>{formData.location}</option>
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center space-x-1">
                      <Phone className="w-3 h-3 text-slate-400" />
                      <span>{t('admin_users.phone')}</span>
                    </label>
                    <input
                      type="text"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="+49 89 1234-105"
                      className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center space-x-1">
                      <Smartphone className="w-3 h-3 text-slate-400" />
                      <span>{t('admin_users.mobile')}</span>
                    </label>
                    <input
                      type="text"
                      name="mobile"
                      value={formData.mobile}
                      onChange={handleChange}
                      placeholder="+49 170 1234567"
                      className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center justify-between">
                      <span className="flex items-center space-x-1">
                        <UserCheck className="w-3 h-3 text-slate-400" />
                        <span>Vorgesetzte (Hierarchie)</span>
                      </span>
                      {supervisorIds.length > 1 && (
                        <span className="text-[10px] bg-indigo-100 text-indigo-700 font-bold px-1.5 py-0.5 rounded-md">
                          {supervisorIds.length} Vorgesetzte
                        </span>
                      )}
                    </label>

                    {supervisorIds.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-1.5">
                        {supervisorIds.map((supId) => {
                          const supObj = filteredSupervisors.find((s) => s.id === supId);
                          if (!supObj) return null;
                          return (
                            <div
                              key={supId}
                              className="inline-flex items-center space-x-1 px-2.5 py-0.5 bg-indigo-50 border border-indigo-200 text-indigo-800 rounded-xl text-xs font-medium shadow-xs"
                            >
                              <span className="max-w-[140px] truncate font-semibold">{supObj.full_name}</span>
                              <span className="text-[10px] text-indigo-500 truncate">({supObj.department})</span>
                              <button
                                type="button"
                                onClick={() => handleRemoveSupervisor(supId)}
                                className="text-indigo-400 hover:text-rose-600 transition-colors p-0.5 rounded-md hover:bg-indigo-100"
                                title="Vorgesetzten entfernen"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    <select
                      onChange={handleAddSupervisor}
                      value=""
                      className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium"
                    >
                      <option value="">
                        {supervisorIds.length === 0
                          ? `-- ${t('admin_users.no_supervisor')} --`
                          : '+ weiteren Vorgesetzten hinzufügen...'}
                      </option>
                      {filteredSupervisors
                        .filter((s) => !supervisorIds.includes(s.id))
                        .map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.full_name} ({s.position} - {s.department})
                          </option>
                        ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center space-x-1">
                      <Lock className="w-3 h-3 text-slate-400" />
                      <span>{t('admin_users.password')} {!isEditing && '*'}</span>
                    </label>
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      required={!isEditing}
                      placeholder={isEditing ? t('admin_users.password_hint_edit') : t('admin_users.password_hint_create')}
                      className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium"
                    />
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      {isEditing ? t('admin_users.password_hint_edit') : t('admin_users.password_hint_create')}
                    </span>
                  </div>
                </div>

                {/* Canteen Management Delegation Toggle */}
                <div className="flex items-center justify-between p-3.5 bg-amber-50/70 rounded-2xl border border-amber-200/80">
                  <div className="flex items-center space-x-2.5">
                    <div className="p-2 rounded-xl bg-amber-500/15 text-amber-700 shrink-0">
                      <UtensilsCrossed className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800">Kantine & Speiseplan verwalten</p>
                      <p className="text-[11px] text-slate-500">
                        Erlaubt diesem Mitarbeiter das Erstellen, Bearbeiten von Wochenplänen und PDF-Uploads.
                      </p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={manageCanteen}
                      onChange={(e) => setManageCanteen(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-600"></div>
                  </label>
                </div>
              </div>
            )}

            {/* TAB 2: MODUL-ZUGRIFF & BERECHTIGUNGEN */}
            {activeTab === 'modules' && (
              <div className="space-y-4">
                {/* SuperAdmin Notice */}
                {formData.role === 'ADMIN' && (
                  <div className="p-3.5 bg-indigo-50 border border-indigo-200 rounded-2xl flex items-center space-x-3 text-indigo-900 text-xs">
                    <ShieldCheck className="w-5 h-5 text-indigo-600 shrink-0" />
                    <div>
                      <p className="font-bold">SuperAdmin Konto</p>
                      <p className="text-[11px] text-indigo-700">
                        SuperAdmins besitzen systemweit vollen Zugriff. Sie können hier dennoch spezifische Modul-Präferenzen festlegen.
                      </p>
                    </div>
                  </div>
                )}

                {/* Action Toolbar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200/80">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-slate-800">
                      Aktivierte Module: <span className="text-indigo-600 font-mono font-bold">{allowedModules.length}</span> von {INTRANET_MODULES.length}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={handleSelectAllModules}
                      className="px-3 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-colors shadow-2xs"
                    >
                      Alle freischalten
                    </button>
                    <button
                      type="button"
                      onClick={handleDeselectAllModules}
                      className="px-3 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-colors shadow-2xs"
                    >
                      Alle ausblenden
                    </button>
                  </div>
                </div>

                {/* Search Bar for Modules */}
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={moduleSearch}
                    onChange={(e) => setModuleSearch(e.target.value)}
                    placeholder="Module filtern nach Name, Kategorie oder Beschreibung..."
                    className="w-full pl-9 pr-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium"
                  />
                </div>

                {/* Modules Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[340px] overflow-y-auto pr-1">
                  {filteredModules.map((mod) => {
                    const isAllowed = allowedModules.includes(mod.key);

                    return (
                      <div
                        key={mod.key}
                        onClick={() => handleToggleModule(mod.key)}
                        className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-start space-x-3 select-none ${
                          isAllowed
                            ? 'border-indigo-500 bg-indigo-50/40 ring-1 ring-indigo-500/20 shadow-xs'
                            : 'border-slate-200 bg-slate-50/50 hover:border-slate-300 opacity-60'
                        }`}
                      >
                        <div className="pt-0.5">
                          <div className={`w-5 h-5 rounded-lg flex items-center justify-center transition-colors ${
                            isAllowed ? 'bg-indigo-600 text-white' : 'border border-slate-300 bg-white'
                          }`}>
                            {isAllowed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                          </div>
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <div className="flex items-center space-x-2 truncate">
                              <span className={`p-1.5 rounded-lg shrink-0 ${
                                isAllowed ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-200 text-slate-500'
                              }`}>
                                {renderModuleIcon(mod.icon)}
                              </span>
                              <span className="text-xs font-bold text-slate-900 truncate">
                                {mod.label}
                              </span>
                            </div>

                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                              isAllowed 
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                                : 'bg-slate-200 text-slate-600'
                            }`}>
                              {isAllowed ? 'Aktiv' : 'Ausgeblendet'}
                            </span>
                          </div>

                          <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                            {mod.description}
                          </p>

                          <span className="text-[10px] text-slate-400 font-mono mt-1 block">
                            Kategorie: {mod.category}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="p-4 bg-white border-t border-slate-100 flex items-center justify-end space-x-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center space-x-2 px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-xl shadow-md shadow-indigo-600/20 transition-all disabled:opacity-50 cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{loading ? 'Wird gespeichert...' : 'Benutzer speichern'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
