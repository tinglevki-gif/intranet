from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel
from app.models.announcement import AnnouncementCategory

class StatCard(BaseModel):
    id: str
    title: str
    value: str
    change: Optional[str] = None
    change_type: Optional[str] = "neutral" # "positive", "negative", "neutral"
    icon: str
    description: Optional[str] = None

class QuickTool(BaseModel):
    id: str
    title: str
    category: str
    description: str
    icon: str
    url: str
    color: str
    badge: Optional[str] = None

class CompanyEvent(BaseModel):
    id: str
    title: str
    date: str
    time: Optional[str] = None
    type: str # "townhall", "birthday", "holiday", "meeting"
    location: Optional[str] = None
    attendees_count: Optional[int] = None

class AnnouncementBase(BaseModel):
    title: str
    summary: str
    content: str
    category: str = "Allgemein"
    is_pinned: bool = False
    cover_image: Optional[str] = None
    author_name: str = "Geschäftsleitung"
    author_id: Optional[int] = None
    views_count: Optional[int] = 0

class AnnouncementCreate(AnnouncementBase):
    pass

class AnnouncementResponse(AnnouncementBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class DashboardData(BaseModel):
    stats: List[StatCard]
    announcements: List[AnnouncementResponse]
    quick_tools: List[QuickTool]
    upcoming_events: List[CompanyEvent]
    system_status: str
