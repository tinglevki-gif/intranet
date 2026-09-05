import React, { useState, useEffect, useRef, useMemo } from 'react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { 
  Navigation, 
  Truck, 
  MapPin, 
  Gauge, 
  Radio, 
  RotateCw, 
  Search, 
  Layers, 
  Maximize2, 
  Building2, 
  Activity,
  CheckCircle2,
  Clock,
  Compass,
  Zap,
  Info
} from 'lucide-react';
import { api } from '../services/api';
import { useLanguage } from '../context/LanguageContext';

// Company HQ Coordinates (Tinglev Elementfabrik GmbH - Zentrale & Werk Altlandsberg-Bruchmühle)
const TINGLEV_HQ = {
  lat: 52.5272,
  lon: 13.8052,
  name: 'Tinglev Elementfabrik GmbH (Zentrale & Werk)',
  address: 'Am Gewerbepark 8A, 15345 Altlandsberg-Bruchmühle'
};

// Create custom SVG HTML Icon for Leaflet
function createTruckDivIcon(speed, plate) {
  const isMoving = (speed || 0) > 0;
  
  const iconHtml = isMoving 
    ? `
      <div class="relative flex items-center justify-center w-11 h-11 truck-marker-moving" title="${plate} - In Fahrt (${speed} km/h)">
        <span class="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-70 animate-ping"></span>
        <div class="relative inline-flex items-center justify-center w-9 h-9 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 text-white shadow-lg border-2 border-white ring-2 ring-emerald-500/40">
          <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
            <path stroke-linecap="round" stroke-linejoin="round" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
          </svg>
        </div>
      </div>
    `
    : `
      <div class="relative flex items-center justify-center w-10 h-10 truck-marker-parked" title="${plate} - Geparkt">
        <div class="relative inline-flex items-center justify-center w-8 h-8 rounded-2xl bg-gradient-to-tr from-slate-700 to-blue-600 text-white shadow-md border-2 border-white ring-2 ring-blue-500/30">
          <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
            <path stroke-linecap="round" stroke-linejoin="round" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
          </svg>
        </div>
      </div>
    `;

  return L.divIcon({
    html: iconHtml,
    className: 'custom-truck-marker',
    iconSize: isMoving ? [44, 44] : [40, 40],
    iconAnchor: isMoving ? [22, 22] : [20, 20],
    popupAnchor: [0, -18]
  });
}

function createHqDivIcon() {
  const iconHtml = `
    <div class="relative flex items-center justify-center w-10 h-10" title="Werk Tinglev (Zentrale)">
      <div class="inline-flex items-center justify-center w-8 h-8 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white shadow-lg border-2 border-white ring-2 ring-orange-500/40">
        <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      </div>
    </div>
  `;
  return L.divIcon({
    html: iconHtml,
    className: 'custom-hq-marker',
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -16]
  });
}

