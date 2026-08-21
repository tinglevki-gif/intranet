from datetime import datetime
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field

class RoleBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    slug: str = Field(..., min_length=2, max_length=60)
    description: Optional[str] = None
    permissions: Dict[str, str] = Field(default_factory=dict)

class RoleCreate(RoleBase):
    pass

class RoleUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    permissions: Optional[Dict[str, str]] = None

class RoleResponse(RoleBase):
    id: int
    is_system_role: bool
    users_count: int = 0
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class PermissionLevelOption(BaseModel):
    key: str           # "none", "read", "read_write", "admin"
    label: str         # "Kein Zugriff", "Nur Lesen", "Lesen & Bearbeiten", "Vollzugriff"
    description: str

class PermissionModuleItem(BaseModel):
    key: str           # e.g. "kantine", "abwicklung", "admin-users"
    label: str         # "Kantine & Speiseplan"
    category: str      # "Hauptbereich", "Arbeitsbereich", "Administration", "Personal & HR", "IT & Systeme"
    icon: str          # "UtensilsCrossed", "ShieldCheck"
    description: str
    default_level: str = "read"

class PermissionsCatalogResponse(BaseModel):
    levels: List[PermissionLevelOption]
    modules: List[PermissionModuleItem]
