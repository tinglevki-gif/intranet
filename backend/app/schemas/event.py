from datetime import datetime
from typing import Optional, Union, Any
from pydantic import BaseModel
from app.models.event import EventCategory

class EventBase(BaseModel):
    title: str
    description: Optional[str] = None
    start_time: datetime
    end_time: datetime
    all_day: bool = False
    location: Optional[str] = None
    category: Union[EventCategory, str] = EventCategory.MEETING
    department: Optional[str] = None

class EventCreate(EventBase):
    pass

class EventUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    all_day: Optional[bool] = None
    location: Optional[str] = None
    category: Optional[Union[EventCategory, str]] = None
    department: Optional[str] = None

class EventResponse(EventBase):
    id: Union[int, str]
    created_by_id: Optional[int] = None
    author_name: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    # External Outlook / iCal Feed metadata
    is_external: bool = False
    source_id: Optional[int] = None
    source_name: Optional[str] = None
    source_color: Optional[str] = None

    class Config:
        from_attributes = True
