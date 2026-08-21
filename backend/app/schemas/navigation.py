from typing import List, Optional
from pydantic import BaseModel, Field

class MenuItemBase(BaseModel):
    key: str
    label: str
    path: str
    icon: str
    section: str = "Principal"
    order: int = 0
    allowed_roles: List[str] = ["ADMIN", "HR_MANAGER", "EMPLOYEE"]
    badge: Optional[str] = None
    is_active: bool = True

class MenuItemCreate(MenuItemBase):
    pass

class MenuItemUpdate(BaseModel):
    label: Optional[str] = None
    icon: Optional[str] = None
    section: Optional[str] = None
    order: Optional[int] = None
    badge: Optional[str] = None
    is_active: Optional[bool] = None
    allowed_roles: Optional[List[str]] = None

class MenuItemResponse(MenuItemBase):
    id: int

    class Config:
        from_attributes = True

class MenuReorderItem(BaseModel):
    id: int
    order: int
    section: Optional[str] = None

class MenuReorderRequest(BaseModel):
    items: List[MenuReorderItem]

class MenuItemToggleActiveRequest(BaseModel):
    is_active: bool

class NavigationSection(BaseModel):
    section: str
    items: List[MenuItemResponse]

class NavigationResponse(BaseModel):
    sections: List[NavigationSection]
    user_role: str
