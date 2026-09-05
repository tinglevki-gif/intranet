from typing import List, Optional, Any, Union
from pydantic import BaseModel, Field
from app.schemas.dispatch import DispatchStatusInfo, DispatchSummary

class VehicleTelemetryItem(BaseModel):
    id: Union[int, str] = Field(..., description="Fahrzeug-Identifikationsnummer")
    plate: str = Field(..., description="Amtliches Kennzeichen (z. B. SL-TF 101)")
    brand: Optional[str] = Field(None, description="Marke / Modell / Typ (z. B. MAN TGX 26.510)")
    lat: float = Field(..., description="Geografische Breite (Latitude)")
    lon: float = Field(..., description="Geografische Länge (Longitude)")
    location: Optional[str] = Field(None, description="Standortbeschreibung / Adresse")
    speed: float = Field(0.0, description="Aktuelle Geschwindigkeit in km/h")
    mileage: Optional[Union[float, int]] = Field(None, description="Kilometerstand (km)")
    timestamp: Optional[str] = Field(None, description="Zeitstempel der letzten GPS-Meldung")
    isActive: bool = Field(True, description="Status Aktiv/Inaktiv")
    dispatch_status: Optional[DispatchStatusInfo] = Field(None, description="Berechneter Dispositionsstatus für Tourenplanung")

class FleetVehiclesResponse(BaseModel):
    total: int = Field(..., description="Gesamtanzahl ortbarer Fahrzeuge")
    in_motion_count: int = Field(0, description="Fahrzeuge in Fahrt (speed > 0)")
    parked_count: int = Field(0, description="Fahrzeuge im Stillstand / geparkt (speed == 0)")
    cached_at: Optional[str] = Field(None, description="Zeitstempel des Caches")
    is_live: bool = Field(True, description="True wenn Live-Daten aus Navkonzept bezogen wurden")
    dispatch_summary: Optional[DispatchSummary] = Field(None, description="Disponenten-Zähler nach logistischem Status")
    vehicles: List[VehicleTelemetryItem] = Field(default_factory=list, description="Fahrzeugliste")

