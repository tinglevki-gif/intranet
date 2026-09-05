import time
import logging
import threading
import requests
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
from app.core.config import settings

logger = logging.getLogger("navkonzept_service")

# Realistic fallback fleet dataset (Tinglev Elementfabrik logistics in Germany & Denmark)
FALLBACK_FLEET_VEHICLES = [
    {
        "id": 101,
        "plate": "SL-TF 101",
        "brand": "MAN TGX 26.510 (Schwerlastzug)",
        "lat": 53.5511,
        "lon": 9.9937,
        "location": "A7 Rtg. Hamburg (km 124)",
        "speed": 78.5,
        "mileage": 184520,
        "timestamp": None,  # Computed dynamically
        "isActive": True
    },
    {
        "id": 102,
        "plate": "SL-TF 102",
        "brand": "Mercedes-Benz Actros 2548 (Innenlader)",
        "lat": 54.9333,
        "lon": 9.2500,
        "location": "Werk Tinglev (Ladezone 3)",
        "speed": 0.0,
        "mileage": 142180,
        "timestamp": None,
        "isActive": True
    },
    {
        "id": 103,
        "plate": "SL-TF 103",
        "brand": "Volvo FH16 750 (Tieflader)",
        "lat": 54.4812,
        "lon": 9.0522,
        "location": "B200 Rtg. Husum (km 42)",
        "speed": 64.0,
        "mileage": 219800,
        "timestamp": None,
        "isActive": True
    },
    {
        "id": 104,
        "plate": "SL-TF 104",
        "brand": "Scania R500 (Pritschenzug mit Kran)",
        "lat": 54.3233,
        "lon": 10.1228,
        "location": "Baustelle Kiel Förde (Entladung)",
        "speed": 0.0,
        "mileage": 98640,
        "timestamp": None,
        "isActive": True
    },
    {
        "id": 105,
        "plate": "SL-TF 105",
        "brand": "DAF XG+ 530 (Betonfertigteile-Transporter)",
        "lat": 54.7833,
        "lon": 9.4333,
        "location": "B200 Flensburg Süd",
        "speed": 58.2,
        "mileage": 112400,
        "timestamp": None,
        "isActive": True
    },
    {
        "id": 201,
        "plate": "SL-TF 201",
        "brand": "Mercedes Sprinter (Montage- & Servicewagen)",
        "lat": 54.9090,
        "lon": 9.7922,
        "location": "Kundentermin Sonderburg (DK)",
        "speed": 0.0,
        "mileage": 67320,
        "timestamp": None,
        "isActive": True
    },
    {
        "id": 202,
        "plate": "SL-TF 202",
        "brand": "VW Crafter (Statik & Qualitätskontrolle)",
        "lat": 54.3000,
        "lon": 9.6667,
        "location": "A7 Rendsburg Hochbrücke",
        "speed": 82.0,
        "mileage": 51200,
        "timestamp": None,
        "isActive": True
    }
]

