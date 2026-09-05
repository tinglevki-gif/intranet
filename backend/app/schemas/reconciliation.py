import datetime as dt
from typing import Optional, List, Any, Dict
from pydantic import BaseModel, Field

class TripReconciliationRequest(BaseModel):
    plate: str = Field(..., min_length=2, max_length=50, description="Amtliches Kennzeichen des Lkw (z. B. MOL-TE 101)")
    delivery_note_number: str = Field(..., min_length=2, max_length=100, description="Lieferschein-Nummer (z. B. LS-2026-8842)")
    date: str = Field(..., description="Datum der Anlieferungsfahrt (YYYY-MM-DD)")
    site_geofence_id: int = Field(..., description="ID des Zielbaustellen-Geofence")
    free_unloading_minutes: int = Field(default=60, ge=0, le=480, description="Vereinbarte kostenlose Entladezeit in Minuten (Standard: 60)")
    hourly_demurrage_rate: float = Field(default=95.0, ge=0.0, description="Stundensatz für Standgeld in Euro (Standard: 95.00 €/Std.)")
    notes: Optional[str] = Field(None, max_length=1000, description="Optionale Bemerkungen zum Entladevorgang / Kranprotokoll")

class GpsAuditTrailItem(BaseModel):
    timestamp: dt.datetime = Field(..., description="Exakter GPS-Zeitstempel")
    event_type: str = Field(..., description="Ereignistyp (FACTORY_EXIT, SITE_ENTER, DWELL_CHECKPOINT, SITE_EXIT)")
    location_name: str = Field(..., description="Ortsbezeichnung / Geofence-Name")
    latitude: float = Field(..., description="Geografische Breite")
    longitude: float = Field(..., description="Geografische Länge")
    speed: float = Field(default=0.0, description="Gemessene Geschwindigkeit in km/h")
    description: str = Field(..., description="Prüffähige Tätigkeitsbeschreibung")

class TripReconciliationResponse(BaseModel):
    id: Optional[int] = None
    report_number: str = Field(..., description="Eindeutige Prüfbericht-Nummer (z. B. SGN-2026-0905-101)")
    delivery_note_number: str = Field(..., description="Lieferschein-Nummer")
    plate: str = Field(..., description="Kennzeichen")
    trip_date: str = Field(..., description="Datum")
    site_geofence_id: int
    site_name: str = Field(..., description="Name der Zielbaustelle")
    factory_geofence_id: Optional[int] = None
    factory_name: Optional[str] = None
    factory_departure_time: Optional[dt.datetime] = None
    site_arrival_time: Optional[dt.datetime] = None
    site_departure_time: Optional[dt.datetime] = None
    stay_duration_minutes: int = Field(..., description="Gesamte Standzeit an der Baustelle in Minuten")
    free_unloading_minutes: int = Field(default=60, description="Freistandzeit in Minuten")
    billable_delay_minutes: int = Field(..., description="Abrechenbare Standgeldzeit in Minuten")
    hourly_demurrage_rate: float = Field(..., description="Angewandter Stundensatz")
    demurrage_total_netto: float = Field(..., description="Berechnetes Standgeld netto in Euro")
    is_demurrage_applicable: bool = Field(..., description="True wenn Standgeld anfällt")
    status: str = Field(default="CONFIRMED")
    compliance_text: Optional[str] = None
    notes: Optional[str] = None
    created_by_name: Optional[str] = None
    created_at: Optional[dt.datetime] = None
    audit_trail: List[GpsAuditTrailItem] = Field(default_factory=list)

    class Config:
        from_attributes = True

class SiteWaitingTimesSummary(BaseModel):
    geofence_id: int
    site_name: str
    site_type: str
    incident_count: int = Field(..., description="Anzahl Überschreitungen über 60 Minuten")
    total_dwell_minutes: int = Field(..., description="Gesamte Verweildauer in Minuten")
    total_delay_minutes: int = Field(..., description="Gesamte Überschreitung in Minuten")
    total_demurrage_eur: float = Field(..., description="Gesamte Standgeldforderung in Euro")
    avg_dwell_minutes: float = Field(..., description="Durchschnittliche Verweildauer in Minuten")

class MonthlyWaitingTimesSummaryResponse(BaseModel):
    month: str = Field(..., description="Auswertungsmonat (YYYY-MM)")
    threshold_minutes: int = Field(default=60, description="Grenzwert für freie Entladezeit")
    total_exceeded_deliveries: int = Field(..., description="Gesamtzahl betroffener Anlieferungen")
    total_delay_minutes: int = Field(..., description="Gesamte Verzögerungszeit in Minuten")
    total_delay_hours: float = Field(..., description="Gesamte Verzögerungszeit in Stunden")
    total_demurrage_eur: float = Field(..., description="Gesamte berechnete Standgelder in Euro")
    by_site: List[SiteWaitingTimesSummary] = Field(default_factory=list)
    items: List[TripReconciliationResponse] = Field(default_factory=list)
