from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.event import Event, EventCategory
from app.models.user import User, RoleEnum
from app.schemas.event import EventResponse, EventCreate, EventUpdate
from app.services.auth_service import get_current_user, require_roles

router = APIRouter()

def format_ics_date(dt: datetime, all_day: bool = False) -> str:
    """Format datetime to RFC 5545 iCalendar standard timestamp."""
    if all_day:
        return dt.strftime("%Y%m%d")
    return dt.strftime("%Y%m%dT%H%M%SZ")

@router.get("/events", response_model=List[EventResponse])
def get_calendar_events(
    start: Optional[datetime] = None,
    end: Optional[datetime] = None,
    category: Optional[str] = None,
    department: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Returns calendar events filtered by date range and category."""
    q = db.query(Event)
    
    if start:
        q = q.filter(Event.end_time >= start)
    if end:
        q = q.filter(Event.start_time <= end)
    if category and category != "ALL":
        q = q.filter(Event.category == category)
    if department and department != "ALL":
        q = q.filter((Event.department == department) | (Event.department == None))
        
    events = q.order_by(Event.start_time.asc()).all()
    
    results = []
    for e in events:
        author_name = e.created_by.full_name if e.created_by else "Nexus Intranet"
        results.append(
            EventResponse(
                id=e.id,
                title=e.title,
                description=e.description,
                start_time=e.start_time,
                end_time=e.end_time,
                all_day=e.all_day,
                location=e.location,
                category=e.category,
                department=e.department,
                created_by_id=e.created_by_id,
                author_name=author_name,
                created_at=e.created_at,
                updated_at=e.updated_at
            )
        )
    return results

@router.post("/events", response_model=EventResponse, status_code=status.HTTP_201_CREATED)
def create_calendar_event(
    event_in: EventCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Creates a new calendar appointment or company event."""
    # If category is TOWNHALL or COMPANY, require ADMIN or HR_MANAGER
    if event_in.category in [EventCategory.TOWNHALL, EventCategory.COMPANY, EventCategory.HOLIDAY]:
        if current_user.role not in [RoleEnum.ADMIN, RoleEnum.HR_MANAGER, RoleEnum.IT_ADMIN]:
            raise HTTPException(
                status_code=403, 
                detail="Nur Administratoren oder HR-Manager dürfen globale Firmen-Events oder Feiertage erstellen."
            )
            
    event = Event(
        title=event_in.title.strip(),
        description=event_in.description,
        start_time=event_in.start_time,
        end_time=event_in.end_time,
        all_day=event_in.all_day,
        location=event_in.location,
        category=event_in.category,
        department=event_in.department,
        created_by_id=current_user.id
    )
    db.add(event)
    db.commit()
    db.refresh(event)
    
    return EventResponse(
        id=event.id,
        title=event.title,
        description=event.description,
        start_time=event.start_time,
        end_time=event.end_time,
        all_day=event.all_day,
        location=event.location,
        category=event.category,
        department=event.department,
        created_by_id=event.created_by_id,
        author_name=current_user.full_name,
        created_at=event.created_at,
        updated_at=event.updated_at
    )

@router.delete("/events/{event_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_calendar_event(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Deletes a calendar event."""
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Termin nicht gefunden")
        
    if current_user.role != RoleEnum.ADMIN and event.created_by_id != current_user.id:
        raise HTTPException(status_code=403, detail="Keine Berechtigung zum Löschen dieses Termins")
        
    db.delete(event)
    db.commit()
    return None

@router.get("/feed.ics")
def get_icalendar_feed(db: Session = Depends(get_db)):
    """Public standard RFC 5545 iCalendar feed (.ics) for MS Outlook, Apple Calendar and Google Calendar."""
    events = db.query(Event).order_by(Event.start_time.asc()).all()
    
    now_str = datetime.utcnow().strftime("%Y%m%dT%H%M%SZ")
    
    lines = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//Nexus Corp//Intranet Platform Calendar v3.0//DE",
        "CALSCALE:GREGORIAN",
        "METHOD:PUBLISH",
        "X-WR-CALNAME:Nexus Corp Unternehmenskalender",
        "X-WR-TIMEZONE:Europe/Berlin",
        "X-WR-CALDESC:Offizieller Termin- und Event-Feed der Nexus Corp Intranet-Plattform"
    ]
    
    for e in events:
        uid = f"event-{e.id}-nexus-corp@intranet.local"
        summary = (e.title or "Termin").replace("\n", " ")
        desc = (e.description or "").replace("\n", "\\n")
        loc = (e.location or "").replace("\n", " ")
        cat = e.category.value if hasattr(e.category, "value") else str(e.category)
        
        lines.append("BEGIN:VEVENT")
        lines.append(f"UID:{uid}")
        lines.append(f"DTSTAMP:{now_str}")
        
        if e.all_day:
            lines.append(f"DTSTART;VALUE=DATE:{format_ics_date(e.start_time, all_day=True)}")
            lines.append(f"DTEND;VALUE=DATE:{format_ics_date(e.end_time, all_day=True)}")
        else:
            lines.append(f"DTSTART:{format_ics_date(e.start_time)}")
            lines.append(f"DTEND:{format_ics_date(e.end_time)}")
            
        lines.append(f"SUMMARY:{summary}")
        if desc:
            lines.append(f"DESCRIPTION:{desc}")
        if loc:
            lines.append(f"LOCATION:{loc}")
        lines.append(f"CATEGORIES:{cat}")
        lines.append("STATUS:CONFIRMED")
        lines.append("END:VEVENT")
        
    lines.append("END:VCALENDAR")
    
    ics_content = "\r\n".join(lines) + "\r\n"
    
    return Response(
        content=ics_content,
        media_type="text/calendar; charset=utf-8",
        headers={
            "Content-Disposition": 'inline; filename="nexus-corporate-calendar.ics"',
            "Cache-Control": "no-cache, no-store, must-revalidate"
        }
    )
