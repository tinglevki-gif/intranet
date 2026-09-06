import React, { useState, useEffect, useRef } from 'react';
import { 
  Truck, 
  MapPin, 
  Navigation, 
  Share2, 
  Wrench, 
  Clock, 
  Gauge, 
  X, 
  ChevronUp, 
  ChevronDown, 
  ExternalLink,
  Shield,
  Building2,
  Calendar
} from 'lucide-react';

export function VehicleBottomSheet({
  vehicle,
  isOpen,
  onClose,
  onOpenTracking,
  onPlanMaintenance
}) {
  const [sheetState, setSheetState] = useState('PEEK'); // 'PEEK' | 'EXPANDED'
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartY, setDragStartY] = useState(0);
  const [dragCurrentY, setDragCurrentY] = useState(0);
  const sheetRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setSheetState('PEEK');
    }
  }, [isOpen, vehicle?.id]);

  if (!isOpen || !vehicle) {
    return null;
  }

  const isMoving = (vehicle.speed || 0) > 0;
  const dispatch = vehicle.dispatch_status;

  // Touch Drag Handlers
  const handleTouchStart = (e) => {
    setIsDragging(true);
    setDragStartY(e.touches[0].clientY);
    setDragCurrentY(e.touches[0].clientY);
  };

  const handleTouchMove = (e) => {
    if (!isDragging) return;
    setDragCurrentY(e.touches[0].clientY);
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);
    const deltaY = dragCurrentY - dragStartY;

    // Swiped Up significantly -> Expand
    if (deltaY < -40) {
      setSheetState('EXPANDED');
    }
    // Swiped Down significantly -> Peek or Close
    else if (deltaY > 50) {
      if (sheetState === 'EXPANDED') {
        setSheetState('PEEK');
      } else {
        onClose();
      }
    }
  };

  const toggleExpand = () => {
    setSheetState(prev => prev === 'PEEK' ? 'EXPANDED' : 'PEEK');
  };

  const openGoogleMaps = () => {
    if (!vehicle.lat || !vehicle.lon) return;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${vehicle.lat},${vehicle.lon}`;
    window.open(url, '_blank');
  };

  const openAppleMaps = () => {
    if (!vehicle.lat || !vehicle.lon) return;
    const url = `https://maps.apple.com/?daddr=${vehicle.lat},${vehicle.lon}`;
    window.open(url, '_blank');
  };

  return (
    <>
      {/* Backdrop overlay only when in full EXPANDED mode */}
      {sheetState === 'EXPANDED' && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-xs md:hidden transition-opacity"
          onClick={() => setSheetState('PEEK')}
        />
      )}

      {/* Touch Drawer / Bottom Sheet Container */}
      <div
        ref={sheetRef}
        className={`fixed left-0 right-0 z-50 md:hidden bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border-t border-slate-200/90 dark:border-slate-800 shadow-2xl rounded-t-3xl transition-all duration-300 ease-out flex flex-col ${
          sheetState === 'EXPANDED'
            ? 'bottom-0 max-h-[82dvh] h-[82dvh]'
            : 'bottom-16 max-h-[140px]'
        }`}
      >
        {/* 1. Drag Handle & Header */}
        <div
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onClick={toggleExpand}
          className="pt-3 pb-2 px-4 cursor-pointer select-none shrink-0"
        >
          {/* Drag Pill */}
          <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mb-2.5 transition-colors" />

          {/* Compact Peek Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-600 to-blue-800 text-white flex items-center justify-center shrink-0 shadow-md">
                <Truck className="w-5 h-5" />
              </div>

              <div className="min-w-0">
                <div className="flex items-center space-x-2">
                  <span className="font-black text-sm text-slate-900 dark:text-white font-mono tracking-tight">
                    {vehicle.plate}
                  </span>
                  {isMoving ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/30 flex items-center space-x-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                      <span>{vehicle.speed} km/h</span>
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                      Stillstand
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                  {vehicle.brand || 'Betonfertigteile-Transporter'}
                </p>
              </div>
            </div>

            {/* Quick action / close buttons */}
            <div className="flex items-center space-x-1.5 shrink-0" onClick={e => e.stopPropagation()}>
              <button
                onClick={toggleExpand}
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 transition-colors"
                title={sheetState === 'EXPANDED' ? 'Einklappen' : 'Details öffnen'}
              >
                {sheetState === 'EXPANDED' ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
              </button>
              <button
                onClick={onClose}
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors"
                title="Schließen"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* 2. Expanded Details Content */}
        {sheetState === 'EXPANDED' && (
          <div className="flex-1 overflow-y-auto px-4 pb-6 pt-2 space-y-4">
            {/* Dispatch Status Card */}
            {dispatch && (
              <div className="bg-gradient-to-r from-sky-50 to-blue-50 dark:from-sky-950/30 dark:to-blue-950/30 p-3.5 rounded-2xl border border-sky-200/80 dark:border-sky-800/60 text-xs">
                <span className="text-[10px] font-bold text-sky-600 dark:text-sky-400 uppercase tracking-wider block mb-1">
                  Disponenten-Status
                </span>
                <p className="font-bold text-slate-900 dark:text-white text-sm">
                  {dispatch.label}
                </p>
                {dispatch.site_name && (
                  <p className="text-slate-600 dark:text-slate-300 mt-0.5 font-medium">
                    Standort / Ziel: {dispatch.site_name}
                  </p>
                )}
              </div>
            )}

            {/* Primary Telemetry Grid */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="bg-slate-50 dark:bg-slate-800/70 p-3 rounded-2xl border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider block">
                  Kilometerstand
                </span>
                <p className="text-base font-black text-slate-900 dark:text-white font-mono mt-0.5">
                  {vehicle.mileage ? `${Number(vehicle.mileage).toLocaleString('de-DE')} km` : '–'}
                </p>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/70 p-3 rounded-2xl border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider block">
                  Geschwindigkeit
                </span>
                <p className="text-base font-black text-slate-900 dark:text-white font-mono mt-0.5">
                  {vehicle.speed || 0} km/h
                </p>
              </div>
            </div>

            {/* Current Address / GPS Position */}
            <div className="bg-slate-50 dark:bg-slate-800/70 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 text-xs space-y-1">
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider block">
                Aktueller Standort
              </span>
              <p className="font-semibold text-slate-800 dark:text-slate-200">
                {vehicle.location || 'Standort wird ermittelt...'}
              </p>
              <p className="text-[10px] text-slate-400 font-mono">
                GPS: {vehicle.lat?.toFixed(5)}, {vehicle.lon?.toFixed(5)}
              </p>
            </div>

            {/* Mobile Action Buttons (Maps, Live-Link, Wartung) */}
            <div className="space-y-2 pt-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block px-1">
                Aktionen & Navigation
              </span>

              {/* Navigation in Google / Apple Maps */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={openGoogleMaps}
                  className="flex items-center justify-center space-x-2 py-3 px-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-500/20 active:scale-98 transition-all"
                >
                  <Navigation className="w-4 h-4" />
                  <span>Google Maps</span>
                </button>

                <button
                  onClick={openAppleMaps}
                  className="flex items-center justify-center space-x-2 py-3 px-3 rounded-2xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white font-bold text-xs border border-slate-700 active:scale-98 transition-all"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Apple Maps</span>
                </button>
              </div>

              {/* Share Live Tracking Link */}
              <button
                onClick={() => {
                  if (onOpenTracking) onOpenTracking(vehicle.id);
                }}
                className="w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-500/20 active:scale-98 transition-all"
              >
                <Share2 className="w-4 h-4" />
                <span>Live-Tracking-Link für Baustelle erstellen</span>
              </button>

              {/* Plan Maintenance */}
              {onPlanMaintenance && (
                <button
                  onClick={() => onPlanMaintenance(vehicle)}
                  className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 rounded-2xl bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-semibold text-xs active:scale-98 transition-all"
                >
                  <Wrench className="w-4 h-4 text-amber-500" />
                  <span>Wartungsintervall einsehen / planen</span>
                </button>
              )}
            </div>

            <div className="text-[10px] text-slate-400 text-center pt-2">
              Zuletzt synchronisiert: {vehicle.timestamp ? vehicle.timestamp.substring(11, 19) + ' Uhr' : 'Echtzeit-Telemetrie'}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
