from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, JSON
from sqlalchemy.orm import relationship
from app.core.database import Base

class Role(Base):
    __tablename__ = "roles"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, index=True)               # e.g. "SuperAdmin", "Vertriebsleiter"
    slug = Column(String, unique=True, nullable=False, index=True)  # e.g. "ADMIN", "SALES_LEAD"
    description = Column(Text, nullable=True)
    is_system_role = Column(Boolean, default=False, nullable=False) # Protected from deletion if True
    
    # Permissions dictionary mapping module keys to access levels:
    # {"kantine": "read_write", "gps": "read", "vertrieb": "admin", ...}
    permissions = Column(JSON, nullable=False, default=dict)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    users = relationship("User", back_populates="custom_role", foreign_keys="User.custom_role_id")
