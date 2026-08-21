from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field

class SystemSettingResponse(BaseModel):
    id: int
    key: str
    value: str
    default_value: str
    label: str
    category: str
    description: Optional[str] = None
    is_public: bool
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class SystemSettingUpdate(BaseModel):
    value: str = Field(..., description="Neuer Konfigurationswert / URL")

class PublicSettingResponse(BaseModel):
    key: str
    value: str
    label: str
