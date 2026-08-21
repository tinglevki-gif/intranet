from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field

class LanguageResponse(BaseModel):
    id: int
    code: str
    name: str
    native_name: str
    flag: str
    locale: str
    is_active: bool
    is_default: bool
    order: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class LanguageUpdate(BaseModel):
    is_active: Optional[bool] = Field(None, description="Aktivierungsstatus der Sprache")
    is_default: Optional[bool] = Field(None, description="Als Standardsprache festlegen")
    order: Optional[int] = Field(None, description="Sortierreihenfolge")

class ActiveLanguagesResponse(BaseModel):
    default_language: str
    total_active: int
    languages: List[LanguageResponse]
