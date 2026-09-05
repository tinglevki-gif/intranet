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
  QrCode,
  Wrench,
  AlertTriangle,
  FileText,
  History,
  DollarSign,
  Crosshair,
  ShieldAlert,
  Moon,
  Bell,
  Volume2,
  Lock,
  CheckSquare,
  Sparkles,
  Filter
} from 'lucide-react';
import { api } from '../services/api';
import { useLanguage } from '../context/LanguageContext';

// Company HQ Coordinates (Tinglev Elementfabrik GmbH - Werk Altlandsberg (Zentrale))
const TINGLEV_HQ = {
  lat: 52.5272,
  lon: 13.8052,
  name: 'Werk Altlandsberg (Zentrale)',
  address: 'Am Gewerbepark 8A, 15345 Altlandsberg-Bruchmühle'
};

const SERVICE_TYPE_INFO = {
  OIL_SERVICE: { label: 'Motoröl & Filter (30.000 km)', badge: 'bg-amber-100 text-amber-800 border-amber-200', icon: '🛢️' },
  TUEV_SP: { label: 'TÜV & Sicherheitsprüfung (SP)', badge: 'bg-blue-100 text-blue-800 border-blue-200', icon: '📋' },
  UVV: { label: 'UVV-Kranprüfung (DGUV 52/54)', badge: 'bg-purple-100 text-purple-800 border-purple-200', icon: '🏗️' },
  TIRES: { label: 'Reifenservice & Achsvermessung', badge: 'bg-slate-100 text-slate-800 border-slate-200', icon: '🛞' },
  BRAKES: { label: 'Bremsen- & Druckluftservice', badge: 'bg-rose-100 text-rose-800 border-rose-200', icon: '🛑' },
  GENERAL_INSPECTION: { label: 'Große Fahrzeuginspektion', badge: 'bg-emerald-100 text-emerald-800 border-emerald-200', icon: '🔧' }
};

const GEOFENCE_TYPE_COLORS = {
  FACTORY: { border: '#ea580c', fill: '#f97316', label: 'Werk / Produktion', badge: 'bg-orange-100 text-orange-800' },
  CONSTRUCTION_SITE: { border: '#2563eb', fill: '#3b82f6', label: 'Baustelle', badge: 'bg-blue-100 text-blue-800' },
  SUPPLIER: { border: '#9333ea', fill: '#a855f7', label: 'Lieferant / Umschlag', badge: 'bg-purple-100 text-purple-800' },
  PARKING: { border: '#059669', fill: '#10b981', label: 'Parkplatz / Rast', badge: 'bg-emerald-100 text-emerald-800' }
};

// Dispatch Status Definitions for Disponenten-Portal
const DISPATCH_STATUS_CONFIG = {
  LOADING_FACTORY: {
    label: 'Im Werk beladen',
    shortLabel: 'Im Werk',
    icon: '🏭',
    badge: 'bg-amber-100 text-amber-900 border-amber-300',
    color: 'amber',
    tileBg: 'from-amber-500/10 to-orange-500/10 border-amber-300 hover:border-amber-500',
    activeTile: 'bg-amber-600 text-white ring-2 ring-amber-400 shadow-md',
    desc: 'Im Werk Altlandsberg (speed = 0)'
  },
  OUTBOUND_TRANSIT: {
    label: 'Auf Anfahrt Baustelle',
    shortLabel: 'Auf Anfahrt',
    icon: '🚛',
    badge: 'bg-blue-100 text-blue-900 border-blue-300',
    color: 'blue',
    tileBg: 'from-blue-500/10 to-indigo-500/10 border-blue-300 hover:border-blue-500',
    activeTile: 'bg-blue-600 text-white ring-2 ring-blue-400 shadow-md',
    desc: 'Fährt zur Baustelle (speed > 0)'
  },
  UNLOADING_SITE: {
    label: 'Beim Entladen',
    shortLabel: 'Beim Entladen',
    icon: '🏗️',
    badge: 'bg-purple-100 text-purple-900 border-purple-300',
    color: 'purple',
    tileBg: 'from-purple-500/10 to-violet-500/10 border-purple-300 hover:border-purple-500',
    activeTile: 'bg-purple-600 text-white ring-2 ring-purple-400 shadow-md',
    desc: 'Auf Baustelle (speed = 0)'
  },
  INBOUND_RETURN: {
    label: 'Auf Rückweg (Leer)',
    shortLabel: 'Rückweg',
    icon: '🔄',
    badge: 'bg-emerald-100 text-emerald-900 border-emerald-300',
    color: 'emerald',
    tileBg: 'from-emerald-500/10 to-teal-500/10 border-emerald-300 hover:border-emerald-500',
    activeTile: 'bg-emerald-600 text-white ring-2 ring-emerald-400 shadow-md',
    desc: 'Fährt zurück zum Werk (verfügbar)'
  },
  STANDBY_IDLE: {
    label: 'Standby / Pause',
    shortLabel: 'Standby',
    icon: '⏸️',
    badge: 'bg-slate-100 text-slate-700 border-slate-300',
    color: 'slate',
    tileBg: 'from-slate-500/10 to-gray-500/10 border-slate-300 hover:border-slate-500',
    activeTile: 'bg-slate-700 text-white ring-2 ring-slate-400 shadow-md',
    desc: 'Parkt / Pause (> 30 Min.)'
  }
};

