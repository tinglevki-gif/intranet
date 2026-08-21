from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field

NEWS_CATEGORIES = [
    "Allgemein",
    "IT-Sicherheit",
    "HR-Update",
    "Event",
    "Produktion & Technik",
    "Wichtig"
]

class NewsPostBase(BaseModel):
    title: str = Field(..., description="Titel des Beitrags", min_length=2)
    summary: Optional[str] = Field("", description="Kurzbeschreibung / Excerpt")
    content: str = Field(..., description="Hauptinhalt mit Markdown-Unterstützung", min_length=2)
    category: str = Field("Allgemein", description="Kategorie z. B. Allgemein, IT-Sicherheit, HR-Update, Event, Wichtig")
    is_pinned: bool = Field(False, description="Wichtig / Oben anheften")
    cover_image: Optional[str] = Field(None, description="URL oder Pfad des Titelbildes")

class NewsPostCreate(BaseModel):
    title: Optional[str] = None
    summary: Optional[str] = ""
    content: Optional[str] = None
    category: Optional[str] = "Allgemein"
    is_pinned: Optional[bool] = False
    cover_image: Optional[str] = None

    # German aliases support
    titel: Optional[str] = None
    kurzbeschreibung: Optional[str] = None
    inhalt: Optional[str] = None
    kategorie: Optional[str] = None
    ist_wichtig: Optional[bool] = None
    titelbild_url: Optional[str] = None

    def get_resolved_values(self):
        resolved_title = (self.title or self.titel or "").strip()
        resolved_content = (self.content or self.inhalt or "").strip()
        resolved_summary = (self.summary if self.summary is not None else self.kurzbeschreibung) or ""
        resolved_category = self.category or self.kategorie or "Allgemein"
        resolved_pinned = self.is_pinned if self.is_pinned is not None else (self.ist_wichtig if self.ist_wichtig is not None else False)
        resolved_cover = self.cover_image or self.titelbild_url
        
        # If summary is empty, generate from first 160 characters of content
        if not resolved_summary.strip() and resolved_content:
            clean_text = resolved_content.replace("#", "").replace("*", "").replace("\n", " ").strip()
            resolved_summary = clean_text[:160] + ("..." if len(clean_text) > 160 else "")

        return {
            "title": resolved_title,
            "summary": resolved_summary,
            "content": resolved_content,
            "category": resolved_category,
            "is_pinned": bool(resolved_pinned),
            "cover_image": resolved_cover
        }

class NewsPostUpdate(BaseModel):
    title: Optional[str] = None
    summary: Optional[str] = None
    content: Optional[str] = None
    category: Optional[str] = None
    is_pinned: Optional[bool] = None
    cover_image: Optional[str] = None

    # German aliases
    titel: Optional[str] = None
    kurzbeschreibung: Optional[str] = None
    inhalt: Optional[str] = None
    kategorie: Optional[str] = None
    ist_wichtig: Optional[bool] = None
    titelbild_url: Optional[str] = None

class NewsPostResponse(BaseModel):
    id: int
    title: str
    summary: str
    content: str
    category: str
    is_pinned: bool
    cover_image: Optional[str] = None
    author_id: Optional[int] = None
    author_name: str
    author_avatar: Optional[str] = None
    author_department: Optional[str] = None
    views_count: int = 0
    read_time_minutes: int = 1
    created_at: datetime
    updated_at: Optional[datetime] = None

    # German field properties for schema compatibility
    @property
    def titel(self) -> str:
        return self.title

    @property
    def inhalt(self) -> str:
        return self.content

    @property
    def kurzbeschreibung(self) -> str:
        return self.summary

    @property
    def kategorie(self) -> str:
        return self.category

    @property
    def ist_wichtig(self) -> bool:
        return self.is_pinned

    @property
    def titelbild_url(self) -> Optional[str]:
        return self.cover_image

    @property
    def autor_id(self) -> Optional[int]:
        return self.author_id

    @property
    def autor_name(self) -> str:
        return self.author_name

    @property
    def erstellt_am(self) -> datetime:
        return self.created_at

    @property
    def aktualisiert_am(self) -> Optional[datetime]:
        return self.updated_at

    class Config:
        from_attributes = True

class NewsListResponse(BaseModel):
    total: int
    categories: List[str]
    items: List[NewsPostResponse]
