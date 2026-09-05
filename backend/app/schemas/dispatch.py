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
    distance_to_factory_km: float = Field(default=0.0, description="Aktuelle Luftlinien-Distanz zum Werk Altlandsberg in km")
    is_available_for_dispatch: bool = Field(default=False, description="True wenn Fahrzeug für neue Aufträge oder spontane Beiladungen verfügbar ist")

class DispatchSummary(BaseModel):
    loading_factory_count: int = Field(default=0, description="Anzahl Fahrzeuge im Werk (Beladung / Bereitstellung)")
    outbound_transit_count: int = Field(default=0, description="Anzahl Fahrzeuge auf Anfahrt zur Baustelle")
    unloading_site_count: int = Field(default=0, description="Anzahl Fahrzeuge beim Entladen auf Baustelle")
    inbound_return_count: int = Field(default=0, description="Anzahl Fahrzeuge auf Rückweg zum Werk (Leer)")
    standby_idle_count: int = Field(default=0, description="Anzahl Fahrzeuge in Bereitschaft / Pause")

class NearestVehicleRequest(BaseModel):
    latitude: Optional[float] = Field(None, ge=-90.0, le=90.0, description="Breitengrad des Suchpunkts")
    longitude: Optional[float] = Field(None, ge=-180.0, le=180.0, description="Längengrad des Suchpunkts")
    address_or_postal_code: Optional[str] = Field(None, description="Postleitzahl oder Ortsname (z. B. '15345', '10115 Berlin', 'Frankfurt (Oder)')")
    status_filter: Optional[List[str]] = Field(None, description="Optionale Filterung nach Status (z. B. INBOUND_RETURN, STANDBY_IDLE)")
    limit: int = Field(default=10, ge=1, le=50, description="Maximale Anzahl Treffer")

class NearestVehicleItem(BaseModel):
    id: Union[int, str]
    plate: str = Field(..., description="Kennzeichen")
    brand: Optional[str] = Field(None, description="Fahrzeugmodell")
    current_lat: float
    current_lon: float
    current_speed: float
    location_name: Optional[str] = None
    dispatch_status: DispatchStatusInfo
    distance_crow_km: float = Field(..., description="Luftlinien-Distanz zum Suchziel in km")
    distance_road_km: float = Field(..., description="Geschätzte Straßen-Distanz in km")
    duration_minutes: int = Field(..., description="Geschätzte Anfahrtszeit in Minuten")
    estimated_arrival_time: str = Field(..., description="Voraussichtliche Ankunftszeit am Suchpunkt")

class NearestVehicleResponse(BaseModel):
    search_query: str
    target_latitude: float
    target_longitude: float
    target_location_name: str
    total_evaluated: int
    results: List[NearestVehicleItem]
