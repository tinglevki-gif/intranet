from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field
from app.models.geofence import GeofenceType, GeofenceEventType

class GeofenceBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=200, description="Name der Geofence-Zone (z. B. Werk Altlandsberg)")
    type: GeofenceType = Field(default=GeofenceType.FACTORY, description="Art des Standorts")
    latitude: float = Field(..., ge=-90.0, le=90.0, description="Geografische Breite")
    longitude: float = Field(..., ge=-180.0, le=180.0, description="Geografische Länge")
    radius_meters: int = Field(default=500, ge=50, le=50000, description="Überwachungsradius in Metern")
    is_active: bool = Field(default=True, description="Status Aktiv/Inaktiv")
    description: Optional[str] = Field(None, max_length=500, description="Optionale Notiz oder Beschreibung")

class GeofenceCreate(GeofenceBase):
    pass

class GeofenceUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=200)
    type: Optional[GeofenceType] = None
    latitude: Optional[float] = Field(None, ge=-90.0, le=90.0)
    longitude: Optional[float] = Field(None, ge=-180.0, le=180.0)
    radius_meters: Optional[int] = Field(None, ge=50, le=50000)
    is_active: Optional[bool] = None
    description: Optional[str] = None

class GeofenceResponse(GeofenceBase):
    id: int
    created_at: datetime
    updated_at: datetime
    active_vehicles_count: int = Field(default=0, description="Anzahl aktuell anwesender Fahrzeuge")

    class Config:
        from_attributes = True

class VehicleStayResponse(BaseModel):
    id: int
    vehicle_id: str
    plate: str
    geofence_id: int
    geofence_name: Optional[str] = None
    geofence_type: Optional[str] = None
    enter_time: datetime
    exit_time: Optional[datetime] = None
    duration_minutes: Optional[int] = None
    is_currently_inside: bool = Field(default=False, description="True wenn Fahrzeug aktuell vor Ort ist")
    created_at: datetime

    class Config:
        from_attributes = True

class StaysSummaryResponse(BaseModel):
    date: str
    total_stays: int
    active_stays_count: int
    completed_stays_count: int
    total_dwell_minutes: int
    avg_dwell_minutes: float
    stays: List[VehicleStayResponse]

class VehicleGeofenceEventResponse(BaseModel):
    id: int
    vehicle_id: str
    plate: str
    geofence_id: int
    geofence_name: Optional[str] = None
    event_type: GeofenceEventType
    timestamp: datetime
    speed: Optional[float] = 0.0
    distance_meters: Optional[float] = None

    class Config:
        from_attributes = True
