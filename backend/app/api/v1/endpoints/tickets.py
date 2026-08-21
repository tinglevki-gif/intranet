import re
from datetime import datetime
from typing import List, Optional, Tuple
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_, func

from app.core.database import get_db
from app.models.ticket import Ticket, TicketMessage, TicketStatus, TicketPriority, TicketCategory
from app.models.user import User, RoleEnum
from app.schemas.ticket import (
    TicketCreate,
    TicketUpdate,
    TicketStatusUpdate,
    TicketAssignUpdate,
    TicketMessageCreate,
    TicketMessageResponse,
    TicketResponse,
    TicketDetailResponse,
    TicketListResponse,
    TicketStatsSummary,
    KnowledgeBaseItemResponse,
    KnowledgeBaseSearchResponse,
    SolutionSuggestionResponse
)
from app.services.auth_service import get_current_user

router = APIRouter()

# Stopwords for Knowledge Base & Smart-Assist search
STOP_WORDS_SEARCH = {
    "der", "die", "das", "und", "oder", "für", "mit", "von", "bei", "den", "dem", "des",
    "ein", "eine", "einer", "eines", "einem", "einen", "wie", "ist", "sind", "was", "wer",
    "kann", "können", "ich", "du", "er", "sie", "es", "wir", "ihr", "im", "in", "an", "am",
    "auf", "nach", "zu", "zum", "zur", "nicht", "bitte", "habe", "hat", "mein", "meine",
    "the", "and", "or", "for", "with", "from", "at", "in", "on", "to", "is", "are", "how"
}

def tokenize_query(query: str) -> List[str]:
    """Tokenizes text into lowercase keywords, removing stop words."""
    cleaned = re.sub(r'[^\w\s-]', ' ', query.lower())
    words = [w.strip() for w in re.split(r'[\s-]+', cleaned) if len(w.strip()) >= 2]
    meaningful = [w for w in words if w not in STOP_WORDS_SEARCH]
    return meaningful or words

def score_ticket_relevance(ticket: Ticket, query_tokens: List[str], raw_query: str) -> float:
    """Computes relevance score between a search query and a solved ticket."""
    score = 0.0
    raw_lower = raw_query.lower().strip()
    
    titel_lower = (ticket.titel or "").lower()
    beschr_lower = (ticket.beschreibung or "").lower()
    loesung_lower = (ticket.loesung_dokumentation or "").lower()
    tags = [str(t).lower() for t in (ticket.loesungs_schlagwoerter or [])]

    # Exact phrase matching boost
    if raw_lower and len(raw_lower) >= 3:
        if raw_lower in titel_lower:
            score += 10.0
        if raw_lower in loesung_lower:
            score += 8.0
        if any(raw_lower in t for t in tags):
            score += 12.0
        if raw_lower in beschr_lower:
            score += 4.0

    # Token-level scoring
    for token in query_tokens:
        # Tags (weight 5.0)
        for tag in tags:
            if token == tag:
                score += 5.0
            elif token in tag or tag in token:
                score += 3.0

        # Title (weight 3.5)
        if token in titel_lower:
            score += 3.5

        # Solution documentation (weight 2.5)
        if token in loesung_lower:
            score += 2.5

        # Description (weight 1.0)
        if token in beschr_lower:
            score += 1.0

    return round(score, 2)

def is_support_staff(user: User) -> bool:
    """Checks if the user has IT / Support / SuperAdmin permissions for Helpdesk."""
    if user.role in [RoleEnum.ADMIN, RoleEnum.IT_ADMIN]:
        return True
    if user.allowed_modules and "it-helpdesk" in user.allowed_modules:
        return True
    return False

