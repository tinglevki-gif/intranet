import React, { useState, useEffect } from 'react';
import { 
  Smartphone, 
  Download, 
  X, 
  Share, 
  PlusSquare, 
  QrCode, 
  Check, 
  Copy, 
  ExternalLink, 
  Sparkles, 
  CheckCircle2, 
  Apple, 
  Layers
} from 'lucide-react';
import { useModalClose } from '../../hooks/useModalClose';

export function PWAInstallModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('ios'); // 'ios' | 'android' | 'qrcode'
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [copied, setCopied] = useState(false);
  const [installedSuccess, setInstalledSuccess] = useState(false);

  useModalClose(isOpen, () => setIsOpen(false));

  useEffect(() => {
    // 1. Detect standalone mode
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true ||
      document.referrer.includes('android-app://');
    setIsStandalone(standalone);

    // 2. Detect platform
    const userAgent = window.navigator.userAgent.toLowerCase();
    const iosDevice = /iphone|ipad|ipod/.test(userAgent);
    const androidDevice = /android/.test(userAgent);

    setIsIOS(iosDevice);
    setIsAndroid(androidDevice);

    if (iosDevice) {
      setActiveTab('ios');
    } else if (androidDevice) {
      setActiveTab('android');
    } else {
      setActiveTab('qrcode');
    }

    // 3. Catch beforeinstallprompt event
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      window.__pwaDeferredPrompt = e;
    };

    // Check if global prompt already exists
    if (window.__pwaDeferredPrompt) {
      setDeferredPrompt(window.__pwaDeferredPrompt);
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // 4. Listen for open-pwa-install-modal custom event
    const handleOpenModal = (event) => {
      if (event?.detail?.tab) {
        setActiveTab(event.detail.tab);
      }
      setIsOpen(true);
    };

    window.addEventListener('open-pwa-install-modal', handleOpenModal);

    // 5. App installed listener
    const handleAppInstalled = () => {
      setInstalledSuccess(true);
      setDeferredPrompt(null);
      window.__pwaDeferredPrompt = null;
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('open-pwa-install-modal', handleOpenModal);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallAndroidClick = async () => {
    const prompt = deferredPrompt || window.__pwaDeferredPrompt;
    if (prompt) {
      prompt.prompt();
      const { outcome } = await prompt.userChoice;
      if (outcome === 'accepted') {
        setInstalledSuccess(true);
      }
      setDeferredPrompt(null);
      window.__pwaDeferredPrompt = null;
    } else {
      setActiveTab('android');
    }
  };

  const handleCopyUrl = () => {
    const url = window.location.origin;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  if (!isOpen) return null;

  const currentUrl = window.location.origin;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=8&data=${encodeURIComponent(currentUrl)}`;

  return (
    <div 
      className="fixed inset-0 z-[10000] bg-slate-950/80 backdrop-blur-md flex items-end sm:items-center justify-center p-3 sm:p-6 animate-fade-in"
      onClick={() => setIsOpen(false)}
    >
      <div 
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with gradient branding */}
        <div className="bg-gradient-to-r from-sky-600 via-blue-700 to-indigo-800 p-5 text-white relative">
          <button
            onClick={() => setIsOpen(false)}
            className="absolute top-4 right-4 p-2 rounded-2xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            title="Schließen"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center space-x-3.5 pr-8">
            <div className="w-12 h-12 rounded-2xl bg-white/15 p-2 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-lg shrink-0">
              <Smartphone className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-black tracking-tight text-white">Tinglev Intranet App</h2>
                <span className="px-2 py-0.5 rounded-full bg-white/20 text-[10px] font-black uppercase tracking-wider backdrop-blur-xs">
                  PWA
                </span>
              </div>
              <p className="text-xs text-sky-100 mt-0.5">
                Direktzugriff auf iOS & Android ohne App Store
              </p>
            </div>
          </div>

          {isStandalone && (
            <div className="mt-3 py-1 px-3 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center space-x-2 text-xs text-emerald-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
              <span>Die App läuft bereits im installierten Vollbild-Modus!</span>
            </div>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 px-3 pt-2 gap-1 overflow-x-auto">
          <button
            onClick={() => setActiveTab('ios')}
            className={`flex items-center space-x-2 py-2.5 px-4 font-bold text-xs rounded-t-2xl border-t border-x transition-all shrink-0 cursor-pointer ${
              activeTab === 'ios'
                ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 border-slate-200 dark:border-slate-800 -mb-px shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white border-transparent'
            }`}
          >
            <Apple className="w-4 h-4" />
            <span>iOS (iPhone / iPad)</span>
            {isIOS && <span className="w-2 h-2 rounded-full bg-sky-500"></span>}
          </button>

          <button
            onClick={() => setActiveTab('android')}
            className={`flex items-center space-x-2 py-2.5 px-4 font-bold text-xs rounded-t-2xl border-t border-x transition-all shrink-0 cursor-pointer ${
              activeTab === 'android'
                ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 border-slate-200 dark:border-slate-800 -mb-px shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white border-transparent'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>Android (Chrome)</span>
            {isAndroid && <span className="w-2 h-2 rounded-full bg-sky-500"></span>}
          </button>

          <button
            onClick={() => setActiveTab('qrcode')}
            className={`flex items-center space-x-2 py-2.5 px-4 font-bold text-xs rounded-t-2xl border-t border-x transition-all shrink-0 cursor-pointer ${
              activeTab === 'qrcode'
                ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 border-slate-200 dark:border-slate-800 -mb-px shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white border-transparent'
            }`}
          >
            <QrCode className="w-4 h-4" />
            <span>QR-Code / Mobil-Link</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {/* TAB 1: iOS */}
          {activeTab === 'ios' && (
            <div className="space-y-4 animate-fade-in">
              <div className="bg-sky-50 dark:bg-sky-950/40 p-3.5 rounded-2xl border border-sky-100 dark:border-sky-900/40 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                Auf dem iPhone oder iPad wird die App über <strong>Safari</strong> direkt auf den Startbildschirm gelegt.
              </div>

              <div className="space-y-3">
                {/* Step 1 */}
                <div className="flex items-start space-x-3.5 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
                  <div className="w-7 h-7 rounded-xl bg-sky-600 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                    1
                  </div>
                  <div className="flex-1 text-xs">
                    <p className="font-bold text-slate-900 dark:text-white">
                      Teilen-Button antippen
                    </p>
                    <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                      Tippen Sie in Safari unten auf das Symbol mit dem Viereck und dem Pfeil nach oben:
                    </p>
                    <div className="mt-2 inline-flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 font-semibold text-slate-800 dark:text-white shadow-xs">
                      <Share className="w-4 h-4 text-sky-500" />
                      <span>Teilen / Compartir</span>
                    </div>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="flex items-start space-x-3.5 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
                  <div className="w-7 h-7 rounded-xl bg-sky-600 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                    2
                  </div>
                  <div className="flex-1 text-xs">
                    <p className="font-bold text-slate-900 dark:text-white">
                      "Zum Home-Bildschirm" wählen
                    </p>
                    <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                      Scrollen Sie im Teilen-Menü etwas nach unten und wählen Sie:
                    </p>
                    <div className="mt-2 inline-flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 font-semibold text-slate-800 dark:text-white shadow-xs">
                      <PlusSquare className="w-4 h-4 text-sky-500" />
                      <span>Zum Home-Bildschirm (Add to Home Screen)</span>
                    </div>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="flex items-start space-x-3.5 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
                  <div className="w-7 h-7 rounded-xl bg-sky-600 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                    3
                  </div>
                  <div className="flex-1 text-xs">
                    <p className="font-bold text-slate-900 dark:text-white">
                      "Hinzufügen" bestätigen
                    </p>
                    <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                      Tippen Sie oben rechts auf <strong>Hinzufügen</strong>. Das App-Icon erscheint sofort auf Ihrem Display.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Android */}
          {activeTab === 'android' && (
            <div className="space-y-4 animate-fade-in">
              {(deferredPrompt || window.__pwaDeferredPrompt) ? (
                <div className="p-4 rounded-2xl bg-gradient-to-r from-sky-500/10 to-blue-500/10 border border-sky-300 dark:border-sky-700/60 text-center space-y-3">
                  <div className="w-12 h-12 mx-auto rounded-2xl bg-sky-600 text-white flex items-center justify-center shadow-lg">
                    <Download className="w-6 h-6 animate-bounce" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                      Direkt-Installation verfügbar
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Ihr Browser unterstützt die 1-Klick Installation für Android.
                    </p>
                  </div>
                  <button
                    onClick={handleInstallAndroidClick}
                    className="w-full py-3 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-sky-500/30 transition-all active:scale-98 cursor-pointer flex items-center justify-center space-x-2"
                  >
                    <Download className="w-4 h-4" />
                    <span>Jetzt als App installieren</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="bg-sky-50 dark:bg-sky-950/40 p-3.5 rounded-2xl border border-sky-100 dark:border-sky-900/40 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                    Öffnen Sie das Intranet im <strong>Google Chrome</strong> oder Samsung Internet Browser auf Ihrem Android-Gerät:
                  </div>

                  <div className="flex items-start space-x-3.5 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
                    <div className="w-7 h-7 rounded-xl bg-sky-600 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                      1
                    </div>
                    <div className="flex-1 text-xs">
                      <p className="font-bold text-slate-900 dark:text-white">
                        Menü (Drei Punkte ⋮) antippen
                      </p>
                      <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                        Tippen Sie oben rechts in Google Chrome auf das Drei-Punkte-Menü.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3.5 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
                    <div className="w-7 h-7 rounded-xl bg-sky-600 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                      2
                    </div>
                    <div className="flex-1 text-xs">
                      <p className="font-bold text-slate-900 dark:text-white">
                        "App installieren" oder "Zum Startbildschirm"
                      </p>
                      <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                        Wählen Sie den Menüpunkt <strong>"App installieren"</strong> oder <strong>"Zum Startbildschirm hinzufügen"</strong>.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: QR Code & Mobile URL */}
          {activeTab === 'qrcode' && (
            <div className="space-y-4 animate-fade-in text-center">
              <p className="text-xs text-slate-600 dark:text-slate-300">
                Scannen Sie diesen QR-Code mit der Kamera Ihres <strong>iPhones oder Android-Smartphones</strong>, um die Intranet-App mobil aufzurufen und zu installieren:
              </p>

              <div className="inline-block p-3 rounded-2xl bg-white border border-slate-200 dark:border-slate-700 shadow-md">
                <img
                  src={qrCodeUrl}
                  alt="Intranet QR Code"
                  className="w-48 h-48 mx-auto rounded-xl"
                  onError={(e) => {
                    // Fallback if external image service is blocked offline
                    e.target.style.display = 'none';
                  }}
                />
              </div>

              {/* URL Display & Copy */}
              <div className="flex items-center space-x-2 max-w-sm mx-auto">
                <div className="flex-1 bg-slate-100 dark:bg-slate-800 px-3 py-2 rounded-xl text-xs font-mono text-slate-700 dark:text-slate-300 truncate border border-slate-200 dark:border-slate-700">
                  {currentUrl}
                </div>
                <button
                  onClick={handleCopyUrl}
                  className="px-3 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 shadow-sm active:scale-95 cursor-pointer shrink-0"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-300" />
                      <span>Kopiert!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Kopieren</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* App Advantages summary footer */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-3 gap-2 text-center">
            <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
              <span className="text-[10px] font-bold text-sky-600 dark:text-sky-400 block">⚡ Sofortstart</span>
              <span className="text-[9px] text-slate-400">Direkt vom Homescreen</span>
            </div>
            <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
              <span className="text-[10px] font-bold text-sky-600 dark:text-sky-400 block">📱 Vollbild</span>
              <span className="text-[9px] text-slate-400">Ohne Browser-Leiste</span>
            </div>
            <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
              <span className="text-[10px] font-bold text-sky-600 dark:text-sky-400 block">🔄 Live-Sync</span>
              <span className="text-[9px] text-slate-400">GPS & Mitteilungen</span>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900/80 border-t border-slate-200 dark:border-slate-800 flex justify-end">
          <button
            onClick={() => setIsOpen(false)}
            className="px-5 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all cursor-pointer"
          >
            Schließen
          </button>
        </div>
      </div>
    </div>
  );
}
