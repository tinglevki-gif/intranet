import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, Enum, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

class EventCategory(str, enum.Enum):
    MEETING = "MEETING"          # Projektmeetings, Sprint Reviews
    HOLIDAY = "HOLIDAY"          # Gesetzliche Feiertage, Brückentage
    TRAINING = "TRAINING"        # Workshops, Cybersecurity, Webinare
    HR_EVENT = "HR_EVENT"        # Sommerfeste, Teambuilding, Antragsfristen
    TOWNHALL = "TOWNHALL"        # All-Hands, Geschäftsberichte
    COMPANY = "COMPANY"          # Globale Firmen-Milestones

class Event(Base):
    __tablename__ = "calendar_events"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime, nullable=False)
    all_day = Column(Boolean, default=False, nullable=False)
    location = Column(String, nullable=True)
    category = Column(Enum(EventCategory), default=EventCategory.MEETING, nullable=False)
    department = Column(String, nullable=True)
    
    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_by = relationship("User", foreign_keys=[created_by_id])
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
