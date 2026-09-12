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

    # Delegated Custom Privileges (e.g. {"manage_canteen": true})
    custom_permissions = Column(JSON, nullable=True, default=dict)

    # Dynamic Role relationship (FK to roles table)
    custom_role_id = Column(Integer, ForeignKey("roles.id"), nullable=True)
    custom_role = relationship("Role", back_populates="users", foreign_keys=[custom_role_id])

    # Self-referencing relationship for organizational hierarchy (Single & Multiple Supervisors)
    supervisor_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    supervisor_ids = Column(JSON, nullable=True, default=list)

    subordinates = relationship(
        "User",
        backref=backref("supervisor", remote_side=[id])
    )

    # Multi-Department Support (JSON list of department strings)
    departments = Column(JSON, nullable=True, default=list)

    def get_departments(self) -> list[str]:
        """Returns a unique list of all departments assigned to this user."""
        res = []
        if self.departments and isinstance(self.departments, list):
            res.extend([str(x).strip() for x in self.departments if x])
        if self.department and str(self.department).strip() not in res:
            res.insert(0, str(self.department).strip())
        return res if res else ["General"]

    def get_supervisor_ids(self) -> list[int]:
        """Returns a unique list of all supervisor IDs assigned to this user."""
        res = []
        if self.supervisor_ids and isinstance(self.supervisor_ids, list):
            res.extend([int(x) for x in self.supervisor_ids if x is not None])
        if self.supervisor_id is not None and self.supervisor_id not in res:
            res.insert(0, int(self.supervisor_id))
        return res

    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    @property
    def can_manage_canteen(self) -> bool:
        """Returns true if user is SuperAdmin or has explicit manage_canteen permission."""
        role_str = self.role.value if hasattr(self.role, 'value') else str(self.role)
        if role_str == "ADMIN":
            return True
        if self.custom_permissions and isinstance(self.custom_permissions, dict):
            if self.custom_permissions.get("manage_canteen") is True:
                return True
        if self.allowed_modules and isinstance(self.allowed_modules, list):
            if "manage_canteen" in self.allowed_modules or "canteen_admin" in self.allowed_modules:
                return True
        return False

    @can_manage_canteen.setter
    def can_manage_canteen(self, value: bool):
        perms = dict(self.custom_permissions or {})
        perms["manage_canteen"] = bool(value)
        self.custom_permissions = perms


