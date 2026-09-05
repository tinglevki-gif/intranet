import enum
from datetime import datetime, date
from sqlalchemy import Column, Integer, String, Text, Boolean, Float, DateTime, Date, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.core.database import Base

class ReconciliationStatus(str, enum.Enum):
    CONFIRMED = "CONFIRMED"     # Berechnet & Bestätigt (Prüfsicher)
    DRAFT = "DRAFT"             # Vorläufig
    BILLED = "BILLED"           # Bereits in Rechnung gestellt
    DISPUTED = "DISPUTED"       # In Klärung / Widerspruch

class TripReconciliation(Base):
    """
    Speichert den Fahrtabgleich und Standgeldnachweis für eine Baustellen-Anlieferung.
    Dient als manipulationssicherer GPS-Beleg gegenüber dem Auftraggeber (§ 412 HGB / VBGL).
    """
    __tablename__ = "trip_reconciliations"

    id = Column(Integer, primary_key=True, index=True)
    report_number = Column(String(100), unique=True, nullable=False, index=True)
    delivery_note_number = Column(String(100), nullable=False, index=True)
    plate = Column(String(50), nullable=False, index=True)
    trip_date = Column(Date, nullable=False, index=True)
    
    # Referenzen zu Geofences
    site_geofence_id = Column(Integer, ForeignKey("geofences.id", ondelete="CASCADE"), nullable=False, index=True)
    factory_geofence_id = Column(Integer, ForeignKey("geofences.id", ondelete="SET NULL"), nullable=True)

    # Zeitpunkte der Fahrt
    factory_departure_time = Column(DateTime, nullable=True)
    site_arrival_time = Column(DateTime, nullable=True)
    site_departure_time = Column(DateTime, nullable=True)

    # Berechnete Standzeiten & Abrechnung
    stay_duration_minutes = Column(Integer, nullable=False, default=0)
    free_unloading_minutes = Column(Integer, nullable=False, default=60)
    billable_delay_minutes = Column(Integer, nullable=False, default=0)
    hourly_demurrage_rate = Column(Float, nullable=False, default=95.0)
    demurrage_total_netto = Column(Float, nullable=False, default=0.0)
    is_demurrage_applicable = Column(Boolean, nullable=False, default=False)
    
    status = Column(String(50), nullable=False, default=ReconciliationStatus.CONFIRMED.value)
    
    # Manipulationssicherer tabellarischer GPS-Audit-Trail als JSON
    audit_trail = Column(JSON, nullable=True)
    compliance_text = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)

    # Ersteller / Disponent
    created_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    site_geofence = relationship("Geofence", foreign_keys=[site_geofence_id])
    factory_geofence = relationship("Geofence", foreign_keys=[factory_geofence_id])
    created_by = relationship("User", foreign_keys=[created_by_id])
