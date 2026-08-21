import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

class AnnouncementCategory(str, enum.Enum):
    ALLGEMEIN = "Allgemein"
    IT_SICHERHEIT = "IT-Sicherheit"
    HR_UPDATE = "HR-Update"
    EVENT = "Event"
    PRODUKTION_TECHNIK = "Produktion & Technik"
    WICHTIG = "Wichtig"
    
    # Backwards compatibility
    COMPANY = "COMPANY"
    HR = "HR"
    TECH = "TECH"
    SOCIAL = "SOCIAL"

class Announcement(Base):
    __tablename__ = "announcements"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    summary = Column(Text, nullable=False, default="")
    content = Column(Text, nullable=False)
    category = Column(String, default="Allgemein", nullable=False)
    is_pinned = Column(Boolean, default=False, nullable=False)
    cover_image = Column(String, nullable=True)
    author_name = Column(String, default="Unternehmenskommunikation", nullable=False)
    author_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    views_count = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    author = relationship("User", foreign_keys=[author_id], lazy="joined")

# Alias for German/Domain specific nomenclature
NewsPost = Announcement
