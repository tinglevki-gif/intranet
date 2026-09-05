import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, Boolean, Float, DateTime, Enum, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.core.database import Base

class FleetSecurityEventType(str, enum.Enum):
    FACTORY_SPEED_VIOLATION = "FACTORY_SPEED_VIOLATION" # Überhöhte Geschwindigkeit auf dem Werksgelände (> 20 km/h)
    OFF_HOURS_MOVEMENT = "OFF_HOURS_MOVEMENT"           # Unbefugte Bewegung / Fahrt während der Ruhezeiten

class FleetSecurityEvent(Base):
    """
    Audit-Log für sicherheitsrelevante Flottenereignisse:
    - Geschwindigkeitsüberschreitungen auf dem Werksgelände (Arbeitsschutz / UVV)
    - Unbefugte Fahrzeugbewegungen außerhalb der Betriebszeiten (Werksschutz & Diebstahlprävention)
    """
    __tablename__ = "fleet_security_events"

    id = Column(Integer, primary_key=True, index=True)
    event_type = Column(Enum(FleetSecurityEventType), nullable=False, index=True)
    vehicle_id = Column(String(100), nullable=False, index=True)
    plate = Column(String(50), nullable=False, index=True)
    
    # Telemetriedaten zum Zeitpunkt des Vorfalls
    speed = Column(Float, nullable=False, default=0.0)
    speed_limit = Column(Float, nullable=False, default=20.0) # Geltendes Tempolimit (z. B. 20.0 km/h im Werk oder 5.0 km/h Ruhezeit)
    location = Column(String(500), nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    distance_moved_meters = Column(Float, nullable=True, default=0.0) # Bei Off-Hours Positionsverschiebung
    
    # Referenz zum Geofence (z. B. Werk Altlandsberg)
    geofence_id = Column(Integer, ForeignKey("geofences.id", ondelete="SET NULL"), nullable=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    
    # Zusätzliche Metadaten & Audit-Details
    details = Column(JSON, nullable=True)
    
    # Quittierung & Bearbeitung durch Werksschutz / Fuhrparkleitung
    is_acknowledged = Column(Boolean, default=False, nullable=False, index=True)
    acknowledged_at = Column(DateTime, nullable=True)
    acknowledged_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    acknowledgement_note = Column(Text, nullable=True)
    
    # Ausgelöste Alarmierungs-Aktionen (z. B. "EMAIL_SENT", "WEBHOOK_TRIGGERED", "LOGGED_ONLY")
    action_taken = Column(String(255), nullable=True, default="LOGGED")

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    geofence = relationship("Geofence", foreign_keys=[geofence_id])
    acknowledged_by = relationship("User", foreign_keys=[acknowledged_by_id])

class FleetSecuritySetting(Base):
    """
    Konfiguration für Sicherheitsregeln, Ruhezeiten und automatische Alarmierungs-Kanäle.
    """
    __tablename__ = "fleet_security_settings"

    id = Column(Integer, primary_key=True, index=True)
    max_yard_speed = Column(Float, default=20.0, nullable=False) # Höchstgeschwindigkeit Werkshof in km/h
    quiet_hours_start = Column(String(10), default="20:00", nullable=False) # Start Ruhezeit Mo-Fr (HH:MM)
    quiet_hours_end = Column(String(10), default="05:00", nullable=False)   # Ende Ruhezeit Mo-Fr (HH:MM)
    weekend_quiet_all_day = Column(Boolean, default=True, nullable=False)   # Sa/So ganztägig als Ruhezeit überwachen
    off_hours_speed_threshold = Column(Float, default=5.0, nullable=False)  # Schwellenwert Geschwindigkeit während Ruhezeit in km/h
    off_hours_distance_threshold_meters = Column(Float, default=100.0, nullable=False) # Schwellenwert Positionswechsel in Metern
    
    # Benachrichtigungskanäle
    alert_email = Column(String(255), nullable=True, default="werksschutz@tinglev-elementfabrik.de, it-leitung@tinglev-elementfabrik.de")
    webhook_url = Column(String(500), nullable=True) # MS Teams / Slack Incoming Webhook
    
    # Cooldown gegen Alert-Flooding (in Minuten)
    cooldown_minutes = Column(Integer, default=15, nullable=False)
    
    is_active = Column(Boolean, default=True, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
