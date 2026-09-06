import React, { useState, useEffect } from 'react';
import { Download, X, Share, PlusSquare, Smartphone, Check, Sparkles } from 'lucide-react';

const PWA_DISMISSED_KEY = 'tinglev_pwa_dismissed';
const FOURTEEN_DAYS_MS = 14 * 24 * 60 * 60 * 1000;

export function InstallPromptBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    // 1. Check if running in standalone mode (already installed as PWA)
    const isStandaloneMode =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true ||
      document.referrer.includes('android-app://');

    setIsStandalone(isStandaloneMode);

    if (isStandaloneMode) {
      return;
    }

    // 2. Check if dismissed within the last 14 days
    const dismissedUntil = localStorage.getItem(PWA_DISMISSED_KEY);
    if (dismissedUntil && Date.now() < Number(dismissedUntil)) {
      return;
    }

    // 3. Detect iOS device and Safari
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    const isSafari = /safari/.test(userAgent) && !/chrome|crios|fxios/.test(userAgent);
    setIsIOS(isIosDevice);

    // 4. Android / Chrome / Edge: Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // 5. Listen for successful installation
    const handleAppInstalled = () => {
      setInstalled(true);
      setShowBanner(false);
      setDeferredPrompt(null);
      console.log('[PWA] Tinglev Intranet wurde erfolgreich installiert!');
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    // 6. iOS: If on iOS Safari and not standalone, show prompt after 3.5s
    if (isIosDevice && !isStandaloneMode) {
      const timer = setTimeout(() => {
        setShowBanner(true);
      }, 3500);
      return () => clearTimeout(timer);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setInstalled(true);
        setShowBanner(false);
      }
      setDeferredPrompt(null);
    } else if (isIOS) {
      setShowIOSGuide(true);
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    setShowIOSGuide(false);
    // Dismiss for 14 days in localStorage
    localStorage.setItem(PWA_DISMISSED_KEY, String(Date.now() + FOURTEEN_DAYS_MS));
  };

  if (isStandalone || !showBanner) {
    return null;
  }

  return (
    <>
      {/* Floating Installation Banner (Top / Bottom Responsive Bar) */}
      <div className="fixed top-3 left-3 right-3 sm:top-auto sm:bottom-4 sm:left-auto sm:right-6 sm:max-w-md z-[9999] animate-slide-up">
        <div className="bg-slate-900/95 dark:bg-slate-900/95 text-white p-4 rounded-3xl shadow-2xl border border-sky-500/30 backdrop-blur-xl flex items-start space-x-3.5 ring-1 ring-sky-500/20">
          {/* Tinglev App Icon */}
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-600 to-blue-800 p-2 shrink-0 shadow-lg flex items-center justify-center border border-sky-400/40 relative">
            <Smartphone className="w-6 h-6 text-white" />
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-sky-400"></span>
            </span>
          </div>

          <div className="flex-1 min-w-0 pr-1">
            <div className="flex items-center space-x-1.5">
              <span className="font-extrabold text-sm text-white">Tinglev Intranet App</span>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-sky-500/20 text-sky-300 border border-sky-500/30">
                PWA
              </span>
            </div>
            
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              {isIOS
                ? 'Tinglev Intranet als App auf Ihrem iPhone / iPad installieren für Vollbildmodus & Schnellzugriff.'
                : 'Tinglev Intranet als App installieren für schnellen Zugriff und Offline-Nutzung.'}
            </p>

            <div className="flex items-center space-x-2 mt-3">
              <button
                onClick={handleInstallClick}
                className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white text-xs font-bold rounded-xl shadow-md shadow-sky-500/20 transition-all active:scale-95 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{isIOS ? 'Anleitung öffnen' : 'Installieren'}</span>
              </button>
              
              <button
                onClick={handleDismiss}
                className="px-2.5 py-1.5 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
                title="Für 14 Tage ausblenden"
              >
                Später
              </button>
            </div>
          </div>

          <button
            onClick={handleDismiss}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Für 14 Tage schließen"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* iOS Step-by-Step Installation Modal */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-[10000] bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-sm w-full p-6 text-white shadow-2xl space-y-4 animate-scale-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Smartphone className="w-5 h-5 text-sky-400" />
                <h3 className="font-extrabold text-base">Auf iOS installieren</h3>
              </div>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs text-slate-300 space-y-3">
              <p className="leading-relaxed">
                In Safari können Sie das Tinglev Intranet mit zwei einfachen Schritten als vollwertige App auf Ihren Home-Bildschirm legen:
              </p>

              <div className="bg-slate-800/90 p-3.5 rounded-2xl border border-slate-700/80 space-y-3">
                <div className="flex items-center space-x-3">
                  <span className="w-6 h-6 rounded-full bg-sky-500/20 text-sky-400 font-black flex items-center justify-center shrink-0 text-xs border border-sky-500/30">
                    1
                  </span>
                  <div className="flex items-center space-x-1.5 text-slate-200">
                    <span>Tippe auf</span>
                    <Share className="w-4 h-4 text-sky-400 inline" />
                    <strong className="text-white">Teilen</strong>
                    <span>(unten im Browser)</span>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <span className="w-6 h-6 rounded-full bg-sky-500/20 text-sky-400 font-black flex items-center justify-center shrink-0 text-xs border border-sky-500/30">
                    2
                  </span>
                  <div className="flex items-center space-x-1.5 text-slate-200">
                    <span>Wähle</span>
                    <PlusSquare className="w-4 h-4 text-sky-400 inline" />
                    <strong className="text-white">"Zum Home-Bildschirm"</strong>
                  </div>
                </div>
              </div>

              <p className="text-[11px] text-slate-400 text-center leading-normal">
                Die App startet danach direkt im nativen Vollbildmodus ohne Browser-Balken.
              </p>
            </div>

            <button
              onClick={() => setShowIOSGuide(false)}
              className="w-full py-2.5 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-bold text-xs rounded-xl transition-all shadow-lg shadow-sky-600/30 active:scale-98 cursor-pointer"
            >
              Verstanden
            </button>
          </div>
        </div>
      )}
    </>
  );
}

// Named alias
export const PWAInstallBanner = InstallPromptBanner;