class NavkonzeptFleetService:
    """
    Service for fetching and transforming live fleet telemetry from Navkonzept (AddSecure FleetVision).
    Implements in-memory 45s TTL caching and safe fallback resilience.
    """
    CACHE_TTL_SECONDS = 45.0

    def __init__(self):
        self._cached_vehicles: Optional[List[Dict[str, Any]]] = None
        self._cache_timestamp: float = 0.0
        self._is_live_data: bool = False
        self._lock = threading.Lock()

    def get_vehicles(self, force_refresh: bool = False) -> Dict[str, Any]:
        """
        Retrieves active vehicles list, using cache if within TTL (45s).
        """
        now = time.time()
        with self._lock:
            if not force_refresh and self._cached_vehicles is not None and (now - self._cache_timestamp) < self.CACHE_TTL_SECONDS:
                logger.debug("Returning cached Navkonzept fleet telemetry (age: %.1fs)", now - self._cache_timestamp)
                return self._build_response(self._cached_vehicles, self._cache_timestamp, self._is_live_data)

            # Fetch fresh data from Navkonzept API
            vehicles, is_live = self._fetch_from_navkonzept()
            self._cached_vehicles = vehicles
            self._cache_timestamp = now
            self._is_live_data = is_live

            return self._build_response(vehicles, self._cache_timestamp, is_live)

    def _fetch_from_navkonzept(self) -> tuple[List[Dict[str, Any]], bool]:
        cookie = getattr(settings, "NAVKONZEPT_COOKIE", "").strip()
        firm_id = getattr(settings, "NAVKONZEPT_FIRM_ID", 332)
        api_url = getattr(settings, "NAVKONZEPT_API_URL", "https://portal.navkonzept.com/api/map/leaflet/ajaxGetTableData")

        # Check if cookie is set to placeholder
        if not cookie or "TU_PHPSESSID_AQUI" in cookie:
            logger.info("Navkonzept Cookie is not configured or set to placeholder. Serving structured fallback telemetry.")
            return self._get_fallback_data(), False

        headers = {
            "Content-Type": "application/json",
            "Cookie": cookie,
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
        payload = {
            "firmId": firm_id,
            "vehicleGroupId": None
        }

        try:
            logger.info("Calling Navkonzept API endpoint: %s for firmId: %s", api_url, firm_id)
            response = requests.post(
                api_url,
                headers=headers,
                json=payload,
                timeout=10.0
            )

            if response.status_code != 200:
                logger.warning(
                    "Navkonzept API returned HTTP status %s: %s. Using fallback dataset.",
                    response.status_code,
                    response.text[:200]
                )
                return self._get_fallback_data(), False

            # Check if response is HTML (e.g. redirected to login page)
            content_type = response.headers.get("Content-Type", "")
            if "html" in content_type.lower() or response.text.strip().startswith("<!DOCTYPE") or response.text.strip().startswith("<html"):
                logger.warning("Navkonzept API returned HTML login page instead of JSON. Session cookie might be expired.")
                return self._get_fallback_data(), False

            data = response.json()
            items = []

            # Extract list of items from diverse possible JSON structures
            if isinstance(data, list):
                items = data
            elif isinstance(data, dict):
                if "items" in data and isinstance(data["items"], list):
                    items = data["items"]
                elif "data" in data:
                    if isinstance(data["data"], list):
                        items = data["data"]
                    elif isinstance(data["data"], dict) and "items" in data["data"] and isinstance(data["data"]["items"], list):
                        items = data["data"]["items"]
                elif "result" in data and isinstance(data["result"], list):
                    items = data["result"]

            if not items:
                logger.warning("Navkonzept API returned empty items array or unrecognized format: %s", str(data)[:200])
                # If valid JSON but empty list, we return empty or fallback
                return self._get_fallback_data(), False

            parsed_vehicles: List[Dict[str, Any]] = []
            for idx, item in enumerate(items):
                lat = item.get("latitude") if item.get("latitude") is not None else item.get("lat")
                lon = item.get("longitude") if item.get("longitude") is not None else (item.get("lon") or item.get("lng"))

                # Discard items without valid coordinates
                if lat is None or lon is None:
                    continue

                try:
                    lat_f = float(lat)
                    lon_f = float(lon)
                except (ValueError, TypeError):
                    continue

                speed_val = item.get("speed")
                try:
                    speed_f = float(speed_val) if speed_val is not None else 0.0
                except (ValueError, TypeError):
                    speed_f = 0.0

                vehicle_id = item.get("id") or item.get("vehicleId") or (idx + 1)
                plate = item.get("registrationNumber") or item.get("plate") or item.get("licencePlate") or f"SL-TF {100 + idx}"
                brand = item.get("brand") or item.get("model") or item.get("name") or "LKW / Zugmaschine"
                location_desc = item.get("locationDescription") or item.get("location") or item.get("address") or "Standort ermittelt"
                mileage = item.get("mileage") or item.get("odometer") or item.get("km")
                timestamp = item.get("timestamp") or item.get("lastUpdate") or datetime.now(timezone.utc).isoformat()
                is_active = bool(item.get("isActive", True))

                parsed_vehicles.append({
                    "id": vehicle_id,
                    "plate": str(plate),
                    "brand": str(brand) if brand else None,
                    "lat": lat_f,
                    "lon": lon_f,
                    "location": str(location_desc),
                    "speed": speed_f,
                    "mileage": mileage,
                    "timestamp": timestamp,
                    "isActive": is_active
                })

            if not parsed_vehicles:
                logger.warning("No valid vehicles with coordinates found in Navkonzept response. Using fallback.")
                return self._get_fallback_data(), False

            logger.info("Successfully parsed %d live vehicles from Navkonzept API.", len(parsed_vehicles))
            return parsed_vehicles, True

        except Exception as e:
            logger.error("Error communicating with Navkonzept API: %s. Using fallback dataset.", e, exc_info=True)
            return self._get_fallback_data(), False

    def _get_fallback_data(self) -> List[Dict[str, Any]]:
        current_iso = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
        vehicles = []
        for v in FALLBACK_FLEET_VEHICLES:
            v_copy = dict(v)
            v_copy["timestamp"] = current_iso
            vehicles.append(v_copy)
        return vehicles

    def _build_response(self, vehicles: List[Dict[str, Any]], cache_ts: float, is_live: bool) -> Dict[str, Any]:
        in_motion = sum(1 for v in vehicles if (v.get("speed") or 0) > 0)
        parked = sum(1 for v in vehicles if (v.get("speed") or 0) == 0)
        cached_iso = datetime.fromtimestamp(cache_ts, tz=timezone.utc).isoformat() if cache_ts else None

        return {
            "total": len(vehicles),
            "in_motion_count": in_motion,
            "parked_count": parked,
            "cached_at": cached_iso,
            "is_live": is_live,
            "vehicles": vehicles
        }

# Global Singleton Instance
navkonzept_fleet_service = NavkonzeptFleetService()
