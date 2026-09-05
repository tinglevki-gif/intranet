import enum
from typing import Optional, List, Dict, Any, Union
from pydantic import BaseModel, Field

class DispatchStatusType(str, enum.Enum):
    LOADING_FACTORY = "LOADING_FACTORY"       # Im Werk beladen / Bereitstellung (speed == 0, im Werk)
    OUTBOUND_TRANSIT = "OUTBOUND_TRANSIT"     # Auf Anfahrt Baustelle (speed > 0, fährt vom Werk weg)
    UNLOADING_SITE = "UNLOADING_SITE"         # Beim Entladen (Baustelle) (speed == 0, in Baustelle)
    INBOUND_RETURN = "INBOUND_RETURN"         # Auf Rückweg Werk / Leerfahrt (speed > 0, fährt zum Werk)
    STANDBY_IDLE = "STANDBY_IDLE"             # Bereitschaft / Pause / Standby (speed == 0, außerhalb)

class DispatchStatusInfo(BaseModel):
    status: DispatchStatusType = Field(..., description="Aktueller Dispositionsstatus des Fahrzeugs")
    label: str = Field(..., description="Benutzerfreundliche deutsche Bezeichnung")
    badge_color: str = Field(default="bg-slate-100 text-slate-800", description="Tailwind Farbschema")
    icon: str = Field(default="🚛", description="Status-Emoji oder Symbol")
    description: str = Field(..., description="Detaillierte Tätigkeits- oder Standortbeschreibung")
    current_zone_name: Optional[str] = Field(None, description="Name der aktuellen Geofence-Zone falls anwesend")
    site_name: Optional[str] = Field(None, description="Name der aktuellen Geofence-Zone / Baustelle")
    distance_to_factory_km: float = Field(default=0.0, description="Aktuelle Luftlinien-Distanz zum Werk Altlandsberg in km")
    is_available_for_dispatch: bool = Field(default=False, description="True wenn Fahrzeug für neue Aufträge oder spontane Beiladungen verfügbar ist")

class DispatchSummary(BaseModel):
    loading_factory: int = Field(default=0, description="Anzahl Fahrzeuge im Werk")
    outbound_transit: int = Field(default=0, description="Anzahl Fahrzeuge auf Anfahrt")
    unloading_site: int = Field(default=0, description="Anzahl Fahrzeuge beim Entladen")
    inbound_return: int = Field(default=0, description="Anzahl Fahrzeuge auf Rückweg")
    standby_idle: int = Field(default=0, description="Anzahl Fahrzeuge in Bereitschaft")
    loading_factory_count: int = Field(default=0)
    outbound_transit_count: int = Field(default=0)
    unloading_site_count: int = Field(default=0)
    inbound_return_count: int = Field(default=0)
    standby_idle_count: int = Field(default=0)
    available_count: int = Field(default=0)
    total: int = Field(default=0)

class NearestVehicleRequest(BaseModel):
    query: Optional[str] = Field(None, description="PLZ, Ort oder Adresse (z. B. '10115 Berlin', '15345')")
    address_or_postal_code: Optional[str] = Field(None, description="Alias für query")
    latitude: Optional[float] = Field(None, ge=-90.0, le=90.0, description="Breitengrad des Suchpunkts")
    longitude: Optional[float] = Field(None, ge=-180.0, le=180.0, description="Längengrad des Suchpunkts")
    geofence_id: Optional[int] = Field(None, description="ID des Ziel-Geofences")
    radius_km: Optional[float] = Field(default=150.0, description="Maximaler Suchradius in km")
    status_filter: Optional[List[str]] = Field(None, description="Optionale Filterung nach Status (z. B. INBOUND_RETURN, STANDBY_IDLE)")
    only_available: Optional[bool] = Field(default=True, description="Nur verfügbare Fahrzeuge (Rückweg, Werk, Standby)")
    limit: int = Field(default=10, ge=1, le=50, description="Maximale Anzahl Treffer")

class NearestVehicleItem(BaseModel):
    id: Optional[Union[int, str]] = None
    vehicle_id: Optional[Union[int, str]] = None
    plate: str = Field(..., description="Kennzeichen")
    brand: Optional[str] = Field(None, description="Fahrzeugmodell")
    current_lat: Optional[float] = None
    current_lon: Optional[float] = None
    lat: Optional[float] = None
    lon: Optional[float] = None
    speed: Optional[float] = 0.0
    current_speed: Optional[float] = 0.0
    location: Optional[str] = None
    location_name: Optional[str] = None
    dispatch_status: Optional[Any] = None
    dispatch_status_label: Optional[str] = None
    is_available_for_dispatch: Optional[bool] = True
    distance_km: float = Field(default=0.0, description="Luftlinien-Distanz zum Suchziel in km")
    distance_crow_km: float = Field(default=0.0, description="Luftlinien-Distanz zum Suchziel in km")
    road_distance_km: float = Field(default=0.0, description="Geschätzte Straßen-Distanz in km")
    distance_road_km: float = Field(default=0.0, description="Geschätzte Straßen-Distanz in km")
    estimated_drive_minutes: int = Field(default=0, description="Geschätzte Anfahrtszeit in Minuten")
    duration_minutes: int = Field(default=0, description="Geschätzte Anfahrtszeit in Minuten")
    estimated_arrival_time: Optional[str] = Field(None, description="Voraussichtliche Ankunftszeit am Suchpunkt")

class NearestVehicleResponse(BaseModel):
    search_query: Optional[str] = None
    query_location: Optional[Dict[str, Any]] = None
    target_latitude: Optional[float] = None
    target_longitude: Optional[float] = None
    target_location_name: Optional[str] = None
    total_found: int = 0
    total_evaluated: int = 0
    vehicles: List[NearestVehicleItem] = []
    results: List[NearestVehicleItem] = []
