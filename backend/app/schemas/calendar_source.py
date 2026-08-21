from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field

class CalendarSourceCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=150)
    ics_url: str = Field(..., min_length=5)
    farbe: str = Field("#0078D4", max_length=30)
    ist_aktiv: bool = True
    abteilung: Optional[str] = None

class CalendarSourceUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=150)
    ics_url: Optional[str] = Field(None, min_length=5)
    farbe: Optional[str] = None
    ist_aktiv: Optional[bool] = None
    abteilung: Optional[str] = None

class CalendarSourceResponse(BaseModel):
    id: int
    name: str
    ics_url: str
    farbe: str
    ist_aktiv: bool
    abteilung: Optional[str] = None
    letzte_synchronisation: Optional[datetime] = None
    letzter_status: Optional[str] = None
    anzahl_termine: int = 0
    erstellt_am: datetime

    class Config:
        from_attributes = True
