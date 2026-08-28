from sqlalchemy import Column, Integer, String, Boolean, JSON
from app.core.database import Base

class MenuItem(Base):
    __tablename__ = "menu_items"

    id = Column(Integer, primary_key=True, index=True)
    key = Column(String, unique=True, index=True, nullable=False)
    label = Column(String, nullable=False)
    path = Column(String, nullable=False)
    icon = Column(String, nullable=False)  # Lucide icon identifier (e.g., 'LayoutDashboard', 'Users', 'Megaphone', 'Settings')
    section = Column(String, default="Hauptbereich", nullable=False) # e.g., 'Hauptbereich', 'Arbeitsbereich', 'Personal & HR', 'IT & Systeme', 'Administration'
    order = Column(Integer, default=0, nullable=False)
    allowed_roles = Column(JSON, default=list, nullable=False) # List of allowed roles, e.g. ["ADMIN", "HR_MANAGER", "EMPLOYEE"]
    badge = Column(String, nullable=True) # e.g. "3 Neu", "Ausstehend", "Hierarchie"
    is_active = Column(Boolean, default=True, nullable=False)
