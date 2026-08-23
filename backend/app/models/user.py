import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum, ForeignKey, JSON
from sqlalchemy.orm import relationship, backref
from app.core.database import Base

class RoleEnum(str, enum.Enum):
    ADMIN = "ADMIN"                         # SuperAdmin (Vollzugriff)
    IT_ADMIN = "IT_ADMIN"                   # IT & SuperAdmin
    HR_MANAGER = "HR_MANAGER"               # HR-Manager / Personal
    MANAGEMENT = "MANAGEMENT"               # Geschäftsführung
    BUSINESS_DEV = "BUSINESS_DEV"           # Geschäftsentwicklung
    RECEPTION = "RECEPTION"                 # Rezeption & Empfang
    SALES = "SALES"                         # Vertriebsabteilung
    CONTROLLING_QS = "CONTROLLING_QS"       # Kontrolle & QS
    TECHNIK = "TECHNIK"                     # Technik & Statik
    ACCOUNTING = "ACCOUNTING"               # Buchhaltung & Finanzen
    PRODUKTION = "PRODUKTION"               # Produktion & Planung
    ABWICKLUNG = "ABWICKLUNG"               # Auftragsabwicklung & Disposition
    EMPLOYEE = "EMPLOYEE"                   # Mitarbeiter (Standard)

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    first_name = Column(String, nullable=True)
    last_name = Column(String, nullable=True)
    full_name = Column(String, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, default="EMPLOYEE", nullable=False)
    department = Column(String, default="General", nullable=False)
    position = Column(String, default="Colaborador", nullable=False)
    avatar_url = Column(String, nullable=True)
    phone = Column(String, nullable=True)        # Festnetz / Durchwahl (z. B. +49 89 1234-100)
    mobile = Column(String, nullable=True)       # Mobilnummer (z. B. +49 170 1234567)
    location = Column(String, default="München Headquarter", nullable=False)
    
    # Granular Module Permissions (None = default access based on role, or list of permitted keys)
    allowed_modules = Column(JSON, nullable=True, default=None)

    # Dynamic Role relationship (FK to roles table)
    custom_role_id = Column(Integer, ForeignKey("roles.id"), nullable=True)
    custom_role = relationship("Role", back_populates="users", foreign_keys=[custom_role_id])

    # Self-referencing relationship for organizational hierarchy
    supervisor_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    subordinates = relationship(
        "User",
        backref=backref("supervisor", remote_side=[id]),
        cascade="all"
    )

    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
