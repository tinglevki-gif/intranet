import React, { useState, useEffect } from 'react';
import { RefreshCw, Sparkles, X, ArrowUpCircle } from 'lucide-react';

export function PWAUpdateToast() {
  const [showToast, setShowToast] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    // 1. Listen for custom swUpdated event emitted by serviceWorkerRegistration
    const handleSWUpdate = (e) => {
      const registration = e.detail?.registration;
      if (registration && registration.waiting) {
        setWaitingWorker(registration.waiting);
        setShowToast(true);
      } else {
        setShowToast(true);
      }
    };

    window.addEventListener('swUpdated', handleSWUpdate);

    // 2. Check directly if service worker has a waiting worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then((reg) => {
        if (reg && reg.waiting) {
          setWaitingWorker(reg.waiting);
          setShowToast(true);
        }
      });
    }

    return () => {
      window.removeEventListener('swUpdated', handleSWUpdate);
    };
  }, []);

  const handleReload = () => {
    setIsUpdating(true);
    if (waitingWorker) {
      waitingWorker.postMessage({ type: 'SKIP_WAITING' });
    } else {
      window.location.reload();
    }
  };

  if (!showToast) {
    return null;
  }

  return (
    <div className="fixed top-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-[10001] animate-bounce-subtle">
      <div className="bg-slate-900/95 dark:bg-slate-900/95 text-white p-4 rounded-3xl shadow-2xl border border-sky-500/40 backdrop-blur-xl flex items-center justify-between space-x-3.5 ring-2 ring-sky-500/30">
        <div className="flex items-center space-x-3 min-w-0">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-500 to-blue-600 flex items-center justify-center text-white shrink-0 shadow-md">
            <RefreshCw className={`w-5 h-5 ${isUpdating ? 'animate-spin' : ''}`} />
          </div>

          <div className="min-w-0">
            <div className="flex items-center space-x-1.5">
              <span className="font-extrabold text-xs text-white">App-Update verfügbar</span>
              <span className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Neu
              </span>
            </div>
            <p className="text-[11px] text-slate-300 truncate mt-0.5">
              Eine neue Version der Intranet-App ist verfügbar.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-1.5 shrink-0">
          <button
            onClick={handleReload}
            disabled={isUpdating}
            className="flex items-center space-x-1 px-3 py-1.5 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white text-xs font-bold rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
          >
            <RefreshCw className={`w-3 h-3 ${isUpdating ? 'animate-spin' : ''}`} />
            <span>{isUpdating ? 'Lädt...' : 'Neu laden'}</span>
          </button>

          <button
            onClick={() => setShowToast(false)}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Schließen"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
