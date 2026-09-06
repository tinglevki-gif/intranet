import React, { useState, useEffect } from 'react';
import { Download, X, Share, PlusSquare, Smartphone, Check } from 'lucide-react';

export function PWAInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    // 1. Detect if running in standalone mode (already installed as PWA)
    const isStandaloneMode =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true ||
      document.referrer.includes('android-app://');

    setIsStandalone(isStandaloneMode);

    if (isStandaloneMode) {
      return;
    }

    // 2. Check if dismissed recently in localStorage
    const dismissedUntil = localStorage.getItem('tinglev_pwa_dismissed');
    if (dismissedUntil && Date.now() < Number(dismissedUntil)) {
      return;
    }

    // 3. Detect iOS device
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    // 4. Listen for Chrome / Android / Desktop 'beforeinstallprompt'
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // 5. Listen for appinstalled event
    const handleAppInstalled = () => {
      setInstalled(true);
      setShowBanner(false);
      setDeferredPrompt(null);
      console.log('[PWA] Tinglev Intranet wurde erfolgreich installiert!');
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    // For iOS users not yet installed, show subtle prompt after 4 seconds
    if (isIosDevice && !isStandaloneMode) {
      const timer = setTimeout(() => {
        setShowBanner(true);
      }, 3000);
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
    // Dismiss for 7 days
    localStorage.setItem('tinglev_pwa_dismissed', String(Date.now() + 7 * 24 * 60 * 60 * 1000));
  };

  if (isStandalone || !showBanner) {
    return null;
  }

  return (
    <>
      {/* Floating Install Prompt Banner */}
      <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-[9999] animate-slide-up">
        <div className="bg-slate-900/95 dark:bg-slate-900/95 text-white p-4 rounded-2xl shadow-2xl border border-sky-500/30 backdrop-blur-lg flex items-start space-x-3.5">
          {/* Tinglev App Icon */}
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-sky-600 to-blue-800 p-2 shrink-0 shadow-md flex items-center justify-center border border-sky-400/40">
            <Smartphone className="w-6 h-6 text-white" />
          </div>

          <div className="flex-1 min-w-0 pr-1">
            <div className="flex items-center space-x-1.5">
              <span className="font-bold text-sm text-white">Tinglev Intranet App</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wide bg-sky-500/20 text-sky-400 border border-sky-500/30">
                PWA
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
              {isIOS
                ? 'Als App auf Ihrem iPhone / iPad für Vollbild-Modus & Schnellzugriff installieren.'
                : 'Für schnellen Zugriff und Offline-Nutzung direkt auf Ihrem Gerät installieren.'}
            </p>

            <div className="flex items-center space-x-2 mt-3">
              <button
                onClick={handleInstallClick}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white text-xs font-bold rounded-xl shadow-md shadow-sky-500/20 transition-all active:scale-95"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{isIOS ? 'Anleitung öffnen' : 'App installieren'}</span>
              </button>
              <button
                onClick={handleDismiss}
                className="px-2.5 py-1.5 text-xs text-slate-400 hover:text-white transition-colors"
              >
                Später
              </button>
            </div>
          </div>

          <button
            onClick={handleDismiss}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Schließen"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* iOS Installation Instructions Modal */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-[10000] bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-sm w-full p-6 text-white shadow-2xl space-y-4 animate-scale-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Smartphone className="w-5 h-5 text-sky-400" />
                <h3 className="font-bold text-base">Auf iOS installieren</h3>
              </div>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs text-slate-300 space-y-3">
              <p className="leading-relaxed">
                In Safari können Sie das Tinglev Intranet mit zwei einfachen Schritten auf Ihren Home-Bildschirm legen:
              </p>

              <div className="bg-slate-800/80 p-3 rounded-2xl border border-slate-700 space-y-2.5">
                <div className="flex items-center space-x-2.5">
                  <span className="w-6 h-6 rounded-full bg-sky-500/20 text-sky-400 font-bold flex items-center justify-center shrink-0 text-xs">
                    1
                  </span>
                  <div className="flex items-center space-x-1.5 text-slate-200">
                    <span>Tippen Sie auf das</span>
                    <Share className="w-4 h-4 text-sky-400 inline" />
                    <span className="font-semibold text-white">Teilen-Symbol</span>
                  </div>
                </div>

                <div className="flex items-center space-x-2.5">
                  <span className="w-6 h-6 rounded-full bg-sky-500/20 text-sky-400 font-bold flex items-center justify-center shrink-0 text-xs">
                    2
                  </span>
                  <div className="flex items-center space-x-1.5 text-slate-200">
                    <span>Wählen Sie</span>
                    <PlusSquare className="w-4 h-4 text-sky-400 inline" />
                    <span className="font-semibold text-white">"Zum Home-Bildschirm"</span>
                  </div>
                </div>
              </div>

              <p className="text-[11px] text-slate-400 text-center">
                Danach öffnet sich das Intranet wie eine echte App im Vollbildmodus.
              </p>
            </div>

            <button
              onClick={() => setShowIOSGuide(false)}
              className="w-full py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-xl transition-colors shadow-lg shadow-sky-600/30"
            >
              Verstanden
            </button>
          </div>
        </div>
      )}
    </>
  );
}
