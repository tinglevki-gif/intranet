import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { 
  Truck, 
  MapPin, 
  Clock, 
  Navigation, 
  RotateCw, 
  ShieldCheck, 
  AlertTriangle, 
  Compass, 
  PhoneCall, 
  CheckCircle2, 
  Building2,
  Calendar,
  Layers,
  ArrowRight
} from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1' ? '/api/v1' : 'http://127.0.0.1:8000/api/v1');

function createLiveTruckIcon(speed, plate) {
  const isMoving = (speed || 0) > 0;
  const iconHtml = `
    <div class="relative flex items-center justify-center w-12 h-12">
      ${isMoving ? '<span class="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping"></span>' : ''}
      <div class="relative inline-flex items-center justify-center w-10 h-10 rounded-2xl ${isMoving ? 'bg-gradient-to-tr from-emerald-600 to-teal-400' : 'bg-gradient-to-tr from-slate-700 to-blue-600'} text-white shadow-xl border-2 border-white ring-2 ring-emerald-500/40">
        <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
          <path stroke-linecap="round" stroke-linejoin="round" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
        </svg>
      </div>
    </div>
  `;
  return L.divIcon({
    html: iconHtml,
    className: 'custom-live-truck-marker',
    iconSize: [48, 48],
    iconAnchor: [24, 24],
    popupAnchor: [0, -20]
  });
}

function createDestinationCraneIcon(destName) {
  const iconHtml = `
    <div class="relative flex items-center justify-center w-11 h-11" title="${destName}">
      <div class="inline-flex items-center justify-center w-9 h-9 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-xl border-2 border-white ring-2 ring-blue-500/40">
        <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      </div>
    </div>
  `;
  return L.divIcon({
    html: iconHtml,
    className: 'custom-dest-marker',
    iconSize: [44, 44],
    iconAnchor: [22, 22],
    popupAnchor: [0, -18]
  });
}

