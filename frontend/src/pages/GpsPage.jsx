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
  Info,
  Shield,
  Calendar,
  Plus,
  Trash2,
  Edit,
  Sliders,
  Check,
  X,
  AlertCircle,
  Share2,
  Copy,
  ExternalLink,
  Link2,
  MessageSquare,
  Send,
  QrCode
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

const GEOFENCE_TYPE_COLORS = {
  FACTORY: { border: '#ea580c', fill: '#f97316', label: 'Werk / Produktion', badge: 'bg-orange-100 text-orange-800' },
  CONSTRUCTION_SITE: { border: '#2563eb', fill: '#3b82f6', label: 'Baustelle', badge: 'bg-blue-100 text-blue-800' },
  SUPPLIER: { border: '#9333ea', fill: '#a855f7', label: 'Lieferant / Umschlag', badge: 'bg-purple-100 text-purple-800' },
  PARKING: { border: '#059669', fill: '#10b981', label: 'Parkplatz / Rast', badge: 'bg-emerald-100 text-emerald-800' }
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
    <div class="relative flex items-center justify-center w-10 h-10" title="Werk Altlandsberg (Zentrale)">
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
  const [activeTab, setActiveTab] = useState('MAP'); // 'MAP' | 'STAYS' | 'GEOFENCES' | 'TRACKING_SHARES'
  const [vehicles, setVehicles] = useState([]);
  const [geofences, setGeofences] = useState([]);
  const [trackingShares, setTrackingShares] = useState([]);
  const [staysSummary, setStaysSummary] = useState(null);
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [isLive, setIsLive] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [countdown, setCountdown] = useState(45);
  const [filterStatus, setFilterStatus] = useState('ALL'); // 'ALL' | 'IN_MOTION' | 'PARKED'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [copiedTokenId, setCopiedTokenId] = useState(null);

  // Geofence Modal State
  const [isGeofenceModalOpen, setIsGeofenceModalOpen] = useState(false);
  const [editingGeofence, setEditingGeofence] = useState(null);
  const [geofenceForm, setGeofenceForm] = useState({
    name: '',
    type: 'FACTORY',
    latitude: 52.5272,
    longitude: 13.8052,
    radius_meters: 500,
    is_active: true,
    description: ''
  });

  // Tracking Share Modal State
  const [isTrackingModalOpen, setIsTrackingModalOpen] = useState(false);
  const [isSubmittingTracking, setIsSubmittingTracking] = useState(false);
  const [createdShareResult, setCreatedShareResult] = useState(null);
  const [trackingForm, setTrackingForm] = useState({
    vehicle_id: '',
    destination_type: 'GEOFENCE', // 'GEOFENCE' | 'MANUAL'
    geofence_id: '',
    destination_name: '',
    destination_lat: 52.5200,
    destination_lon: 13.4050,
    duration_hours: 12,
    notes: ''
  });

  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersGroupRef = useRef(null);
  const geofencesGroupRef = useRef(null);
  const markersMapRef = useRef(new Map());

  // Load telemetry data from Backend API
  const fetchFleetTelemetry = async (forceRefresh = false) => {
    if (forceRefresh) setIsRefreshing(true);
    try {
      const [vehiclesData, geofencesData, sharesData] = await Promise.all([
        api.getFleetVehicles(forceRefresh),
        api.getGeofences(),
        api.getTrackingShares(false)
      ]);

      if (vehiclesData && Array.isArray(vehiclesData.vehicles)) {
        setVehicles(vehiclesData.vehicles);
        setIsLive(vehiclesData.is_live);
      }
      if (Array.isArray(geofencesData)) {
        setGeofences(geofencesData);
      }
      if (Array.isArray(sharesData)) {
        setTrackingShares(sharesData);
      }
    } catch (err) {
      console.error('Fehler beim Laden der Telemetrie/Geofences/Tracking:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
      setCountdown(45);
    }
  };

  // Load Stays Summary for selected date
  const fetchStaysData = async (dateStr) => {
    try {
      const data = await api.getVehicleStays(dateStr);
      setStaysSummary(data);
    } catch (err) {
      console.error('Fehler beim Laden der Standzeiten:', err);
    }
  };

  // Load Tracking Shares
  const fetchTrackingShares = async () => {
    try {
      const shares = await api.getTrackingShares(false);
      if (Array.isArray(shares)) {
        setTrackingShares(shares);
      }
    } catch (err) {
      console.error('Fehler beim Laden der Baustellen-Freigaben:', err);
    }
  };

  // Initial load
  useEffect(() => {
    fetchFleetTelemetry(false);
    fetchStaysData(selectedDate);
    fetchTrackingShares();
  }, []);

  // When tab changes
  useEffect(() => {
    if (activeTab === 'STAYS') {
      fetchStaysData(selectedDate);
    } else if (activeTab === 'TRACKING_SHARES') {
      fetchTrackingShares();
    }
  }, [selectedDate, activeTab]);

  // 45-Second Interval Countdown for Live Telemetry
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          fetchFleetTelemetry(false);
          if (activeTab === 'STAYS') {
            fetchStaysData(selectedDate);
          } else if (activeTab === 'TRACKING_SHARES') {
            fetchTrackingShares();
          }
          return 45;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [activeTab, selectedDate]);

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
    if (activeTab !== 'MAP') return;
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) {
      mapInstanceRef.current.invalidateSize();
      return;
    }

    const map = L.map(mapContainerRef.current, {
      center: [TINGLEV_HQ.lat, TINGLEV_HQ.lon],
      zoom: 10,
      zoomControl: true,
      attributionControl: false
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    // Layer groups for Geofences & Vehicles
    const geofencesGroup = L.layerGroup().addTo(map);
    const markersGroup = L.layerGroup().addTo(map);

    geofencesGroupRef.current = geofencesGroup;
    markersGroupRef.current = markersGroup;
    mapInstanceRef.current = map;

    // Add HQ Marker
    const hqMarker = L.marker([TINGLEV_HQ.lat, TINGLEV_HQ.lon], {
      icon: createHqDivIcon()
    }).addTo(map);

    hqMarker.bindPopup(`
      <div class="p-3.5 space-y-1.5 min-w-[220px] text-xs">
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

    setTimeout(() => {
      map.invalidateSize();
    }, 250);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [activeTab]);

  // Update Geofence Circles on Leaflet Map
  useEffect(() => {
    if (activeTab !== 'MAP') return;
    const map = mapInstanceRef.current;
    const geofencesGroup = geofencesGroupRef.current;
    if (!map || !geofencesGroup) return;

    geofencesGroup.clearLayers();

    geofences.forEach((geo) => {
      if (!geo.is_active || typeof geo.latitude !== 'number' || typeof geo.longitude !== 'number') return;

      const colors = GEOFENCE_TYPE_COLORS[geo.type] || GEOFENCE_TYPE_COLORS.FACTORY;
      const circle = L.circle([geo.latitude, geo.longitude], {
        radius: geo.radius_meters || 500,
        color: colors.border,
        fillColor: colors.fill,
        fillOpacity: 0.14,
        weight: 2,
        dashArray: '4, 6'
      });

      circle.bindPopup(`
        <div class="p-3 space-y-2 min-w-[210px] text-xs">
          <div class="flex items-center justify-between">
            <span class="px-2 py-0.5 rounded-md font-bold text-[10px] ${colors.badge}">${colors.label}</span>
            <span class="text-[10px] text-slate-400 font-mono">r = ${geo.radius_meters}m</span>
          </div>
          <h4 class="font-extrabold text-sm text-slate-900">${geo.name}</h4>
          ${geo.description ? `<p class="text-[11px] text-slate-500">${geo.description}</p>` : ''}
          <div class="pt-1 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span class="text-slate-500">Fahrzeuge vor Ort:</span>
            <span class="font-black text-slate-900">${geo.active_vehicles_count || 0}</span>
          </div>
        </div>
      `);

      geofencesGroup.addLayer(circle);
    });
  }, [geofences, activeTab]);

  // Update Leaflet Markers whenever filtered vehicles change
  useEffect(() => {
    if (activeTab !== 'MAP') return;
    const map = mapInstanceRef.current;
    const markersGroup = markersGroupRef.current;
    if (!map || !markersGroup) return;

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

    if (filteredVehicles.length > 0) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 13 });
    }
  }, [filteredVehicles, activeTab]);

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

  const handleCenterHQ = () => {
    const map = mapInstanceRef.current;
    if (!map) return;
    map.flyTo([TINGLEV_HQ.lat, TINGLEV_HQ.lon], 12, { duration: 1.0 });
  };

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

  // Geofence Modal Handlers
  const handleOpenCreateGeofence = () => {
    setEditingGeofence(null);
    setGeofenceForm({
      name: '',
      type: 'CONSTRUCTION_SITE',
      latitude: 52.5200,
      longitude: 13.4050,
      radius_meters: 500,
      is_active: true,
      description: ''
    });
    setIsGeofenceModalOpen(true);
  };

  const handleOpenEditGeofence = (geo) => {
    setEditingGeofence(geo);
    setGeofenceForm({
      name: geo.name,
      type: geo.type,
      latitude: geo.latitude,
      longitude: geo.longitude,
      radius_meters: geo.radius_meters,
      is_active: geo.is_active,
      description: geo.description || ''
    });
    setIsGeofenceModalOpen(true);
  };

  const handleSaveGeofence = async (e) => {
    e.preventDefault();
    try {
      if (editingGeofence) {
        await api.updateGeofence(editingGeofence.id, geofenceForm);
      } else {
        await api.createGeofence(geofenceForm);
      }
      setIsGeofenceModalOpen(false);
      fetchFleetTelemetry(true);
    } catch (err) {
      alert('Fehler beim Speichern des Geofence: ' + err.message);
    }
  };

  const handleDeleteGeofence = async (geoId) => {
    if (!window.confirm('Möchten Sie diese Geofence-Zone wirklich löschen?')) return;
    try {
      await api.deleteGeofence(geoId);
      fetchFleetTelemetry(true);
    } catch (err) {
      alert('Fehler beim Löschen: ' + err.message);
    }
  };

  // Tracking Share Handlers
  const handleOpenCreateTracking = (vehicleId = null) => {
    const defaultVehicle = vehicleId || (vehicles.length > 0 ? vehicles[0].id : '');
    const firstGeofence = geofences.length > 0 ? geofences[0] : null;

    setCreatedShareResult(null);
    setTrackingForm({
      vehicle_id: defaultVehicle,
      destination_type: firstGeofence ? 'GEOFENCE' : 'MANUAL',
      geofence_id: firstGeofence ? firstGeofence.id : '',
      destination_name: firstGeofence ? firstGeofence.name : 'Baustelle Potsdamer Platz',
      destination_lat: firstGeofence ? firstGeofence.latitude : 52.5096,
      destination_lon: firstGeofence ? firstGeofence.longitude : 13.3759,
      duration_hours: 12,
      notes: ''
    });
    setIsTrackingModalOpen(true);
  };

  const handleTrackingGeofenceSelect = (geoId) => {
    const selectedGeo = geofences.find((g) => String(g.id) === String(geoId));
    if (selectedGeo) {
      setTrackingForm((prev) => ({
        ...prev,
        geofence_id: selectedGeo.id,
        destination_name: selectedGeo.name,
        destination_lat: selectedGeo.latitude,
        destination_lon: selectedGeo.longitude
      }));
    }
  };

  const handleSaveTrackingShare = async (e) => {
    e.preventDefault();
    if (!trackingForm.vehicle_id) {
      alert('Bitte wählen Sie ein Fahrzeug aus.');
      return;
    }
    setIsSubmittingTracking(true);
    try {
      const payload = {
        vehicle_id: parseInt(trackingForm.vehicle_id),
        destination_name: trackingForm.destination_name,
        destination_lat: parseFloat(trackingForm.destination_lat),
        destination_lon: parseFloat(trackingForm.destination_lon),
        duration_hours: parseInt(trackingForm.duration_hours) || 12,
        notes: trackingForm.notes || null
      };

      const result = await api.createTrackingShare(payload);
      setCreatedShareResult(result);
      fetchTrackingShares();
    } catch (err) {
      alert('Fehler beim Erstellen des Live-Links: ' + err.message);
    } finally {
      setIsSubmittingTracking(false);
    }
  };

  const handleCopyShareLink = (token, id = null) => {
    const fullUrl = `${window.location.origin}/track/${token}`;
    navigator.clipboard.writeText(fullUrl).then(() => {
      setCopiedTokenId(id || token);
      setTimeout(() => setCopiedTokenId(null), 2500);
    }).catch(() => {
      prompt('Link manuell kopieren:', fullUrl);
    });
  };

  const handleDeleteTrackingShare = async (shareId) => {
    if (!window.confirm('Möchten Sie diese Live-Freigabe widerrufen und löschen? Der Link wird sofort ungültig.')) return;
    try {
      await api.deleteTrackingShare(shareId);
      fetchTrackingShares();
    } catch (err) {
      alert('Fehler beim Widerrufen der Freigabe: ' + err.message);
    }
  };

  return (
    <div className="space-y-6 pb-16 animate-fade-in">
      {/* 1. Header Banner */}
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
                Live Telemetrie & Geofencing
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
              Live-Telematik, Geofencing & Standzeitüberwachung der Flotte (Navkonzept)
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

          <div className="flex items-center space-x-2 bg-slate-50 px-3.5 py-2 rounded-2xl border border-slate-200/80 text-xs font-semibold text-slate-600">
            <Clock className="w-4 h-4 text-slate-400" />
            <span>Sync in: <strong className="text-blue-600 font-mono">{countdown}s</strong></span>
          </div>

          <button
            onClick={() => handleOpenCreateTracking()}
            className="flex items-center space-x-2 px-4 py-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 active:scale-95 transition-all"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Live-Link generieren</span>
          </button>

          <button
            onClick={() => {
              fetchFleetTelemetry(true);
              if (activeTab === 'STAYS') fetchStaysData(selectedDate);
              if (activeTab === 'TRACKING_SHARES') fetchTrackingShares();
            }}
            disabled={isRefreshing}
            className="flex items-center space-x-2 px-4 py-2 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/20 active:scale-95 transition-all disabled:opacity-50"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? 'Wird aktualisiert...' : 'Jetzt aktualisieren'}</span>
          </button>
        </div>
      </div>

      {/* 2. Navigation View Switcher Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200/80 pb-3">
        <button
          onClick={() => setActiveTab('MAP')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all ${
            activeTab === 'MAP'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-100'
          }`}
        >
          <Compass className="w-4 h-4" />
          <span>Live-Kartenansicht (OSM)</span>
        </button>

        <button
          onClick={() => setActiveTab('STAYS')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all ${
            activeTab === 'STAYS'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-100'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Standzeiten & Ladezeiten</span>
          {staysSummary?.active_stays_count > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500 text-white font-mono">
              {staysSummary.active_stays_count}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('GEOFENCES')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all ${
            activeTab === 'GEOFENCES'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-100'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>Geofence-Zonen ({geofences.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('TRACKING_SHARES')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all ${
            activeTab === 'TRACKING_SHARES'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-100'
          }`}
        >
          <Share2 className="w-4 h-4" />
          <span>Baustellen-Tracking (ETA)</span>
          {trackingShares.length > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500 text-white font-mono">
              {trackingShares.length}
            </span>
          )}
        </button>
      </div>

      {/* 3. TAB CONTENT: MAP VIEW */}
      {activeTab === 'MAP' && (
        <div className="space-y-6 animate-fade-in">
          {/* KPI Metrics Grid */}
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
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Aktive Geofences</p>
                <p className="text-2xl sm:text-3xl font-black text-purple-600 mt-1">{geofences.filter(g => g.is_active).length} <span className="text-xs font-bold text-purple-400">Zonen</span></p>
                <p className="text-[11px] text-slate-400 font-medium mt-1">Überwachte Standorte</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                <Shield className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Main Map & Synchronized List */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-7 xl:col-span-8 bg-white rounded-3xl p-4 border border-slate-100 shadow-card space-y-4">
              {/* Map Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-3 px-2">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-slate-800">Kartenansicht (OpenStreetMap)</span>
                  <span className="text-[11px] text-slate-400">• {filteredVehicles.length} Fahrzeuge • {geofences.length} Zonen</span>
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

              {/* Map Canvas */}
              <div className="relative w-full h-[520px] rounded-2xl overflow-hidden border border-slate-200/80 shadow-inner">
                <div ref={mapContainerRef} className="w-full h-full" />
                
                {/* Legend Overlay */}
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
                  <div className="flex items-center space-x-2 pt-1 border-t border-slate-100 dark:border-slate-800">
                    <span className="w-3 h-3 rounded-full border-2 border-dashed border-purple-500 bg-purple-500/20 inline-block"></span>
                    <span className="font-medium text-slate-600 dark:text-slate-300">Geofence-Zonen</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Vehicle List */}
            <div className="lg:col-span-5 xl:col-span-4 bg-white rounded-3xl p-5 border border-slate-100 shadow-card space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-black text-base text-slate-900">Fahrzeugflotte ({filteredVehicles.length})</h3>
                <span className="text-[11px] text-slate-400 font-medium">Klick zentriert Karte</span>
              </div>

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
                          <div className="flex items-center space-x-1.5">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenCreateTracking(veh.id);
                              }}
                              className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-[10px] border border-emerald-200 transition-colors"
                              title="Live-Tracking-Link für Baustelle erstellen"
                            >
                              <Share2 className="w-2.5 h-2.5" />
                              <span>Live-Link</span>
                            </button>
                            <span>{veh.timestamp ? veh.timestamp.substring(11, 19) + ' Uhr' : 'Echtzeit'}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. TAB CONTENT: STANDZEITEN & LADEZEITEN (STAYS) */}
      {activeTab === 'STAYS' && (
        <div className="space-y-6 animate-fade-in">
          {/* Stays KPI Summary */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-card">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Erfasste Aufenthalte</p>
              <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">{staysSummary?.total_stays || 0}</p>
              <p className="text-[11px] text-slate-500 font-medium mt-1">Datum: {selectedDate}</p>
            </div>
            <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-card">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Aktuell vor Ort</p>
              <p className="text-2xl sm:text-3xl font-black text-emerald-600 mt-1">{staysSummary?.active_stays_count || 0} <span className="text-xs font-bold text-emerald-600/70">LKW</span></p>
              <p className="text-[11px] text-emerald-600 font-semibold mt-1">Lade- / Entladevorgang läuft</p>
            </div>
            <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-card">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Abgeschlossene Stopps</p>
              <p className="text-2xl sm:text-3xl font-black text-blue-600 mt-1">{staysSummary?.completed_stays_count || 0}</p>
              <p className="text-[11px] text-slate-400 font-medium mt-1">Erfolgreich abgewickelt</p>
            </div>
            <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-card">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Ø Standzeit pro Stopp</p>
              <p className="text-2xl sm:text-3xl font-black text-purple-600 mt-1">{staysSummary?.avg_dwell_minutes || 0} <span className="text-xs font-bold text-purple-400">Min.</span></p>
              <p className="text-[11px] text-slate-400 font-medium mt-1">Gesamt: {staysSummary?.total_dwell_minutes || 0} Min.</p>
            </div>
          </div>

          {/* Stays Table Card */}
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-card space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-black text-slate-900">Auswertung der Lade-, Entlade- und Standzeiten</h3>
                <p className="text-xs text-slate-500">Automatische Erfassung via Haversine-Geofencing aller Werk- und Baustellenanfahrten</p>
              </div>

              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2 bg-slate-50 px-3 py-1.5 rounded-2xl border border-slate-200 text-xs">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="bg-transparent font-bold text-slate-800 focus:outline-none text-xs"
                  />
                </div>

                <button
                  onClick={() => api.runGeofenceEvaluation().then(() => fetchStaysData(selectedDate))}
                  className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-2xl transition-colors"
                >
                  Jetzt neu evaluieren
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded-2xl border border-slate-100">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-100">
                  <tr>
                    <th className="py-3 px-4">Kennzeichen</th>
                    <th className="py-3 px-4">Geofence-Zone / Standort</th>
                    <th className="py-3 px-4">Typ</th>
                    <th className="py-3 px-4">Eintreffen (ENTER)</th>
                    <th className="py-3 px-4">Abfahrt (EXIT)</th>
                    <th className="py-3 px-4 text-right">Standzeit (Dauer)</th>
                    <th className="py-3 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {staysSummary?.stays && staysSummary.stays.length > 0 ? (
                    staysSummary.stays.map((stay) => {
                      const colors = GEOFENCE_TYPE_COLORS[stay.geofence_type] || GEOFENCE_TYPE_COLORS.FACTORY;
                      const enterTimeStr = new Date(stay.enter_time).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                      const exitTimeStr = stay.exit_time 
                        ? new Date(stay.exit_time).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                        : '–';

                      return (
                        <tr key={stay.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                            <span className="px-2 py-0.5 rounded-lg bg-slate-900 text-white text-[11px]">
                              {stay.plate}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-bold text-slate-800">
                            {stay.geofence_name}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${colors.badge}`}>
                              {colors.label}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-mono text-slate-600">{enterTimeStr} Uhr</td>
                          <td className="py-3.5 px-4 font-mono text-slate-600">{exitTimeStr} {stay.exit_time ? 'Uhr' : ''}</td>
                          <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                            {stay.duration_minutes !== null ? `${stay.duration_minutes} Min.` : 'Vor Ort...'}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            {stay.is_currently_inside ? (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 inline-flex items-center space-x-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                                <span>Vor Ort</span>
                              </span>
                            ) : (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                                Abgeschlossen
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="7" className="py-12 text-center text-slate-400 text-xs">
                        Keine Standzeiten für den {selectedDate} erfasst.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 5. TAB CONTENT: GEOFENCES MANAGEMENT */}
      {activeTab === 'GEOFENCES' && (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-card space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-black text-slate-900">Geofence-Zonen & Überwachungsradien</h3>
                <p className="text-xs text-slate-500">Definieren Sie Werke, Baustellen, Zulieferer und Parkplätze für die automatische Telemetrieerfassung</p>
              </div>

              <button
                onClick={handleOpenCreateGeofence}
                className="flex items-center space-x-2 px-4 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/20 active:scale-95 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Geofence anlegen</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
              {geofences.map((geo) => {
                const colors = GEOFENCE_TYPE_COLORS[geo.type] || GEOFENCE_TYPE_COLORS.FACTORY;

                return (
                  <div key={geo.id} className="p-5 rounded-3xl border border-slate-100 bg-white hover:border-slate-200 transition-all shadow-sm space-y-3">
                    <div className="flex items-center justify-between">
                      <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold ${colors.badge}`}>
                        {colors.label}
                      </span>
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => handleOpenEditGeofence(geo)}
                          className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors"
                          title="Bearbeiten"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteGeofence(geo.id)}
                          className="p-1.5 rounded-xl hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors"
                          title="Löschen"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-black text-sm text-slate-900">{geo.name}</h4>
                      {geo.description && <p className="text-[11px] text-slate-500 mt-1">{geo.description}</p>}
                    </div>

                    <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 grid grid-cols-2 gap-2 text-[11px]">
                      <div>
                        <span className="text-[10px] text-slate-400 block font-semibold">Radius:</span>
                        <span className="font-bold text-slate-900 font-mono">{geo.radius_meters} m</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block font-semibold">Fahrzeuge vor Ort:</span>
                        <span className="font-bold text-blue-600 font-mono">{geo.active_vehicles_count || 0}</span>
                      </div>
                    </div>

                    <div className="text-[10px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-100">
                      <span>Status: {geo.is_active ? 'Aktiv' : 'Inaktiv'}</span>
                      <span className="font-mono">{geo.latitude.toFixed(4)}, {geo.longitude.toFixed(4)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 6. TAB CONTENT: TRACKING SHARES (BAUSTELLEN & MOBILKRÄNE) */}
      {activeTab === 'TRACKING_SHARES' && (
        <div className="space-y-6 animate-fade-in">
          {/* Tracking Shares Header Card */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-card space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-xl font-black text-slate-900">Live-Lieferverfolgung & Baustellen-Freigaben</h3>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
                    Mobilkran-ETA
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1 max-w-2xl">
                  Erstellen Sie temporäre, sichere Tracking-Links für Bauleiter, Poliere und Mobilkranführer vor Ort. Externe Empfänger sehen nur die Echtzeitposition und die Live-ETA des zugewiesenen Lkw ohne internen Systemzugang.
                </p>
              </div>

              <button
                onClick={() => handleOpenCreateTracking()}
                className="flex items-center space-x-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-black shadow-lg shadow-emerald-600/25 active:scale-95 transition-all shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Neuen Live-Link erstellen</span>
              </button>
            </div>

            {/* Shares Grid */}
            {trackingShares.length === 0 ? (
              <div className="py-16 text-center bg-slate-50/70 rounded-3xl border border-dashed border-slate-200 space-y-4">
                <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
                  <Share2 className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-extrabold text-slate-800 text-base">Keine aktiven Baustellen-Freigaben</h4>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    Erstellen Sie einen Live-Tracking-Link für anstehende Betonfertigteil-Lieferungen zur Abstimmung mit dem Baustellenteam.
                  </p>
                </div>
                <button
                  onClick={() => handleOpenCreateTracking()}
                  className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>Jetzt ersten Link generieren</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {trackingShares.map((share) => {
                  const shareUrl = `${window.location.origin}/track/${share.token}`;
                  const isCopied = copiedTokenId === share.id || copiedTokenId === share.token;
                  const expiresDate = new Date(share.expires_at);
                  const isExpired = expiresDate < new Date();
                  const expiresStr = expiresDate.toLocaleString('de-DE', {
                    day: '2-digit',
                    month: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit'
                  });

                  return (
                    <div
                      key={share.id}
                      className="p-5 rounded-3xl border border-slate-100 bg-white hover:border-slate-200 transition-all shadow-sm flex flex-col justify-between space-y-4"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="px-2.5 py-1 rounded-xl bg-slate-900 text-white font-mono font-bold text-xs tracking-wider shadow-sm">
                            {share.vehicle_plate || `Fahrzeug #${share.vehicle_id}`}
                          </span>

                          {isExpired ? (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                              Abgelaufen
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center space-x-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                              <span>Live Aktiv</span>
                            </span>
                          )}
                        </div>

                        <div>
                          <div className="flex items-center space-x-1.5 text-xs font-extrabold text-slate-900">
                            <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span className="truncate">{share.destination_name}</span>
                          </div>
                          {share.notes && (
                            <p className="text-[11px] text-slate-500 mt-1 italic line-clamp-2 bg-slate-50 p-2 rounded-xl border border-slate-100">
                              💬 „{share.notes}“
                            </p>
                          )}
                        </div>

                        <div className="bg-slate-50/80 p-3 rounded-2xl border border-slate-100 text-[11px] space-y-1.5 font-medium">
                          <div className="flex items-center justify-between text-slate-500">
                            <span>Gültig bis:</span>
                            <span className="font-bold text-slate-800 font-mono">{expiresStr} Uhr</span>
                          </div>
                          <div className="flex items-center justify-between text-slate-500">
                            <span>Zielkoordinaten:</span>
                            <span className="font-mono text-[10px] text-slate-700">
                              {share.destination_lat.toFixed(4)}, {share.destination_lon.toFixed(4)}
                            </span>
                          </div>
                        </div>

                        {/* Token Link URL Box */}
                        <div className="flex items-center space-x-2 bg-slate-100/80 px-3 py-2 rounded-xl text-[11px] font-mono text-slate-600 overflow-hidden border border-slate-200/60">
                          <Link2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate flex-1">/track/{share.token}</span>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                        <button
                          onClick={() => handleCopyShareLink(share.token, share.id)}
                          className={`flex-1 flex items-center justify-center space-x-1.5 py-2 px-3 rounded-xl font-bold text-xs transition-all ${
                            isCopied
                              ? 'bg-emerald-600 text-white shadow-sm'
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                          }`}
                        >
                          {isCopied ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              <span>Kopiert!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Link kopieren</span>
                            </>
                          )}
                        </button>

                        <a
                          href={`https://wa.me/?text=${encodeURIComponent(
                            `Live-Lieferung Betonfertigteile für "${share.destination_name}": ${shareUrl}`
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition-colors"
                          title="Per WhatsApp an Bauleiter senden"
                        >
                          <Send className="w-4 h-4" />
                        </a>

                        <a
                          href={shareUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 transition-colors"
                          title="Öffentliche Tracking-Seite öffnen"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>

                        <button
                          onClick={() => handleDeleteTrackingShare(share.id)}
                          className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors"
                          title="Freigabelink widerrufen und löschen"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* GEOFENCE CREATE / EDIT MODAL */}
      {isGeofenceModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full border border-slate-100 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-lg text-slate-900">
                    {editingGeofence ? 'Geofence bearbeiten' : 'Neuen Geofence anlegen'}
                  </h3>
                  <p className="text-xs text-slate-500">Geografische Überwachungszone für Telemetrie definieren</p>
                </div>
              </div>
              <button
                onClick={() => setIsGeofenceModalOpen(false)}
                className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveGeofence} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1.5">Zonenname *</label>
                <input
                  type="text"
                  required
                  value={geofenceForm.name}
                  onChange={(e) => setGeofenceForm({ ...geofenceForm, name: e.target.value })}
                  placeholder="z. B. Großbaustelle Berlin Europacity"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1.5">Standort-Typ *</label>
                  <select
                    value={geofenceForm.type}
                    onChange={(e) => setGeofenceForm({ ...geofenceForm, type: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-medium"
                  >
                    <option value="FACTORY">Werk / Produktion</option>
                    <option value="CONSTRUCTION_SITE">Baustelle / Kunde</option>
                    <option value="SUPPLIER">Lieferant / Umschlag</option>
                    <option value="PARKING">Parkplatz / Werkstatt</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1.5">Radius (Meter) *</label>
                  <input
                    type="number"
                    required
                    min="50"
                    max="50000"
                    value={geofenceForm.radius_meters}
                    onChange={(e) => setGeofenceForm({ ...geofenceForm, radius_meters: parseInt(e.target.value) || 500 })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1.5">Breitengrad (Lat) *</label>
                  <input
                    type="number"
                    step="0.0001"
                    required
                    value={geofenceForm.latitude}
                    onChange={(e) => setGeofenceForm({ ...geofenceForm, latitude: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1.5">Längengrad (Lon) *</label>
                  <input
                    type="number"
                    step="0.0001"
                    required
                    value={geofenceForm.longitude}
                    onChange={(e) => setGeofenceForm({ ...geofenceForm, longitude: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1.5">Beschreibung / Notiz</label>
                <textarea
                  rows="2"
                  value={geofenceForm.description}
                  onChange={(e) => setGeofenceForm({ ...geofenceForm, description: e.target.value })}
                  placeholder="Optionale Details zu Zufahrtswegen oder Ladezonen..."
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none text-xs"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsGeofenceModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-colors"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md shadow-blue-600/20 active:scale-95 transition-all"
                >
                  {editingGeofence ? 'Änderungen speichern' : 'Geofence anlegen'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TRACKING SHARE GENERATE / RESULT MODAL */}
      {isTrackingModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full border border-slate-100 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Share2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-lg text-slate-900">
                    {createdShareResult ? 'Live-Link bereit!' : 'Baustellen-Live-Link erstellen'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {createdShareResult
                      ? 'Link für Polier / Mobilkranführer teilen'
                      : 'Echtzeit-ETA & Ankunftsavisierung für die Baustelle'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsTrackingModalOpen(false);
                  setCreatedShareResult(null);
                }}
                className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {createdShareResult ? (
              /* Success & Share View */
              <div className="space-y-5 animate-fade-in text-xs">
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200/80 flex items-start space-x-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <h4 className="font-bold text-emerald-900 text-sm">Live-Tracking-Link erfolgreich erstellt!</h4>
                    <p className="text-emerald-700 text-xs">
                      Zielort: <strong>{createdShareResult.destination_name}</strong> • Gültig für {createdShareResult.duration_hours || 12} Stunden
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="font-bold text-slate-700 block">Freigabe-URL (Mobilfreundlich)</label>
                  <div className="flex items-center space-x-2 bg-slate-50 p-2.5 rounded-2xl border border-slate-200">
                    <input
                      type="text"
                      readOnly
                      value={`${window.location.origin}/track/${createdShareResult.token}`}
                      className="w-full bg-transparent font-mono text-xs text-slate-800 focus:outline-none"
                    />
                    <button
                      onClick={() => handleCopyShareLink(createdShareResult.token)}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shrink-0 flex items-center space-x-1 shadow-sm transition-all"
                    >
                      {copiedTokenId === createdShareResult.token ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
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

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(
                      `Hallo, hier ist der Live-Tracking-Link für die Betonfertigteil-Lieferung (${createdShareResult.destination_name}): ${window.location.origin}/track/${createdShareResult.token}`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center space-x-2 py-3 px-4 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs shadow-md shadow-emerald-500/20 transition-all"
                  >
                    <Send className="w-4 h-4" />
                    <span>Per WhatsApp senden</span>
                  </a>

                  <a
                    href={`${window.location.origin}/track/${createdShareResult.token}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center space-x-2 py-3 px-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/20 transition-all"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>Vorschau öffnen</span>
                  </a>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      setCreatedShareResult(null);
                      handleOpenCreateTracking();
                    }}
                    className="text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors"
                  >
                    + Weiteren Link erstellen
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsTrackingModalOpen(false);
                      setCreatedShareResult(null);
                    }}
                    className="px-5 py-2.5 rounded-2xl bg-slate-900 text-white font-bold text-xs shadow-md transition-all"
                  >
                    Fertig
                  </button>
                </div>
              </div>
            ) : (
              /* Input Form View */
              <form onSubmit={handleSaveTrackingShare} className="space-y-4 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1.5">Fahrzeug auswählen *</label>
                  <select
                    required
                    value={trackingForm.vehicle_id}
                    onChange={(e) => setTrackingForm({ ...trackingForm, vehicle_id: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-2xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-medium"
                  >
                    <option value="">-- Fahrzeug auswählen --</option>
                    {vehicles.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.plate} - {v.brand || 'LKW'} ({v.location || 'Standort ermittelt'})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1.5">Zielort festlegen *</label>
                  <div className="flex items-center space-x-2 mb-2.5">
                    <button
                      type="button"
                      onClick={() => setTrackingForm({ ...trackingForm, destination_type: 'GEOFENCE' })}
                      className={`flex-1 py-1.5 rounded-xl font-bold transition-all ${
                        trackingForm.destination_type === 'GEOFENCE'
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      Aus Geofence wählen
                    </button>
                    <button
                      type="button"
                      onClick={() => setTrackingForm({ ...trackingForm, destination_type: 'MANUAL' })}
                      className={`flex-1 py-1.5 rounded-xl font-bold transition-all ${
                        trackingForm.destination_type === 'MANUAL'
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      Manuelle Koordinaten
                    </button>
                  </div>

                  {trackingForm.destination_type === 'GEOFENCE' ? (
                    <div>
                      <select
                        value={trackingForm.geofence_id}
                        onChange={(e) => handleTrackingGeofenceSelect(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-2xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-medium"
                      >
                        <option value="">-- Geofence-Zone wählen --</option>
                        {geofences.map((g) => (
                          <option key={g.id} value={g.id}>
                            {g.name} ({g.type})
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <input
                        type="text"
                        required
                        value={trackingForm.destination_name}
                        onChange={(e) => setTrackingForm({ ...trackingForm, destination_name: e.target.value })}
                        placeholder="z. B. Baustelle Potsdamer Platz Kran 1"
                        className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-medium"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="number"
                          step="0.0001"
                          required
                          placeholder="Lat (z. B. 52.5096)"
                          value={trackingForm.destination_lat}
                          onChange={(e) => setTrackingForm({ ...trackingForm, destination_lat: parseFloat(e.target.value) || 0 })}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-mono text-xs"
                        />
                        <input
                          type="number"
                          step="0.0001"
                          required
                          placeholder="Lon (z. B. 13.3759)"
                          value={trackingForm.destination_lon}
                          onChange={(e) => setTrackingForm({ ...trackingForm, destination_lon: parseFloat(e.target.value) || 0 })}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-mono text-xs"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1.5">Gültigkeitsdauer (Token-Ablauf) *</label>
                  <select
                    value={trackingForm.duration_hours}
                    onChange={(e) => setTrackingForm({ ...trackingForm, duration_hours: parseInt(e.target.value) || 12 })}
                    className="w-full px-3 py-2.5 rounded-2xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-medium"
                  >
                    <option value="4">4 Stunden (Kurzstrecke)</option>
                    <option value="8">8 Stunden (Normaler Tagestransport)</option>
                    <option value="12">12 Stunden (Standard - Montagetag)</option>
                    <option value="24">24 Stunden (1 Tag)</option>
                    <option value="48">48 Stunden (2 Tage)</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1.5">Hinweis / Baustellennotiz (optional)</label>
                  <textarea
                    rows="2"
                    value={trackingForm.notes}
                    onChange={(e) => setTrackingForm({ ...trackingForm, notes: e.target.value })}
                    placeholder="z. B. Kranstellplatz Tor 2, Lieferung Los 3 Betonfertigteile..."
                    className="w-full px-3.5 py-2 rounded-2xl border border-slate-200 bg-slate-50 focus:outline-none text-xs"
                  />
                </div>

                <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsTrackingModalOpen(false)}
                    className="px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-colors"
                  >
                    Abbrechen
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingTracking}
                    className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold shadow-md shadow-emerald-600/20 active:scale-95 transition-all disabled:opacity-50 flex items-center space-x-1.5"
                  >
                    {isSubmittingTracking && <RotateCw className="w-3.5 h-3.5 animate-spin" />}
                    <span>Live-Link erstellen</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
