export const COMPANY_LOCATIONS = [
  { id: 'tiglev', name: 'Tinglev', country: 'DK', flag: '🇩🇰', lat: 54.933, lon: 9.250, isHQ: true },
  { id: 'muc', name: 'München', country: 'DE', flag: '🇩🇪', lat: 48.137, lon: 11.576, isHQ: false },
  { id: 'ber', name: 'Berlin', country: 'DE', flag: '🇩🇪', lat: 52.520, lon: 13.405, isHQ: false },
  { id: 'fra', name: 'Frankfurt', country: 'DE', flag: '🇩🇪', lat: 50.110, lon: 8.682, isHQ: false },
  { id: 'lon', name: 'London', country: 'GB', flag: '🇬🇧', lat: 51.507, lon: -0.128, isHQ: false },
  { id: 'waw', name: 'Warschau', country: 'PL', flag: '🇵🇱', lat: 52.229, lon: 21.012, isHQ: false },
  { id: 'ist', name: 'Istanbul', country: 'TR', flag: '🇹🇷', lat: 41.008, lon: 28.978, isHQ: false },
  { id: 'mad', name: 'Madrid', country: 'ES', flag: '🇪🇸', lat: 40.416, lon: -3.703, isHQ: false },
  { id: 'vie', name: 'Wien', country: 'AT', flag: '🇦🇹', lat: 48.208, lon: 16.373, isHQ: false },
  { id: 'zrh', name: 'Zürich', country: 'CH', flag: '🇨🇭', lat: 47.376, lon: 8.541, isHQ: false },
];

/**
 * Converts 2-letter country code (e.g. 'DE', 'DK', 'PL') to emoji flag
 */
export function getCountryFlag(countryCode) {
  if (!countryCode || countryCode.length !== 2) return '📍';
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map((char) => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

export function getWeatherConditionInfo(code) {
  // WMO Weather interpretation codes (WW)
  if (code === 0) {
    return { key: 'clear', icon: 'Sun', color: 'text-amber-500' };
  }
  if (code >= 1 && code <= 3) {
    return { key: 'partly_cloudy', icon: 'CloudSun', color: 'text-sky-500' };
  }
  if (code === 45 || code === 48) {
    return { key: 'fog', icon: 'CloudFog', color: 'text-slate-400' };
  }
  if ((code >= 51 && code <= 57) || (code >= 80 && code <= 82)) {
    return { key: 'drizzle', icon: 'CloudDrizzle', color: 'text-blue-400' };
  }
  if (code >= 61 && code <= 67) {
    return { key: 'rain', icon: 'CloudRain', color: 'text-blue-600' };
  }
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) {
    return { key: 'snow', icon: 'Snowflake', color: 'text-cyan-400' };
  }
  if (code >= 95 && code <= 99) {
    return { key: 'thunderstorm', icon: 'CloudLightning', color: 'text-indigo-600' };
  }
  return { key: 'cloudy', icon: 'Cloud', color: 'text-slate-400' };
}

const cache = new Map();

/**
 * Dynamic Geocoding Search using Open-Meteo public Geocoding API
 */
export async function searchGeocodingLocations(query) {
  if (!query || query.trim().length < 2) return [];

  const cleanQuery = query.trim();
  try {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cleanQuery)}&count=6&language=de&format=json`;
    const response = await fetch(url);
    if (!response.ok) return [];

    const data = await response.json();
    if (!data.results || !Array.isArray(data.results)) return [];

    return data.results.map((item) => {
      const countryCode = item.country_code || 'DE';
      const flag = getCountryFlag(countryCode);
      const adminStr = item.admin1 ? `, ${item.admin1}` : '';
      const countryStr = item.country ? ` (${item.country})` : '';

      return {
        id: `geo-${item.id}`,
        name: item.name,
        displayName: `${item.name}${adminStr}${countryStr}`,
        country: item.country || countryCode,
        countryCode: countryCode,
        flag: flag,
        lat: item.latitude,
        lon: item.longitude,
        isHQ: item.name.toLowerCase().includes('tinglev') || item.name.toLowerCase().includes('tiglev'),
      };
    });
  } catch (err) {
    console.warn('Geocoding search failed:', err);
    return [];
  }
}

/**
 * Fetches current live weather from Open-Meteo using exact latitude and longitude
 */
export async function fetchLocationWeather(location) {
  if (!location || location.lat === undefined || location.lon === undefined) {
    location = COMPANY_LOCATIONS[0];
  }

  const lat = Number(location.lat).toFixed(4);
  const lon = Number(location.lon).toFixed(4);
  const cacheKey = `weather-${lat}-${lon}`;
  const cached = cache.get(cacheKey);
  const now = Date.now();

  // 10 minutes cache
  if (cached && (now - cached.timestamp < 10 * 60 * 1000)) {
    return cached.data;
  }

  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Weather API Error: ${response.status}`);
    }

    const json = await response.json();
    const current = json.current;
    const condition = getWeatherConditionInfo(current.weather_code);

    const weatherData = {
      locationId: location.id || `custom-${lat}-${lon}`,
      locationName: location.name,
      displayName: location.displayName || location.name,
      flag: location.flag || '📍',
      lat: Number(lat),
      lon: Number(lon),
      temperature: Math.round(current.temperature_2m),
      humidity: current.relative_humidity_2m,
      windSpeed: Math.round(current.wind_speed_10m),
      weatherCode: current.weather_code,
      conditionKey: condition.key,
      iconName: condition.icon,
      iconColor: condition.color,
      isHQ: !!location.isHQ,
    };

    cache.set(cacheKey, { timestamp: now, data: weatherData });
    return weatherData;
  } catch (error) {
    console.warn(`Could not fetch live weather for ${location.name}, using fallback:`, error);
    return {
      locationId: location.id || `custom-${lat}-${lon}`,
      locationName: location.name,
      displayName: location.displayName || location.name,
      flag: location.flag || '📍',
      lat: Number(lat),
      lon: Number(lon),
      temperature: 19,
      humidity: 55,
      windSpeed: 12,
      weatherCode: 1,
      conditionKey: 'partly_cloudy',
      iconName: 'CloudSun',
      iconColor: 'text-sky-500',
      isHQ: !!location.isHQ,
    };
  }
}
