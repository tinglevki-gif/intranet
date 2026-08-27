from datetime import datetime, date
from typing import Optional, List, Any, Dict
from pydantic import BaseModel, Field

class DishItem(BaseModel):
    titel: str = ""
    beschreibung: Optional[str] = ""
    preis: str = ""
    kalorien: Optional[str] = None
    is_vegan: bool = False
    is_vegetarian: bool = False

class DessertItem(BaseModel):
    titel: str = ""
    preis: Optional[str] = None

class DailyMenu(BaseModel):
    tag: str  # e.g. "Montag"
    datum: Optional[str] = None  # e.g. "2026-08-24"
    gericht_haupt: DishItem = Field(default_factory=DishItem)
    gericht_vegetarisch_vegan: DishItem = Field(default_factory=DishItem)
    dessert_beilage: Optional[DessertItem] = Field(default_factory=DessertItem)
    allergene_zusatzstoffe: Optional[List[str]] = []

class WeeklyMenuBase(BaseModel):
    calendar_week: int
    year: int
    valid_from: date
    valid_to: date
    days_data: List[DailyMenu]
    pdf_url: Optional[str] = None
    is_published: bool = True

class WeeklyMenuCreate(WeeklyMenuBase):
    pass

class WeeklyMenuUpdate(BaseModel):
    calendar_week: Optional[int] = None
    year: Optional[int] = None
    valid_from: Optional[date] = None
    valid_to: Optional[date] = None
    days_data: Optional[List[DailyMenu]] = None
    pdf_url: Optional[str] = None
    is_published: Optional[bool] = None

class WeeklyMenuResponse(WeeklyMenuBase):
    id: int
    erstellt_von_id: Optional[int] = None
    erstellt_von_name: Optional[str] = None
    aktualisiert_am: datetime
    created_at: datetime

    class Config:
        from_attributes = True

class WeeklyMenuListResponse(BaseModel):
    total: int
    items: List[WeeklyMenuResponse]
