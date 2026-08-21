from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, model_validator
from app.models.ticket import TicketStatus, TicketPriority, TicketCategory

class TicketCreate(BaseModel):
    titel: str = Field(..., min_length=3, max_length=200)
    beschreibung: str = Field(..., min_length=5)
    kategorie: TicketCategory = TicketCategory.ALLGEMEIN
    prioritaet: TicketPriority = TicketPriority.MITTEL
    loesungs_schlagwoerter: Optional[List[str]] = None

class TicketUpdate(BaseModel):
    titel: Optional[str] = Field(None, min_length=3, max_length=200)
    beschreibung: Optional[str] = Field(None, min_length=5)
    kategorie: Optional[TicketCategory] = None
    prioritaet: Optional[TicketPriority] = None
    loesungs_schlagwoerter: Optional[List[str]] = None

class TicketStatusUpdate(BaseModel):
    status: TicketStatus
    loesung_dokumentation: Optional[str] = None
    loesungs_schlagwoerter: Optional[List[str]] = None

    @model_validator(mode='after')
    def validate_solution_documentation(self):
        if self.status == TicketStatus.GELOEST:
            if not self.loesung_dokumentation or len(self.loesung_dokumentation.strip()) < 5:
                raise ValueError("Beim Status 'GELOEST' ist eine aussagekräftige Lösungsdokumentation (mindestens 5 Zeichen) zwingend erforderlich.")
        return self

class TicketAssignUpdate(BaseModel):
    zugewiesen_an_id: Optional[int] = None

class TicketMessageCreate(BaseModel):
    nachricht: str = Field(..., min_length=1)
    ist_interne_notiz: bool = False

class TicketMessageResponse(BaseModel):
    id: int
    ticket_id: int
    autor_id: int
    autor_name: str
    autor_avatar: Optional[str] = None
    autor_role: Optional[str] = None
    nachricht: str
    ist_interne_notiz: bool
    erstellt_am: datetime

    class Config:
        from_attributes = True

class TicketResponse(BaseModel):
    id: int
    ticket_nr: str
    titel: str
    beschreibung: str
    kategorie: TicketCategory
    prioritaet: TicketPriority
    status: TicketStatus
    ersteller_id: int
    ersteller_name: str
    ersteller_email: str
    ersteller_avatar: Optional[str] = None
    ersteller_department: Optional[str] = None
    zugewiesen_an_id: Optional[int] = None
    zugewiesen_an_name: Optional[str] = None
    zugewiesen_an_avatar: Optional[str] = None
    loesung_dokumentation: Optional[str] = None
    loesungs_schlagwoerter: Optional[List[str]] = []
    erstellt_am: datetime
    aktualisiert_am: datetime
    geloest_am: Optional[datetime] = None
    messages_count: int = 0

    class Config:
        from_attributes = True

class TicketDetailResponse(TicketResponse):
    messages: List[TicketMessageResponse] = []

class TicketListResponse(BaseModel):
    total: int
    items: List[TicketResponse]

class TicketStatsSummary(BaseModel):
    total: int
    offen: int
    in_bearbeitung: int
    wartet_auf_benutzer: int
    geloest: int
    geschlossen: int
    kritisch: int
    nach_kategorie: Dict[str, int]
    nach_prioritaet: Dict[str, int]

# Knowledge Base & Smart-Assist Solution Suggestion Schemas
class KnowledgeBaseItemResponse(BaseModel):
    id: int
    ticket_nr: str
    titel: str
    kategorie: TicketCategory
    prioritaet: TicketPriority
    status: TicketStatus
    problembeschreibung: str
    loesungsschritte: str
    loesungs_schlagwoerter: List[str] = []
    geloest_am: Optional[datetime] = None
    techniker_name: Optional[str] = None
    techniker_avatar: Optional[str] = None
    relevance_score: Optional[float] = None

    class Config:
        from_attributes = True

class KnowledgeBaseSearchResponse(BaseModel):
    total: int
    query: str
    category_filter: Optional[str] = None
    results: List[KnowledgeBaseItemResponse]

class SolutionSuggestionResponse(BaseModel):
    has_suggestions: bool
    suggestions_count: int
    suggestions: List[KnowledgeBaseItemResponse]
