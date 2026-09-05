from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
from app.models.security import FleetSecurityEventType

class FleetSecurityEventResponse(BaseModel):
    id: int
    event_type: FleetSecurityEventType
    vehicle_id: str
    plate: str
    speed: float
    speed_limit: float
    location: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    distance_moved_meters: Optional[float] = 0.0
    geofence_id: Optional[int] = None
    geofence_name: Optional[str] = None
    timestamp: datetime
    details: Optional[Dict[str, Any]] = None
    is_acknowledged: bool
    acknowledged_at: Optional[datetime] = None
    acknowledged_by_id: Optional[int] = None
    acknowledged_by_name: Optional[str] = None
    acknowledgement_note: Optional[str] = None
    action_taken: Optional[str] = "LOGGED"
    created_at: datetime

    class Config:
        orm_mode = True

class FleetSecurityLogsResponse(BaseModel):
    items: List[FleetSecurityEventResponse]
    total: int
    unacknowledged_count: int
    speed_violations_count: int
    off_hours_count: int
    limit: int
    offset: int

class FleetSecuritySettingUpdate(BaseModel):
    max_yard_speed: Optional[float] = Field(20.0, description="Höchstgeschwindigkeit im Werk in km/h", ge=5.0, le=100.0)
    quiet_hours_start: Optional[str] = Field("20:00", description="Startzeit Ruhezeit Mo-Fr (HH:MM)")
    quiet_hours_end: Optional[str] = Field("05:00", description="Endzeit Ruhezeit Mo-Fr (HH:MM)")
    weekend_quiet_all_day: Optional[bool] = Field(True, description="Wochenende ganztägig als Ruhezeit")
    off_hours_speed_threshold: Optional[float] = Field(5.0, description="Geschwindigkeitsschwelle während Ruhezeit in km/h")
    off_hours_distance_threshold_meters: Optional[float] = Field(100.0, description="Entfernungsschwelle während Ruhezeit in Metern")
    alert_email: Optional[str] = Field(None, description="Komma-getrennte E-Mail-Adressen für Alarme")
    webhook_url: Optional[str] = Field(None, description="MS Teams / Slack Webhook URL")
    cooldown_minutes: Optional[int] = Field(15, description="Cooldown gegen Alarmflut in Minuten", ge=1, le=1440)
    is_active: Optional[bool] = Field(True, description="Überwachung aktiv")

class FleetSecuritySettingResponse(BaseModel):
    id: int
    max_yard_speed: float
    quiet_hours_start: str
    quiet_hours_end: str
    weekend_quiet_all_day: bool
    off_hours_speed_threshold: float
    off_hours_distance_threshold_meters: float
    alert_email: Optional[str] = None
    webhook_url: Optional[str] = None
    cooldown_minutes: int
    is_active: bool
    is_currently_quiet_hours: bool = False
    current_time_info: Optional[str] = None
    updated_at: datetime

    class Config:
        orm_mode = True

class FleetSecurityAcknowledgeRequest(BaseModel):
    note: Optional[str] = Field(None, description="Notiz zur Quittierung / Begründung")

class FleetSecurityStatsResponse(BaseModel):
    total_events: int
    unacknowledged_events: int
    violations_today: int
    speed_violations_total: int
    off_hours_total: int
    is_active: bool
    is_currently_quiet_hours: bool
    max_yard_speed: float
    quiet_hours_label: str

class FleetSecurityEvaluateResponse(BaseModel):
    success: bool
    message: str
    vehicles_checked: int
    new_violations_detected: int
    detected_events: List[FleetSecurityEventResponse]
