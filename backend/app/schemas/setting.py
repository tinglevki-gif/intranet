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

class DashboardConfigResponse(BaseModel):
    default_mode: str = "standard"  # 'standard' | 'minimal'
    greeting_style: str = "compact"  # 'compact' | 'minimal_text' | 'hidden'
    custom_motto: str = "TINGLEV ELEMENTFABRIK • DIGITALER ARBEITSPLATZ"
    show_search_bar: bool = True
    show_quick_modules: bool = True
    quick_modules_style: str = "pills"  # 'pills' | 'compact_cards'
    show_kpi_metrics: bool = True
    kpi_metrics_style: str = "inline_badges"  # 'inline_badges' | 'compact_cards' | 'hidden'
    show_announcements: bool = True
    announcements_limit: int = 3
    show_quick_tools: bool = True
    show_events: bool = True
    events_limit: int = 3
    layout_density: str = "compact"  # 'compact' | 'ultra_minimal'

class DashboardConfigUpdate(BaseModel):
    default_mode: Optional[str] = "standard"
    greeting_style: Optional[str] = "compact"
    custom_motto: Optional[str] = "TINGLEV ELEMENTFABRIK • DIGITALER ARBEITSPLATZ"
    show_search_bar: Optional[bool] = True
    show_quick_modules: Optional[bool] = True
    quick_modules_style: Optional[str] = "pills"
    show_kpi_metrics: Optional[bool] = True
    kpi_metrics_style: Optional[str] = "inline_badges"
    show_announcements: Optional[bool] = True
    announcements_limit: Optional[int] = 3
    show_quick_tools: Optional[bool] = True
    show_events: Optional[bool] = True
    events_limit: Optional[int] = 3
    layout_density: Optional[str] = "compact"

