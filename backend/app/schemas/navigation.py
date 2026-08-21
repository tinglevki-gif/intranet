from typing import List, Optional
from pydantic import BaseModel

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

class MenuItemResponse(MenuItemBase):
    id: int

    class Config:
        from_attributes = True

class NavigationSection(BaseModel):
    section: str
    items: List[MenuItemResponse]

class NavigationResponse(BaseModel):
    sections: List[NavigationSection]
    user_role: str
