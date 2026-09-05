import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useBranding } from '../context/BrandingContext';
import { TinglevMark } from '../components/common/TinglevLogo';
import { ThemeSelector } from '../components/layout/ThemeSelector';
import { 
  Lock, 
  Mail, 
  ArrowRight, 
  AlertCircle
} from 'lucide-react';

export function LoginPage() {
  const [email, setEmail] = useState('admin@empresa.com');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login } = useAuth();
  const { t } = useLanguage();
  const { companyName, companySuffix, companyTagline, companyLogoUrl } = useBranding();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || 'Login fehlgeschlagen. Bitte überprüfen Sie Ihre Anmeldedaten.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#001424] flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Top right theme switcher */}
      <div className="absolute top-6 right-6 z-20">
        <ThemeSelector />
      </div>

      {/* Ambient background glows with Tinglev Blue and Orange */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#009FE3]/15 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#F05A22]/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="sm:mx-auto sm:w-full sm:max-w-lg relative z-10 text-center">
        {/* Logo */}
        <div className="inline-flex items-center justify-center w-20 h-20 p-3 rounded-3xl bg-gradient-to-br from-[#00243F] to-[#001E36] border border-[#003E6B]/80 shadow-2xl shadow-[#001424]/60 mb-4 relative group overflow-hidden">
          {companyLogoUrl ? (
            <img src={companyLogoUrl} alt={companyName} className="w-12 h-12 object-contain rounded-xl" />
          ) : (
            <TinglevMark className="w-10 h-10 transform group-hover:scale-105 transition-transform" color="#009FE3" />
          )}
          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-[#F05A22] rounded-full border-2 border-[#001424]"></span>
        </div>
        <div className="w-12 h-1 bg-[#F05A22] rounded-full mx-auto mb-3"></div>
        <h2 className="text-3xl font-extrabold text-white tracking-tight font-heading">
          {companyName} {companySuffix}
        </h2>
        <p className="mt-2 text-sm text-slate-300">
          {companyTagline || t('login.subtitle', 'Zentrales Portal für Unternehmenszusammenarbeit & Workflows')}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg relative z-10">
        <div className="bg-[#001E36]/90 backdrop-blur-xl border border-[#002B49] py-8 px-6 sm:px-10 shadow-2xl rounded-3xl">
          {error && (
            <div className="mb-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-start space-x-3 text-rose-300 text-xs">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                {t('login.email_label', 'GESCHÄFTLICHE E-MAIL')}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-4 py-2.5 bg-[#001424]/80 border border-[#002B49] rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-[#009FE3] focus:border-transparent transition-all"
                  placeholder={t('login.email_placeholder', 'vorname.nachname@firma.de')}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                {t('login.password_label', 'PASSWORT')}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-4 py-2.5 bg-[#001424]/80 border border-[#002B49] rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-[#009FE3] focus:border-transparent transition-all"
                  placeholder={t('login.password_placeholder', '••••••••')}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-[#F05A22] to-[#e0460f] hover:from-[#e0460f] hover:to-[#c2360a] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#F05A22] shadow-lg shadow-[#F05A22]/25 transition-all disabled:opacity-50 cursor-pointer mt-2"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <span>{t('login.submit_button', 'Im Intranet anmelden')}</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* German Intellectual Property & Copyright Notice */}
        <p className="mt-8 text-center text-xs text-slate-400/90 font-medium tracking-wide">
          Demo ist geistiges Eigentum der Organic Creation Group • Alle Rechte vorbehalten 2026
        </p>
      </div>
    </div>
  );
}
