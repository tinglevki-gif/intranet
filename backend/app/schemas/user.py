from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, EmailStr
from app.models.user import RoleEnum

class UserBase(BaseModel):
    email: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    full_name: str
    department: str = "General"
    position: str = "Colaborador"
    avatar_url: Optional[str] = None
    phone: Optional[str] = None
    mobile: Optional[str] = None
    location: str = "Tinglev Headquarter"
    role: RoleEnum = RoleEnum.EMPLOYEE
    custom_role_id: Optional[int] = None
    supervisor_id: Optional[int] = None
    allowed_modules: Optional[List[str]] = None
    is_active: bool = True

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    full_name: Optional[str] = None
    email: Optional[str] = None
    department: Optional[str] = None
    position: Optional[str] = None
    avatar_url: Optional[str] = None
    phone: Optional[str] = None
    mobile: Optional[str] = None
    location: Optional[str] = None
    role: Optional[RoleEnum] = None
    custom_role_id: Optional[int] = None
    supervisor_id: Optional[int] = None
    allowed_modules: Optional[List[str]] = None
    is_active: Optional[bool] = None
    password: Optional[str] = None

class UserResponse(UserBase):
    id: int
    custom_role_name: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class UserAdminResponse(UserResponse):
    supervisor_name: Optional[str] = None
    subordinates_count: int = 0

class UserListResponse(BaseModel):
    total: int
    items: List[UserAdminResponse]

class UserDirectoryResponse(UserBase):
    id: int
    extension: Optional[str] = None
    supervisor_name: Optional[str] = None

    class Config:
        from_attributes = True

class UserLogin(BaseModel):
    email: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

# Permissions Schemas
class ModuleDefinition(BaseModel):
    key: str
    label: str
    category: str
    icon: str
    description: str

class UserPermissionsResponse(BaseModel):
    user_id: int
    full_name: str
    email: str
    role: RoleEnum
    is_admin: bool
    allowed_modules: List[str]
    available_modules: List[ModuleDefinition]

class UserPermissionsUpdate(BaseModel):
    modules: List[str]

# Recursive OrgChart Tree Schema
class OrgChartNodeResponse(BaseModel):
    id: int
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    full_name: str
    position: str
    department: str
    email: str
    phone: Optional[str] = None
    mobile: Optional[str] = None
    avatar_url: Optional[str] = None
    location: str
    role: RoleEnum
    supervisor_id: Optional[int] = None
    children: List['OrgChartNodeResponse'] = []

    class Config:
        from_attributes = True
