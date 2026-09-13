import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { LANGUAGES as DEFAULT_LANGUAGES, translations } from '../i18n/translations';
import { api } from '../services/api';

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [activeLanguagesList, setActiveLanguagesList] = useState(DEFAULT_LANGUAGES);
  const [defaultLanguageCode, setDefaultLanguageCode] = useState('de');

  // Active language state (restored from localStorage or 'de')
  const [language, setLanguageState] = useState(() => {
    try {
      const saved = localStorage.getItem('intranet_lang');
      return saved && (translations[saved] || DEFAULT_LANGUAGES.some((l) => l.code === saved)) ? saved : 'de';
    } catch {
      return 'de';
    }
  });

  // Fetch active languages from backend
  const fetchActiveLanguages = useCallback(async () => {
    try {
      const data = await api.getActiveLanguages();
      if (data && data.languages && data.languages.length > 0) {
        const formatted = data.languages.map((l) => ({
          code: l.code,
          label: l.native_name || l.name,
          name: l.name,
          flag: l.flag,
          country: l.code.toUpperCase(),
          locale: l.locale,
          is_default: l.is_default,
          is_active: l.is_active,
          order: l.order,
        }));
        if (formatted.length > 0) {
          setActiveLanguagesList(formatted);
        }
        if (data.default_language) {
          setDefaultLanguageCode(data.default_language);
        }
      }
    } catch (err) {
      console.warn('Backend-Sprachkonfiguration konnte nicht geladen werden, verwende lokale Fallbacks:', err);
    }
  }, []);

  useEffect(() => {
    fetchActiveLanguages();
  }, [fetchActiveLanguages]);

  // Keep <html lang="..."> synced
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = language;
    }
  }, [language]);

  const setLanguage = (newLangCode) => {
    if (!newLangCode) return;
    setLanguageState(newLangCode);
    try {
      localStorage.setItem('intranet_lang', newLangCode);
    } catch (e) {
      console.error('Error saving language to localStorage:', e);
    }
    if (typeof document !== 'undefined') {
      document.documentElement.lang = newLangCode;
    }
  };

  const currentLanguage =
    activeLanguagesList.find((l) => l.code === language) ||
    DEFAULT_LANGUAGES.find((l) => l.code === language) ||
    activeLanguagesList[0] ||
    DEFAULT_LANGUAGES[0];

  // Translation helper function supporting nested dot keys e.g. "navbar.search_placeholder"
  const t = (keyPath, fallback = null) => {
    if (!keyPath) return '';
    const keys = keyPath.split('.');
    
    // 1. Try current language
    let result = translations[language];
    for (const k of keys) {
      if (result && result[k] !== undefined) {
        result = result[k];
      } else {
        result = undefined;
        break;
      }
    }

    if (result !== undefined && typeof result === 'string') {
      return result;
    }

    // 2. Fallback to German ('de')
    let deResult = translations['de'];
    for (const k of keys) {
      if (deResult && deResult[k] !== undefined) {
        deResult = deResult[k];
      } else {
        deResult = undefined;
        break;
      }
    }

    if (deResult !== undefined && typeof deResult === 'string') {
      return deResult;
    }

    // 3. Fallback string or keyPath itself
    return fallback !== null ? fallback : keyPath;
  };

  const formatDate = (date, options = {}) => {
    const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
    if (!d || isNaN(d.getTime())) return '';
    const defaultOptions = { day: 'numeric', month: 'long', year: 'numeric', ...options };
    const loc = currentLanguage?.locale || 'de-DE';
    try {
      return new Intl.DateTimeFormat(loc, defaultOptions).format(d);
    } catch {
      return new Intl.DateTimeFormat('de-DE', defaultOptions).format(d);
    }
  };

  const formatTime = (date, options = {}) => {
    const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
    if (!d || isNaN(d.getTime())) return '';
    const defaultOptions = { hour: '2-digit', minute: '2-digit', ...options };
    const loc = currentLanguage?.locale || 'de-DE';
    try {
      return new Intl.DateTimeFormat(loc, defaultOptions).format(d);
    } catch {
      return new Intl.DateTimeFormat('de-DE', defaultOptions).format(d);
    }
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        currentLanguage,
        languages: activeLanguagesList,
        defaultLanguage: defaultLanguageCode,
        refreshLanguages: fetchActiveLanguages,
        t,
        formatDate,
        formatTime,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage muss innerhalb eines LanguageProviders verwendet werden');
  }
  return context;
}
