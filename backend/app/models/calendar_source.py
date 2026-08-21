from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime
from app.core.database import Base

class ExternalCalendarSource(Base):
    __tablename__ = "calendar_external_sources"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    ics_url = Column(Text, nullable=False)
    farbe = Column(String, default="#0078D4", nullable=False)  # Microsoft 365 / Outlook Blue default
    ist_aktiv = Column(Boolean, default=True, nullable=False, index=True)
    abteilung = Column(String, nullable=True)
    
    letzte_synchronisation = Column(DateTime, nullable=True)
    letzter_status = Column(String, default="NEU", nullable=True)  # OK, ERROR, NEU
    anzahl_termine = Column(Integer, default=0, nullable=False)
    
    erstellt_am = Column(DateTime, default=datetime.utcnow, nullable=False)
    aktualisiert_am = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
