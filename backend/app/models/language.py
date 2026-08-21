from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime
from app.core.database import Base

class LanguageConfig(Base):
    __tablename__ = "language_configs"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(10), unique=True, index=True, nullable=False) # e.g. 'de', 'en', 'es', 'pl', 'tr', 'da'
    name = Column(String(100), nullable=False)                         # e.g. "Deutsch", "English", "Español"
    native_name = Column(String(100), nullable=False)                  # e.g. "Deutsch", "English", "Español"
    flag = Column(String(10), nullable=False)                          # e.g. "🇩🇪", "🇬🇧", "🇪🇸"
    locale = Column(String(20), default="de-DE", nullable=False)      # e.g. "de-DE", "en-US", "es-ES"
    is_active = Column(Boolean, default=True, nullable=False)
    is_default = Column(Boolean, default=False, nullable=False)
    order = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