export function PublicTrackingPage() {
  const { token } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [countdown, setCountdown] = useState(30);

  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const layerGroupRef = useRef(null);

  const fetchTrackingData = async (showLoading = false) => {
    if (showLoading) setIsRefreshing(true);
    try {
      const res = await fetch(`${API_BASE_URL}/public/track/${token}`);
      if (res.status === 404) {
        setError('Ungültiger Tracking-Link. Diese Freigabe existiert nicht.');
        setData(null);
        return;
      }
      if (res.status === 410) {
        setError('Dieser Tracking-Link ist abgelaufen oder wurde von der Logistik-Disposition widerrufen.');
        setData(null);
        return;
      }
      if (!res.ok) {
        setError('Telemetriedaten können aktuell nicht abgerufen werden.');
        return;
      }
      const json = await res.json();
      setData(json);
      setError(null);
    } catch (err) {
      console.error('Tracking fetch error:', err);
      setError('Verbindung zum Intranet-Server fehlgeschlagen.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
      setCountdown(30);
    }
  };

  useEffect(() => {
    fetchTrackingData(false);
  }, [token]);

  // 30s auto-refresh
  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          fetchTrackingData(false);
          return 30;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [token]);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      zoomControl: true,
      attributionControl: false
    }).setView([52.5272, 13.8052], 11);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap'
    }).addTo(map);

    const layerGroup = L.layerGroup().addTo(map);
    layerGroupRef.current = layerGroup;
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [data]);

  // Update Markers & Route Line on Map
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layerGroup = layerGroupRef.current;
    if (!map || !layerGroup || !data) return;

    layerGroup.clearLayers();

    // 1. Truck Marker
    const truckMarker = L.marker([data.current_lat, data.current_lon], {
      icon: createLiveTruckIcon(data.current_speed, data.plate)
    }).addTo(layerGroup);

    truckMarker.bindPopup(`
      <div class="p-3 space-y-1.5 min-w-[200px] text-xs">
        <span class="px-2 py-0.5 rounded bg-slate-900 text-white font-mono font-bold">${data.plate}</span>
        <h4 class="font-extrabold text-sm text-slate-900 mt-1">${data.brand || 'Schwerlastzug'}</h4>
        <p class="text-slate-500 text-[11px]">Geschwindigkeit: <strong>${data.current_speed} km/h</strong></p>
      </div>
    `);

    // 2. Destination Marker
    const destMarker = L.marker([data.destination_lat, data.destination_lon], {
      icon: createDestinationCraneIcon(data.destination_name)
    }).addTo(layerGroup);

    destMarker.bindPopup(`
      <div class="p-3 space-y-1 min-w-[200px] text-xs">
        <span class="px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-bold text-[10px]">Zielbaustelle</span>
        <h4 class="font-extrabold text-sm text-slate-900">${data.destination_name}</h4>
      </div>
    `);

    // 3. Dashed line between truck and destination
    const polyline = L.polyline(
      [
        [data.current_lat, data.current_lon],
        [data.destination_lat, data.destination_lon]
      ],
      {
        color: '#2563eb',
        weight: 3,
        dashArray: '8, 8',
        opacity: 0.75
      }
    ).addTo(layerGroup);

    // Fit bounds with padding
    const bounds = L.latLngBounds([
      [data.current_lat, data.current_lon],
      [data.destination_lat, data.destination_lon]
    ]);
    map.fitBounds(bounds, { padding: [60, 60], maxZoom: 14 });

  }, [data]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center mx-auto text-blue-400">
            <RotateCw className="w-8 h-8 animate-spin" />
          </div>
          <p className="text-white font-extrabold text-sm tracking-wide">Live-Lieferdaten werden geladen...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-md w-full text-center space-y-5 shadow-2xl">
          <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto text-red-400">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white">Tracking nicht verfügbar</h2>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">{error}</p>
          </div>
          <div className="pt-2">
            <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/60 text-xs text-slate-300 space-y-2 text-left">
              <p className="font-bold text-white flex items-center space-x-1.5">
                <Building2 className="w-4 h-4 text-blue-400" />
                <span>Tinglev Elementfabrik GmbH</span>
              </p>
              <p className="text-[11px] text-slate-400">Disposition & Werk Altlandsberg-Bruchmühle</p>
              <p className="text-[11px] text-blue-400 font-mono">Zentrale: +49 (0) 33438 642-0</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col antialiased">
      {/* 1. Header Bar */}
      <header className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800/80 px-4 py-3.5 sticky top-0 z-50 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-400 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xs font-black text-white uppercase tracking-wider">Tinglev Elementfabrik</h1>
            <p className="text-[10px] text-slate-400 font-medium">Live-Lieferverfolgung • Baustelle</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[10px] font-bold text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            <span>Live Telemetrie</span>
          </div>

          <button
            onClick={() => fetchTrackingData(true)}
            disabled={isRefreshing}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title="Jetzt aktualisieren"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </header>

      {/* 2. Main Mobile-First Content */}
      <main className="flex-1 max-w-2xl w-full mx-auto p-4 space-y-4">
        {/* ETA Hero Card */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-blue-950/70 rounded-3xl p-6 border border-slate-800 shadow-2xl relative overflow-hidden space-y-5">
          {/* Subtle Ambient Glow */}
          <div className="absolute -top-16 -right-16 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Destination Header */}
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-400">Zielbaustelle</span>
              <h2 className="text-lg sm:text-xl font-black text-white mt-0.5">{data.destination_name}</h2>
            </div>
            <span className="px-3 py-1 rounded-xl bg-slate-800 text-slate-200 font-mono font-black text-xs border border-slate-700">
              {data.plate}
            </span>
          </div>

          {/* Big ETA Display */}
          <div className="bg-slate-950/60 rounded-2xl p-5 border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-[11px] text-slate-400 font-semibold block">Voraussichtliche Ankunftszeit (ETA):</span>
              <p className="text-3xl sm:text-4xl font-black text-white tracking-tight mt-1 text-emerald-400">
                {data.estimated_arrival_time}
              </p>
              <p className="text-xs text-slate-400 font-medium mt-1 flex items-center space-x-1.5">
                <Clock className="w-3.5 h-3.5 text-blue-400" />
                <span>
                  {data.duration_remaining_minutes > 0
                    ? `Fahrzeit: noch ca. ${data.duration_remaining_minutes} Minuten`
                    : 'Fahrzeug trifft ein / vor Ort'}
                </span>
              </p>
            </div>

            <div className="bg-slate-900/90 p-3.5 rounded-2xl border border-slate-800 sm:text-right shrink-0">
              <span className="text-[10px] text-slate-400 block font-semibold">Restdistanz:</span>
              <p className="text-2xl font-black text-blue-400 font-mono mt-0.5">{data.distance_remaining_km} km</p>
              <span className="text-[10px] text-slate-400 block mt-0.5 font-medium">
                {data.is_moving ? `In Fahrt (${data.current_speed} km/h)` : 'Stehend / Rangieren'}
              </span>
            </div>
          </div>

          {/* Delivery Elements info / Notes */}
          {data.notes && (
            <div className="bg-blue-500/10 border border-blue-500/20 p-3.5 rounded-2xl text-xs text-blue-200">
              <span className="font-bold text-blue-300 block mb-0.5">Hinweis für Bauleitung / Mobilkran:</span>
              <p>{data.notes}</p>
            </div>
          )}
        </div>

        {/* 3. Interactive Leaflet Map Card */}
        <div className="bg-slate-900 rounded-3xl p-3 border border-slate-800 shadow-xl space-y-3">
          <div className="flex items-center justify-between px-2 pt-1">
            <span className="text-xs font-bold text-slate-300 flex items-center space-x-1.5">
              <MapPin className="w-3.5 h-3.5 text-blue-400" />
              <span>Live-Standort LKW & Baustelle</span>
            </span>
            <span className="text-[10px] text-slate-500">Auto-Update in {countdown}s</span>
          </div>

          <div className="h-72 sm:h-96 w-full rounded-2xl overflow-hidden border border-slate-800 relative">
            <div ref={mapContainerRef} className="w-full h-full" />
          </div>
        </div>

        {/* 4. Safety & Expiry Footer */}
        <div className="bg-slate-900/60 rounded-2xl p-4 border border-slate-800/80 text-[11px] text-slate-400 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Sicherer temporärer Baustellen-Link • Keine internen Daten</span>
          </div>
          <div className="text-slate-500 text-[10px]">
            Gültig bis: {new Date(data.expires_at).toLocaleString('de-DE', { dateStyle: 'short', timeStyle: 'short' })} Uhr
          </div>
        </div>
      </main>
    </div>
  );
}
