from typing import List, Optional, Any, Dict
from pydantic import BaseModel, Field
from app.schemas.canteen import DailyMenu

class TicketAISuggestRequest(BaseModel):
    title: str
    description: str
    category: Optional[str] = None
    kb_context: Optional[str] = None

class TicketAISuggestResponse(BaseModel):
    suggested_category: str = "IT_SUPPORT"
    suggested_priority: str = "MITTEL"
    immediate_steps: List[str] = Field(default_factory=list)
    possible_root_cause: str = ""
    draft_response: str = ""

class CanteenAIGenerateRequest(BaseModel):
    calendar_week: int
    year: int
    theme_or_notes: Optional[str] = None

class CanteenAIGenerateResponse(BaseModel):
    calendar_week: int
    year: int
    days_data: List[DailyMenu] = Field(default_factory=list)