export function GpsPage() {
  const { t } = useLanguage();
  const [vehicles, setVehicles] = useState([]);
  const [isLive, setIsLive] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [countdown, setCountdown] = useState(45);
  const [filterStatus, setFilterStatus] = useState('ALL'); // 'ALL' | 'IN_MOTION' | 'PARKED'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState(null);

  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersGroupRef = useRef(null);
  const markersMapRef = useRef(new Map());

  // Load telemetry data from Backend API
  const fetchFleetTelemetry = async (forceRefresh = false) => {
    if (forceRefresh) setIsRefreshing(true);
    try {
      const data = await api.getFleetVehicles(forceRefresh);
      if (data && Array.isArray(data.vehicles)) {
        setVehicles(data.vehicles);
        setIsLive(data.is_live);
        setLastUpdated(new Date());
      }
    } catch (err) {
      console.error('Fehler beim Laden der Fahrzeugtelemetrie:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
      setCountdown(45);
    }
  };

  // Initial load
  useEffect(() => {
    fetchFleetTelemetry(false);
  }, []);

  // 45-Second Interval Countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          fetchFleetTelemetry(false);
          return 45;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Filtered vehicles
  const filteredVehicles = useMemo(() => {
    return vehicles.filter((v) => {
      const isMoving = (v.speed || 0) > 0;
      const matchesStatus = 
        filterStatus === 'ALL' ||
        (filterStatus === 'IN_MOTION' && isMoving) ||
        (filterStatus === 'PARKED' && !isMoving);

      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = 
        !q ||
        (v.plate && v.plate.toLowerCase().includes(q)) ||
        (v.brand && v.brand.toLowerCase().includes(q)) ||
        (v.location && v.location.toLowerCase().includes(q));

      return matchesStatus && matchesSearch;
    });
  }, [vehicles, filterStatus, searchQuery]);

  // Statistics KPIs
  const stats = useMemo(() => {
    const total = vehicles.length;
    const inMotion = vehicles.filter((v) => (v.speed || 0) > 0);
    const inMotionCount = inMotion.length;
    const parkedCount = total - inMotionCount;
    const avgSpeed = inMotionCount > 0 
      ? Math.round(inMotion.reduce((acc, v) => acc + (v.speed || 0), 0) / inMotionCount) 
      : 0;

    return { total, inMotionCount, parkedCount, avgSpeed };
  }, [vehicles]);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    // Initialize Map instance
    const map = L.map(mapContainerRef.current, {
      center: [TINGLEV_HQ.lat, TINGLEV_HQ.lon],
      zoom: 9,
      zoomControl: true,
      attributionControl: false
    });

    // Add OpenStreetMap tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    // Layer group for vehicle markers
    const markersGroup = L.layerGroup().addTo(map);
    markersGroupRef.current = markersGroup;
    mapInstanceRef.current = map;

    // Add HQ Marker
    const hqMarker = L.marker([TINGLEV_HQ.lat, TINGLEV_HQ.lon], {
      icon: createHqDivIcon()
    }).addTo(map);

    hqMarker.bindPopup(`
      <div class="p-3.5 space-y-1.5 min-w-[210px] text-xs">
        <div class="flex items-center space-x-2">
          <span class="px-2 py-0.5 rounded-lg bg-orange-100 text-orange-800 font-bold text-[10px]">Hauptsitz</span>
          <span class="font-extrabold text-slate-900">${TINGLEV_HQ.name}</span>
        </div>
        <p class="text-slate-500 font-medium text-[11px]">${TINGLEV_HQ.address}</p>
        <div class="pt-1 text-[10px] text-emerald-600 font-semibold flex items-center space-x-1">
          <span class="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
          <span>Logistik-Zentrale & Werk</span>
        </div>
      </div>
    `);

    // Invalidate size on container layout changes
    setTimeout(() => {
      map.invalidateSize();
    }, 250);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Leaflet Markers whenever filtered vehicles change
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersGroup = markersGroupRef.current;
    if (!map || !markersGroup) return;

    // Clear previous markers
    markersGroup.clearLayers();
    markersMapRef.current.clear();

    const bounds = L.latLngBounds([[TINGLEV_HQ.lat, TINGLEV_HQ.lon]]);

    filteredVehicles.forEach((veh) => {
      if (typeof veh.lat !== 'number' || typeof veh.lon !== 'number') return;

      const isMoving = (veh.speed || 0) > 0;
      const marker = L.marker([veh.lat, veh.lon], {
        icon: createTruckDivIcon(veh.speed, veh.plate)
      });

      const formattedMileage = veh.mileage 
        ? `${Number(veh.mileage).toLocaleString('de-DE')} km` 
        : '–';

      const popupHtml = `
        <div class="p-4 space-y-3 min-w-[260px] text-xs">
          <div class="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div class="flex items-center space-x-2">
              <span class="px-2.5 py-1 rounded-lg bg-slate-900 text-white font-mono font-bold text-xs tracking-wider shadow-sm">
                ${veh.plate}
              </span>
            </div>
            ${
              isMoving 
                ? '<span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">In Fahrt</span>'
                : '<span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">Geparkt</span>'
            }
          </div>

          <div>
            <h4 class="font-extrabold text-sm text-slate-900">${veh.brand || 'LKW Transportzug'}</h4>
            <p class="text-[11px] text-slate-500 mt-0.5 flex items-center space-x-1">
              <span>📍</span>
              <span class="font-medium">${veh.location || 'Standort ermittelt'}</span>
            </p>
          </div>

          <div class="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-[11px]">
            <div>
              <span class="text-[10px] text-slate-400 block font-semibold">Geschwindigkeit:</span>
              <span class="font-bold text-slate-900 font-mono text-xs ${isMoving ? 'text-emerald-600' : ''}">
                ${veh.speed || 0} km/h
              </span>
            </div>
            <div>
              <span class="text-[10px] text-slate-400 block font-semibold">Kilometerstand:</span>
              <span class="font-bold text-slate-900 font-mono text-xs">${formattedMileage}</span>
            </div>
          </div>

          <div class="text-[10px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-50">
            <span>Telemetrie: ${veh.isActive ? 'Aktiv' : 'Inaktiv'}</span>
            <span>${veh.timestamp ? veh.timestamp.substring(11, 19) + ' Uhr' : 'Echtzeit'}</span>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml);
      marker.on('click', () => {
        setSelectedVehicle(veh);
      });

      markersGroup.addLayer(marker);
      markersMapRef.current.set(veh.id, marker);
      bounds.extend([veh.lat, veh.lon]);
    });

    // If initial load or reset, fit bounds
    if (filteredVehicles.length > 0) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 13 });
    }
  }, [filteredVehicles]);

  // Focus on vehicle from list
  const handleSelectVehicle = (veh) => {
    setSelectedVehicle(veh);
    const map = mapInstanceRef.current;
    if (!map || typeof veh.lat !== 'number' || typeof veh.lon !== 'number') return;

    map.flyTo([veh.lat, veh.lon], 14, { duration: 1.2 });
    const marker = markersMapRef.current.get(veh.id);
    if (marker) {
      setTimeout(() => {
        marker.openPopup();
      }, 600);
    }
  };

  // Center on Tinglev HQ
  const handleCenterHQ = () => {
    const map = mapInstanceRef.current;
    if (!map) return;
    map.flyTo([TINGLEV_HQ.lat, TINGLEV_HQ.lon], 12, { duration: 1.0 });
  };

  // Fit all vehicles
  const handleFitAll = () => {
    const map = mapInstanceRef.current;
    if (!map || vehicles.length === 0) return;

    const bounds = L.latLngBounds([[TINGLEV_HQ.lat, TINGLEV_HQ.lon]]);
    vehicles.forEach((v) => {
      if (typeof v.lat === 'number' && typeof v.lon === 'number') {
        bounds.extend([v.lat, v.lon]);
      }
    });
    map.fitBounds(bounds, { padding: [50, 50] });
  };

  return (
    <div className="space-y-6 pb-16 animate-fade-in">
      {/* 1. Top Header Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-card flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 via-blue-500 to-cyan-400 text-white flex items-center justify-center shadow-lg shadow-blue-500/25 shrink-0">
            <Navigation className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center space-x-2.5">
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                {t('gps.title') || 'GPS & Flottenortung'}
              </h1>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-blue-50 text-blue-700 border border-blue-200 uppercase tracking-wide">
                Live Telemetrie
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
              {t('gps.subtitle') || 'Live-Telematik, Fahrzeugortung und Logistik-Status der Flotte (Navkonzept)'}
            </p>
          </div>
        </div>

        {/* Live Status & Auto-Refresh Bar */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-2 px-3.5 py-2 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs">
            <span className={`w-2.5 h-2.5 rounded-full ${isLive ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}></span>
            <span className="font-semibold text-slate-700">
              {isLive ? 'Navkonzept Live verbunden' : 'Telemetrie-Modus aktiv'}
            </span>
          </div>

          {/* Countdown & Refresh Button */}
          <div className="flex items-center space-x-2 bg-slate-50 px-3.5 py-2 rounded-2xl border border-slate-200/80 text-xs font-semibold text-slate-600">
            <Clock className="w-4 h-4 text-slate-400" />
            <span>Aktualisierung in: <strong className="text-blue-600 font-mono">{countdown}s</strong></span>
          </div>

          <button
            onClick={() => fetchFleetTelemetry(true)}
            disabled={isRefreshing}
            className="flex items-center space-x-2 px-4 py-2 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/20 active:scale-95 transition-all disabled:opacity-50"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? 'Wird aktualisiert...' : 'Jetzt aktualisieren'}</span>
          </button>
        </div>
      </div>

      {/* 2. KPI Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-card flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Gesamtflotte</p>
            <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">{stats.total} <span className="text-xs font-bold text-slate-400">LKW</span></p>
            <p className="text-[11px] text-slate-500 font-medium mt-1">Registrierte Telematik</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Truck className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-card flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">In Fahrt (Auf Tour)</p>
            <p className="text-2xl sm:text-3xl font-black text-emerald-600 mt-1">{stats.inMotionCount} <span className="text-xs font-bold text-emerald-600/70">aktiv</span></p>
            <p className="text-[11px] text-emerald-600 font-semibold mt-1">Geschwindigkeit &gt; 0 km/h</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Radio className="w-6 h-6 animate-pulse" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-card flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Geparkt / Stillstand</p>
            <p className="text-2xl sm:text-3xl font-black text-slate-800 mt-1">{stats.parkedCount} <span className="text-xs font-bold text-slate-400">Fahrzeuge</span></p>
            <p className="text-[11px] text-slate-400 font-medium mt-1">Werk / Baustelle / Ladung</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
            <MapPin className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-card flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Ø Geschwindigkeit</p>
            <p className="text-2xl sm:text-3xl font-black text-blue-600 mt-1">{stats.avgSpeed} <span className="text-xs font-bold text-blue-600/70">km/h</span></p>
            <p className="text-[11px] text-slate-400 font-medium mt-1">Fahrzeuge in Bewegung</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <Gauge className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* 3. Main Interactive GPS Hub (Map + Synchronized List) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Leaflet Map (7 Cols on LG) */}
        <div className="lg:col-span-7 xl:col-span-8 bg-white rounded-3xl p-4 border border-slate-100 shadow-card space-y-4">
          {/* Map Top Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 px-2">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-slate-800">Kartenansicht (OpenStreetMap)</span>
              <span className="text-[11px] text-slate-400">• {filteredVehicles.length} auf Karte</span>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={handleCenterHQ}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
                title="Auf Werk Altlandsberg-Bruchmühle (Zentrale) zentrieren"
              >
                <Building2 className="w-3.5 h-3.5 text-amber-600" />
                <span>Werk Altlandsberg</span>
              </button>

              <button
                onClick={handleFitAll}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
                title="Gesamtflotte einpassen"
              >
                <Maximize2 className="w-3.5 h-3.5 text-blue-600" />
                <span>Flotte einpassen</span>
              </button>
            </div>
          </div>

          {/* Leaflet Map Canvas Container */}
          <div className="relative w-full h-[520px] rounded-2xl overflow-hidden border border-slate-200/80 shadow-inner">
            <div ref={mapContainerRef} className="w-full h-full" />
            
            {/* Legend Overlay in Map Bottom-Left */}
            <div className="absolute bottom-4 left-4 z-[400] bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-3.5 py-2.5 rounded-2xl shadow-lg border border-slate-200/80 dark:border-slate-800 text-[11px] space-y-1.5">
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block ring-2 ring-emerald-300"></span>
                <span className="font-bold text-slate-800 dark:text-slate-200">In Fahrt (speed &gt; 0)</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 rounded-full bg-blue-600 inline-block ring-2 ring-blue-300"></span>
                <span className="font-bold text-slate-800 dark:text-slate-200">Geparkt / Stillstand</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 rounded-full bg-orange-500 inline-block ring-2 ring-orange-300"></span>
                <span className="font-bold text-slate-800 dark:text-slate-200">Werk Altlandsberg (Zentrale)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Vehicle List & Filtering (5 Cols on LG) */}
        <div className="lg:col-span-5 xl:col-span-4 bg-white rounded-3xl p-5 border border-slate-100 shadow-card space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-base text-slate-900">Fahrzeugflotte ({filteredVehicles.length})</h3>
            <span className="text-[11px] text-slate-400 font-medium">Klick zentriert Karte</span>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Kennzeichen, Marke, Ort suchen..."
              className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>

          {/* Status Filter Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100/80 rounded-2xl">
            <button
              onClick={() => setFilterStatus('ALL')}
              className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all ${
                filterStatus === 'ALL' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Alle ({stats.total})
            </button>
            <button
              onClick={() => setFilterStatus('IN_MOTION')}
              className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all ${
                filterStatus === 'IN_MOTION' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              In Fahrt ({stats.inMotionCount})
            </button>
            <button
              onClick={() => setFilterStatus('PARKED')}
              className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all ${
                filterStatus === 'PARKED' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Geparkt ({stats.parkedCount})
            </button>
          </div>

          {/* Scrollable Vehicle Cards */}
          <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
            {isLoading ? (
              <div className="py-12 text-center text-slate-400 text-xs space-y-2">
                <RotateCw className="w-6 h-6 animate-spin mx-auto text-blue-500" />
                <p>Telemetriedaten werden geladen...</p>
              </div>
            ) : filteredVehicles.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs space-y-2">
                <Info className="w-6 h-6 mx-auto text-slate-300" />
                <p>Keine Fahrzeuge für diesen Filter gefunden.</p>
              </div>
            ) : (
              filteredVehicles.map((veh) => {
                const isMoving = (veh.speed || 0) > 0;
                const isSelected = selectedVehicle?.id === veh.id;

                return (
                  <div
                    key={veh.id}
                    onClick={() => handleSelectVehicle(veh)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer text-xs space-y-2.5 ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50/50 ring-2 ring-blue-500/20 shadow-md'
                        : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50/60'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="px-2.5 py-0.5 rounded-lg bg-slate-900 text-white font-mono font-bold text-xs">
                          {veh.plate}
                        </span>
                        <span className="font-bold text-slate-900 truncate max-w-[140px]">
                          {veh.brand || 'LKW'}
                        </span>
                      </div>

                      {isMoving ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center space-x-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                          <span>{veh.speed} km/h</span>
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                          Geparkt
                        </span>
                      )}
                    </div>

                    <div className="text-[11px] text-slate-600 flex items-start space-x-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <span className="truncate">{veh.location || 'Standort ermittelt'}</span>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-100/80">
                      <span>Km-Stand: <strong className="text-slate-700 font-mono">{veh.mileage ? `${Number(veh.mileage).toLocaleString('de-DE')} km` : '–'}</strong></span>
                      <span>{veh.timestamp ? veh.timestamp.substring(11, 19) + ' Uhr' : 'Echtzeit'}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
