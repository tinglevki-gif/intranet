import time
import urllib.request
import urllib.error
from datetime import datetime, date, timedelta, timezone
from typing import List, Dict, Any, Optional
import icalendar
import requests
from sqlalchemy.orm import Session

from app.models.calendar_source import ExternalCalendarSource
from app.schemas.event import EventResponse

# In-memory cache: source_id -> { "timestamp": float, "events": List[EventResponse] }
_CALENDAR_CACHE: Dict[int, Dict[str, Any]] = {}
CACHE_TTL_SECONDS = 300  # 5 minutes cache TTL

def invalidate_source_cache(source_id: Optional[int] = None):
    """Invalidates memory cache for a specific source or all sources."""
    global _CALENDAR_CACHE
    if source_id is not None:
        _CALENDAR_CACHE.pop(source_id, None)
    else:
        _CALENDAR_CACHE.clear()

def _normalize_dt(dt_val) -> tuple[datetime, bool]:
    """
    Normalizes icalendar date/datetime into naive UTC-compatible datetime and all_day flag.
    """
    if isinstance(dt_val, icalendar.vDDDTypes):
        dt_val = dt_val.dt

    if isinstance(dt_val, date) and not isinstance(dt_val, datetime):
        return datetime(dt_val.year, dt_val.month, dt_val.day, 0, 0, 0), True

    if isinstance(dt_val, datetime):
        if dt_val.tzinfo is not None:
            # Convert to UTC and strip tzinfo
            dt_utc = dt_val.astimezone(timezone.utc).replace(tzinfo=None)
            return dt_utc, False
        return dt_val, False

    return datetime.utcnow(), False

def parse_ics_content(source: ExternalCalendarSource, ics_raw: bytes) -> List[EventResponse]:
    """Parses raw iCalendar .ics byte stream into a list of EventResponse objects."""
    parsed_events: List[EventResponse] = []
    
    cal = icalendar.Calendar.from_ical(ics_raw)
    
    for idx, component in enumerate(cal.walk('VEVENT')):
        try:
            summary = str(component.get('summary', 'Termin (Outlook)'))
            description = str(component.get('description', '')) if component.get('description') else None
            location = str(component.get('location', '')) if component.get('location') else None
            
            raw_dtstart = component.get('dtstart')
            raw_dtend = component.get('dtend')
            
            if not raw_dtstart:
                continue
                
            start_dt, is_all_day_start = _normalize_dt(raw_dtstart)
            
            if raw_dtend:
                end_dt, is_all_day_end = _normalize_dt(raw_dtend)
                all_day = is_all_day_start or is_all_day_end
            else:
                duration = component.get('duration')
                if duration:
                    end_dt = start_dt + duration.dt
                    all_day = is_all_day_start
                elif is_all_day_start:
                    end_dt = start_dt + timedelta(days=1)
                    all_day = True
                else:
                    end_dt = start_dt + timedelta(hours=1)
                    all_day = False

            raw_uid = str(component.get('uid', f"item-{idx}"))
            event_id = f"ext-{source.id}-{raw_uid}"
            
            # Map category from summary or default
            summary_lower = summary.lower()
            if any(k in summary_lower for k in ['feiertag', 'holiday', 'ostern', 'weihnachten', 'neujahr', 'brückentag']):
                category = "HOLIDAY"
            elif any(k in summary_lower for k in ['training', 'schulung', 'workshop', 'webinar']):
                category = "TRAINING"
            elif any(k in summary_lower for k in ['townhall', 'all-hands', 'versammlung']):
                category = "TOWNHALL"
            else:
                category = "MEETING"

            parsed_events.append(
                EventResponse(
                    id=event_id,
                    title=summary,
                    description=description,
                    start_time=start_dt,
                    end_time=end_dt,
                    all_day=all_day,
                    location=location,
                    category=category,
                    department=source.abteilung,
                    created_by_id=None,
                    author_name=f"Outlook ({source.name})",
                    created_at=datetime.utcnow(),
                    updated_at=datetime.utcnow(),
                    is_external=True,
                    source_id=source.id,
                    source_name=source.name,
                    source_color=source.farbe or "#0078D4"
                )
            )
        except Exception as parse_err:
            print(f"Warning: Failed to parse VEVENT {idx} from source {source.name}: {parse_err}")
            continue

    return parsed_events

def sync_calendar_source(source: ExternalCalendarSource, db: Optional[Session] = None, force: bool = False) -> List[EventResponse]:
    """
    Fetches and parses the .ics feed from a calendar source, using cache if available.
    """
    global _CALENDAR_CACHE
    now = time.time()
    
    if not force and source.id in _CALENDAR_CACHE:
        cache_entry = _CALENDAR_CACHE[source.id]
        if (now - cache_entry["timestamp"]) < CACHE_TTL_SECONDS:
            return cache_entry["events"]

    url = source.ics_url.strip()
    if url.startswith("webcal://"):
        url = "https://" + url[9:]

    try:
        if url.startswith("http://") or url.startswith("https://"):
            resp = requests.get(
                url,
                timeout=10,
                headers={"User-Agent": "NexusIntranet-CalendarSync/3.0 (Windows NT 10.0; Win64; x64)"}
            )
            resp.raise_for_status()
            ics_bytes = resp.content
        else:
            # Allow local raw string or file path for testing / mock feeds
            if url.startswith("BEGIN:VCALENDAR"):
                ics_bytes = url.encode("utf-8")
            else:
                with open(url, "rb") as f:
                    ics_bytes = f.read()

        events = parse_ics_content(source, ics_bytes)
        
        # Update cache
        _CALENDAR_CACHE[source.id] = {
            "timestamp": now,
            "events": events
        }

        # Update DB metadata if session provided
        if db:
            source.letzte_synchronisation = datetime.utcnow()
            source.letzter_status = "OK"
            source.anzahl_termine = len(events)
            db.commit()

        return events

    except Exception as err:
        err_msg = str(err)
        print(f"Error syncing external calendar source #{source.id} ({source.name}): {err_msg}")
        
        if db:
            source.letzter_status = f"ERROR: {err_msg[:200]}"
            db.commit()

        # If we had a previous cache, return stale cache instead of failing completely
        if source.id in _CALENDAR_CACHE:
            return _CALENDAR_CACHE[source.id]["events"]

        return []

def get_all_external_events(db: Session, category_filter: Optional[str] = None, department_filter: Optional[str] = None) -> List[EventResponse]:
    """Fetches events from all active external sources."""
    sources = db.query(ExternalCalendarSource).filter(ExternalCalendarSource.ist_aktiv == True).all()
    all_events: List[EventResponse] = []
    
    for source in sources:
        events = sync_calendar_source(source, db=db)
        for e in events:
            if category_filter and category_filter != "ALL" and e.category != category_filter:
                continue
            if department_filter and department_filter != "ALL" and e.department and e.department != department_filter:
                continue
            all_events.append(e)
            
    return all_events