// Create custom SVG HTML Icon for Leaflet
function createTruckDivIcon(speed, plate, dispatchStatus) {
  const isMoving = (speed || 0) > 0;
  let gradientClasses = 'from-slate-700 to-blue-600';
  let ringClasses = 'ring-blue-500/30';

  if (dispatchStatus === 'LOADING_FACTORY') {
    gradientClasses = 'from-amber-600 to-orange-500';
    ringClasses = 'ring-amber-500/40';
  } else if (dispatchStatus === 'OUTBOUND_TRANSIT') {
    gradientClasses = 'from-blue-600 to-indigo-600';
    ringClasses = 'ring-blue-500/40';
  } else if (dispatchStatus === 'UNLOADING_SITE') {
    gradientClasses = 'from-purple-600 to-violet-600';
    ringClasses = 'ring-purple-500/40';
  } else if (dispatchStatus === 'INBOUND_RETURN') {
    gradientClasses = 'from-emerald-600 to-teal-500';
    ringClasses = 'ring-emerald-500/40';
  } else if (dispatchStatus === 'STANDBY_IDLE') {
    gradientClasses = 'from-slate-600 to-gray-700';
    ringClasses = 'ring-slate-400/40';
  } else if (isMoving) {
    gradientClasses = 'from-emerald-600 to-teal-400';
    ringClasses = 'ring-emerald-500/40';
  }
  
  const iconHtml = isMoving 
    ? `
      <div class="relative flex items-center justify-center w-11 h-11 truck-marker-moving" title="${plate} - In Fahrt (${speed} km/h)">
        <span class="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-70 animate-ping"></span>
        <div class="relative inline-flex items-center justify-center w-9 h-9 rounded-2xl bg-gradient-to-tr ${gradientClasses} text-white shadow-lg border-2 border-white ring-2 ${ringClasses}">
          <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
            <path stroke-linecap="round" stroke-linejoin="round" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
          </svg>
        </div>
      </div>
    `
    : `
      <div class="relative flex items-center justify-center w-10 h-10 truck-marker-parked" title="${plate} - Geparkt">
        <div class="relative inline-flex items-center justify-center w-8 h-8 rounded-2xl bg-gradient-to-tr ${gradientClasses} text-white shadow-md border-2 border-white ring-2 ${ringClasses}">
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
  const [activeTab, setActiveTab] = useState('MAP'); // 'MAP' | 'STAYS' | 'GEOFENCES' | 'TRACKING_SHARES' | 'MAINTENANCE' | 'DEMURRAGE'
  const [vehicles, setVehicles] = useState([]);
  const [geofences, setGeofences] = useState([]);
  const [trackingShares, setTrackingShares] = useState([]);
  const [maintenanceIntervals, setMaintenanceIntervals] = useState([]);
  const [maintenanceAlerts, setMaintenanceAlerts] = useState([]);
  const [maintenanceLogs, setMaintenanceLogs] = useState([]);
  const [maintenanceFilter, setMaintenanceFilter] = useState('ALL'); // 'ALL' | 'OVERDUE' | 'DUE_SOON' | 'OK'
  const [maintenanceVehicleFilter, setMaintenanceVehicleFilter] = useState('ALL');
  const [staysSummary, setStaysSummary] = useState(null);
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [isLive, setIsLive] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [countdown, setCountdown] = useState(45);
  const [filterStatus, setFilterStatus] = useState('ALL'); // 'ALL' | 'IN_MOTION' | 'PARKED'
  const [dispatchFilter, setDispatchFilter] = useState('ALL'); // 'ALL' | 'LOADING_FACTORY' | 'OUTBOUND_TRANSIT' | 'UNLOADING_SITE' | 'INBOUND_RETURN' | 'STANDBY_IDLE'
  const [dispatchSummary, setDispatchSummary] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [copiedTokenId, setCopiedTokenId] = useState(null);

  // Nearest Vehicle (Umkreissuche) Modal State
  const [isNearestModalOpen, setIsNearestModalOpen] = useState(false);
  const [isSearchingNearest, setIsSearchingNearest] = useState(false);
  const [nearestTargetType, setNearestTargetType] = useState('PLZ'); // 'PLZ' | 'GEOFENCE' | 'COORDS'
  const [nearestQuery, setNearestQuery] = useState('10115 Berlin');
  const [nearestSelectedGeofenceId, setNearestSelectedGeofenceId] = useState('');
  const [nearestLat, setNearestLat] = useState(52.5200);
  const [nearestLon, setNearestLon] = useState(13.4050);
  const [nearestRadius, setNearestRadius] = useState(150);
  const [nearestOnlyAvailable, setNearestOnlyAvailable] = useState(true);
  const [nearestResults, setNearestResults] = useState(null);

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

  // Maintenance Log Modal State (Service quittieren)
  const [isLogServiceModalOpen, setIsLogServiceModalOpen] = useState(false);
  const [selectedIntervalForLog, setSelectedIntervalForLog] = useState(null);
  const [logServiceForm, setLogServiceForm] = useState({
    interval_id: null,
    vehicle_id: '',
    plate: '',
    service_type: 'OIL_SERVICE',
    service_mileage: 0,
    service_date: new Date().toISOString().split('T')[0],
    performed_by: 'Werkstatt Altlandsberg',
    workshop_name: 'Tinglev Werkstatt Altlandsberg',
    invoice_number: '',
    cost_euros: 0,
    notes: ''
  });

  // Maintenance Interval Create / Edit Modal
  const [isIntervalModalOpen, setIsIntervalModalOpen] = useState(false);
  const [editingInterval, setEditingInterval] = useState(null);
  const [intervalForm, setIntervalForm] = useState({
    vehicle_id: '',
    plate: '',
    service_type: 'OIL_SERVICE',
    interval_km: 30000,
    last_service_mileage: 0,
    last_service_date: new Date().toISOString().split('T')[0],
    next_due_date: '',
    warning_threshold_km: 1500,
    notes: ''
  });

  // Maintenance History Logs Modal
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  // -------------------------------------------------------------
  // Trip Reconciliation & Demurrage (Standgeld & Fahrtabgleich § 412 HGB)
  // -------------------------------------------------------------
  const [reconciliationMonth, setReconciliationMonth] = useState(new Date().toISOString().slice(0, 7));
  const [reconciliationSiteFilter, setReconciliationSiteFilter] = useState('ALL');
  const [monthlyWaitingTimes, setMonthlyWaitingTimes] = useState(null);
  const [reconciliationsList, setReconciliationsList] = useState([]);
  const [selectedReconciliation, setSelectedReconciliation] = useState(null);
  const [isReconciliationModalOpen, setIsReconciliationModalOpen] = useState(false);
  const [isCalculatingReconciliation, setIsCalculatingReconciliation] = useState(false);
  const [reconciliationSubTab, setReconciliationSubTab] = useState('CALCULATOR'); // 'CALCULATOR', 'MONTHLY', 'ARCHIVE'
  const [reconciliationForm, setReconciliationForm] = useState({
    plate: 'MOL-TE 101',
    delivery_note_number: '',
    date: new Date().toISOString().split('T')[0],
    site_geofence_id: '',
    free_unloading_minutes: 60,
    hourly_demurrage_rate: 95.0,
    notes: ''
  });

  // -------------------------------------------------------------
  // Werksschutz & Flottensicherheit (Security, Speed & Off-Hours Audit)
  // -------------------------------------------------------------
  const [securityLogs, setSecurityLogs] = useState([]);
  const [securityStats, setSecurityStats] = useState(null);
  const [securitySettings, setSecuritySettings] = useState(null);
  const [securityFilterType, setSecurityFilterType] = useState('ALL'); // 'ALL' | 'FACTORY_SPEED_VIOLATION' | 'OFF_HOURS_MOVEMENT'
  const [securityFilterAck, setSecurityFilterAck] = useState('ALL'); // 'ALL' | 'UNACKNOWLEDGED' | 'ACKNOWLEDGED'
  const [securitySearchPlate, setSecuritySearchPlate] = useState('');
  const [isSecuritySettingsModalOpen, setIsSecuritySettingsModalOpen] = useState(false);
  const [isSecurityAckModalOpen, setIsSecurityAckModalOpen] = useState(false);
  const [selectedEventForAck, setSelectedEventForAck] = useState(null);
  const [ackNote, setAckNote] = useState('');
  const [isEvaluatingSecurity, setIsEvaluatingSecurity] = useState(false);
  const [isSavingSecuritySettings, setIsSavingSecuritySettings] = useState(false);
  const [securitySettingsForm, setSecuritySettingsForm] = useState({
    max_yard_speed: 20.0,
    quiet_hours_start: '20:00',
    quiet_hours_end: '05:00',
    weekend_quiet_all_day: true,
    off_hours_speed_threshold: 5.0,
    off_hours_distance_threshold_meters: 100.0,
    alert_email: '',
    webhook_url: '',
    cooldown_minutes: 15,
    is_active: true
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
      const [vehiclesData, geofencesData, sharesData, alertsData, intervalsData] = await Promise.all([
        api.getFleetVehicles(forceRefresh),
        api.getGeofences(),
        api.getTrackingShares(false),
        api.getMaintenanceAlerts(),
        api.getMaintenanceIntervals('ALL')
      ]);

      fetchSecurityData();

      if (vehiclesData && Array.isArray(vehiclesData.vehicles)) {
        setVehicles(vehiclesData.vehicles);
        setIsLive(vehiclesData.is_live);
        if (vehiclesData.dispatch_summary) {
          setDispatchSummary(vehiclesData.dispatch_summary);
        }
        if (vehiclesData.vehicles.length > 0 && !reconciliationForm.plate) {
          setReconciliationForm(prev => ({ ...prev, plate: vehiclesData.vehicles[0].plate }));
        }
      }
      if (Array.isArray(geofencesData)) {
        setGeofences(geofencesData);
        const firstSite = geofencesData.find(g => g.type === 'CONSTRUCTION_SITE') || geofencesData[0];
        if (firstSite && !reconciliationForm.site_geofence_id) {
          setReconciliationForm(prev => ({ ...prev, site_geofence_id: String(firstSite.id) }));
        }
      }
      if (Array.isArray(sharesData)) {
        setTrackingShares(sharesData);
      }
      if (Array.isArray(alertsData)) {
        setMaintenanceAlerts(alertsData);
      }
      if (Array.isArray(intervalsData)) {
        setMaintenanceIntervals(intervalsData);
      }
    } catch (err) {
      console.error('Fehler beim Laden der Telemetrie/Geofences/Tracking/Wartung:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
      setCountdown(45);
    }
  };

  // Nearest Vehicle Proximity Search (Umkreissuche für Disponenten)
  const handleSearchNearestVehicles = async (e) => {
    if (e) e.preventDefault();
    setIsSearchingNearest(true);
    try {
      const payload = {
        radius_km: Number(nearestRadius) || 150,
        limit: 10,
        only_available: Boolean(nearestOnlyAvailable)
      };

      if (nearestTargetType === 'GEOFENCE' && nearestSelectedGeofenceId) {
        payload.geofence_id = Number(nearestSelectedGeofenceId);
      } else if (nearestTargetType === 'COORDS') {
        payload.latitude = Number(nearestLat);
        payload.longitude = Number(nearestLon);
      } else {
        payload.query = (nearestQuery || '10115 Berlin').trim();
      }

      const res = await api.findNearestVehicles(payload);
      setNearestResults(res);
    } catch (err) {
      alert('Fehler bei der Umkreissuche: ' + err.message);
    } finally {
      setIsSearchingNearest(false);
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

  // Load Maintenance Data
  const fetchMaintenanceData = async (status = maintenanceFilter, vehId = maintenanceVehicleFilter) => {
    try {
      const [intervals, alerts, logs] = await Promise.all([
        api.getMaintenanceIntervals(status, vehId),
        api.getMaintenanceAlerts(),
        api.getMaintenanceLogs(vehId === 'ALL' ? null : vehId)
      ]);
      if (Array.isArray(intervals)) setMaintenanceIntervals(intervals);
      if (Array.isArray(alerts)) setMaintenanceAlerts(alerts);
      if (Array.isArray(logs)) setMaintenanceLogs(logs);
    } catch (err) {
      console.error('Fehler beim Laden der Wartungsdaten:', err);
    }
  };

  // Load Reconciliation & Demurrage Data
  const fetchReconciliationData = async (month = reconciliationMonth, siteId = reconciliationSiteFilter) => {
    try {
      const [waitingTimes, reports] = await Promise.all([
        api.getWaitingTimesReport(month, 60, siteId),
        api.getReconciliationReports(siteId)
      ]);
      if (waitingTimes) setMonthlyWaitingTimes(waitingTimes);
      if (Array.isArray(reports)) setReconciliationsList(reports);
    } catch (err) {
      console.error('Fehler beim Laden der Standgeld- und Fahrtabgleichsdaten:', err);
    }
  };

  // Load Security & Speed Audit Data
  const fetchSecurityData = async (type = securityFilterType, plate = securitySearchPlate, ack = securityFilterAck) => {
    try {
      const isAckParam = ack === 'ALL' ? undefined : (ack === 'ACKNOWLEDGED');
      const [logsRes, statsRes, settingsRes] = await Promise.all([
        api.getFleetSecurityLogs({
          type: type,
          plate: plate || undefined,
          is_acknowledged: isAckParam,
          limit: 100
        }),
        api.getFleetSecurityStats(),
        api.getFleetSecuritySettings()
      ]);

      if (logsRes && Array.isArray(logsRes.items)) {
        setSecurityLogs(logsRes.items);
      }
      if (statsRes) {
        setSecurityStats(statsRes);
      }
      if (settingsRes) {
        setSecuritySettings(settingsRes);
        setSecuritySettingsForm({
          max_yard_speed: settingsRes.max_yard_speed,
          quiet_hours_start: settingsRes.quiet_hours_start,
          quiet_hours_end: settingsRes.quiet_hours_end,
          weekend_quiet_all_day: settingsRes.weekend_quiet_all_day,
          off_hours_speed_threshold: settingsRes.off_hours_speed_threshold,
          off_hours_distance_threshold_meters: settingsRes.off_hours_distance_threshold_meters,
          alert_email: settingsRes.alert_email || '',
          webhook_url: settingsRes.webhook_url || '',
          cooldown_minutes: settingsRes.cooldown_minutes,
          is_active: settingsRes.is_active
        });
      }
    } catch (err) {
      console.error('Fehler beim Laden der Sicherheitsdaten:', err);
    }
  };

  const handleOpenSecuritySettings = () => {
    if (securitySettings) {
      setSecuritySettingsForm({
        max_yard_speed: securitySettings.max_yard_speed,
        quiet_hours_start: securitySettings.quiet_hours_start,
        quiet_hours_end: securitySettings.quiet_hours_end,
        weekend_quiet_all_day: securitySettings.weekend_quiet_all_day,
        off_hours_speed_threshold: securitySettings.off_hours_speed_threshold,
        off_hours_distance_threshold_meters: securitySettings.off_hours_distance_threshold_meters,
        alert_email: securitySettings.alert_email || '',
        webhook_url: securitySettings.webhook_url || '',
        cooldown_minutes: securitySettings.cooldown_minutes,
        is_active: securitySettings.is_active
      });
    }
    setIsSecuritySettingsModalOpen(true);
  };

  const handleSaveSecuritySettings = async (e) => {
    e.preventDefault();
    setIsSavingSecuritySettings(true);
    try {
      const payload = {
        max_yard_speed: parseFloat(securitySettingsForm.max_yard_speed) || 20.0,
        quiet_hours_start: securitySettingsForm.quiet_hours_start,
        quiet_hours_end: securitySettingsForm.quiet_hours_end,
        weekend_quiet_all_day: Boolean(securitySettingsForm.weekend_quiet_all_day),
        off_hours_speed_threshold: parseFloat(securitySettingsForm.off_hours_speed_threshold) || 5.0,
        off_hours_distance_threshold_meters: parseFloat(securitySettingsForm.off_hours_distance_threshold_meters) || 100.0,
        alert_email: securitySettingsForm.alert_email ? securitySettingsForm.alert_email.trim() : null,
        webhook_url: securitySettingsForm.webhook_url ? securitySettingsForm.webhook_url.trim() : null,
        cooldown_minutes: parseInt(securitySettingsForm.cooldown_minutes) || 15,
        is_active: Boolean(securitySettingsForm.is_active)
      };

      const updated = await api.updateFleetSecuritySettings(payload);
      setSecuritySettings(updated);
      setIsSecuritySettingsModalOpen(false);
      fetchSecurityData();
      alert('Sicherheitsregeln & Werksschutz-Konfiguration erfolgreich gespeichert!');
    } catch (err) {
      alert('Fehler beim Speichern der Sicherheitsregeln: ' + err.message);
    } finally {
      setIsSavingSecuritySettings(false);
    }
  };

  const handleOpenAckModal = (event) => {
    setSelectedEventForAck(event);
    setAckNote('');
    setIsSecurityAckModalOpen(true);
  };

  const handleSaveAck = async (e) => {
    e.preventDefault();
    if (!selectedEventForAck) return;
    try {
      await api.acknowledgeFleetSecurityEvent(selectedEventForAck.id, {
        note: ackNote.trim() || 'Vom Fuhrparkleiter geprüft und zur Kenntnis genommen.'
      });
      setIsSecurityAckModalOpen(false);
      setSelectedEventForAck(null);
      fetchSecurityData();
    } catch (err) {
      alert('Fehler beim Quittieren: ' + err.message);
    }
  };

  const handleEvaluateSecurityNow = async () => {
    setIsEvaluatingSecurity(true);
    try {
      const res = await api.evaluateFleetSecurity();
      fetchSecurityData();
      if (res && res.new_violations_detected > 0) {
        alert(`Prüfung abgeschlossen: ${res.new_violations_detected} neue Sicherheitsvorfälle erfasst!`);
      } else {
        alert('Prüfung abgeschlossen: Keine neuen Verstöße auf dem Werksgelände festgestellt.');
      }
    } catch (err) {
      alert('Fehler bei manueller Sicherheitsprüfung: ' + err.message);
    } finally {
      setIsEvaluatingSecurity(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchFleetTelemetry(false);
    fetchStaysData(selectedDate);
    fetchTrackingShares();
    fetchMaintenanceData();
    fetchReconciliationData();
    fetchSecurityData();
  }, []);

  // When tab changes
  useEffect(() => {
    if (activeTab === 'STAYS') {
      fetchStaysData(selectedDate);
    } else if (activeTab === 'TRACKING_SHARES') {
      fetchTrackingShares();
    } else if (activeTab === 'MAINTENANCE') {
      fetchMaintenanceData(maintenanceFilter, maintenanceVehicleFilter);
    } else if (activeTab === 'DEMURRAGE') {
      fetchReconciliationData(reconciliationMonth, reconciliationSiteFilter);
    } else if (activeTab === 'SECURITY') {
      fetchSecurityData(securityFilterType, securitySearchPlate, securityFilterAck);
    }
  }, [selectedDate, activeTab, maintenanceFilter, maintenanceVehicleFilter, reconciliationMonth, reconciliationSiteFilter, securityFilterType, securitySearchPlate, securityFilterAck]);

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
          } else if (activeTab === 'MAINTENANCE') {
            fetchMaintenanceData(maintenanceFilter, maintenanceVehicleFilter);
          } else if (activeTab === 'DEMURRAGE') {
            fetchReconciliationData(reconciliationMonth, reconciliationSiteFilter);
          } else if (activeTab === 'SECURITY') {
            fetchSecurityData(securityFilterType, securitySearchPlate, securityFilterAck);
          }
          return 45;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [activeTab, selectedDate, maintenanceFilter, maintenanceVehicleFilter, reconciliationMonth, reconciliationSiteFilter, securityFilterType, securitySearchPlate, securityFilterAck]);

  // Filtered vehicles
  const filteredVehicles = useMemo(() => {
    return vehicles.filter((v) => {
      const isMoving = (v.speed || 0) > 0;
      const matchesStatus = 
        filterStatus === 'ALL' ||
        (filterStatus === 'IN_MOTION' && isMoving) ||
        (filterStatus === 'PARKED' && !isMoving);

      const matchesDispatch = 
        dispatchFilter === 'ALL' || 
        (v.dispatch_status && v.dispatch_status.status === dispatchFilter);

      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = 
        !q ||
        (v.plate && v.plate.toLowerCase().includes(q)) ||
        (v.brand && v.brand.toLowerCase().includes(q)) ||
        (v.location && v.location.toLowerCase().includes(q));

      return matchesStatus && matchesDispatch && matchesSearch;
    });
  }, [vehicles, filterStatus, dispatchFilter, searchQuery]);

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
      const dispatchStatus = veh.dispatch_status?.status;
      const marker = L.marker([veh.lat, veh.lon], {
        icon: createTruckDivIcon(veh.speed, veh.plate, dispatchStatus)
      });

      const formattedMileage = veh.mileage 
        ? `${Number(veh.mileage).toLocaleString('de-DE')} km` 
        : '–';

      const dispatch = veh.dispatch_status;
      const dispatchBadgeHtml = dispatch 
        ? `
          <div class="px-2.5 py-1 rounded-xl text-[11px] font-bold ${
            dispatch.status === 'LOADING_FACTORY' ? 'bg-amber-100 text-amber-900 border border-amber-300' :
            dispatch.status === 'OUTBOUND_TRANSIT' ? 'bg-blue-100 text-blue-900 border border-blue-300' :
            dispatch.status === 'UNLOADING_SITE' ? 'bg-purple-100 text-purple-900 border border-purple-300' :
            dispatch.status === 'INBOUND_RETURN' ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' :
            'bg-slate-100 text-slate-700 border border-slate-300'
          } flex items-center justify-between">
            <span class="flex items-center space-x-1.5">
              <span>${
                dispatch.status === 'LOADING_FACTORY' ? '🏭' :
                dispatch.status === 'OUTBOUND_TRANSIT' ? '🚛' :
                dispatch.status === 'UNLOADING_SITE' ? '🏗️' :
                dispatch.status === 'INBOUND_RETURN' ? '🔄' : '⏸️'
              }</span>
              <span>${dispatch.label}</span>
            </span>
            ${dispatch.site_name ? `<span class="text-[10px] font-medium opacity-80 truncate max-w-[110px]">${dispatch.site_name}</span>` : ''}
          </div>
        `
        : '';

      const popupHtml = `
        <div class="p-4 space-y-3 min-w-[270px] text-xs">
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

          ${dispatchBadgeHtml}

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

  // Maintenance Handlers
  const handleOpenLogService = (interval) => {
    setSelectedIntervalForLog(interval);
    setLogServiceForm({
      interval_id: interval.id,
      vehicle_id: interval.vehicle_id,
      plate: interval.plate,
      service_type: interval.service_type,
      service_mileage: interval.current_mileage || interval.last_service_mileage,
      service_date: new Date().toISOString().split('T')[0],
      performed_by: 'Werkstatt Altlandsberg',
      workshop_name: 'Tinglev Werkstatt Altlandsberg',
      invoice_number: '',
      cost_euros: 0,
      notes: ''
    });
    setIsLogServiceModalOpen(true);
  };

  const handleSaveLogService = async (e) => {
    e.preventDefault();
    try {
      await api.logMaintenanceService(logServiceForm);
      setIsLogServiceModalOpen(false);
      fetchMaintenanceData();
      alert('Wartungsservice erfolgreich quittiert! Das nächste Fälligkeitsziel wurde aktualisiert.');
    } catch (err) {
      alert('Fehler beim Quittieren des Services: ' + err.message);
    }
  };

  const handleOpenCreateInterval = (vehicleId = null) => {
    const defaultVehicle = vehicleId 
      ? vehicles.find((v) => String(v.id) === String(vehicleId)) 
      : vehicles[0];

    setEditingInterval(null);
    setIntervalForm({
      vehicle_id: defaultVehicle ? String(defaultVehicle.id) : '101',
      plate: defaultVehicle ? defaultVehicle.plate : 'MOL-TE 101',
      service_type: 'OIL_SERVICE',
      interval_km: 30000,
      last_service_mileage: defaultVehicle?.mileage || 0,
      last_service_date: new Date().toISOString().split('T')[0],
      next_due_date: '',
      warning_threshold_km: 1500,
      notes: ''
    });
    setIsIntervalModalOpen(true);
  };

  const handleOpenEditInterval = (interval) => {
    setEditingInterval(interval);
    setIntervalForm({
      vehicle_id: interval.vehicle_id,
      plate: interval.plate,
      service_type: interval.service_type,
      interval_km: interval.interval_km,
      last_service_mileage: interval.last_service_mileage,
      last_service_date: interval.last_service_date || '',
      next_due_date: interval.next_due_date || '',
      warning_threshold_km: interval.warning_threshold_km,
      notes: interval.notes || ''
    });
    setIsIntervalModalOpen(true);
  };

  const handleSaveInterval = async (e) => {
    e.preventDefault();
    try {
      const selectedVeh = vehicles.find((v) => String(v.id) === String(intervalForm.vehicle_id));
      const payload = {
        ...intervalForm,
        plate: selectedVeh ? selectedVeh.plate : intervalForm.plate,
        interval_km: parseInt(intervalForm.interval_km) || 30000,
        last_service_mileage: parseInt(intervalForm.last_service_mileage) || 0,
        warning_threshold_km: parseInt(intervalForm.warning_threshold_km) || 1500,
        last_service_date: intervalForm.last_service_date || null,
        next_due_date: intervalForm.next_due_date || null
      };

      if (editingInterval) {
        await api.updateMaintenanceInterval(editingInterval.id, payload);
      } else {
        await api.createMaintenanceInterval(payload);
      }

      setIsIntervalModalOpen(false);
      fetchMaintenanceData();
    } catch (err) {
      alert('Fehler beim Speichern des Intervalls: ' + err.message);
    }
  };

  const handleDeleteInterval = async (intervalId) => {
    if (!window.confirm('Möchten Sie dieses Wartungsintervall wirklich löschen?')) return;
    try {
      await api.deleteMaintenanceInterval(intervalId);
      fetchMaintenanceData();
    } catch (err) {
      alert('Fehler beim Löschen des Intervalls: ' + err.message);
    }
  };

  const handleEvaluateMaintenance = async () => {
    try {
      const res = await api.evaluateMaintenance();
      fetchMaintenanceData();
      alert(`Wartungsüberwachung ausgeführt: ${res.alerts_count} fällige Services identifiziert.`);
    } catch (err) {
      alert('Fehler bei der Evaluierung: ' + err.message);
    }
  };

  // -------------------------------------------------------------
  // Reconciliation & Demurrage Handlers
  // -------------------------------------------------------------
  const handleRunReconciliation = async (e) => {
    e.preventDefault();
    if (!reconciliationForm.delivery_note_number.trim()) {
      alert('Bitte geben Sie eine Lieferschein-Nummer ein.');
      return;
    }
    if (!reconciliationForm.site_geofence_id) {
      alert('Bitte wählen Sie eine Zielbaustelle aus.');
      return;
    }

    setIsCalculatingReconciliation(true);
    try {
      const payload = {
        plate: reconciliationForm.plate,
        delivery_note_number: reconciliationForm.delivery_note_number.trim(),
        date: reconciliationForm.date,
        site_geofence_id: parseInt(reconciliationForm.site_geofence_id),
        free_unloading_minutes: parseInt(reconciliationForm.free_unloading_minutes) || 60,
        hourly_demurrage_rate: parseFloat(reconciliationForm.hourly_demurrage_rate) || 95.0,
        notes: reconciliationForm.notes ? reconciliationForm.notes.trim() : null
      };

      const result = await api.createTripReconciliation(payload);
      setSelectedReconciliation(result);
      setIsReconciliationModalOpen(true);
      fetchReconciliationData(reconciliationMonth, reconciliationSiteFilter);
    } catch (err) {
      alert('Fehler beim Fahrtabgleich: ' + err.message);
    } finally {
      setIsCalculatingReconciliation(false);
    }
  };

  const handleOpenReconciliationModal = (report) => {
    setSelectedReconciliation(report);
    setIsReconciliationModalOpen(true);
  };

  const handlePrintAuditReport = () => {
    window.print();
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

        <button
          onClick={() => setActiveTab('MAINTENANCE')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all ${
            activeTab === 'MAINTENANCE'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-100'
          }`}
        >
          <Wrench className="w-4 h-4" />
          <span>Wartung & Werkstatt</span>
          {maintenanceAlerts.length > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-rose-500 text-white font-mono font-bold animate-pulse">
              {maintenanceAlerts.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('DEMURRAGE')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all ${
            activeTab === 'DEMURRAGE'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-100'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>Standgeld & Fahrtabgleich</span>
          {monthlyWaitingTimes?.total_exceeded_deliveries > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-500 text-white font-mono font-bold">
              {monthlyWaitingTimes.total_exceeded_deliveries}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('SECURITY')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all ${
            activeTab === 'SECURITY'
              ? 'bg-gradient-to-r from-rose-600 to-red-600 text-white shadow-md shadow-rose-600/25'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-100'
          }`}
        >
          <ShieldAlert className={`w-4 h-4 ${activeTab === 'SECURITY' ? 'text-white' : 'text-rose-500'}`} />
          <span>Werksschutz & Sicherheit</span>
          {securityStats?.unacknowledged_events > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-rose-600 text-white font-mono font-bold animate-pulse shadow-sm">
              {securityStats.unacknowledged_events}
            </span>
          )}
        </button>
      </div>

      {/* 3. TAB CONTENT: MAP VIEW */}
      {activeTab === 'MAP' && (
        <div className="space-y-6 animate-fade-in">
          {/* Disponenten-Leitzentrale (5 Status-Kacheln + Umkreissuche) */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-5 border border-slate-700 shadow-xl text-white space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-400 shadow-inner">
                  <Compass className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h2 className="text-base font-black tracking-tight text-white">Disponenten-Leitzentrale</h2>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/30 text-blue-300 border border-blue-400/30">
                      Live-Disposition
                    </span>
                  </div>
                  <p className="text-xs text-slate-300">
                    Status-Klassifizierung &amp; Logistik-Steuerung der Schwerlast-Flotte
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                {dispatchFilter !== 'ALL' && (
                  <button
                    onClick={() => setDispatchFilter('ALL')}
                    className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-600 transition-colors flex items-center space-x-1.5"
                  >
                    <X className="w-3.5 h-3.5 text-rose-400" />
                    <span>Filter aufheben ({filteredVehicles.length}/{vehicles.length})</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    setIsNearestModalOpen(true);
                    if (!nearestResults && vehicles.length > 0) {
                      handleSearchNearestVehicles();
                    }
                  }}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-blue-600/30 active:scale-95 transition-all flex items-center space-x-2 border border-blue-400/30"
                >
                  <Search className="w-4 h-4 text-blue-200" />
                  <span>Nächstgelegenes Fahrzeug finden</span>
                </button>
              </div>
            </div>

            {/* 5 Disponenten-Kacheln mit 1-Klick-Filterung */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {Object.entries(DISPATCH_STATUS_CONFIG).map(([statusCode, cfg]) => {
                const count = dispatchSummary 
                  ? (statusCode === 'LOADING_FACTORY' ? dispatchSummary.loading_factory :
                     statusCode === 'OUTBOUND_TRANSIT' ? dispatchSummary.outbound_transit :
                     statusCode === 'UNLOADING_SITE' ? dispatchSummary.unloading_site :
                     statusCode === 'INBOUND_RETURN' ? dispatchSummary.inbound_return :
                     dispatchSummary.standby_idle)
                  : vehicles.filter(v => v.dispatch_status?.status === statusCode).length;

                const isSelected = dispatchFilter === statusCode;

                return (
                  <button
                    key={statusCode}
                    onClick={() => setDispatchFilter(prev => prev === statusCode ? 'ALL' : statusCode)}
                    className={`p-3.5 rounded-2xl border text-left transition-all relative overflow-hidden flex flex-col justify-between ${
                      isSelected
                        ? `${cfg.activeTile} scale-[1.02]`
                        : `bg-slate-800/80 border-slate-700/80 hover:border-slate-600 hover:bg-slate-800 text-slate-300`
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xl">{cfg.icon}</span>
                      <span className={`px-2.5 py-0.5 rounded-xl font-mono font-black text-sm ${
                        isSelected 
                          ? 'bg-white/20 text-white' 
                          : 'bg-slate-900 text-slate-100 border border-slate-700'
                      }`}>
                        {count || 0}
                      </span>
                    </div>

                    <div className="mt-2.5">
                      <p className={`font-bold text-xs ${isSelected ? 'text-white font-extrabold' : 'text-slate-100'}`}>
                        {cfg.label}
                      </p>
                      <p className={`text-[10px] mt-0.5 truncate ${isSelected ? 'text-white/80' : 'text-slate-400'}`}>
                        {cfg.desc}
                      </p>
                    </div>

                    {isSelected && (
                      <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-white animate-ping"></div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

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
                    title="Auf Werk Altlandsberg (Zentrale) zentrieren"
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
                    const dispatch = veh.dispatch_status;
                    const statusCfg = dispatch ? DISPATCH_STATUS_CONFIG[dispatch.status] : null;

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
                            <span className="font-bold text-slate-900 truncate max-w-[130px]">
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

                        {/* Dispatch Status Badge */}
                        {dispatch && statusCfg && (
                          <div className="flex items-center space-x-1.5">
                            <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border flex items-center space-x-1 ${statusCfg.badge}`}>
                              <span>{statusCfg.icon}</span>
                              <span>{dispatch.label}</span>
                            </span>
                            {dispatch.site_name && (
                              <span className="text-[10px] text-slate-500 font-medium truncate max-w-[140px]">
                                ({dispatch.site_name})
                              </span>
                            )}
                          </div>
                        )}

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

      {/* 7. TAB CONTENT: VORAUSSCHAUENDE WARTUNG & WERKSTATT-SERVICES */}
      {activeTab === 'MAINTENANCE' && (
        <div className="space-y-6 animate-fade-in">
          {/* Maintenance KPIs Header Banner */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-card flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Überfällige Services</p>
                <p className="text-2xl sm:text-3xl font-black text-rose-600 mt-1">
                  {maintenanceIntervals.filter((i) => i.status === 'OVERDUE').length} <span className="text-xs font-bold text-rose-600/70">Wartungen</span>
                </p>
                <p className="text-[11px] text-rose-600 font-semibold mt-1">Dringender Werkstatttermin nötig</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6 animate-bounce" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-card flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Bald fällig (&le; 1.500 km / 30 T.)</p>
                <p className="text-2xl sm:text-3xl font-black text-amber-600 mt-1">
                  {maintenanceIntervals.filter((i) => i.status === 'DUE_SOON').length} <span className="text-xs font-bold text-amber-600/70">Avisiert</span>
                </p>
                <p className="text-[11px] text-amber-600 font-medium mt-1">Werkstatt-Disposition planen</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <Clock className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-card flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Im Wartungsplan (OK)</p>
                <p className="text-2xl sm:text-3xl font-black text-emerald-600 mt-1">
                  {maintenanceIntervals.filter((i) => i.status === 'OK').length} <span className="text-xs font-bold text-emerald-600/70">Services</span>
                </p>
                <p className="text-[11px] text-slate-400 font-medium mt-1">Laufleistung im grünen Bereich</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-card flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Werkstatt-Protokolle</p>
                <p className="text-2xl sm:text-3xl font-black text-blue-600 mt-1">
                  {maintenanceLogs.length} <span className="text-xs font-bold text-blue-400">Einträge</span>
                </p>
                <p className="text-[11px] text-slate-400 font-medium mt-1">Quittierte Inspektionen</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <FileText className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Main Maintenance Table Card */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-card space-y-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <div className="flex items-center space-x-2.5">
                  <h3 className="text-xl font-black text-slate-900">Vorausschauende Wartung & Fuhrpark-Inspektionen</h3>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-100 text-blue-800 border border-blue-200">
                    Telemetrie-Laufleistung
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1 max-w-2xl">
                  Automatische Synchronisation der Gesamtkilometerstände via Navkonzept zur Einhaltung gesetzlicher Prüffristen (TÜV/SP, UVV) und herstellerkonformer Öl- und Reifenservices.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  onClick={handleEvaluateMaintenance}
                  className="flex items-center space-x-1.5 px-3.5 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
                  title="Wartungszustand aller Fahrzeuge neu berechnen"
                >
                  <RotateCw className="w-3.5 h-3.5 text-blue-600" />
                  <span>Jetzt evaluieren</span>
                </button>

                <button
                  onClick={() => setIsHistoryModalOpen(true)}
                  className="flex items-center space-x-1.5 px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
                >
                  <History className="w-3.5 h-3.5 text-slate-600" />
                  <span>Werkstatt-Historie ({maintenanceLogs.length})</span>
                </button>

                <button
                  onClick={() => handleOpenCreateInterval()}
                  className="flex items-center space-x-1.5 px-4 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/20 active:scale-95 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>Wartungsplan anlegen</span>
                </button>
              </div>
            </div>

            {/* Filter Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-100">
              <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100/80 rounded-2xl">
                <button
                  onClick={() => setMaintenanceFilter('ALL')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    maintenanceFilter === 'ALL' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  Alle ({maintenanceIntervals.length})
                </button>
                <button
                  onClick={() => setMaintenanceFilter('OVERDUE')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    maintenanceFilter === 'OVERDUE' ? 'bg-rose-600 text-white shadow-sm' : 'text-slate-500 hover:text-rose-600'
                  }`}
                >
                  Überfällig ({maintenanceIntervals.filter((i) => i.status === 'OVERDUE').length})
                </button>
                <button
                  onClick={() => setMaintenanceFilter('DUE_SOON')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    maintenanceFilter === 'DUE_SOON' ? 'bg-amber-500 text-white shadow-sm' : 'text-slate-500 hover:text-amber-600'
                  }`}
                >
                  Bald fällig ({maintenanceIntervals.filter((i) => i.status === 'DUE_SOON').length})
                </button>
                <button
                  onClick={() => setMaintenanceFilter('OK')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    maintenanceFilter === 'OK' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-500 hover:text-emerald-600'
                  }`}
                >
                  Im Plan ({maintenanceIntervals.filter((i) => i.status === 'OK').length})
                </button>
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-xs text-slate-400 font-semibold">Fahrzeug:</span>
                <select
                  value={maintenanceVehicleFilter}
                  onChange={(e) => setMaintenanceVehicleFilter(e.target.value)}
                  className="px-3 py-1.5 text-xs bg-slate-50 rounded-xl border border-slate-200 font-medium focus:outline-none"
                >
                  <option value="ALL">Alle Fahrzeuge</option>
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.plate} ({v.brand || 'LKW'})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Intervals List Grid */}
            {maintenanceIntervals.length === 0 ? (
              <div className="py-16 text-center text-slate-400 text-xs space-y-3">
                <Wrench className="w-8 h-8 mx-auto text-slate-300" />
                <p className="font-bold text-slate-700 text-sm">Keine Wartungsintervalle für diesen Filter gefunden.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {maintenanceIntervals.map((interval) => {
                  const typeInfo = SERVICE_TYPE_INFO[interval.service_type] || {
                    label: interval.service_type,
                    badge: 'bg-slate-100 text-slate-800 border-slate-200',
                    icon: '🔧'
                  };

                  const isOverdue = interval.status === 'OVERDUE';
                  const isDueSoon = interval.status === 'DUE_SOON';
                  const progressPct = interval.progress_percentage || 0;

                  // Progress bar color
                  let progressBarColor = 'bg-emerald-500';
                  if (isOverdue) progressBarColor = 'bg-rose-600';
                  else if (isDueSoon) progressBarColor = 'bg-amber-500';

                  const dueDateStr = interval.next_due_date
                    ? new Date(interval.next_due_date).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
                    : null;

                  return (
                    <div
                      key={interval.id}
                      className={`p-5 rounded-3xl border transition-all flex flex-col justify-between space-y-4 shadow-sm bg-white ${
                        isOverdue
                          ? 'border-rose-300 ring-2 ring-rose-500/10 hover:border-rose-400'
                          : isDueSoon
                          ? 'border-amber-300 ring-2 ring-amber-500/10 hover:border-amber-400'
                          : 'border-slate-100 hover:border-slate-200'
                      }`}
                    >
                      <div className="space-y-3">
                        {/* Header: Plate & Status */}
                        <div className="flex items-center justify-between">
                          <span className="px-2.5 py-1 rounded-xl bg-slate-900 text-white font-mono font-bold text-xs tracking-wider shadow-sm">
                            {interval.plate}
                          </span>

                          {isOverdue ? (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200 flex items-center space-x-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-ping"></span>
                              <span>Überfällig</span>
                            </span>
                          ) : isDueSoon ? (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 flex items-center space-x-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                              <span>Bald fällig</span>
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                              Im Plan
                            </span>
                          )}
                        </div>

                        {/* Service Type Title */}
                        <div>
                          <div className="flex items-center space-x-1.5">
                            <span className="text-sm">{typeInfo.icon}</span>
                            <h4 className="font-extrabold text-sm text-slate-900 leading-tight">
                              {typeInfo.label}
                            </h4>
                          </div>
                          {interval.notes && (
                            <p className="text-[11px] text-slate-500 mt-1 line-clamp-1 italic">
                              „{interval.notes}“
                            </p>
                          )}
                        </div>

                        {/* Mileage Progress Bar */}
                        <div className="space-y-1.5 bg-slate-50/90 p-3 rounded-2xl border border-slate-100 text-xs">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-slate-500 font-medium">Laufleistung:</span>
                            <span className="font-mono font-bold text-slate-800">
                              {interval.current_mileage?.toLocaleString('de-DE')} / {interval.next_due_mileage?.toLocaleString('de-DE')} km
                            </span>
                          </div>

                          {/* Bar */}
                          <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${progressBarColor} transition-all duration-500`}
                              style={{ width: `${Math.min(100, Math.max(5, progressPct))}%` }}
                            ></div>
                          </div>

                          <div className="flex items-center justify-between text-[10px] pt-0.5">
                            <span className="font-semibold text-slate-400">
                              Intervall: {interval.interval_km.toLocaleString('de-DE')} km
                            </span>
                            <span
                              className={`font-mono font-bold ${
                                isOverdue
                                  ? 'text-rose-600'
                                  : isDueSoon
                                  ? 'text-amber-600'
                                  : 'text-emerald-600'
                              }`}
                            >
                              {interval.remaining_km <= 0
                                ? `Seit ${Math.abs(interval.remaining_km).toLocaleString('de-DE')} km überfällig!`
                                : `noch ${interval.remaining_km?.toLocaleString('de-DE')} km`}
                            </span>
                          </div>
                        </div>

                        {/* Dates Info */}
                        <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-500 px-1 font-medium">
                          <div>
                            <span className="block text-slate-400">Letzter Service:</span>
                            <span className="font-bold text-slate-700">
                              {interval.last_service_date || '–'} ({interval.last_service_mileage?.toLocaleString('de-DE')} km)
                            </span>
                          </div>
                          {dueDateStr && (
                            <div>
                              <span className="block text-slate-400">Fristdatum:</span>
                              <span className={`font-bold ${isOverdue ? 'text-rose-600' : 'text-slate-700'}`}>
                                {dueDateStr}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                        <button
                          onClick={() => handleOpenLogService(interval)}
                          className="flex-1 flex items-center justify-center space-x-1.5 py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs shadow-sm active:scale-95 transition-all"
                        >
                          <Wrench className="w-3.5 h-3.5" />
                          <span>Service quittieren</span>
                        </button>

                        <button
                          onClick={() => handleOpenEditInterval(interval)}
                          className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
                          title="Intervall bearbeiten"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleDeleteInterval(interval.id)}
                          className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors"
                          title="Intervall löschen"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
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

      {/* 7. TAB CONTENT: STANDGELD & FAHRTABGLEICH (§ 412 HGB) */}
      {activeTab === 'DEMURRAGE' && (
        <div className="space-y-6 animate-fade-in">
          {/* Sub Navigation Bar */}
          <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-card flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setReconciliationSubTab('CALCULATOR')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all ${
                  reconciliationSubTab === 'CALCULATOR'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/80'
                }`}
              >
                <DollarSign className="w-4 h-4" />
                <span>Fahrtabgleich-Rechner</span>
              </button>

              <button
                onClick={() => setReconciliationSubTab('MONTHLY')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all ${
                  reconciliationSubTab === 'MONTHLY'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/80'
                }`}
              >
                <Calendar className="w-4 h-4" />
                <span>Monatscontrolling & Verzögerungen</span>
                {monthlyWaitingTimes?.total_exceeded_deliveries > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-500 text-white font-mono">
                    {monthlyWaitingTimes.total_exceeded_deliveries}
                  </span>
                )}
              </button>

              <button
                onClick={() => setReconciliationSubTab('ARCHIVE')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all ${
                  reconciliationSubTab === 'ARCHIVE'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/80'
                }`}
              >
                <History className="w-4 h-4" />
                <span>Archivierte Nachweise ({reconciliationsList.length})</span>
              </button>
            </div>

            <button
              onClick={() => fetchReconciliationData(reconciliationMonth, reconciliationSiteFilter)}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors self-start md:self-auto"
            >
              <RotateCw className="w-3.5 h-3.5 text-blue-600" />
              <span>Daten aktualisieren</span>
            </button>
          </div>

          {/* SUB-TAB 1: RECONCILIATION CALCULATOR FORM */}
          {reconciliationSubTab === 'CALCULATOR' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Form */}
              <div className="lg:col-span-7 bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-card space-y-6">
                <div className="flex items-center space-x-3 border-b border-slate-100 pb-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-blue-600/20">
                    <DollarSign className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900">Fahrtabgleich & Standgeldberechnung</h3>
                    <p className="text-xs text-slate-500 font-medium">
                      GPS-gestützter Abgleich der Werkausfahrt, Ankunft und Standzeit mit manipulationssicherem Beleg
                    </p>
                  </div>
                </div>

                <form onSubmit={handleRunReconciliation} className="space-y-4 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1.5">Lieferschein-Nummer *</label>
                      <input
                        type="text"
                        required
                        value={reconciliationForm.delivery_note_number}
                        onChange={(e) => setReconciliationForm({ ...reconciliationForm, delivery_note_number: e.target.value })}
                        placeholder="z. B. LS-2026-8842"
                        className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 bg-slate-50 font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1.5">Fahrzeug (Kennzeichen) *</label>
                      <select
                        required
                        value={reconciliationForm.plate}
                        onChange={(e) => setReconciliationForm({ ...reconciliationForm, plate: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 bg-slate-50 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      >
                        {vehicles.map((v) => (
                          <option key={v.id} value={v.plate}>
                            {v.plate} - {v.brand || 'Schwerlast-LKW'}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1.5">Datum der Anlieferung *</label>
                      <input
                        type="date"
                        required
                        value={reconciliationForm.date}
                        onChange={(e) => setReconciliationForm({ ...reconciliationForm, date: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 bg-slate-50 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1.5">Zielbaustelle (Geofence) *</label>
                      <select
                        required
                        value={reconciliationForm.site_geofence_id}
                        onChange={(e) => setReconciliationForm({ ...reconciliationForm, site_geofence_id: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 bg-slate-50 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      >
                        <option value="">-- Zielbaustelle wählen --</option>
                        {geofences.map((g) => (
                          <option key={g.id} value={g.id}>
                            {g.name} ({GEOFENCE_TYPE_COLORS[g.type]?.label || g.type})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1.5">Freie Entladezeit (Minuten) *</label>
                      <input
                        type="number"
                        required
                        min="0"
                        max="480"
                        value={reconciliationForm.free_unloading_minutes}
                        onChange={(e) => setReconciliationForm({ ...reconciliationForm, free_unloading_minutes: parseInt(e.target.value) || 60 })}
                        className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 bg-slate-50 font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      />
                      <span className="text-[10px] text-slate-400 mt-1 block">Standard gemäß VBGL: 60 Minuten</span>
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1.5">Stundensatz Standgeld (€/h) *</label>
                      <input
                        type="number"
                        step="0.5"
                        required
                        min="0"
                        value={reconciliationForm.hourly_demurrage_rate}
                        onChange={(e) => setReconciliationForm({ ...reconciliationForm, hourly_demurrage_rate: parseFloat(e.target.value) || 95.0 })}
                        className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 bg-slate-50 font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      />
                      <span className="text-[10px] text-slate-400 mt-1 block">Schwerlastzug inkl. Fahrereinsatz (95.00 €)</span>
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1.5">Baustellen- & Verzögerungshinweise (optional)</label>
                    <textarea
                      rows="3"
                      value={reconciliationForm.notes}
                      onChange={(e) => setReconciliationForm({ ...reconciliationForm, notes: e.target.value })}
                      placeholder="z. B. Kranführer erst ab 10:30 Uhr einsatzbereit, Zufahrt durch Fremdfahrzeuge blockiert..."
                      className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 bg-slate-50 focus:outline-none text-xs"
                    />
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-3">
                    <button
                      type="submit"
                      disabled={isCalculatingReconciliation}
                      className="px-6 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs shadow-lg shadow-blue-600/25 active:scale-95 transition-all flex items-center space-x-2 disabled:opacity-50"
                    >
                      {isCalculatingReconciliation ? (
                        <>
                          <RotateCw className="w-4 h-4 animate-spin" />
                          <span>Fahrt wird abgeglichen...</span>
                        </>
                      ) : (
                        <>
                          <DollarSign className="w-4 h-4" />
                          <span>Fahrtabgleich starten & Beleg generieren</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>

              {/* Right Column: Info & Quick Samples */}
              <div className="lg:col-span-5 space-y-6">
                <div className="bg-gradient-to-br from-slate-900 to-blue-950 text-white p-6 sm:p-7 rounded-3xl shadow-xl space-y-4">
                  <div className="flex items-center space-x-2 text-cyan-400 font-extrabold text-xs tracking-wider uppercase">
                    <Shield className="w-4 h-4" />
                    <span>Rechtssicherheit & Nachweis (§ 412 HGB)</span>
                  </div>
                  <h4 className="text-lg font-black leading-snug">
                    Manipulationssichere GPS-Dokumentation für Standgeldforderungen
                  </h4>
                  <p className="text-slate-300 text-xs leading-relaxed">
                    Bei Verzögerungen der Entladung auf Kundenbaustellen sichert der automatisierte Fahrtabgleich den Nachweis:
                  </p>
                  <ul className="space-y-2 text-xs text-slate-200">
                    <li className="flex items-start space-x-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>Exakte Abfahrt vom Werk Altlandsberg (GPS-Geofence EXIT)</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>Minutengenaues Eintreffen an der Baustelle (Geofence ENTER)</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>Nachweis von Stillstandszeiten mit Geschwindigkeit = 0 km/h</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>Rechtssicherer Prüfbericht nach ADSp / VBGL mit Zeit- und Koordinatenstempel</span>
                    </li>
                  </ul>
                </div>

                {/* Muster-Fälle Schnellzugriff */}
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-card space-y-3">
                  <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider text-slate-400">
                    Letzte erstellte Standgeldbelege
                  </h4>
                  {reconciliationsList.slice(0, 3).map((r) => (
                    <div
                      key={r.id || r.report_number}
                      onClick={() => handleOpenReconciliationModal(r)}
                      className="p-3 rounded-2xl bg-slate-50 hover:bg-slate-100 cursor-pointer transition-all border border-slate-100 flex items-center justify-between text-xs"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-slate-900">{r.delivery_note_number}</span>
                          <span className="font-mono text-[10px] text-slate-500">({r.plate})</span>
                        </div>
                        <p className="text-[11px] text-slate-500 truncate max-w-[200px]">{r.site_name}</p>
                      </div>
                      <div className="text-right">
                        <span className={`font-mono font-bold text-xs block ${r.demurrage_total_netto > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                          {r.demurrage_total_netto > 0 ? `${r.demurrage_total_netto.toFixed(2)} €` : '0,00 € (Im Plan)'}
                        </span>
                        <span className="text-[10px] text-slate-400">{r.trip_date}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* SUB-TAB 2: MONTHLY CONTROLLING & ANALYSIS */}
          {reconciliationSubTab === 'MONTHLY' && (
            <div className="space-y-6">
              {/* Filter & Toolbar */}
              <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-slate-700">Monat:</span>
                    <input
                      type="month"
                      value={reconciliationMonth}
                      onChange={(e) => {
                        setReconciliationMonth(e.target.value);
                        fetchReconciliationData(e.target.value, reconciliationSiteFilter);
                      }}
                      className="px-3.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold font-mono focus:outline-none"
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-slate-700">Baustelle:</span>
                    <select
                      value={reconciliationSiteFilter}
                      onChange={(e) => {
                        setReconciliationSiteFilter(e.target.value);
                        fetchReconciliationData(reconciliationMonth, e.target.value);
                      }}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium focus:outline-none"
                    >
                      <option value="ALL">Alle Baustellen</option>
                      {geofences.map((g) => (
                        <option key={g.id} value={g.id}>
                          {g.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="text-xs text-slate-500 font-medium">
                  Basis: Entladezeit &gt; 60 Minuten (Stundensatz 95,00 €/h)
                </div>
              </div>

              {/* KPI Metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white p-6 rounded-3xl border border-rose-100 shadow-card flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-bold text-rose-500 uppercase tracking-wider">Entladeverzögerungen</p>
                    <p className="text-2xl sm:text-3xl font-black text-rose-700 mt-1">
                      {monthlyWaitingTimes?.total_exceeded_deliveries || 0}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">Anlieferungen &gt; 60 Min. Standzeit</p>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
                    <Clock className="w-6 h-6" />
                  </div>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-amber-100 shadow-card flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-bold text-amber-500 uppercase tracking-wider">Verzögerungsstunden</p>
                    <p className="text-2xl sm:text-3xl font-black text-amber-700 mt-1">
                      {monthlyWaitingTimes?.total_delay_hours?.toFixed(1) || '0.0'} <span className="text-xs text-slate-400 font-bold">Std.</span>
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Gesamt: {monthlyWaitingTimes?.total_delay_minutes || 0} Minuten Wartezeit
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                    <Gauge className="w-6 h-6" />
                  </div>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-emerald-100 shadow-card flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">Forderungssumme Standgeld</p>
                    <p className="text-2xl sm:text-3xl font-black text-emerald-700 mt-1">
                      {monthlyWaitingTimes?.total_demurrage_eur ? `${monthlyWaitingTimes.total_demurrage_eur.toLocaleString('de-DE', { minimumFractionDigits: 2 })} €` : '0,00 €'}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">Abrechenbare Standgelder Netto</p>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <DollarSign className="w-6 h-6" />
                  </div>
                </div>
              </div>

              {/* Baustellen Ranking Table */}
              <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-card space-y-4">
                <h4 className="font-extrabold text-base text-slate-900">
                  Baustellen-Übersicht & Standzeiten-Ranking ({reconciliationMonth})
                </h4>

                {(!monthlyWaitingTimes?.by_site || monthlyWaitingTimes.by_site.length === 0) ? (
                  <div className="py-12 text-center text-slate-400 text-xs space-y-2">
                    <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-400" />
                    <p className="font-bold text-slate-700 text-sm">Keine Entladeverzögerungen über 60 Minuten im gewählten Monat.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead>
                        <tr className="border-b border-slate-100 text-[11px] text-slate-400 uppercase tracking-wider font-bold">
                          <th className="py-3 px-3">Baustelle</th>
                          <th className="py-3 px-3 text-center">Vorfälle (&gt;60 Min)</th>
                          <th className="py-3 px-3 text-center">Ø Verweildauer</th>
                          <th className="py-3 px-3 text-center">Verzögerung (Std.)</th>
                          <th className="py-3 px-3 text-right">Standgeldforderung</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium">
                        {monthlyWaitingTimes.by_site.map((site) => (
                          <tr key={site.geofence_id} className="hover:bg-slate-50 transition-colors">
                            <td className="py-3.5 px-3">
                              <span className="font-bold text-slate-900 block">{site.site_name}</span>
                              <span className="text-[10px] text-slate-400 font-mono">Geofence #{site.geofence_id}</span>
                            </td>
                            <td className="py-3.5 px-3 text-center font-bold text-slate-800">
                              <span className="px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                                {site.incident_count} Transporte
                              </span>
                            </td>
                            <td className="py-3.5 px-3 text-center font-mono text-slate-700">
                              {site.avg_dwell_minutes} Min.
                            </td>
                            <td className="py-3.5 px-3 text-center font-mono text-amber-700 font-bold">
                              {(site.total_delay_minutes / 60).toFixed(1)} Std. ({site.total_delay_minutes} Min.)
                            </td>
                            <td className="py-3.5 px-3 text-right font-mono font-black text-rose-600 text-sm">
                              {site.total_demurrage_eur?.toLocaleString('de-DE', { minimumFractionDigits: 2 })} €
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* SUB-TAB 3: ARCHIVE & REPORTS LIST */}
          {reconciliationSubTab === 'ARCHIVE' && (
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-card space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h4 className="font-extrabold text-base text-slate-900">Archivierte Standgeld- & Fahrtabgleichsbelege</h4>
                  <p className="text-xs text-slate-500 font-medium">
                    Manipulationssichere Einzelnachweise mit GPS-Audit-Trail und Rechtsbeleg
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 font-mono font-bold text-xs">
                  {reconciliationsList.length} Belege
                </span>
              </div>

              {reconciliationsList.length === 0 ? (
                <div className="py-16 text-center text-slate-400 text-xs space-y-2">
                  <FileText className="w-8 h-8 mx-auto text-slate-300" />
                  <p>Bisher wurden keine Fahrtabgleiche gespeichert.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {reconciliationsList.map((rep) => {
                    const isDemurrage = rep.demurrage_total_netto > 0;
                    return (
                      <div
                        key={rep.id || rep.report_number}
                        className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50 p-3 rounded-2xl transition-all"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2.5">
                            <span className="px-2.5 py-1 rounded-xl bg-slate-900 text-white font-mono font-bold text-xs">
                              {rep.plate}
                            </span>
                            <span className="font-bold text-slate-900 text-sm">{rep.delivery_note_number}</span>
                            <span className="text-[10px] text-slate-400 font-mono">({rep.report_number})</span>
                          </div>
                          <div className="text-xs text-slate-600 flex items-center space-x-3">
                            <span>📍 Ziel: <strong>{rep.site_name}</strong></span>
                            <span>• Datum: <strong>{rep.trip_date}</strong></span>
                            <span>• Standzeit: <strong>{rep.stay_duration_minutes} Min.</strong></span>
                          </div>
                          {rep.notes && (
                            <p className="text-[11px] text-slate-500 italic">„{rep.notes}“</p>
                          )}
                        </div>

                        <div className="flex items-center space-x-4 self-end sm:self-center">
                          <div className="text-right">
                            {isDemurrage ? (
                              <div>
                                <span className="text-sm font-black font-mono text-rose-600 block">
                                  {rep.demurrage_total_netto?.toFixed(2)} €
                                </span>
                                <span className="text-[10px] text-rose-500 font-bold">
                                  +{rep.billable_delay_minutes} Min. Verzögerung
                                </span>
                              </div>
                            ) : (
                              <div>
                                <span className="text-xs font-bold text-emerald-600 block">0,00 €</span>
                                <span className="text-[10px] text-emerald-500 font-medium">Im Plan (Freistandzeit)</span>
                              </div>
                            )}
                          </div>

                          <button
                            onClick={() => handleOpenReconciliationModal(rep)}
                            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition-all flex items-center space-x-1.5"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>Beleg anzeigen</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 4. TAB CONTENT: FLEET SECURITY & YARD SAFETY AUDIT */}
      {activeTab === 'SECURITY' && (
        <div className="space-y-6 animate-fade-in">
          {/* Top Banner / Hero Card */}
          <div className="bg-gradient-to-r from-slate-900 via-rose-950 to-slate-900 rounded-3xl p-6 sm:p-8 border border-rose-900/50 shadow-2xl text-white relative overflow-hidden">
            <div className="absolute right-0 top-0 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
            
            <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="flex items-start sm:items-center space-x-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-rose-600 to-red-500 text-white flex items-center justify-center shadow-lg shadow-rose-600/30 shrink-0">
                  <ShieldAlert className="w-7 h-7" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                      Werksschutz &amp; Flottensicherheit
                    </h2>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-500/30 text-rose-300 border border-rose-400/40 uppercase tracking-wide">
                      Hof-Tempolimit &amp; Ruhezeiten-Audit
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
                    Automatische Überwachung der Höchstgeschwindigkeit auf dem Werksgelände (&le; {securitySettings?.max_yard_speed || 20} km/h) 
                    sowie Alarmierung bei unbefugten Flottenbewegungen außerhalb der Betriebszeiten.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={handleOpenSecuritySettings}
                  className="flex items-center space-x-2 px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs backdrop-blur-sm border border-white/20 transition-all shadow-sm active:scale-95"
                >
                  <Sliders className="w-3.5 h-3.5 text-rose-300" />
                  <span>Sicherheitsregeln konfigurieren</span>
                </button>

                <button
                  type="button"
                  disabled={isEvaluatingSecurity}
                  onClick={handleEvaluateSecurityNow}
                  className="flex items-center space-x-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-bold text-xs shadow-lg shadow-rose-600/30 transition-all active:scale-95 disabled:opacity-50"
                >
                  <RotateCw className={`w-3.5 h-3.5 ${isEvaluatingSecurity ? 'animate-spin' : ''}`} />
                  <span>{isEvaluatingSecurity ? 'Wird geprüft...' : 'Jetzt prüfen'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* 4 KPI Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Offene Alarme */}
            <div className="bg-white p-5 rounded-3xl border border-rose-100 shadow-card flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-rose-600 uppercase tracking-wider">Unquittierte Alarme</p>
                <div className="flex items-baseline space-x-2 mt-1">
                  <span className="text-2xl sm:text-3xl font-black text-rose-700">
                    {securityStats?.unacknowledged_events || 0}
                  </span>
                  <span className="text-xs text-slate-400 font-bold">offen</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Erfordert Prüfung durch Werksschutz
                </p>
              </div>
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${securityStats?.unacknowledged_events > 0 ? 'bg-rose-100 text-rose-600 animate-pulse' : 'bg-slate-100 text-slate-400'}`}>
                <Bell className="w-6 h-6" />
              </div>
            </div>

            {/* Card 2: Hof-Geschwindigkeitsverstöße */}
            <div className="bg-white p-5 rounded-3xl border border-amber-100 shadow-card flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-amber-600 uppercase tracking-wider">Hof-Tempolimit &gt; {securitySettings?.max_yard_speed || 20} km/h</p>
                <div className="flex items-baseline space-x-2 mt-1">
                  <span className="text-2xl sm:text-3xl font-black text-amber-700">
                    {securityStats?.speed_violations_total || 0}
                  </span>
                  <span className="text-xs text-slate-400 font-bold">Verstöße</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Arbeitsschutz im Werk Altlandsberg
                </p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Gauge className="w-6 h-6" />
              </div>
            </div>

            {/* Card 3: Ruhezeiten-Verstöße */}
            <div className="bg-white p-5 rounded-3xl border border-purple-100 shadow-card flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-purple-600 uppercase tracking-wider">Ruhezeiten-Verstöße</p>
                <div className="flex items-baseline space-x-2 mt-1">
                  <span className="text-2xl sm:text-3xl font-black text-purple-700">
                    {securityStats?.off_hours_total || 0}
                  </span>
                  <span className="text-xs text-slate-400 font-bold">Bewegungen</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Außerhalb der Betriebszeiten
                </p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <Moon className="w-6 h-6" />
              </div>
            </div>

            {/* Card 4: Überwachungs-Status & Ruhezeit */}
            <div className="bg-white p-5 rounded-3xl border border-blue-100 shadow-card flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">Werksschutz-Status</p>
                <div className="flex items-center space-x-2 mt-1">
                  <span className={`w-2.5 h-2.5 rounded-full ${securitySettings?.is_currently_quiet_hours ? 'bg-purple-500 animate-pulse' : 'bg-emerald-500'}`}></span>
                  <span className="text-base sm:text-lg font-black text-slate-900">
                    {securitySettings?.is_currently_quiet_hours ? '🌙 Ruhezeit aktiv' : '☀️ Betriebszeit'}
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 mt-0.5 truncate max-w-[180px]">
                  {securityStats?.quiet_hours_label || 'Mo-Fr 20:00-05:00 Uhr'}
                </p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Shield className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-100 shadow-card flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-slate-400 mr-1 flex items-center space-x-1">
                <Filter className="w-3.5 h-3.5" />
                <span>Typ:</span>
              </span>

              <button
                type="button"
                onClick={() => setSecurityFilterType('ALL')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  securityFilterType === 'ALL'
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Alle Ereignisse
              </button>

              <button
                type="button"
                onClick={() => setSecurityFilterType('FACTORY_SPEED_VIOLATION')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
                  securityFilterType === 'FACTORY_SPEED_VIOLATION'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
                }`}
              >
                <span>⚡ Hof-Tempo (&gt;{securitySettings?.max_yard_speed || 20} km/h)</span>
              </button>

              <button
                type="button"
                onClick={() => setSecurityFilterType('OFF_HOURS_MOVEMENT')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
                  securityFilterType === 'OFF_HOURS_MOVEMENT'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'bg-purple-50 text-purple-800 hover:bg-purple-100'
                }`}
              >
                <span>🌙 Ruhezeiten-Verstöße</span>
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-slate-400">Status:</span>
                <select
                  value={securityFilterAck}
                  onChange={(e) => setSecurityFilterAck(e.target.value)}
                  className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 focus:outline-none"
                >
                  <option value="ALL">Alle Status</option>
                  <option value="UNACKNOWLEDGED">Nur Unquittiert</option>
                  <option value="ACKNOWLEDGED">Bereits Quittiert</option>
                </select>
              </div>

              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Kennzeichen filtern..."
                  value={securitySearchPlate}
                  onChange={(e) => setSecuritySearchPlate(e.target.value)}
                  className="pl-8 pr-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20 w-44"
                />
              </div>
            </div>
          </div>

          {/* Audit Logs Table / Feed */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-card overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-base text-slate-900">
                  Sicherheits-Audit-Log &amp; Vorfallsprotokoll
                </h3>
                <p className="text-xs text-slate-500">
                  Vollständiger Nachweis aller Geschwindigkeits- und Bewegungsverstöße
                </p>
              </div>
              <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 font-mono font-bold text-xs">
                {securityLogs.length} Einträge
              </span>
            </div>

            {securityLogs.length === 0 ? (
              <div className="py-16 text-center text-slate-400 text-xs space-y-3">
                <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-500" />
                <div className="space-y-1">
                  <p className="font-bold text-slate-800 text-sm">Keine Sicherheitsvorfälle vorhanden</p>
                  <p className="text-slate-500">
                    Es wurden keine Geschwindigkeits- oder Ruhezeiten-Verstöße für die aktuellen Filterkriterien erfasst.
                  </p>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-100 text-[11px] text-slate-400 uppercase tracking-wider font-bold">
                      <th className="py-3.5 px-4">Zeitpunkt</th>
                      <th className="py-3.5 px-4">Ereignis-Typ</th>
                      <th className="py-3.5 px-4">Fahrzeug / Lkw</th>
                      <th className="py-3.5 px-4">Geschwindigkeit / Limit</th>
                      <th className="py-3.5 px-4">Standort / Geofence</th>
                      <th className="py-3.5 px-4">Alarmierung</th>
                      <th className="py-3.5 px-4">Status &amp; Prüfung</th>
                      <th className="py-3.5 px-4 text-right">Aktion</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {securityLogs.map((item) => {
                      const isSpeedViolation = item.event_type === 'FACTORY_SPEED_VIOLATION';
                      const formattedDate = item.timestamp 
                        ? new Date(item.timestamp).toLocaleString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' }) 
                        : '-';
                      const excessSpeed = (item.speed || 0) - (item.speed_limit || 0);

                      return (
                        <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3.5 px-4 font-mono text-slate-700 whitespace-nowrap">
                            {formattedDate}
                          </td>

                          <td className="py-3.5 px-4 whitespace-nowrap">
                            {isSpeedViolation ? (
                              <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 font-bold text-[11px]">
                                <span>⚡</span>
                                <span>Werkshof-Tempo</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-xl bg-purple-50 text-purple-800 border border-purple-200 font-bold text-[11px]">
                                <span>🌙</span>
                                <span>Ruhezeit-Fahrt</span>
                              </span>
                            )}
                          </td>

                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <div className="flex items-center space-x-2">
                              <span className="px-2.5 py-0.5 rounded-lg bg-slate-900 text-white font-mono font-bold text-xs">
                                {item.plate}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono">ID: {item.vehicle_id}</span>
                            </div>
                          </td>

                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <div className="space-y-0.5">
                              <div className="flex items-baseline space-x-1">
                                <span className={`font-mono font-black text-sm ${isSpeedViolation ? 'text-rose-600' : 'text-purple-600'}`}>
                                  {item.speed?.toFixed(1) || '0.0'} km/h
                                </span>
                                <span className="text-[10px] text-slate-400 font-medium">
                                  (Limit: {item.speed_limit || 20} km/h)
                                </span>
                              </div>
                              {excessSpeed > 0 && (
                                <span className="text-[10px] text-rose-600 font-bold block">
                                  +{excessSpeed.toFixed(1)} km/h Überschreitung
                                </span>
                              )}
                              {item.distance_moved_meters > 0 && (
                                <span className="text-[10px] text-purple-600 font-bold block">
                                  +{Math.round(item.distance_moved_meters)} m Positionswechsel
                                </span>
                              )}
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="text-slate-800 font-bold text-xs truncate max-w-xs" title={item.location}>
                              {item.location || 'Werksgelände'}
                            </div>
                            {item.latitude && item.longitude && (
                              <span className="text-[10px] text-slate-400 font-mono">
                                {item.latitude.toFixed(4)}, {item.longitude.toFixed(4)}
                              </span>
                            )}
                          </td>

                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-mono font-bold">
                              {item.action_taken || 'LOGGED'}
                            </span>
                          </td>

                          <td className="py-3.5 px-4 whitespace-nowrap">
                            {item.is_acknowledged ? (
                              <div className="space-y-0.5">
                                <span className="inline-flex items-center space-x-1 text-emerald-700 font-bold text-xs">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                  <span>Quittiert</span>
                                </span>
                                <p className="text-[10px] text-slate-400">
                                  {item.acknowledged_by_name || 'Admin'} • {item.acknowledged_at ? new Date(item.acknowledged_at).toLocaleDateString('de-DE') : ''}
                                </p>
                                {item.acknowledgement_note && (
                                  <p className="text-[10px] text-slate-500 italic max-w-xs truncate" title={item.acknowledgement_note}>
                                    „{item.acknowledgement_note}“
                                  </p>
                                )}
                              </div>
                            ) : (
                              <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold">
                                <AlertTriangle className="w-3 h-3 text-rose-500" />
                                <span>Unquittiert</span>
                              </span>
                            )}
                          </td>

                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            {!item.is_acknowledged ? (
                              <button
                                type="button"
                                onClick={() => handleOpenAckModal(item)}
                                className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-sm transition-all"
                              >
                                Quittieren
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleOpenAckModal(item)}
                                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all"
                              >
                                Details
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
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

      {/* 8. MAINTENANCE LOG SERVICE MODAL (SERVICE QUITTIEREN) */}
      {isLogServiceModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full border border-slate-100 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Wrench className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-lg text-slate-900">Wartungsservice quittieren</h3>
                  <p className="text-xs text-slate-500">
                    {logServiceForm.plate} • {SERVICE_TYPE_INFO[logServiceForm.service_type]?.label || logServiceForm.service_type}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsLogServiceModalOpen(false)}
                className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveLogService} className="space-y-4 text-xs">
              <div className="p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl text-[11px] text-emerald-800 space-y-1">
                <span className="font-bold block">Automatische Fortschreibung:</span>
                <p>
                  Mit Quittierung wird das nächste Fälligkeitsziel um das definierte Intervall weitergerollt und der Status auf <strong>Im Plan (OK)</strong> gesetzt.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1.5">Km-Stand bei Service *</label>
                  <input
                    type="number"
                    required
                    value={logServiceForm.service_mileage}
                    onChange={(e) => setLogServiceForm({ ...logServiceForm, service_mileage: parseInt(e.target.value) || 0 })}
                    className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 bg-slate-50 font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1.5">Datum der Durchführung *</label>
                  <input
                    type="date"
                    required
                    value={logServiceForm.service_date}
                    onChange={(e) => setLogServiceForm({ ...logServiceForm, service_date: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 bg-slate-50 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1.5">Durchgeführt von</label>
                  <input
                    type="text"
                    value={logServiceForm.performed_by}
                    onChange={(e) => setLogServiceForm({ ...logServiceForm, performed_by: e.target.value })}
                    placeholder="z. B. M. Schmidt (Meister)"
                    className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 bg-slate-50 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1.5">Werkstatt / Betrieb</label>
                  <input
                    type="text"
                    value={logServiceForm.workshop_name}
                    onChange={(e) => setLogServiceForm({ ...logServiceForm, workshop_name: e.target.value })}
                    placeholder="z. B. Tinglev Werkstatt Altlandsberg"
                    className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 bg-slate-50 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1.5">Kosten (€ Netto)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={logServiceForm.cost_euros}
                    onChange={(e) => setLogServiceForm({ ...logServiceForm, cost_euros: parseFloat(e.target.value) || 0 })}
                    placeholder="0.00"
                    className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 bg-slate-50 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1.5">Rechnungs- / Auftrags-Nr.</label>
                  <input
                    type="text"
                    value={logServiceForm.invoice_number}
                    onChange={(e) => setLogServiceForm({ ...logServiceForm, invoice_number: e.target.value })}
                    placeholder="z. B. RE-2026-089"
                    className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 bg-slate-50 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1.5">Werkstatt-Notizen / Prüfbericht</label>
                <textarea
                  rows="2"
                  value={logServiceForm.notes}
                  onChange={(e) => setLogServiceForm({ ...logServiceForm, notes: e.target.value })}
                  placeholder="z. B. Ölfilter & Kraftstoffvorfilter getauscht, Bremsbeläge i. O., ohne Mängel..."
                  className="w-full px-3.5 py-2 rounded-2xl border border-slate-200 bg-slate-50 focus:outline-none text-xs"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsLogServiceModalOpen(false)}
                  className="px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-colors"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold shadow-md shadow-emerald-600/20 active:scale-95 transition-all flex items-center space-x-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Service quittieren</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 9. MAINTENANCE INTERVAL CREATE / EDIT MODAL */}
      {isIntervalModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full border border-slate-100 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Wrench className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-lg text-slate-900">
                    {editingInterval ? 'Wartungsplan bearbeiten' : 'Neues Wartungsintervall anlegen'}
                  </h3>
                  <p className="text-xs text-slate-500">Laufleistungs- und Fristenüberwachung konfigurieren</p>
                </div>
              </div>
              <button
                onClick={() => setIsIntervalModalOpen(false)}
                className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveInterval} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1.5">Fahrzeug *</label>
                  <select
                    required
                    value={intervalForm.vehicle_id}
                    onChange={(e) => {
                      const v = vehicles.find((item) => String(item.id) === String(e.target.value));
                      setIntervalForm({
                        ...intervalForm,
                        vehicle_id: e.target.value,
                        plate: v ? v.plate : intervalForm.plate,
                        last_service_mileage: v?.mileage || intervalForm.last_service_mileage
                      });
                    }}
                    className="w-full px-3 py-2.5 rounded-2xl border border-slate-200 bg-slate-50 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    {vehicles.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.plate} - {v.brand || 'LKW'}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1.5">Service-Typ *</label>
                  <select
                    required
                    value={intervalForm.service_type}
                    onChange={(e) => setIntervalForm({ ...intervalForm, service_type: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-2xl border border-slate-200 bg-slate-50 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="OIL_SERVICE">🛢️ Motoröl & Filter (30.000 km)</option>
                    <option value="TUEV_SP">📋 TÜV & Sicherheitsprüfung (SP)</option>
                    <option value="UVV">🏗️ UVV-Prüfung (Kran / Innenlader)</option>
                    <option value="TIRES">🛞 Reifenservice & Achsvermessung</option>
                    <option value="BRAKES">🛑 Bremsen- & Druckluftservice</option>
                    <option value="GENERAL_INSPECTION">🔧 Große Fahrzeuginspektion</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1.5">Intervall (km) *</label>
                  <input
                    type="number"
                    required
                    min="1000"
                    step="1000"
                    value={intervalForm.interval_km}
                    onChange={(e) => setIntervalForm({ ...intervalForm, interval_km: parseInt(e.target.value) || 30000 })}
                    className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 bg-slate-50 font-mono font-bold focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1.5">Vorwarn-Schwelle (km) *</label>
                  <input
                    type="number"
                    required
                    min="100"
                    step="100"
                    value={intervalForm.warning_threshold_km}
                    onChange={(e) => setIntervalForm({ ...intervalForm, warning_threshold_km: parseInt(e.target.value) || 1500 })}
                    className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 bg-slate-50 font-mono font-bold focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1.5">Letzter Service (km)</label>
                  <input
                    type="number"
                    value={intervalForm.last_service_mileage}
                    onChange={(e) => setIntervalForm({ ...intervalForm, last_service_mileage: parseInt(e.target.value) || 0 })}
                    className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 bg-slate-50 font-mono font-bold focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1.5">Letzter Service (Datum)</label>
                  <input
                    type="date"
                    value={intervalForm.last_service_date}
                    onChange={(e) => setIntervalForm({ ...intervalForm, last_service_date: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 bg-slate-50 font-medium focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1.5">Nächstes Fristdatum (optional z. B. für TÜV/UVV)</label>
                <input
                  type="date"
                  value={intervalForm.next_due_date}
                  onChange={(e) => setIntervalForm({ ...intervalForm, next_due_date: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 bg-slate-50 font-medium focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1.5">Hinweise / Vorgaben</label>
                <textarea
                  rows="2"
                  value={intervalForm.notes}
                  onChange={(e) => setIntervalForm({ ...intervalForm, notes: e.target.value })}
                  placeholder="z. B. Herstellerfreigabe beachten, nur Originalfilter verwenden..."
                  className="w-full px-3.5 py-2 rounded-2xl border border-slate-200 bg-slate-50 focus:outline-none text-xs"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsIntervalModalOpen(false)}
                  className="px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-colors"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md shadow-blue-600/20 active:scale-95 transition-all"
                >
                  {editingInterval ? 'Änderungen speichern' : 'Wartungsplan anlegen'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 10. MAINTENANCE HISTORY LOGS MODAL */}
      {isHistoryModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-3xl w-full border border-slate-100 shadow-2xl space-y-6 max-h-[90vh] flex flex-col justify-between">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 shrink-0">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <History className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-lg text-slate-900">Werkstatt-Historie & Wartungsberichte</h3>
                  <p className="text-xs text-slate-500">Archiv aller quittierten Inspektionen, UVV- und Reparaturarbeiten</p>
                </div>
              </div>
              <button
                onClick={() => setIsHistoryModalOpen(false)}
                className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto pr-1 flex-1">
              {maintenanceLogs.length === 0 ? (
                <div className="py-16 text-center text-slate-400 text-xs space-y-2">
                  <History className="w-8 h-8 mx-auto text-slate-300" />
                  <p>Bisher wurden keine Wartungsprotokolle erfasst.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {maintenanceLogs.map((log) => {
                    const typeInfo = SERVICE_TYPE_INFO[log.service_type] || {
                      label: log.service_type,
                      badge: 'bg-slate-100 text-slate-800 border-slate-200',
                      icon: '🔧'
                    };

                    return (
                      <div
                        key={log.id}
                        className="p-4 rounded-2xl border border-slate-100 bg-slate-50/70 hover:bg-slate-50 transition-all text-xs space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <span className="px-2.5 py-0.5 rounded-lg bg-slate-900 text-white font-mono font-bold text-xs">
                              {log.plate}
                            </span>
                            <span className="font-bold text-slate-800 flex items-center space-x-1">
                              <span>{typeInfo.icon}</span>
                              <span>{typeInfo.label}</span>
                            </span>
                          </div>

                          <span className="font-mono text-slate-500 font-semibold text-[11px]">
                            {log.service_date}
                          </span>
                        </div>

                        <div className="grid grid-cols-3 gap-2 text-[11px] text-slate-600 bg-white p-2.5 rounded-xl border border-slate-100">
                          <div>
                            <span className="text-[10px] text-slate-400 block font-semibold">Km bei Service:</span>
                            <span className="font-bold font-mono text-slate-900">{log.service_mileage?.toLocaleString('de-DE')} km</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block font-semibold">Werkstatt / Prüfer:</span>
                            <span className="font-bold text-slate-900 truncate block">{log.workshop_name}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block font-semibold">Kosten / Beleg:</span>
                            <span className="font-bold font-mono text-slate-900">
                              {log.cost_euros ? `${log.cost_euros.toFixed(2)} €` : '–'} {log.invoice_number ? `(${log.invoice_number})` : ''}
                            </span>
                          </div>
                        </div>

                        {log.notes && (
                          <p className="text-[11px] text-slate-500 italic bg-white p-2 rounded-xl border border-slate-100/80">
                            „{log.notes}“
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => setIsHistoryModalOpen(false)}
                className="px-5 py-2.5 rounded-2xl bg-slate-900 text-white font-bold text-xs shadow-md transition-all"
              >
                Schließen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 11. TRIP RECONCILIATION & DEMURRAGE AUDIT REPORT MODAL (PRÜFBERICHT NACH § 412 HGB) */}
      {isReconciliationModalOpen && selectedReconciliation && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-4xl w-full border border-slate-100 shadow-2xl space-y-6 max-h-[92vh] flex flex-col justify-between my-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-4 shrink-0">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="px-2.5 py-0.5 rounded-lg bg-blue-600 text-white font-bold text-[10px] uppercase tracking-wider">
                    Offizieller Prüfnachweis
                  </span>
                  <span className="font-mono text-xs font-bold text-slate-500">
                    {selectedReconciliation.report_number}
                  </span>
                </div>
                <h3 className="font-black text-xl text-slate-900">
                  Prüfbericht zur Standgeldabrechnung (§ 412 HGB / VBGL)
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Tinglev Elementfabrik GmbH • Werk Altlandsberg (Zentrale): Am Gewerbepark 8A, 15345 Altlandsberg-Bruchmühle
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={handlePrintAuditReport}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center space-x-1.5 transition-colors"
                  title="Druckansicht öffnen"
                >
                  <FileText className="w-4 h-4 text-blue-600" />
                  <span>Drucken / PDF</span>
                </button>
                <button
                  onClick={() => setIsReconciliationModalOpen(false)}
                  className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Scrollable Body */}
            <div className="overflow-y-auto pr-1 space-y-6 flex-1 text-xs">
              {/* Status Banner */}
              {selectedReconciliation.demurrage_total_netto > 0 ? (
                <div className="p-4 rounded-2xl bg-gradient-to-r from-rose-50 to-amber-50 border border-rose-200/80 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center font-black">
                      !
                    </div>
                    <div>
                      <h4 className="font-black text-rose-900 text-sm uppercase tracking-wide">
                        Abrechnungspflichtige Entladeverzögerung
                      </h4>
                      <p className="text-rose-700 text-xs">
                        Vereinbarte Freistandzeit um <strong>{selectedReconciliation.billable_delay_minutes} Minuten</strong> überschritten
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-rose-600 block font-semibold">Standgeldforderung:</span>
                    <span className="text-2xl font-black font-mono text-rose-700">
                      {selectedReconciliation.demurrage_total_netto?.toFixed(2)} €
                    </span>
                    <span className="text-[10px] text-slate-400 block">zzgl. gesetzl. MwSt.</span>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200/80 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                    <div>
                      <h4 className="font-bold text-emerald-900 text-sm">
                        Entladung im Zeitplan (Freistandzeit eingehalten)
                      </h4>
                      <p className="text-emerald-700 text-xs">
                        Standzeit: {selectedReconciliation.stay_duration_minutes} Minuten (unter {selectedReconciliation.free_unloading_minutes} Minuten Freigrenze)
                      </p>
                    </div>
                  </div>
                  <span className="px-3 py-1 rounded-xl bg-emerald-600 text-white font-mono font-bold text-xs">
                    0,00 € • Im Plan
                  </span>
                </div>
              )}

              {/* Master Data Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold uppercase">Lieferschein-Nr.</span>
                  <span className="font-bold font-mono text-slate-900 text-sm">{selectedReconciliation.delivery_note_number}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold uppercase">Fahrzeug (LKW)</span>
                  <span className="font-bold font-mono text-slate-900 text-sm">{selectedReconciliation.plate}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold uppercase">Datum</span>
                  <span className="font-bold text-slate-900 text-sm">{selectedReconciliation.trip_date}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold uppercase">Zielbaustelle</span>
                  <span className="font-bold text-slate-900 text-sm truncate block" title={selectedReconciliation.site_name}>
                    {selectedReconciliation.site_name}
                  </span>
                </div>
              </div>

              {/* Time & Demurrage Calculation Details */}
              <div className="space-y-3">
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider text-slate-400">
                  Fahrt- & Entladezeiten-Abgleich
                </h4>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 bg-white rounded-2xl border border-slate-200/80">
                    <span className="text-[10px] text-slate-400 block font-semibold">Werkausfahrt (Altlandsberg):</span>
                    <span className="font-bold font-mono text-slate-800 text-xs mt-0.5 block">
                      {selectedReconciliation.factory_departure_time
                        ? new Date(selectedReconciliation.factory_departure_time).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) + ' Uhr'
                        : '–'}
                    </span>
                  </div>

                  <div className="p-3 bg-white rounded-2xl border border-slate-200/80">
                    <span className="text-[10px] text-slate-400 block font-semibold">Eintreffen Baustelle:</span>
                    <span className="font-bold font-mono text-slate-800 text-xs mt-0.5 block">
                      {selectedReconciliation.site_arrival_time
                        ? new Date(selectedReconciliation.site_arrival_time).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) + ' Uhr'
                        : '–'}
                    </span>
                  </div>

                  <div className="p-3 bg-white rounded-2xl border border-slate-200/80">
                    <span className="text-[10px] text-slate-400 block font-semibold">Abfahrt Baustelle:</span>
                    <span className="font-bold font-mono text-slate-800 text-xs mt-0.5 block">
                      {selectedReconciliation.site_departure_time
                        ? new Date(selectedReconciliation.site_departure_time).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) + ' Uhr'
                        : '–'}
                    </span>
                  </div>

                  <div className="p-3 bg-white rounded-2xl border border-slate-200/80">
                    <span className="text-[10px] text-slate-400 block font-semibold">Gesamte Standzeit:</span>
                    <span className="font-bold font-mono text-slate-900 text-xs mt-0.5 block">
                      {selectedReconciliation.stay_duration_minutes} Minuten ({(selectedReconciliation.stay_duration_minutes / 60).toFixed(1)} Std.)
                    </span>
                  </div>
                </div>

                {/* Calculation breakdown */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-600">Gesamte Verweildauer an der Baustelle:</span>
                    <span className="font-mono font-bold text-slate-900">{selectedReconciliation.stay_duration_minutes} Minuten</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-600">Vereinbarte kostenlose Entladezeit (Freistandzeit):</span>
                    <span className="font-mono font-bold text-emerald-600">- {selectedReconciliation.free_unloading_minutes} Minuten</span>
                  </div>
                  <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200">
                    <span className="font-bold text-slate-800">Abrechenbare Standgeldzeit:</span>
                    <span className="font-mono font-bold text-rose-600">
                      = {selectedReconciliation.billable_delay_minutes} Minuten ({(selectedReconciliation.billable_delay_minutes / 60).toFixed(2)} Std.)
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200">
                    <span className="font-bold text-slate-800">
                      Standgeldbetrag Netto ({selectedReconciliation.hourly_demurrage_rate?.toFixed(2)} €/h Stundensatz):
                    </span>
                    <span className="font-mono font-black text-rose-700 text-sm">
                      {selectedReconciliation.demurrage_total_netto?.toFixed(2)} €
                    </span>
                  </div>
                </div>
              </div>

              {/* GPS Audit Trail Table */}
              <div className="space-y-3">
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider text-slate-400">
                  Manipulationssicherer GPS-Audit-Trail (Ereignisnachweis)
                </h4>

                <div className="overflow-x-auto rounded-2xl border border-slate-200">
                  <table className="w-full text-left text-[11px]">
                    <thead className="bg-slate-100/80 text-slate-500 font-bold border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3">Zeitpunkt</th>
                        <th className="py-2.5 px-3">Ereignis</th>
                        <th className="py-2.5 px-3">Geofence / Standort</th>
                        <th className="py-2.5 px-3">GPS-Koordinaten</th>
                        <th className="py-2.5 px-3 text-center">Tempo</th>
                        <th className="py-2.5 px-3">Tätigkeitsnachweis</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {(selectedReconciliation.audit_trail || []).map((step, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="py-2 px-3 font-mono font-bold text-slate-900 whitespace-nowrap">
                            {step.timestamp ? new Date(step.timestamp).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' Uhr' : '–'}
                          </td>
                          <td className="py-2 px-3 whitespace-nowrap">
                            <span className="px-2 py-0.5 rounded-md font-bold text-[10px] bg-slate-200 text-slate-800">
                              {step.event_type}
                            </span>
                          </td>
                          <td className="py-2 px-3 font-semibold text-slate-800 max-w-[150px] truncate">
                            {step.location_name}
                          </td>
                          <td className="py-2 px-3 font-mono text-[10px] text-slate-500 whitespace-nowrap">
                            {step.latitude?.toFixed(4)}, {step.longitude?.toFixed(4)}
                          </td>
                          <td className="py-2 px-3 font-mono text-center text-slate-700 whitespace-nowrap">
                            {step.speed || 0} km/h
                          </td>
                          <td className="py-2 px-3 text-slate-600">
                            {step.description}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Legal Notice Box */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-[10px] text-slate-500 leading-relaxed space-y-1">
                <span className="font-bold text-slate-700 block">Rechtlicher Hinweis & Konformität:</span>
                <p>
                  {selectedReconciliation.compliance_text ||
                    'Prüfbericht zur Standgeldabrechnung gemäß § 412 HGB / VBGL. Die Verweil- und Stillstandszeiten wurden automatisiert über das GPS-Telemetriesystem (Navkonzept / AddSecure FleetVision) erfasst.'}
                </p>
                {selectedReconciliation.notes && (
                  <p className="pt-1 text-slate-600 italic">
                    <strong>Zusätzliche Bemerkung:</strong> „{selectedReconciliation.notes}“
                  </p>
                )}
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between shrink-0">
              <span className="text-[11px] text-slate-400">
                Erstellt am {selectedReconciliation.created_at ? new Date(selectedReconciliation.created_at).toLocaleString('de-DE') : new Date().toLocaleDateString('de-DE')}
              </span>

              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={handlePrintAuditReport}
                  className="px-4 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/20 active:scale-95 transition-all flex items-center space-x-1.5"
                >
                  <FileText className="w-4 h-4" />
                  <span>Drucken / PDF-Export</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsReconciliationModalOpen(false)}
                  className="px-5 py-2.5 rounded-2xl bg-slate-900 text-white font-bold text-xs shadow-md transition-all"
                >
                  Schließen
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. MODAL: NÄCHSTGELEGENES FAHRZEUG FINDEN (UMKREISSUCHE DISPONENTEN) */}
      {isNearestModalOpen && (
        <div className="fixed inset-0 z-[1000] bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-100 overflow-hidden my-8 flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-400 shadow-inner">
                  <Crosshair className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-white">Nächstgelegenes Fahrzeug finden</h3>
                  <p className="text-xs text-slate-300">Intelligente Umkreissuche für Disponenten (Distanz &amp; ETA)</p>
                </div>
              </div>
              <button
                onClick={() => setIsNearestModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-300 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5 text-xs">
              {/* Target Type Selector Tabs */}
              <div className="space-y-2">
                <label className="font-bold text-slate-700 block">Zielort / Suchkriterium:</label>
                <div className="grid grid-cols-3 gap-2 p-1 bg-slate-100 rounded-2xl">
                  <button
                    type="button"
                    onClick={() => setNearestTargetType('PLZ')}
                    className={`py-2 rounded-xl text-xs font-bold transition-all ${
                      nearestTargetType === 'PLZ' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    PLZ / Adresse
                  </button>
                  <button
                    type="button"
                    onClick={() => setNearestTargetType('GEOFENCE')}
                    className={`py-2 rounded-xl text-xs font-bold transition-all ${
                      nearestTargetType === 'GEOFENCE' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    Baustelle / Geofence
                  </button>
                  <button
                    type="button"
                    onClick={() => setNearestTargetType('COORDS')}
                    className={`py-2 rounded-xl text-xs font-bold transition-all ${
                      nearestTargetType === 'COORDS' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    GPS-Koordinaten
                  </button>
                </div>
              </div>

              {/* Target Input based on Type */}
              {nearestTargetType === 'PLZ' && (
                <div className="space-y-2.5">
                  <div className="relative">
                    <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={nearestQuery}
                      onChange={(e) => setNearestQuery(e.target.value)}
                      placeholder="z. B. 10115 Berlin, Alexanderplatz, 15345 Altlandsberg..."
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs font-medium"
                    />
                  </div>
                  {/* Quick select chips */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[10px] text-slate-400 font-semibold">Schnellauswahl:</span>
                    {[
                      '10115 Berlin',
                      '10178 Berlin Hbf',
                      '15345 Altlandsberg',
                      '12529 Schönefeld',
                      '14467 Potsdam',
                      '15230 Frankfurt (Oder)'
                    ].map((chip) => (
                      <button
                        key={chip}
                        type="button"
                        onClick={() => setNearestQuery(chip)}
                        className={`px-2.5 py-1 rounded-xl text-[10px] font-bold border transition-colors ${
                          nearestQuery === chip 
                            ? 'bg-blue-600 text-white border-blue-600' 
                            : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'
                        }`}
                      >
                        {chip}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {nearestTargetType === 'GEOFENCE' && (
                <div className="space-y-2">
                  <select
                    value={nearestSelectedGeofenceId}
                    onChange={(e) => setNearestSelectedGeofenceId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs font-semibold text-slate-800"
                  >
                    <option value="">-- Geofence-Baustelle auswählen --</option>
                    {geofences.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name} ({g.type === 'CONSTRUCTION_SITE' ? 'Baustelle' : g.type === 'FACTORY' ? 'Werk' : g.type})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {nearestTargetType === 'COORDS' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-1">Breitengrad (Lat):</label>
                    <input
                      type="number"
                      step="any"
                      value={nearestLat}
                      onChange={(e) => setNearestLat(parseFloat(e.target.value))}
                      className="w-full px-3.5 py-2.5 bg-slate-50 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-xs font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-1">Längengrad (Lon):</label>
                    <input
                      type="number"
                      step="any"
                      value={nearestLon}
                      onChange={(e) => setNearestLon(parseFloat(e.target.value))}
                      className="w-full px-3.5 py-2.5 bg-slate-50 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-xs font-mono font-bold"
                    />
                  </div>
                </div>
              )}

              {/* Radius & Filters */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[11px] font-bold text-slate-700">Suchradius:</label>
                    <span className="font-mono font-black text-blue-600 text-xs">{nearestRadius} km</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    {[50, 100, 150, 250].map((rad) => (
                      <button
                        key={rad}
                        type="button"
                        onClick={() => setNearestRadius(rad)}
                        className={`flex-1 py-1 rounded-lg text-[10px] font-bold border transition-colors ${
                          nearestRadius === rad
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white hover:bg-slate-100 text-slate-600 border-slate-200'
                        }`}
                      >
                        {rad} km
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col justify-end">
                  <label className="flex items-center space-x-2.5 cursor-pointer bg-white p-2.5 rounded-xl border border-slate-200 hover:border-slate-300 transition-colors">
                    <input
                      type="checkbox"
                      checked={nearestOnlyAvailable}
                      onChange={(e) => setNearestOnlyAvailable(e.target.checked)}
                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <span className="font-bold text-slate-800 text-[11px] block">Nur verfügbare Fahrzeuge</span>
                      <span className="text-[10px] text-slate-400 block">Rückweg (Leer), Standby oder im Werk</span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Action Button: Suche ausführen */}
              <button
                type="button"
                onClick={handleSearchNearestVehicles}
                disabled={isSearchingNearest}
                className="w-full py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-lg shadow-blue-600/20 active:scale-98 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                {isSearchingNearest ? (
                  <>
                    <RotateCw className="w-4 h-4 animate-spin" />
                    <span>Berechne Straßenstrecken &amp; Fahrzeiten...</span>
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    <span>Fahrzeuge im Umkreis berechnen</span>
                  </>
                )}
              </button>

              {/* Results Display */}
              {nearestResults && (
                <div className="space-y-3 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-extrabold text-slate-900 text-xs">
                        Gefundene Fahrzeuge ({nearestResults.total_found || 0})
                      </h4>
                      {nearestResults.query_location && (
                        <p className="text-[10px] text-slate-500">
                          Ziel: <span className="font-semibold text-slate-700">{nearestResults.query_location.name || nearestResults.query_location.formatted_address}</span>
                        </p>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">
                      Sortiert nach Fahrzeit ETA
                    </span>
                  </div>

                  {(!nearestResults.vehicles || nearestResults.vehicles.length === 0) ? (
                    <div className="p-6 text-center bg-slate-50 rounded-2xl text-slate-400 space-y-1">
                      <AlertCircle className="w-6 h-6 mx-auto text-slate-300" />
                      <p className="font-bold text-slate-600">Keine passenden Fahrzeuge im Radius {nearestRadius} km gefunden.</p>
                      <p className="text-[10px]">Erhöhen Sie den Suchradius oder deaktivieren Sie den Filter „Nur verfügbare Fahrzeuge“.</p>
                    </div>
                  ) : (
                    <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                      {nearestResults.vehicles.map((item, idx) => {
                        const statusCfg = DISPATCH_STATUS_CONFIG[item.dispatch_status] || {
                          label: item.dispatch_status_label,
                          badge: 'bg-slate-100 text-slate-700',
                          icon: '🚛'
                        };

                        return (
                          <div
                            key={item.vehicle_id}
                            className="p-3.5 rounded-2xl border border-slate-200 bg-white hover:border-blue-300 hover:shadow-sm transition-all space-y-2"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <span className="w-5 h-5 rounded-full bg-slate-900 text-white font-mono font-black text-[10px] flex items-center justify-center">
                                  {idx + 1}
                                </span>
                                <span className="px-2 py-0.5 rounded-lg bg-slate-900 text-white font-mono font-bold text-xs">
                                  {item.plate}
                                </span>
                                <span className="font-bold text-slate-900">
                                  {item.brand || 'LKW'}
                                </span>
                              </div>

                              <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border flex items-center space-x-1 ${statusCfg.badge}`}>
                                <span>{statusCfg.icon}</span>
                                <span>{item.dispatch_status_label}</span>
                              </span>
                            </div>

                            {/* Distance & ETA Details */}
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 bg-slate-50 p-2.5 rounded-xl text-[11px]">
                              <div>
                                <span className="text-[10px] text-slate-400 block font-semibold">Straßenstrecke:</span>
                                <span className="font-mono font-bold text-slate-900">
                                  ~{item.road_distance_km} km
                                </span>
                                <span className="text-[9px] text-slate-400 block">({item.distance_km} km Luftlinie)</span>
                              </div>

                              <div>
                                <span className="text-[10px] text-slate-400 block font-semibold">Geschätzte Fahrzeit:</span>
                                <span className="font-mono font-black text-blue-600 text-xs">
                                  ~{item.estimated_drive_minutes} Min.
                                </span>
                                <span className="text-[9px] text-slate-400 block">(@ 65 km/h LKW)</span>
                              </div>

                              <div className="col-span-2 sm:col-span-1">
                                <span className="text-[10px] text-slate-400 block font-semibold">Geschwindigkeit:</span>
                                <span className="font-mono font-bold text-slate-800">
                                  {item.speed || 0} km/h
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                              <span className="truncate max-w-[280px] flex items-center space-x-1">
                                <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                                <span>{item.location || 'Standort ermittelt'}</span>
                              </span>

                              <div className="flex items-center space-x-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setIsNearestModalOpen(false);
                                    const v = vehicles.find(x => x.id === item.vehicle_id);
                                    if (v) handleSelectVehicle(v);
                                  }}
                                  className="px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[10px] transition-colors"
                                >
                                  Auf Karte
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setIsNearestModalOpen(false);
                                    handleOpenCreateTracking(item.vehicle_id);
                                  }}
                                  className="px-2.5 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] shadow-sm transition-colors flex items-center space-x-1"
                                >
                                  <Share2 className="w-3 h-3" />
                                  <span>Tracking-Link</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between shrink-0">
              <span className="text-[11px] text-slate-400">
                Logistik-Berechnung nach § 412 HGB / AddSecure FleetVision
              </span>
              <button
                type="button"
                onClick={() => setIsNearestModalOpen(false)}
                className="px-5 py-2.5 rounded-2xl bg-slate-900 text-white font-bold text-xs shadow-md transition-all"
              >
                Schließen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SECURITY SETTINGS MODAL */}
      {isSecuritySettingsModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-xl w-full border border-slate-100 shadow-2xl space-y-6 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-lg text-slate-900">
                    Sicherheitsregeln &amp; Werksschutz-Konfiguration
                  </h3>
                  <p className="text-xs text-slate-500">
                    Grenzwerte für Hof-Geschwindigkeit, Ruhezeiten &amp; Benachrichtigungen
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsSecuritySettingsModalOpen(false)}
                className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSecuritySettings} className="space-y-4 text-xs">
              {/* Yard Speed Limit */}
              <div className="bg-amber-50/50 p-4 rounded-2xl border border-amber-200/60 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-amber-950 flex items-center space-x-1.5">
                    <span>⚡ Höchstgeschwindigkeit Werkshof Altlandsberg:</span>
                  </label>
                  <span className="font-mono font-black text-amber-700 text-sm">
                    {securitySettingsForm.max_yard_speed} km/h
                  </span>
                </div>
                <div className="flex items-center space-x-3">
                  <input
                    type="number"
                    required
                    min="5"
                    max="60"
                    step="1"
                    value={securitySettingsForm.max_yard_speed}
                    onChange={(e) => setSecuritySettingsForm({ ...securitySettingsForm, max_yard_speed: parseFloat(e.target.value) || 20 })}
                    className="w-32 px-3 py-2 rounded-xl border border-amber-300 bg-white font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  <span className="text-[11px] text-slate-600">
                    Geschwindigkeiten darüber lösen einen <code>FACTORY_SPEED_VIOLATION</code> Eintrag aus.
                  </span>
                </div>
              </div>

              {/* Quiet Hours Configuration */}
              <div className="bg-purple-50/50 p-4 rounded-2xl border border-purple-200/60 space-y-3">
                <label className="font-bold text-purple-950 block">
                  🌙 Betriebsfreie Ruhezeiten (Mo–Fr) &amp; Wochenende
                </label>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">Startzeit (Abends):</label>
                    <input
                      type="text"
                      required
                      placeholder="20:00"
                      pattern="[0-2][0-9]:[0-5][0-9]"
                      value={securitySettingsForm.quiet_hours_start}
                      onChange={(e) => setSecuritySettingsForm({ ...securitySettingsForm, quiet_hours_start: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-purple-200 bg-white font-mono font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">Endzeit (Morgens):</label>
                    <input
                      type="text"
                      required
                      placeholder="05:00"
                      pattern="[0-2][0-9]:[0-5][0-9]"
                      value={securitySettingsForm.quiet_hours_end}
                      onChange={(e) => setSecuritySettingsForm({ ...securitySettingsForm, quiet_hours_end: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-purple-200 bg-white font-mono font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>

                <label className="flex items-center space-x-2.5 cursor-pointer bg-white p-2.5 rounded-xl border border-purple-200/80">
                  <input
                    type="checkbox"
                    checked={securitySettingsForm.weekend_quiet_all_day}
                    onChange={(e) => setSecuritySettingsForm({ ...securitySettingsForm, weekend_quiet_all_day: e.target.checked })}
                    className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500 border-slate-300"
                  />
                  <span className="text-xs font-bold text-purple-900">
                    Samstag &amp; Sonntag ganztägig als Ruhezeit überwachen
                  </span>
                </label>
              </div>

              {/* Thresholds for Off-Hours Movement */}
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200/70">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Bewegungsschwelle:</label>
                  <div className="flex items-center space-x-1">
                    <input
                      type="number"
                      required
                      min="1"
                      max="50"
                      step="0.5"
                      value={securitySettingsForm.off_hours_speed_threshold}
                      onChange={(e) => setSecuritySettingsForm({ ...securitySettingsForm, off_hours_speed_threshold: parseFloat(e.target.value) || 5.0 })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-mono font-bold text-slate-800 focus:outline-none"
                    />
                    <span className="text-slate-500 font-bold">km/h</span>
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Positionsverschiebung:</label>
                  <div className="flex items-center space-x-1">
                    <input
                      type="number"
                      required
                      min="10"
                      max="5000"
                      step="10"
                      value={securitySettingsForm.off_hours_distance_threshold_meters}
                      onChange={(e) => setSecuritySettingsForm({ ...securitySettingsForm, off_hours_distance_threshold_meters: parseFloat(e.target.value) || 100.0 })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-mono font-bold text-slate-800 focus:outline-none"
                    />
                    <span className="text-slate-500 font-bold">Meter</span>
                  </div>
                </div>
              </div>

              {/* Notification Channels */}
              <div className="space-y-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Alarm-E-Mail Empfänger (Werksschutz &amp; IT):</label>
                  <input
                    type="text"
                    placeholder="werksschutz@tinglev-elementfabrik.de, it-leitung@tinglev-elementfabrik.de"
                    value={securitySettingsForm.alert_email}
                    onChange={(e) => setSecuritySettingsForm({ ...securitySettingsForm, alert_email: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">MS Teams / Slack Webhook URL (Optional):</label>
                  <input
                    type="url"
                    placeholder="https://outlook.office.com/webhook/..."
                    value={securitySettingsForm.webhook_url}
                    onChange={(e) => setSecuritySettingsForm({ ...securitySettingsForm, webhook_url: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 font-mono text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                  />
                </div>
              </div>

              {/* Anti-Spam Cooldown & Active Checkbox */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Anti-Spam Cooldown:</label>
                  <div className="flex items-center space-x-1">
                    <input
                      type="number"
                      required
                      min="1"
                      max="1440"
                      value={securitySettingsForm.cooldown_minutes}
                      onChange={(e) => setSecuritySettingsForm({ ...securitySettingsForm, cooldown_minutes: parseInt(e.target.value) || 15 })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-mono font-bold text-slate-800 focus:outline-none"
                    />
                    <span className="text-slate-500 font-bold">Min.</span>
                  </div>
                </div>

                <div className="flex items-end">
                  <label className="flex items-center space-x-2.5 cursor-pointer bg-slate-50 p-2 rounded-xl border border-slate-200 w-full">
                    <input
                      type="checkbox"
                      checked={securitySettingsForm.is_active}
                      onChange={(e) => setSecuritySettingsForm({ ...securitySettingsForm, is_active: e.target.checked })}
                      className="w-4 h-4 text-rose-600 rounded focus:ring-rose-500 border-slate-300"
                    />
                    <span className="text-xs font-bold text-slate-800">Überwachung aktiv</span>
                  </label>
                </div>
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsSecuritySettingsModalOpen(false)}
                  className="px-4 py-2 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  disabled={isSavingSecuritySettings}
                  className="px-5 py-2 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition-all disabled:opacity-50"
                >
                  {isSavingSecuritySettings ? 'Speichern...' : 'Regeln speichern'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EVENT ACKNOWLEDGEMENT MODAL */}
      {isSecurityAckModalOpen && selectedEventForAck && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full border border-slate-100 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center space-x-3">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${selectedEventForAck.event_type === 'FACTORY_SPEED_VIOLATION' ? 'bg-amber-50 text-amber-600' : 'bg-purple-50 text-purple-600'}`}>
                  <CheckSquare className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-lg text-slate-900">
                    Sicherheitsvorfall quittieren
                  </h3>
                  <p className="text-xs text-slate-500">
                    Audit-Prüfung &amp; Dokumentation für den Fuhrparkleiter
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsSecurityAckModalOpen(false);
                  setSelectedEventForAck(null);
                }}
                className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Event Summary Card */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 font-mono text-sm px-2.5 py-0.5 rounded-lg bg-slate-900 text-white">
                  {selectedEventForAck.plate}
                </span>
                <span className={`px-2.5 py-1 rounded-full font-bold text-[10px] ${selectedEventForAck.event_type === 'FACTORY_SPEED_VIOLATION' ? 'bg-amber-100 text-amber-800' : 'bg-purple-100 text-purple-800'}`}>
                  {selectedEventForAck.event_type === 'FACTORY_SPEED_VIOLATION' ? '⚡ Hof-Geschwindigkeit' : '🌙 Ruhezeiten-Bewegung'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 text-slate-600">
                <div>
                  <span className="text-slate-400 block text-[10px]">Geschwindigkeit:</span>
                  <span className="font-mono font-bold text-slate-800">{selectedEventForAck.speed} km/h (Limit: {selectedEventForAck.speed_limit} km/h)</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Zeitpunkt:</span>
                  <span className="font-mono text-slate-800">{selectedEventForAck.timestamp ? new Date(selectedEventForAck.timestamp).toLocaleString('de-DE') : ''}</span>
                </div>
              </div>

              <div className="pt-1 text-slate-600">
                <span className="text-slate-400 block text-[10px]">Standort:</span>
                <span className="font-semibold text-slate-800">{selectedEventForAck.location}</span>
              </div>
            </div>

            {selectedEventForAck.is_acknowledged ? (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs space-y-2">
                <div className="flex items-center space-x-2 text-emerald-800 font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Bereits quittiert</span>
                </div>
                <p className="text-emerald-700">
                  Prüfer: <strong>{selectedEventForAck.acknowledged_by_name || 'Admin'}</strong> am {selectedEventForAck.acknowledged_at ? new Date(selectedEventForAck.acknowledged_at).toLocaleString('de-DE') : ''}
                </p>
                {selectedEventForAck.acknowledgement_note && (
                  <p className="text-slate-700 bg-white p-2.5 rounded-xl border border-emerald-100 italic">
                    „{selectedEventForAck.acknowledgement_note}“
                  </p>
                )}
              </div>
            ) : (
              <form onSubmit={handleSaveAck} className="space-y-4 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1.5">
                    Prüfvermerk / Begründung (Optional):
                  </label>
                  <textarea
                    rows={3}
                    placeholder="z. B. Fahrer mündlich belehrt gem. UVV / Genehmigte Ausnahmefahrt..."
                    value={ackNote}
                    onChange={(e) => setAckNote(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800 font-medium"
                  />
                </div>

                <div className="flex items-center justify-end space-x-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsSecurityAckModalOpen(false);
                      setSelectedEventForAck(null);
                    }}
                    className="px-4 py-2 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
                  >
                    Abbrechen
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition-all flex items-center space-x-1.5"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Als geprüft quittieren</span>
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
