import React, { useState, useEffect, useRef } from 'react';
import * as LucideIcons from 'lucide-react';
import { 
  ChevronDown, 
  Droplets, 
  Wind, 
  MapPin, 
  RefreshCw, 
  Search, 
  Navigation, 
  Check, 
  AlertCircle,
  X
} from 'lucide-react';
import { 
  COMPANY_LOCATIONS, 
  fetchLocationWeather, 
  searchGeocodingLocations 
} from '../../services/weatherService';
import { useLanguage } from '../../context/LanguageContext';

const WEATHER_STORAGE_KEY = 'tiglev_weather_selected_location';

export function WeatherWidget() {
  const { t } = useLanguage();
  
  // Persistent selected location loaded from LocalStorage
  const [selectedLocation, setSelectedLocation] = useState(() => {
    try {
      const saved = localStorage.getItem(WEATHER_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (
          parsed && 
          parsed.name && 
          !parsed.name.toLowerCase().includes('tinglev') && 
          !parsed.name.toLowerCase().includes('tiglev') &&
          parsed.lat !== undefined && 
          parsed.lon !== undefined
        ) {
          return parsed;
        }
      }
    } catch (err) {
      console.warn('Could not read saved weather location:', err);
    }
    return COMPANY_LOCATIONS[0]; // Default to Altlandsberg HQ
  });

  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Search & Geocoding State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [geoError, setGeoError] = useState(null);
  const [isLocating, setIsLocating] = useState(false);

  const loadWeather = async (loc) => {
    if (!loc) return;
    setLoading(true);
    try {
      const data = await fetchLocationWeather(loc);
      setWeatherData(data);
    } catch (err) {
      console.error('Weather widget error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Load weather when selectedLocation changes and persist to localStorage
  useEffect(() => {
    if (selectedLocation) {
      try {
        localStorage.setItem(WEATHER_STORAGE_KEY, JSON.stringify(selectedLocation));
      } catch (e) {
        console.warn('Failed to save weather location to localStorage', e);
      }
      loadWeather(selectedLocation);
    }
  }, [selectedLocation]);

  // Debounced dynamic geocoding search
  useEffect(() => {
    if (!searchQuery || searchQuery.trim().length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const timer = setTimeout(async () => {
      const results = await searchGeocodingLocations(searchQuery);
      setSearchResults(results);
      setIsSearching(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Outside click listener
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const renderIcon = (iconName, className = 'w-4 h-4') => {
    const IconComponent = LucideIcons[iconName] || LucideIcons.Sun;
    return <IconComponent className={className} />;
  };

  const handleSelectLocation = (loc) => {
    setSelectedLocation(loc);
    setSearchQuery('');
    setSearchResults([]);
    setDropdownOpen(false);
  };

  // GPS Geolocation Handler
  const handleDetectGPS = () => {
    if (!navigator.geolocation) {
      setGeoError('GPS-Ortung wird von diesem Browser nicht unterstützt.');
      setTimeout(() => setGeoError(null), 4000);
      return;
    }

    setIsLocating(true);
    setGeoError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        setIsLocating(false);
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;

        const gpsLocation = {
          id: `gps-${lat.toFixed(3)}-${lon.toFixed(3)}`,
          name: 'Mein Standort',
          displayName: `Mein Standort (${lat.toFixed(2)}°, ${lon.toFixed(2)}°)`,
          country: 'GPS',
          countryCode: 'GPS',
          flag: '📍',
          lat: lat,
          lon: lon,
          isHQ: false,
        };

        handleSelectLocation(gpsLocation);
      },
      (error) => {
        setIsLocating(false);
        console.warn('Geolocation error:', error);
        setGeoError('Standortzugriff verweigert oder nicht ermittelbar.');
        setTimeout(() => setGeoError(null), 4000);
      },
      { timeout: 10000, enableHighAccuracy: false }
    );
  };

  const conditionText = weatherData?.conditionKey 
    ? t(`weather.${weatherData.conditionKey}`, weatherData.conditionKey)
    : t('weather.clear');

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Pill */}
      <button
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-slate-100/90 hover:bg-slate-200/80 text-slate-700 border border-slate-200/70 text-xs font-semibold transition-all group shadow-2xs hover:border-indigo-300"
        title={t('weather.weather')}
      >
        <span className="text-sm leading-none">{selectedLocation.flag}</span>
        <span className="text-slate-700 font-medium hidden sm:inline max-w-[110px] truncate">
          {selectedLocation.name}
        </span>

        {loading ? (
          <RefreshCw className="w-3.5 h-3.5 text-indigo-500 animate-spin" />
        ) : (
          <div className="flex items-center space-x-1">
            <span className={weatherData?.iconColor || 'text-amber-500'}>
              {renderIcon(weatherData?.iconName || 'Sun')}
            </span>
            <span className="font-bold text-slate-800 font-mono">
              {weatherData?.temperature !== undefined ? `${weatherData.temperature}°C` : '--'}
            </span>
          </div>
        )}

        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${dropdownOpen ? 'rotate-180 text-indigo-600' : 'group-hover:text-slate-600'}`} />
      </button>

      {/* Dropdown Location Selector & Weather Detail Flyout */}
      {dropdownOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-3xl shadow-2xl border border-slate-100 py-3 z-50 animate-fade-in divide-y divide-slate-100 overflow-hidden">
          {/* Active Location Detail Header */}
          <div className="px-5 py-4 bg-gradient-to-br from-indigo-50/80 via-white to-slate-50/80 rounded-t-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <span className="text-2xl">{selectedLocation.flag}</span>
                <div>
                  <h4 className="text-sm font-extrabold text-slate-900 leading-tight">
                    {selectedLocation.displayName || selectedLocation.name}
                  </h4>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-600">
                    {selectedLocation.isHQ ? `${t('weather.hq')} • Altlandsberg` : selectedLocation.country || 'Standort'}
                  </span>
                </div>
              </div>

              <div className="text-right">
                <div className="text-xl font-extrabold text-slate-900 font-mono flex items-center justify-end space-x-1.5">
                  <span className={weatherData?.iconColor || 'text-amber-500'}>
                    {renderIcon(weatherData?.iconName || 'Sun', 'w-5 h-5')}
                  </span>
                  <span>{weatherData?.temperature !== undefined ? `${weatherData.temperature}°C` : '--'}</span>
                </div>
                <p className="text-[11px] text-slate-500 font-medium capitalize mt-0.5">
                  {conditionText}
                </p>
              </div>
            </div>

            {/* Weather Metrics */}
            <div className="mt-3 pt-3 border-t border-slate-200/60 grid grid-cols-2 gap-2 text-xs text-slate-600">
              <div className="flex items-center space-x-1.5">
                <Droplets className="w-3.5 h-3.5 text-blue-500" />
                <span className="text-slate-400">{t('weather.humidity')}:</span>
                <span className="font-semibold text-slate-800">{weatherData?.humidity || 0}%</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <Wind className="w-3.5 h-3.5 text-teal-500" />
                <span className="text-slate-400">{t('weather.wind')}:</span>
                <span className="font-semibold text-slate-800">{weatherData?.windSpeed || 0} km/h</span>
              </div>
            </div>
          </div>

          {/* Search Box & GPS Section */}
          <div className="p-3 space-y-2 bg-slate-50/50">
            {/* Search Input for ANY city/address */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Stadt oder Adresse suchen (z. B. Hamburg, Tinglev, Paris)..."
                className="w-full pl-9 pr-8 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* GPS Detection Button */}
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={handleDetectGPS}
                disabled={isLocating}
                className="flex items-center space-x-1.5 text-[11px] font-semibold text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 px-2 py-1 rounded-lg transition-colors"
              >
                {isLocating ? (
                  <RefreshCw className="w-3 h-3 animate-spin text-indigo-600" />
                ) : (
                  <Navigation className="w-3 h-3 text-indigo-600" />
                )}
                <span>Meinen Standort ermitteln (GPS)</span>
              </button>

              <span className="text-[10px] text-slate-400 font-mono">Open-Meteo Live</span>
            </div>

            {geoError && (
              <div className="p-2 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-[11px] flex items-center space-x-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{geoError}</span>
              </div>
            )}
          </div>

          {/* Location Picker List or Search Results */}
          <div className="py-2">
            <div className="px-4 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              {searchQuery.trim().length >= 2 
                ? (isSearching ? 'Suche läuft...' : `Gefundene Orte (${searchResults.length})`) 
                : t('weather.standorte')}
            </div>

            <div className="max-h-52 overflow-y-auto px-2 space-y-0.5 mt-1">
              {/* If Searching, show Geocoding Results */}
              {searchQuery.trim().length >= 2 ? (
                searchResults.length === 0 && !isSearching ? (
                  <div className="p-3 text-center text-xs text-slate-400">
                    Keine Städte oder Orte für „{searchQuery}“ gefunden.
                  </div>
                ) : (
                  searchResults.map((loc) => (
                    <button
                      key={loc.id}
                      onClick={() => handleSelectLocation(loc)}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors text-left"
                    >
                      <div className="flex items-center space-x-2.5 truncate">
                        <span className="text-base shrink-0">{loc.flag}</span>
                        <div className="truncate">
                          <p className="font-bold text-slate-800 truncate">{loc.name}</p>
                          <p className="text-[10px] text-slate-400 truncate">{loc.displayName}</p>
                        </div>
                      </div>
                      <ChevronDown className="w-3.5 h-3.5 -rotate-90 text-slate-300 shrink-0 ml-2" />
                    </button>
                  ))
                )
              ) : (
                /* Otherwise show Company Locations */
                COMPANY_LOCATIONS.map((loc) => {
                  const isCurrent = loc.id === selectedLocation.id || (
                    Number(loc.lat).toFixed(2) === Number(selectedLocation.lat).toFixed(2) &&
                    Number(loc.lon).toFixed(2) === Number(selectedLocation.lon).toFixed(2)
                  );

                  return (
                    <button
                      key={loc.id}
                      onClick={() => handleSelectLocation(loc)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                        isCurrent
                          ? 'bg-indigo-50 text-indigo-700 font-bold border border-indigo-100 shadow-2xs'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                    >
                      <div className="flex items-center space-x-2.5">
                        <span className="text-base">{loc.flag}</span>
                        <span>{loc.name}</span>
                        {loc.isHQ && (
                          <span className="px-1.5 py-0.5 text-[9px] font-extrabold rounded-md bg-indigo-100 text-indigo-700">
                            HQ
                          </span>
                        )}
                      </div>
                      {isCurrent && (
                        <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
