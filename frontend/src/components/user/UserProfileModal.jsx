import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, 
  User, 
  Lock, 
  Camera, 
  Trash2, 
  Save, 
  Check, 
  AlertCircle, 
  Eye, 
  EyeOff, 
  Phone, 
  Smartphone, 
  MapPin, 
  Building2, 
  ShieldCheck, 
  Sparkles,
  KeyRound
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { api, getAvatarUrl } from '../../services/api';
import { UserAvatar } from '../common/UserAvatar';
import { RoleBadge } from '../common/Badge';

import { useModalClose } from '../../hooks/useModalClose';

export function UserProfileModal({ isOpen, onClose }) {
  const { user, updateUser } = useAuth();
  const { t } = useLanguage();
  useModalClose(isOpen, onClose);

  const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'password'

  // Profile form state
  const [firstName, setFirstName] = useState(user?.first_name || '');
  const [lastName, setLastName] = useState(user?.last_name || '');
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [mobile, setMobile] = useState(user?.mobile || '');
  const [location, setLocation] = useState(user?.location || 'Tinglev HQ Brandenburg');

  // Password form state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  // Status state
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [message, setMessage] = useState(null); // { type: 'success'|'error', text: '' }

  if (!isOpen || !user) return null;

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: 'error', text: t('profile.err_file_size', 'Die Datei ist zu groß (max. 5MB).') });
      return;
    }

    try {
      setUploadingAvatar(true);
      setMessage(null);
      const updatedUser = await api.uploadMyAvatar(file);
      updateUser(updatedUser);
      setMessage({ type: 'success', text: t('profile.msg_avatar_updated', 'Profilbild erfolgreich aktualisiert!') });
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Fehler beim Hochladen des Profilbilds.' });
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleRemoveAvatar = async () => {
    if (!user.avatar_url) return;
    try {
      setUploadingAvatar(true);
      setMessage(null);
      const updatedUser = await api.deleteMyAvatar();
      updateUser(updatedUser);
      setMessage({ type: 'success', text: t('profile.msg_avatar_removed', 'Profilbild entfernt.') });
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Fehler beim Entfernen des Profilbilds.' });
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      setSavingProfile(true);
      setMessage(null);

      const payload = {
        first_name: firstName,
        last_name: lastName,
        full_name: fullName,
        phone,
        mobile,
        location,
      };

      const updatedUser = await api.updateMyProfile(payload);
      updateUser(updatedUser);
      setMessage({ type: 'success', text: t('profile.msg_profile_saved', 'Profildaten erfolgreich gespeichert!') });
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Fehler beim Speichern des Profils.' });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSavePassword = async (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 4) {
      setMessage({ type: 'error', text: t('profile.err_pass_short', 'Das neue Passwort muss mindestens 4 Zeichen lang sein.') });
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: t('profile.err_pass_mismatch', 'Die neuen Passwörter stimmen nicht überein.') });
      return;
    }

    try {
      setSavingPassword(true);
      setMessage(null);

      await api.updateMyPassword({
        new_password: newPassword
      });

      setNewPassword('');
      setConfirmPassword('');
      setMessage({ type: 'success', text: t('profile.msg_pass_updated', 'Passwort erfolgreich geändert!') });
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Fehler beim Ändern des Passworts.' });
    } finally {
      setSavingPassword(false);
    }
  };

  // Password strength score (0 to 4)
  const getPasswordStrength = (pass) => {
    if (!pass) return 0;
    let score = 0;
    if (pass.length >= 6) score++;
    if (pass.length >= 10) score++;
    if (/[A-Z]/.test(pass) && /[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;
    return score;
  };

  const strength = getPasswordStrength(newPassword);

  return createPortal(
    <div 
      onClick={onClose}
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fade-in overflow-y-auto"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden my-8 z-[10000]"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors focus:outline-none"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center space-x-4">
            <div className="relative group">
              <UserAvatar
                src={user.avatar_url}
                name={user.full_name}
                size="lg"
                className="w-16 h-16 rounded-2xl ring-4 ring-white/20 shadow-lg shrink-0 object-cover"
              />
              <label 
                htmlFor="user-profile-avatar-upload"
                className="absolute inset-0 bg-black/50 rounded-2xl flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                title="Foto ändern"
              >
                <Camera className="w-5 h-5" />
              </label>
              <input
                id="user-profile-avatar-upload"
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                onChange={handleAvatarChange}
                className="hidden"
                disabled={uploadingAvatar}
              />
            </div>

            <div>
              <h2 className="text-xl font-bold text-white flex items-center space-x-2">
                <span>{user.full_name}</span>
              </h2>
              <p className="text-xs text-indigo-200 mt-0.5">{user.email}</p>
              <div className="mt-2 flex items-center space-x-2">
                <RoleBadge role={user.role} customRoleName={user.custom_role_name} />
                <span className="text-[11px] text-slate-300 font-medium px-2 py-0.5 rounded-full bg-white/10">
                  {user.department || 'General'}
                </span>
              </div>
            </div>
          </div>

          {/* Modal Navigation Tabs */}
          <div className="flex space-x-2 mt-6 pt-2 border-t border-white/10">
            <button
              type="button"
              onClick={() => { setActiveTab('profile'); setMessage(null); }}
              className={`flex items-center space-x-2 px-4 py-2 text-xs font-bold rounded-xl transition-all ${
                activeTab === 'profile'
                  ? 'bg-white text-indigo-950 shadow-md'
                  : 'text-indigo-200 hover:bg-white/10 hover:text-white'
              }`}
            >
              <User className="w-4 h-4" />
              <span>{t('profile.tab_profile', 'Profil & Foto')}</span>
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab('password'); setMessage(null); }}
              className={`flex items-center space-x-2 px-4 py-2 text-xs font-bold rounded-xl transition-all ${
                activeTab === 'password'
                  ? 'bg-white text-indigo-950 shadow-md'
                  : 'text-indigo-200 hover:bg-white/10 hover:text-white'
              }`}
            >
              <KeyRound className="w-4 h-4" />
              <span>{t('profile.tab_password', 'Passwort ändern')}</span>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {/* Notification Alert */}
          {message && (
            <div className={`p-4 rounded-2xl border text-xs font-semibold flex items-center justify-between animate-fade-in ${
              message.type === 'success' 
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                : 'bg-rose-50 text-rose-800 border-rose-200'
            }`}>
              <div className="flex items-center space-x-2.5">
                {message.type === 'success' ? (
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <span>{message.text}</span>
              </div>
              <button onClick={() => setMessage(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* TAB 1: PROFILE & PHOTO EDIT */}
          {activeTab === 'profile' && (
            <form onSubmit={handleSaveProfile} className="space-y-5">
              {/* Photo Management Box */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <UserAvatar
                    src={user.avatar_url}
                    name={user.full_name}
                    size="md"
                    className="w-12 h-12 rounded-xl shrink-0"
                  />
                  <div>
                    <p className="text-xs font-bold text-slate-800">{t('profile.photo_heading', 'Profilfoto & Avatar')}</p>
                    <p className="text-[11px] text-slate-500">{t('profile.photo_hint', 'Erlaubte Formate: PNG, JPG, WebP (max. 5MB)')}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <label
                    htmlFor="user-profile-avatar-btn"
                    className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center space-x-1.5 shadow-sm"
                  >
                    {uploadingAvatar ? (
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : (
                      <Camera className="w-3.5 h-3.5" />
                    )}
                    <span>{t('profile.btn_upload_photo', 'Foto ändern')}</span>
                  </label>
                  <input
                    id="user-profile-avatar-btn"
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    onChange={handleAvatarChange}
                    className="hidden"
                    disabled={uploadingAvatar}
                  />

                  {user.avatar_url && (
                    <button
                      type="button"
                      onClick={handleRemoveAvatar}
                      disabled={uploadingAvatar}
                      className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition-colors border border-rose-200"
                      title={t('profile.btn_remove_photo', 'Foto entfernen')}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Personal Data Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {t('profile.first_name', 'Vorname')}
                  </label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    placeholder="z.B. Hans"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {t('profile.last_name', 'Nachname')}
                  </label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    placeholder="z.B. Müller"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {t('profile.full_name', 'Anzeigename (Vollständiger Name)')}
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    placeholder="z.B. Hans Müller"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center space-x-1">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{t('profile.phone', 'Telefon / Durchwahl')}</span>
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    placeholder="+49 30 1234567"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center space-x-1">
                    <Smartphone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{t('profile.mobile', 'Mobilnummer')}</span>
                  </label>
                  <input
                    type="text"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    placeholder="+49 170 1234567"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center space-x-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{t('profile.location', 'Standort / Betriebsstätte')}</span>
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    placeholder="z.B. Tinglev HQ Brandenburg"
                  />
                </div>
              </div>

              {/* System Assigned Info (Read-only) */}
              <div className="pt-3 border-t border-slate-100">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  {t('profile.system_info_title', 'Zugewiesene Systemdaten')}
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200/60 text-xs">
                  <div>
                    <span className="text-slate-400 text-[10.5px] block">{t('profile.email', 'E-Mail')}</span>
                    <span className="font-bold text-slate-800 truncate block">{user.email}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10.5px] block">{t('profile.department', 'Abteilung')}</span>
                    <span className="font-bold text-slate-800 truncate block">{user.department || 'General'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10.5px] block">{t('profile.position', 'Position')}</span>
                    <span className="font-bold text-slate-800 truncate block">{user.position || 'Mitarbeiter'}</span>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-indigo-600/20 transition-all disabled:opacity-50 flex items-center space-x-2 cursor-pointer"
                >
                  {savingProfile ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>{t('profile.btn_saving', 'Wird gespeichert...')}</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>{t('profile.btn_save', 'Profil speichern')}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: PASSWORD CHANGE */}
          {activeTab === 'password' && (
            <form onSubmit={handleSavePassword} className="space-y-4">
              <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 text-amber-900 text-xs flex items-start space-x-3">
                <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">{t('profile.pass_security_tip', 'Sicherheits-Hinweis')}</p>
                  <p className="text-[11.5px] text-amber-800/90 mt-0.5">
                    {t('profile.pass_security_desc', 'Wählen Sie ein sicheres Passwort mit mindestens 4 Zeichen, am besten kombiniert aus Buchstaben, Zahlen und Sonderzeichen.')}
                  </p>
                </div>
              </div>

              {/* New Password */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t('profile.new_pass', 'Neues Passwort')}
                </label>
                <div className="relative">
                  <input
                    type={showNewPass ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPass(!showNewPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Strength Meter Bar */}
                {newPassword && (
                  <div className="mt-2 space-y-1">
                    <div className="flex h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`transition-all duration-300 ${
                          strength <= 1 ? 'w-1/4 bg-rose-500' : strength === 2 ? 'w-2/4 bg-amber-500' : strength === 3 ? 'w-3/4 bg-blue-500' : 'w-full bg-emerald-500'
                        }`}
                      ></div>
                    </div>
                    <p className="text-[10.5px] text-slate-500 font-medium">
                      {strength <= 1 && <span className="text-rose-600 font-bold">Schwaches Passwort</span>}
                      {strength === 2 && <span className="text-amber-600 font-bold">Mittleres Passwort</span>}
                      {strength === 3 && <span className="text-blue-600 font-bold">Gutes Passwort</span>}
                      {strength >= 4 && <span className="text-emerald-600 font-bold">Starkes Passwort</span>}
                    </p>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t('profile.confirm_pass', 'Neues Passwort bestätigen')}
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPass ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPass(!showConfirmPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {confirmPassword && (
                  <p className={`text-[11px] mt-1 font-medium ${newPassword === confirmPassword ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {newPassword === confirmPassword ? '✓ Passwörter stimmen überein' : '✕ Passwörter stimmen nicht überein'}
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <div className="pt-3 flex justify-end">
                <button
                  type="submit"
                  disabled={savingPassword || !newPassword || newPassword !== confirmPassword}
                  className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-indigo-600/20 transition-all disabled:opacity-50 flex items-center space-x-2 cursor-pointer"
                >
                  {savingPassword ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>{t('profile.btn_saving', 'Wird aktualisiert...')}</span>
                    </>
                  ) : (
                    <>
                      <KeyRound className="w-4 h-4" />
                      <span>{t('profile.btn_change_pass', 'Passwort aktualisieren')}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