def generate_ticket_number(db: Session) -> str:
    """Generates unique sequential ticket code like TK-2026-001."""
    current_year = datetime.utcnow().year
    prefix = f"TK-{current_year}-"
    
    last_ticket = db.query(Ticket).filter(Ticket.ticket_nr.like(f"{prefix}%")).order_by(Ticket.id.desc()).first()
    if last_ticket and last_ticket.ticket_nr:
        try:
            last_num = int(last_ticket.ticket_nr.split("-")[-1])
            next_num = last_num + 1
        except Exception:
            next_num = db.query(Ticket).count() + 1
    else:
        next_num = 1
        
    return f"{prefix}{next_num:03d}"

def map_message_to_response(msg: TicketMessage) -> TicketMessageResponse:
    autor_name = msg.autor.full_name if msg.autor else "Unbekannt"
    autor_avatar = msg.autor.avatar_url if msg.autor else None
    autor_role = msg.autor.role.value if msg.autor and hasattr(msg.autor.role, 'value') else str(msg.autor.role if msg.autor else "")
    
    return TicketMessageResponse(
        id=msg.id,
        ticket_id=msg.ticket_id,
        autor_id=msg.autor_id,
        autor_name=autor_name,
        autor_avatar=autor_avatar,
        autor_role=autor_role,
        nachricht=msg.nachricht,
        ist_interne_notiz=msg.ist_interne_notiz,
        erstellt_am=msg.erstellt_am
    )

def map_ticket_to_response(t: Ticket, db: Session) -> TicketResponse:
    ersteller_name = t.ersteller.full_name if t.ersteller else "System"
    ersteller_email = t.ersteller.email if t.ersteller else ""
    ersteller_avatar = t.ersteller.avatar_url if t.ersteller else None
    ersteller_department = t.ersteller.department if t.ersteller else None
    
    zugewiesen_an_name = t.zugewiesen_an.full_name if t.zugewiesen_an else None
    zugewiesen_an_avatar = t.zugewiesen_an.avatar_url if t.zugewiesen_an else None
    
    msg_count = db.query(TicketMessage).filter(TicketMessage.ticket_id == t.id).count()

    return TicketResponse(
        id=t.id,
        ticket_nr=t.ticket_nr,
        titel=t.titel,
        beschreibung=t.beschreibung,
        kategorie=t.kategorie,
        prioritaet=t.prioritaet,
        status=t.status,
        ersteller_id=t.ersteller_id,
        ersteller_name=ersteller_name,
        ersteller_email=ersteller_email,
        ersteller_avatar=ersteller_avatar,
        ersteller_department=ersteller_department,
        zugewiesen_an_id=t.zugewiesen_an_id,
        zugewiesen_an_name=zugewiesen_an_name,
        zugewiesen_an_avatar=zugewiesen_an_avatar,
        loesung_dokumentation=t.loesung_dokumentation,
        loesungs_schlagwoerter=t.loesungs_schlagwoerter or [],
        erstellt_am=t.erstellt_am,
        aktualisiert_am=t.aktualisiert_am,
        geloest_am=t.geloest_am,
        messages_count=msg_count
    )

def map_ticket_to_kb_item(t: Ticket, score: Optional[float] = None) -> KnowledgeBaseItemResponse:
    techniker_name = t.zugewiesen_an.full_name if t.zugewiesen_an else (t.ersteller.full_name if t.ersteller else "IT-Support")
    techniker_avatar = t.zugewiesen_an.avatar_url if t.zugewiesen_an else (t.ersteller.avatar_url if t.ersteller else None)

    return KnowledgeBaseItemResponse(
        id=t.id,
        ticket_nr=t.ticket_nr,
        titel=t.titel,
        kategorie=t.kategorie,
        prioritaet=t.prioritaet,
        status=t.status,
        problembeschreibung=t.beschreibung,
        loesungsschritte=t.loesung_dokumentation or "",
        loesungs_schlagwoerter=t.loesungs_schlagwoerter or [],
        geloest_am=t.geloest_am or t.aktualisiert_am,
        techniker_name=techniker_name,
        techniker_avatar=techniker_avatar,
        relevance_score=score
    )

