import React, { useState, useEffect, useRef } from 'react';
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
  RefreshCw
} from 'lucide-react';
import { api, getAvatarUrl } from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';

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

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    full_name: '',
    email: '',
    role: 'EMPLOYEE',
    department: 'Softwareentwicklung',
    position: 'Full Stack Entwickler',
    location: 'Tinglev Headquarter',
    phone: '',
    mobile: '',
    supervisor_id: '',
    avatar_url: '',
    password: '',
    is_active: true,
  });

  // Avatar file state
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarRemoved, setAvatarRemoved] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [availableRoles, setAvailableRoles] = useState([]);

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
        department: userToEdit.department || 'General',
        position: userToEdit.position || 'Mitarbeiter',
        location: userToEdit.location || 'Tinglev Headquarter',
        phone: userToEdit.phone || '',
        mobile: userToEdit.mobile || '',
        supervisor_id: userToEdit.supervisor_id ? String(userToEdit.supervisor_id) : '',
        avatar_url: userToEdit.avatar_url || '',
        password: '',
        is_active: userToEdit.is_active !== undefined ? userToEdit.is_active : true,
      });
      setAvatarPreview(getAvatarUrl(userToEdit.avatar_url));
    } else {
      setFormData({
        first_name: '',
        last_name: '',
        full_name: '',
        email: '',
        role: 'EMPLOYEE',
        department: 'Softwareentwicklung',
        position: 'Entwickler',
        location: 'Tinglev Headquarter',
        phone: '',
        mobile: '',
        supervisor_id: '',
        avatar_url: '',
        password: '',
        is_active: true,
      });
      setAvatarPreview(null);
    }
    setAvatarFile(null);
    setAvatarRemoved(false);
    setError(null);
  }, [userToEdit, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => {
      const updated = {
        ...prev,
        [name]: type === 'checkbox' ? checked : value,
      };

      // Auto update full_name when typing first or last name
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

    // Check MIME type
    if (!file.type.startsWith('image/')) {
      setError('Bitte wählen Sie eine gültige Bilddatei (JPG, PNG, WebP oder GIF) aus.');
      return;
    }

    // Check size (max 5 MB)
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

      // 1. If user is creating a new user and selected a file
      if (!isEditing && avatarFile) {
        const tempUpload = await api.uploadTempAvatar(avatarFile);
        finalAvatarUrl = tempUpload.avatar_url;
      }

      // 2. If avatar was explicitly removed on an existing user
      if (isEditing && avatarRemoved) {
        finalAvatarUrl = null;
      }

      const payload = {
        ...formData,
        avatar_url: finalAvatarUrl,
        supervisor_id: formData.supervisor_id ? parseInt(formData.supervisor_id, 10) : null,
      };

      if (isEditing && !payload.password) {
        delete payload.password;
      }

      // Save user record
      const savedUser = await onSave(payload, userToEdit ? userToEdit.id : null);

      // 3. If editing and user selected a new avatar file, upload directly
      if (isEditing && avatarFile && userToEdit?.id) {
        await api.uploadUserAvatar(userToEdit.id, avatarFile);
      }

      onClose();
    } catch (err) {
      setError(err.message || 'Fehler beim Speichern des Benutzers');
    } finally {
      setLoading(false);
    }
  };

  const filteredSupervisors = availableSupervisors.filter(
    (s) => !userToEdit || s.id !== userToEdit.id
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-2xl overflow-hidden my-8 transform transition-all">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-indigo-500/20 border border-indigo-400/30">
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
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold flex items-center space-x-2 animate-fade-in">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* ========================================================= */}
          {/* INTERACTIVE AVATAR UPLOAD & PREVIEW SECTION */}
          {/* ========================================================= */}
          <div 
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`p-4 rounded-2xl border-2 transition-all ${
              isDragging 
                ? 'border-indigo-500 bg-indigo-50/50' 
                : 'border-dashed border-slate-200 bg-slate-50/60 hover:border-indigo-300'
            }`}
          >
            <div className="flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-4">
              {/* Avatar Preview circle */}
              <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                <div className="w-20 h-20 rounded-2xl overflow-hidden bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white font-extrabold text-2xl shadow-md ring-4 ring-white">
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

                {/* Camera Overlay on Hover */}
                <div className="absolute inset-0 bg-slate-900/50 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera className="w-6 h-6 text-white" />
                </div>
              </div>

              {/* Upload actions & instructions */}
              <div className="flex-1 text-center sm:text-left space-y-1.5">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center space-x-1">
                <Building className="w-3 h-3 text-slate-400" />
                <span>{t('admin_users.department')} *</span>
              </label>
              <select
                name="department"
                value={formData.department}
                onChange={handleChange}
                className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium"
              >
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

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center space-x-1">
                <MapPin className="w-3 h-3 text-slate-400" />
                <span>{t('admin_users.location')}</span>
              </label>
              <select
                name="location"
                value={formData.location}
                onChange={handleChange}
                className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium"
              >
                <option value="Tinglev Headquarter">Tinglev HQ (DK 🇩🇰)</option>
                <option value="München Headquarter">München (DE 🇩🇪)</option>
                <option value="Berlin Office">Berlin (DE 🇩🇪)</option>
                <option value="Frankfurt Office">Frankfurt (DE 🇩🇪)</option>
                <option value="London Tech Hub">London (GB 🇬🇧)</option>
                <option value="Warschau Center">Warschau (PL 🇵🇱)</option>
                <option value="Istanbul Office">Istanbul (TR 🇹🇷)</option>
                <option value="Madrid Office">Madrid (ES 🇪🇸)</option>
                <option value="Wien Office">Wien (AT 🇦🇹)</option>
                <option value="Zürich Office">Zürich (CH 🇨🇭)</option>
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center space-x-1">
                <UserCheck className="w-3 h-3 text-slate-400" />
                <span>{t('admin_users.supervisor')}</span>
              </label>
              <select
                name="supervisor_id"
                value={formData.supervisor_id}
                onChange={handleChange}
                className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium"
              >
                <option value="">-- {t('admin_users.no_supervisor')} --</option>
                {filteredSupervisors.map((s) => (
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

          {/* Active Status Toggle */}
          <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="flex items-center space-x-2.5">
              <span className={`w-2.5 h-2.5 rounded-full ${formData.is_active ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
              <div>
                <p className="text-xs font-bold text-slate-800">{t('admin_users.is_active')}</p>
                <p className="text-[11px] text-slate-400">
                  {formData.is_active ? 'Konto ist freigeschaltet und kann sich im Intranet anmelden.' : 'Konto ist gesperrt.'}
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                name="is_active"
                checked={formData.is_active}
                onChange={handleChange}
                className="sr-only peer"
              />
              <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
            </label>
          </div>

          {/* Modal Footer */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
            >
              {t('admin_users.cancel_btn')}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center space-x-2 px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-xl shadow-md shadow-indigo-600/20 transition-all disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{loading ? 'Wird gespeichert...' : t('admin_users.save_btn')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
