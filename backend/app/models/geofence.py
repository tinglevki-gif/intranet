import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, Boolean, Float, DateTime, Enum, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

class GeofenceType(str, enum.Enum):
    FACTORY = "FACTORY"                     # Eigenes Werk / Produktion (z. B. Werk Altlandsberg)
    CONSTRUCTION_SITE = "CONSTRUCTION_SITE" # Großbaustelle / Kunden-Abladestelle
    SUPPLIER = "SUPPLIER"                   # Lieferant / Kieswerk / Zementwerk
    PARKING = "PARKING"                     # Parkplatz / Rasthof / Werkstatt

class GeofenceEventType(str, enum.Enum):
    ENTER = "ENTER"                         # Fahrzeug ist in Geofence-Zone eingefahren
    EXIT = "EXIT"                           # Fahrzeug hat Geofence-Zone verlassen

class Geofence(Base):
    """
    Geofence-Zonen zur automatischen Standzeit- und Ankunftserfassung.
    """
    __tablename__ = "geofences"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False, index=True)
    type = Column(Enum(GeofenceType), default=GeofenceType.FACTORY, nullable=False, index=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    radius_meters = Column(Integer, default=500, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False, index=True)
    description = Column(String(500), nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    events = relationship("VehicleGeofenceEvent", back_populates="geofence", cascade="all, delete-orphan")
    stays = relationship("VehicleStay", back_populates="geofence", cascade="all, delete-orphan")

class VehicleGeofenceEvent(Base):
    """
    Audit-Log für Betreten (ENTER) und Verlassen (EXIT) von Geofence-Zonen.
    """
    __tablename__ = "vehicle_geofence_events"

    id = Column(Integer, primary_key=True, index=True)
    vehicle_id = Column(String(100), nullable=False, index=True)
    plate = Column(String(50), nullable=False, index=True)
    geofence_id = Column(Integer, ForeignKey("geofences.id", ondelete="CASCADE"), nullable=False, index=True)
    event_type = Column(Enum(GeofenceEventType), nullable=False, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    speed = Column(Float, nullable=True, default=0.0)
    distance_meters = Column(Float, nullable=True)

    # Relationships
    geofence = relationship("Geofence", back_populates="events")

class VehicleStay(Base):
    """
    Protokolliert Aufenthalte, Lade- und Entladezeiten sowie Gesamtdauer vor Ort.
    """
    __tablename__ = "vehicle_stays"

    id = Column(Integer, primary_key=True, index=True)
    vehicle_id = Column(String(100), nullable=False, index=True)
    plate = Column(String(50), nullable=False, index=True)
    geofence_id = Column(Integer, ForeignKey("geofences.id", ondelete="CASCADE"), nullable=False, index=True)
    enter_time = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    exit_time = Column(DateTime, nullable=True, index=True)
    duration_minutes = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    geofence = relationship("Geofence", back_populates="stays")
