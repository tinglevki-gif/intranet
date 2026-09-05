from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field

class DeliveryTrackingShareCreate(BaseModel):
    vehicle_id: str = Field(..., description="ID oder Kennzeichen des Fahrzeugs")
    destination_name: str = Field(..., min_length=2, max_length=200, description="Name der Baustelle oder des Zielorts")
    destination_lat: float = Field(..., ge=-90.0, le=90.0, description="Geografische Breite der Baustelle")
    destination_lon: float = Field(..., ge=-180.0, le=180.0, description="Geografische Länge der Baustelle")
    duration_hours: int = Field(default=12, ge=1, le=168, description="Gültigkeitsdauer des Links in Stunden (Standard: 12h)")
    notes: Optional[str] = Field(None, max_length=500, description="Optionale Notizen für Bauleiter / Montageleiter")

class DeliveryTrackingShareResponse(BaseModel):
    id: int
    token: str
    vehicle_id: str
    destination_name: str
    destination_lat: float
    destination_lon: float
    created_at: datetime
    expires_at: datetime
    is_active: bool
    notes: Optional[str] = None
    created_by_name: Optional[str] = None
    share_url: Optional[str] = None

    class Config:
        from_attributes = True

class PublicTrackingResponse(BaseModel):
    is_valid: bool = True
    token: str
    plate: str = Field(..., description="Amtliches Kennzeichen des LKW")
    brand: Optional[str] = Field(None, description="Modell / Fahrzeugtyp")
    current_lat: float = Field(..., description="Aktuelle LKW-Breite")
    current_lon: float = Field(..., description="Aktuelle LKW-Länge")
    current_speed: float = Field(0.0, description="Aktuelle Geschwindigkeit in km/h")
    is_moving: bool = Field(False, description="True wenn LKW in Fahrt ist")
    
    destination_name: str = Field(..., description="Zielbaustelle")
    destination_lat: float = Field(..., description="Zielbreite")
    destination_lon: float = Field(..., description="Ziellänge")
    
    distance_remaining_km: float = Field(..., description="Verbleibende Distanz zur Baustelle in km")
    duration_remaining_minutes: int = Field(..., description="Geschätzte Fahrzeit in Minuten")
    estimated_arrival_time: str = Field(..., description="Geschätzte Ankunftszeit (z. B. 14:35 Uhr oder ISO-String)")
    
    last_update: str = Field(..., description="Zeitpunkt des letzten GPS-Pings")
    expires_at: datetime = Field(..., description="Ablaufdatum des Tracking-Links")
    notes: Optional[str] = None
