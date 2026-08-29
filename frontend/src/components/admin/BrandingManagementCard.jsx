import React, { useState, useEffect, useRef } from 'react';
import { useBranding } from '../../context/BrandingContext';
import { useLanguage } from '../../context/LanguageContext';
import { TinglevLogo } from '../common/TinglevLogo';
import { 
  Building2, 
  Upload, 
  RotateCcw, 
  Save, 
  CheckCircle, 
  Sparkles, 
  Image as ImageIcon,
  AlertCircle
} from 'lucide-react';

export function BrandingManagementCard() {
  const { 
    companyName, 
    companySuffix, 
    companyTagline, 
    companyLogoUrl, 
    updateBranding, 
    uploadLogo, 
    resetBranding 
  } = useBranding();
  
  const { t } = useLanguage();

  const [formName, setFormName] = useState(companyName || 'TINGLEV');
  const [formSuffix, setFormSuffix] = useState(companySuffix || 'ELEMENTFABRIK');
  const [formTagline, setFormTagline] = useState(companyTagline || 'PORTAL INTRANET');

  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const fileInputRef = useRef(null);

  useEffect(() => {
    setFormName(companyName || 'TINGLEV');
    setFormSuffix(companySuffix || 'ELEMENTFABRIK');
    setFormTagline(companyTagline || 'PORTAL INTRANET');
  }, [companyName, companySuffix, companyTagline]);

  const handleSaveText = async (e) => {
    e.preventDefault();
    if (!formName.trim()) {
      setErrorMsg('Der Firmenname darf nicht leer sein.');
      return;
    }

    setSaving(true);
    setErrorMsg('');
    try {
      await updateBranding(formName.trim(), formSuffix.trim(), formTagline.trim());
      setSuccessMsg('Branding-Texte erfolgreich aktualisiert!');
      setTimeout(() => setSuccessMsg(''), 3500);
    } catch (err) {
      setErrorMsg(err.message || 'Fehler beim Speichern des Brandings.');
    } finally {
      setSaving(false);
    }
  };

  const handleLogoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setErrorMsg('');
    try {
      await uploadLogo(file);
      setSuccessMsg('Firmenlogo erfolgreich hochgeladen und angewendet!');
      setTimeout(() => setSuccessMsg(''), 3500);
    } catch (err) {
      setErrorMsg(err.message || 'Fehler beim Hochladen des Logos.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleReset = async () => {
    if (!window.confirm('Möchten Sie das Branding und das Logo wirklich auf die Standardwerte von Tinglev Elementfabrik zurücksetzen?')) {
      return;
    }

    setSaving(true);
    setErrorMsg('');
    try {
      await resetBranding();
      setSuccessMsg('Branding erfolgreich auf Standard zurückgesetzt!');
      setTimeout(() => setSuccessMsg(''), 3500);
    } catch (err) {
      setErrorMsg(err.message || 'Fehler beim Zurücksetzen des Brandings.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-card space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-100 flex-wrap gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Unternehmens-Branding & Firmenlogo
            </h2>
            <p className="text-xs text-slate-500">
              Passen Sie den Firmennamen, Zusatz, Untertitel und das Logo global für die gesamte Intranet-Plattform an.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleReset}
          disabled={saving || uploading}
          className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold transition-colors disabled:opacity-50"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Auf Standard zurücksetzen</span>
        </button>
      </div>

      {/* Success / Error Alerts */}
      {successMsg && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center space-x-2 animate-fade-in">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center space-x-2 animate-fade-in">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN (7 Cols): Settings Form */}
        <div className="lg:col-span-7 space-y-6">
          <form onSubmit={handleSaveText} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Firmenname (Hauptmarke)
              </label>
              <input
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="z. B. TINGLEV"
                className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 text-slate-900 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Zusatz / Suffix
                </label>
                <input
                  type="text"
                  value={formSuffix}
                  onChange={(e) => setFormSuffix(e.target.value)}
                  placeholder="z. B. ELEMENTFABRIK"
                  className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 text-slate-900 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Untertitel / Tagline
                </label>
                <input
                  type="text"
                  value={formTagline}
                  onChange={(e) => setFormTagline(e.target.value)}
                  placeholder="z. B. PORTAL INTRANET"
                  className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 text-slate-900 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center space-x-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-xs font-bold shadow-md shadow-indigo-600/20 transition-all disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Wird gespeichert...' : 'Branding-Texte speichern'}</span>
            </button>
          </form>

          {/* Logo Upload Section */}
          <div className="pt-5 border-t border-slate-100 space-y-3">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Eigenes Firmenlogo hochladen
            </label>
            <p className="text-xs text-slate-400">
              Unterstützte Formate: PNG, JPG, SVG, WEBP (Empfohlen: quadratisch oder transparentes PNG/SVG).
            </p>

            <div className="flex items-center space-x-4">
              <input
                ref={fileInputRef}
                type="file"
                accept=".png,.jpg,.jpeg,.svg,.webp,.gif"
                onChange={handleLogoChange}
                className="hidden"
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="inline-flex items-center space-x-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-xs font-semibold transition-all shadow-xs disabled:opacity-50"
              >
                {uploading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Wird hochgeladen...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    <span>Logo auswählen & hochladen</span>
                  </>
                )}
              </button>

              {companyLogoUrl && (
                <span className="text-xs text-emerald-600 font-semibold flex items-center space-x-1">
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Eigenes Logo aktiv</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN (5 Cols): Live Preview Box */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-700 uppercase tracking-wider">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>Echtzeit-Vorschau (Seitenleiste)</span>
          </div>

          {/* Dark Sidebar Preview Frame */}
          <div className="bg-[#001E36] rounded-3xl p-5 border border-[#002B49] shadow-xl space-y-4">
            <div className="pb-3 border-b border-[#002B49]/80 bg-[#001424]/60 -mx-5 -mt-5 p-5 rounded-t-3xl">
              <TinglevLogo 
                variant="full" 
                theme="light-text" 
                showSubtitle={true}
                customName={formName || 'TINGLEV'}
                customSuffix={formSuffix}
                customTagline={formTagline}
                customLogoUrl={companyLogoUrl}
              />
            </div>

            <div className="space-y-2 opacity-50 pointer-events-none">
              <div className="h-3 bg-[#002B49] rounded-md w-1/3"></div>
              <div className="h-8 bg-[#002B49]/60 rounded-xl"></div>
              <div className="h-8 bg-[#002B49]/60 rounded-xl"></div>
            </div>
          </div>

          {/* Light Theme Preview Frame */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 shadow-xs flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500">Helle Ansicht:</span>
            <TinglevLogo 
              variant="full" 
              theme="dark-text" 
              showSubtitle={false}
              customName={formName || 'TINGLEV'}
              customSuffix={formSuffix}
              customLogoUrl={companyLogoUrl}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default BrandingManagementCard;
