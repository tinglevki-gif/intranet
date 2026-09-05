import datetime
from sqlalchemy import Column, Integer, String, Boolean, Float, DateTime, Date, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.core.database import Base

class VehicleMeta(Base):
    """
    Speichert den aktuellen Telemetrie-Status und Gesamtkilometerstand der Flotte
    für vorausschauende Wartungen.
    """
    __tablename__ = "vehicles_meta"

    id = Column(Integer, primary_key=True, index=True)
    vehicle_id = Column(String(100), unique=True, index=True, nullable=False)
    plate = Column(String(50), index=True, nullable=False)
    brand = Column(String(100), nullable=True)
    current_mileage = Column(Integer, default=0, nullable=False)
    last_telemetry_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow, nullable=False)

    intervals = relationship("MaintenanceInterval", back_populates="vehicle_meta", foreign_keys="MaintenanceInterval.vehicle_id", primaryjoin="VehicleMeta.vehicle_id == foreign(MaintenanceInterval.vehicle_id)")


class MaintenanceInterval(Base):
    """
    Definiert Wartungsintervalle (TÜV, UVV, Ölwechsel, Reifenservice) pro Fahrzeug.
    """
    __tablename__ = "maintenance_intervals"

    id = Column(Integer, primary_key=True, index=True)
    vehicle_id = Column(String(100), index=True, nullable=False)
    plate = Column(String(50), index=True, nullable=False)
    
    # ENUM / String: 'TUEV_SP', 'UVV', 'OIL_SERVICE', 'TIRES', 'GENERAL_INSPECTION', 'BRAKES'
    service_type = Column(String(50), nullable=False, index=True)
    
    interval_km = Column(Integer, default=30000, nullable=False)
    last_service_mileage = Column(Integer, default=0, nullable=False)
    last_service_date = Column(Date, nullable=True)
    
    next_due_mileage = Column(Integer, nullable=False)
    next_due_date = Column(Date, nullable=True)
    
    warning_threshold_km = Column(Integer, default=1500, nullable=False)
    
    # Status: 'OK', 'DUE_SOON', 'OVERDUE'
    status = Column(String(20), default="OK", index=True, nullable=False)
    
    notes = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow, nullable=False)

    vehicle_meta = relationship("VehicleMeta", back_populates="intervals", foreign_keys=[vehicle_id], primaryjoin="VehicleMeta.vehicle_id == foreign(MaintenanceInterval.vehicle_id)")
    logs = relationship("MaintenanceLog", back_populates="interval", cascade="all, delete-orphan")


class MaintenanceLog(Base):
    """
    Werkstatt-Protokoll und Quittierungshistorie durchgeführter Wartungen.
    """
    __tablename__ = "maintenance_logs"

    id = Column(Integer, primary_key=True, index=True)
    interval_id = Column(Integer, ForeignKey("maintenance_intervals.id", ondelete="SET NULL"), nullable=True)
    vehicle_id = Column(String(100), index=True, nullable=False)
    plate = Column(String(50), index=True, nullable=False)
    
    service_type = Column(String(50), nullable=False)
    service_mileage = Column(Integer, nullable=False)
    service_date = Column(Date, default=datetime.date.today, nullable=False)
    
    performed_by = Column(String(100), default="Werkstatt Altlandsberg", nullable=False)
    workshop_name = Column(String(200), default="Tinglev Werkstatt Altlandsberg", nullable=False)
    invoice_number = Column(String(100), nullable=True)
    cost_euros = Column(Float, default=0.0, nullable=True)
    
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)

    interval = relationship("MaintenanceInterval", back_populates="logs")