# =========================================================================
# 1. KNOWLEDGE BASE & SMART ASSIST ENDPOINTS
# =========================================================================

@router.get("/knowledge-base/search", response_model=KnowledgeBaseSearchResponse)
def search_knowledge_base(
    q: Optional[str] = None,
    kategorie: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Searches solved tickets and documented solutions (Knowledge Base).
    Accessible to all authenticated employees with weighted relevance scoring.
    """
    base_q = db.query(Ticket).filter(
        Ticket.status.in_([TicketStatus.GELOEST, TicketStatus.GESCHLOSSEN]),
        Ticket.loesung_dokumentation != None,
        Ticket.loesung_dokumentation != ""
    )

    if kategorie and kategorie != "ALL":
        base_q = base_q.filter(Ticket.kategorie == kategorie)

    solved_tickets = base_q.all()

    if not q or not q.strip():
        # Return recent solved tickets ordered by geloest_am
        sorted_tickets = sorted(solved_tickets, key=lambda x: x.geloest_am or x.aktualisiert_am, reverse=True)
        results = [map_ticket_to_kb_item(t, None) for t in sorted_tickets]
        return KnowledgeBaseSearchResponse(
            total=len(results),
            query="",
            category_filter=kategorie,
            results=results
        )

    query_tokens = tokenize_query(q)
    scored_items: List[Tuple[Ticket, float]] = []
    for t in solved_tickets:
        score = score_ticket_relevance(t, query_tokens, q)
        if score > 0.0:
            scored_items.append((t, score))

    # Sort by score descending, then date
    scored_items.sort(key=lambda x: (x[1], x[0].geloest_am or x[0].aktualisiert_am), reverse=True)
    results = [map_ticket_to_kb_item(t, score) for t, score in scored_items]

    return KnowledgeBaseSearchResponse(
        total=len(results),
        query=q,
        category_filter=kategorie,
        results=results
    )

@router.get("/suggest-solutions", response_model=SolutionSuggestionResponse)
def suggest_solutions(
    titel: Optional[str] = None,
    kategorie: Optional[str] = None,
    beschreibung: Optional[str] = None,
    limit: int = Query(4, ge=1, le=10),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Smart Assist: Real-time solution suggestions while user drafts a new ticket to prevent duplicates.
    """
    combined_text = f"{titel or ''} {beschreibung or ''}".strip()
    if not combined_text or len(combined_text) < 3:
        return SolutionSuggestionResponse(has_suggestions=False, suggestions_count=0, suggestions=[])

    base_q = db.query(Ticket).filter(
        Ticket.status.in_([TicketStatus.GELOEST, TicketStatus.GESCHLOSSEN]),
        Ticket.loesung_dokumentation != None,
        Ticket.loesung_dokumentation != ""
    )

    solved_tickets = base_q.all()

    query_tokens = tokenize_query(combined_text)
    scored_items: List[Tuple[Ticket, float]] = []
    for t in solved_tickets:
        score = score_ticket_relevance(t, query_tokens, combined_text)
        # Boost if category matches user's selection
        if kategorie and kategorie != "ALL" and t.kategorie == kategorie:
            score += 3.0
        if score >= 2.0:  # Minimum relevance threshold for smart suggestion
            scored_items.append((t, score))

    scored_items.sort(key=lambda x: x[1], reverse=True)
    top_suggestions = scored_items[:limit]
    results = [map_ticket_to_kb_item(t, score) for t, score in top_suggestions]

    return SolutionSuggestionResponse(
        has_suggestions=len(results) > 0,
        suggestions_count=len(results),
        suggestions=results
    )

# =========================================================================
# 2. STANDARD TICKET CRUD & STATS ENDPOINTS
# =========================================================================

@router.get("/stats/summary", response_model=TicketStatsSummary)
def get_ticket_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Returns aggregated KPI metrics and category/priority distribution for tickets."""
    base_q = db.query(Ticket)
    if not is_support_staff(current_user):
        base_q = base_q.filter(or_(Ticket.ersteller_id == current_user.id, Ticket.zugewiesen_an_id == current_user.id))

    all_tickets = base_q.all()

    total = len(all_tickets)
    offen = sum(1 for t in all_tickets if t.status == TicketStatus.OFFEN)
    in_bearbeitung = sum(1 for t in all_tickets if t.status == TicketStatus.IN_BEARBEITUNG)
    wartet_auf_benutzer = sum(1 for t in all_tickets if t.status == TicketStatus.WARTET_AUF_BENUTZER)
    geloest = sum(1 for t in all_tickets if t.status == TicketStatus.GELOEST)
    geschlossen = sum(1 for t in all_tickets if t.status == TicketStatus.GESCHLOSSEN)
    kritisch = sum(1 for t in all_tickets if t.prioritaet == TicketPriority.KRITISCH and t.status in [TicketStatus.OFFEN, TicketStatus.IN_BEARBEITUNG])

    nach_kategorie = {}
    for cat in TicketCategory:
        nach_kategorie[cat.value] = sum(1 for t in all_tickets if t.kategorie == cat)

    nach_prioritaet = {}
    for prio in TicketPriority:
        nach_prioritaet[prio.value] = sum(1 for t in all_tickets if t.prioritaet == prio)

    return TicketStatsSummary(
        total=total,
        offen=offen,
        in_bearbeitung=in_bearbeitung,
        wartet_auf_benutzer=wartet_auf_benutzer,
        geloest=geloest,
        geschlossen=geschlossen,
        kritisch=kritisch,
        nach_kategorie=nach_kategorie,
        nach_prioritaet=nach_prioritaet
    )

@router.get("", response_model=TicketListResponse)
def list_tickets(
    status: Optional[str] = None,
    prioritaet: Optional[str] = None,
    kategorie: Optional[str] = None,
    zugewiesen_an_id: Optional[int] = None,
    ersteller_id: Optional[int] = None,
    query: Optional[str] = None,
    only_my_tickets: bool = False,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    List all accessible helpdesk tickets with multi-criteria filtering.
    Regular employees see their own created and assigned tickets.
    IT support and SuperAdmins can view and manage all tickets.
    """
    q = db.query(Ticket)

    # Permission filter
    if not is_support_staff(current_user) or only_my_tickets:
        q = q.filter(
            or_(
                Ticket.ersteller_id == current_user.id,
                Ticket.zugewiesen_an_id == current_user.id
            )
        )

    if status and status != "ALL":
        q = q.filter(Ticket.status == status)

    if prioritaet and prioritaet != "ALL":
        q = q.filter(Ticket.prioritaet == prioritaet)

    if kategorie and kategorie != "ALL":
        q = q.filter(Ticket.kategorie == kategorie)

    if zugewiesen_an_id is not None:
        if zugewiesen_an_id == 0:
            q = q.filter(Ticket.zugewiesen_an_id == None)
        else:
            q = q.filter(Ticket.zugewiesen_an_id == zugewiesen_an_id)

    if ersteller_id is not None:
        q = q.filter(Ticket.ersteller_id == ersteller_id)

    if query:
        search = f"%{query.lower().strip()}%"
        q = q.filter(
            or_(
                Ticket.ticket_nr.ilike(search),
                Ticket.titel.ilike(search),
                Ticket.beschreibung.ilike(search),
                Ticket.loesung_dokumentation.ilike(search)
            )
        )

    total = q.count()
    tickets = q.order_by(
        Ticket.status.asc(),
        Ticket.prioritaet.desc(),
        Ticket.erstellt_am.desc()
    ).offset(skip).limit(limit).all()

    items = [map_ticket_to_response(t, db) for t in tickets]
    return TicketListResponse(total=total, items=items)

@router.post("", response_model=TicketResponse, status_code=status.HTTP_201_CREATED)
def create_ticket(
    ticket_in: TicketCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Creates a new helpdesk ticket and adds initial description message."""
    ticket_nr = generate_ticket_number(db)
    
    ticket = Ticket(
        ticket_nr=ticket_nr,
        titel=ticket_in.titel.strip(),
        beschreibung=ticket_in.beschreibung.strip(),
        kategorie=ticket_in.kategorie,
        prioritaet=ticket_in.prioritaet,
        status=TicketStatus.OFFEN,
        ersteller_id=current_user.id,
        zugewiesen_an_id=None,
        loesungs_schlagwoerter=ticket_in.loesungs_schlagwoerter or []
    )
    db.add(ticket)
    db.commit()
    db.refresh(ticket)

    # Automatically add initial message
    initial_msg = TicketMessage(
        ticket_id=ticket.id,
        autor_id=current_user.id,
        nachricht=ticket_in.beschreibung.strip(),
        ist_interne_notiz=False,
        erstellt_am=datetime.utcnow()
    )
    db.add(initial_msg)
    db.commit()

    return map_ticket_to_response(ticket, db)

@router.get("/{ticket_id}", response_model=TicketDetailResponse)
def get_ticket_detail(
    ticket_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Returns full ticket detail including chat history.
    Internal notes are filtered out for regular employees.
    """
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket nicht gefunden")

    # Safety: Regular employees can only view their own created/assigned tickets
    if not is_support_staff(current_user):
        if ticket.ersteller_id != current_user.id and ticket.zugewiesen_an_id != current_user.id:
            raise HTTPException(status_code=403, detail="Keine Berechtigung zum Einsehen dieses Tickets")

    ticket_res = map_ticket_to_response(ticket, db)

    # Fetch messages
    msg_query = db.query(TicketMessage).filter(TicketMessage.ticket_id == ticket.id)
    if not is_support_staff(current_user):
        # Filter internal notes for employees
        msg_query = msg_query.filter(TicketMessage.ist_interne_notiz == False)

    messages = msg_query.order_by(TicketMessage.erstellt_am.asc()).all()
    message_responses = [map_message_to_response(m) for m in messages]

    return TicketDetailResponse(
        **ticket_res.model_dump(),
        messages=message_responses
    )

@router.post("/{ticket_id}/messages", response_model=TicketMessageResponse, status_code=status.HTTP_201_CREATED)
def add_ticket_message(
    ticket_id: int,
    msg_in: TicketMessageCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Adds a message, user reply or internal note to the ticket.
    Internal notes are restricted to support/admin users.
    """
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket nicht gefunden")

    # Permission check
    if not is_support_staff(current_user):
        if ticket.ersteller_id != current_user.id and ticket.zugewiesen_an_id != current_user.id:
            raise HTTPException(status_code=403, detail="Keine Berechtigung zum Kommentieren dieses Tickets")
        if msg_in.ist_interne_notiz:
            raise HTTPException(status_code=403, detail="Nur IT- und Support-Mitarbeiter dürfen interne Notizen erstellen.")

    # Auto transition from WARTET_AUF_BENUTZER to IN_BEARBEITUNG when employee replies
    if ticket.status == TicketStatus.WARTET_AUF_BENUTZER and ticket.ersteller_id == current_user.id:
        ticket.status = TicketStatus.IN_BEARBEITUNG

    msg = TicketMessage(
        ticket_id=ticket.id,
        autor_id=current_user.id,
        nachricht=msg_in.nachricht.strip(),
        ist_interne_notiz=msg_in.ist_interne_notiz,
        erstellt_am=datetime.utcnow()
    )
    db.add(msg)

    ticket.aktualisiert_am = datetime.utcnow()
    db.commit()
    db.refresh(msg)

    return map_message_to_response(msg)

@router.patch("/{ticket_id}/status", response_model=TicketResponse)
def update_ticket_status(
    ticket_id: int,
    status_in: TicketStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Updates ticket status.
    Transition to 'GELOEST' strictly requires solution documentation.
    """
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket nicht gefunden")

    # Only creator, assignee or support/admin can update status
    if not is_support_staff(current_user) and ticket.ersteller_id != current_user.id and ticket.zugewiesen_an_id != current_user.id:
        raise HTTPException(status_code=403, detail="Keine Berechtigung zur Statusänderung")

    ticket.status = status_in.status

    if status_in.status == TicketStatus.GELOEST:
        ticket.loesung_dokumentation = status_in.loesung_dokumentation.strip() if status_in.loesung_dokumentation else None
        ticket.geloest_am = datetime.utcnow()
        if status_in.loesungs_schlagwoerter is not None:
            ticket.loesungs_schlagwoerter = status_in.loesungs_schlagwoerter
    elif status_in.status != TicketStatus.GELOEST and ticket.geloest_am is not None:
        # If reopened or moved to in progress
        ticket.geloest_am = None

    ticket.aktualisiert_am = datetime.utcnow()
    db.commit()
    db.refresh(ticket)

    return map_ticket_to_response(ticket, db)

@router.patch("/{ticket_id}/assign", response_model=TicketResponse)
def assign_ticket(
    ticket_id: int,
    assign_in: TicketAssignUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Assigns ticket to a support employee or clears assignment.
    Auto-advances status from OFFEN to IN_BEARBEITUNG if assigned.
    """
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket nicht gefunden")

    if not is_support_staff(current_user) and ticket.ersteller_id != current_user.id:
        raise HTTPException(status_code=403, detail="Nur Support-Mitarbeiter oder Ersteller dürfen Tickets zuweisen")

    if assign_in.zugewiesen_an_id:
        assignee = db.query(User).filter(User.id == assign_in.zugewiesen_an_id).first()
        if not assignee:
            raise HTTPException(status_code=400, detail="Der zugewiesene Benutzer existiert nicht.")
        ticket.zugewiesen_an_id = assign_in.zugewiesen_an_id
        if ticket.status == TicketStatus.OFFEN:
            ticket.status = TicketStatus.IN_BEARBEITUNG
    else:
        ticket.zugewiesen_an_id = None

    ticket.aktualisiert_am = datetime.utcnow()
    db.commit()
    db.refresh(ticket)

    return map_ticket_to_response(ticket, db)

@router.put("/{ticket_id}", response_model=TicketResponse)
@router.patch("/{ticket_id}", response_model=TicketResponse)
def update_ticket(
    ticket_id: int,
    ticket_in: TicketUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Updates ticket title, description, category, priority or tags."""
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket nicht gefunden")

    if not is_support_staff(current_user) and ticket.ersteller_id != current_user.id:
        raise HTTPException(status_code=403, detail="Keine Berechtigung zum Bearbeiten dieses Tickets")

    if ticket_in.titel is not None:
        ticket.titel = ticket_in.titel.strip()
    if ticket_in.beschreibung is not None:
        ticket.beschreibung = ticket_in.beschreibung.strip()
    if ticket_in.kategorie is not None:
        ticket.kategorie = ticket_in.kategorie
    if ticket_in.prioritaet is not None:
        ticket.prioritaet = ticket_in.prioritaet
    if ticket_in.loesungs_schlagwoerter is not None:
        ticket.loesungs_schlagwoerter = ticket_in.loesungs_schlagwoerter

    ticket.aktualisiert_am = datetime.utcnow()
    db.commit()
    db.refresh(ticket)

    return map_ticket_to_response(ticket, db)

@router.delete("/{ticket_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_ticket(
    ticket_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """SuperAdmin or IT Admin: Permanently delete a ticket and its message history."""
    if current_user.role not in [RoleEnum.ADMIN, RoleEnum.IT_ADMIN]:
        raise HTTPException(status_code=403, detail="Nur Administratoren können Tickets löschen.")

    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket nicht gefunden")

    db.delete(ticket)
    db.commit()
    return None
