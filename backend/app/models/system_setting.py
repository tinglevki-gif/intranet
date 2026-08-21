from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime
from app.core.database import Base

class SystemSetting(Base):
    __tablename__ = "system_settings"

    id = Column(Integer, primary_key=True, index=True)
    key = Column(String(100), unique=True, index=True, nullable=False) # e.g. 'onedrive_vertrieb_url'
    value = Column(Text, nullable=False)
    default_value = Column(Text, nullable=False)
    label = Column(String(200), nullable=False)
    category = Column(String(100), default="general", nullable=False) # e.g. 'integrations', 'modules'
    description = Column(Text, nullable=True)
    is_public = Column(Boolean, default=False, nullable=False) # Accessible by regular authenticated users
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
