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

class BrandingResponse(BaseModel):
    company_name: str
    company_suffix: str
    company_tagline: str
    company_logo_url: str

class BrandingUpdate(BaseModel):
    company_name: str = Field(..., min_length=1, max_length=100)
    company_suffix: str = Field(..., max_length=100)
    company_tagline: str = Field(..., max_length=100)
