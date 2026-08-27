import os
import uuid
from datetime import datetime, date
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.user import User, RoleEnum
from app.models.canteen import WeeklyMenu
from app.schemas.canteen import (
    WeeklyMenuCreate,
    WeeklyMenuUpdate,
    WeeklyMenuResponse,
    WeeklyMenuListResponse,
    DailyMenu,
    DishItem,
    DessertItem
)
from app.services.auth_service import get_current_user

router = APIRouter()

# Upload directory config
BACKEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", ".."))
UPLOAD_ROOT = os.path.join(BACKEND_DIR, "uploads")
CANTEEN_DIR = os.path.join(UPLOAD_ROOT, "canteen")
os.makedirs(CANTEEN_DIR, exist_ok=True)

ALLOWED_EXTENSIONS = {".pdf"}
MAX_PDF_SIZE = 15 * 1024 * 1024  # 15 MB

# =========================================================================
# PERMISSION DEPENDENCY
# =========================================================================

def require_canteen_permission(current_user: User = Depends(get_current_user)) -> User:
    """Requires SuperAdmin or explicit manage_canteen custom permission."""
    if current_user.can_manage_canteen:
        return current_user
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Zugriff verweigert. Sie benötigen die Berechtigung 'Kantine / Speiseplan verwalten'."
    )

# =========================================================================
# DATE HELPERS & TEMPLATE GENERATOR
# =========================================================================

def get_current_week_and_year():
    today = date.today()
    iso = today.isocalendar()
    return iso[1], iso[0]

def get_dates_for_iso_week(year: int, week: int):
    try:
        mon = date.fromisocalendar(year, week, 1)
        fri = date.fromisocalendar(year, week, 5)
        return mon, fri
    except Exception:
        today = date.today()
        return today, today

def generate_default_days_data(year: int, week: int) -> List[Dict[str, Any]]:
    days_names = ["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag"]
    days_list = []
    for i, name in enumerate(days_names):
        try:
            day_date = date.fromisocalendar(year, week, i + 1).isoformat()
        except Exception:
            day_date = None
        days_list.append({
            "tag": name,
            "datum": day_date,
            "gericht_haupt": {
                "titel": "",
                "beschreibung": "",
                "preis": "6,90 €",
                "kalorien": "",
                "is_vegan": False,
                "is_vegetarian": False
            },
            "gericht_vegetarisch_vegan": {
                "titel": "",
                "beschreibung": "",
                "preis": "5,80 €",
                "kalorien": "",
                "is_vegan": False,
                "is_vegetarian": True
            },
            "dessert_beilage": {
                "titel": "",
                "preis": "1,80 €"
            },
            "allergene_zusatzstoffe": []
        })
    return days_list

def map_weekly_menu_response(menu: WeeklyMenu) -> WeeklyMenuResponse:
    erstellt_name = menu.erstellt_von.full_name if menu.erstellt_von else "Kantinenteam"
    return WeeklyMenuResponse(
        id=menu.id,
        calendar_week=menu.calendar_week,
        year=menu.year,
        valid_from=menu.valid_from,
        valid_to=menu.valid_to,
        days_data=menu.days_data or [],
        pdf_url=menu.pdf_url,
        is_published=menu.is_published,
        erstellt_von_id=menu.erstellt_von_id,
        erstellt_von_name=erstellt_name,
        aktualisiert_am=menu.aktualisiert_am or menu.created_at or datetime.utcnow(),
        created_at=menu.created_at or datetime.utcnow()
    )

# =========================================================================
# ENDPOINTS
# =========================================================================

@router.get("/menu/current", response_model=WeeklyMenuResponse)
def get_current_menu(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Liefert den Speiseplan für die aktuelle Kalenderwoche."""
    cur_week, cur_year = get_current_week_and_year()
    
    # 1. Look for exact current week & year
    menu = db.query(WeeklyMenu).filter(
        WeeklyMenu.calendar_week == cur_week,
        WeeklyMenu.year == cur_year,
        WeeklyMenu.is_published == True
    ).first()

    if menu:
        return map_weekly_menu_response(menu)

    # 2. If not found, look for any latest published menu
    latest_menu = db.query(WeeklyMenu).filter(
        WeeklyMenu.is_published == True
    ).order_by(WeeklyMenu.year.desc(), WeeklyMenu.calendar_week.desc()).first()

    if latest_menu:
        return map_weekly_menu_response(latest_menu)

    # 3. Fallback: generate default template structure
    v_from, v_to = get_dates_for_iso_week(cur_year, cur_week)
    return WeeklyMenuResponse(
        id=0,
        calendar_week=cur_week,
        year=cur_year,
        valid_from=v_from,
        valid_to=v_to,
        days_data=generate_default_days_data(cur_year, cur_week),
        pdf_url=None,
        is_published=True,
        erstellt_von_id=None,
        erstellt_von_name="Kantinenteam",
        aktualisiert_am=datetime.utcnow(),
        created_at=datetime.utcnow()
    )

@router.get("/menu", response_model=WeeklyMenuResponse)
def get_menu_by_week(
    week: Optional[int] = Query(None, ge=1, le=53),
    year: Optional[int] = Query(None, ge=2020, le=2050),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Liefert den Speiseplan für eine angeforderte Kalenderwoche und Jahr."""
    cur_week, cur_year = get_current_week_and_year()
    target_week = week if week is not None else cur_week
    target_year = year if year is not None else cur_year

    # Managers can view unpublished drafts too
    q = db.query(WeeklyMenu).filter(
        WeeklyMenu.calendar_week == target_week,
        WeeklyMenu.year == target_year
    )
    if not current_user.can_manage_canteen:
        q = q.filter(WeeklyMenu.is_published == True)

    menu = q.first()
    if menu:
        return map_weekly_menu_response(menu)

    # If not found in DB, return draft template with computed dates
    v_from, v_to = get_dates_for_iso_week(target_year, target_week)
    return WeeklyMenuResponse(
        id=0,
        calendar_week=target_week,
        year=target_year,
        valid_from=v_from,
        valid_to=v_to,
        days_data=generate_default_days_data(target_year, target_week),
        pdf_url=None,
        is_published=True,
        erstellt_von_id=None,
        erstellt_von_name=None,
        aktualisiert_am=datetime.utcnow(),
        created_at=datetime.utcnow()
    )

@router.get("/menu/all", response_model=WeeklyMenuListResponse)
def list_all_menus(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Liefert alle gespeicherten Wochen-Speisepläne."""
    q = db.query(WeeklyMenu)
    if not current_user.can_manage_canteen:
        q = q.filter(WeeklyMenu.is_published == True)

    menus = q.order_by(WeeklyMenu.year.desc(), WeeklyMenu.calendar_week.desc()).all()
    return WeeklyMenuListResponse(
        total=len(menus),
        items=[map_weekly_menu_response(m) for m in menus]
    )

@router.post("/menu", response_model=WeeklyMenuResponse, status_code=status.HTTP_201_CREATED)
def create_or_upsert_weekly_menu(
    payload: WeeklyMenuCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_canteen_permission)
):
    """
    Erstellt oder überschreibt den Wochenplan für eine Kalenderwoche.
    Geschützt: Nur SuperAdmins und autorisierte Kantinenverwalter.
    """
    existing = db.query(WeeklyMenu).filter(
        WeeklyMenu.calendar_week == payload.calendar_week,
        WeeklyMenu.year == payload.year
    ).first()

    raw_days = [d.dict() if hasattr(d, 'dict') else d for d in payload.days_data]

    if existing:
        existing.valid_from = payload.valid_from
        existing.valid_to = payload.valid_to
        existing.days_data = raw_days
        if payload.pdf_url is not None:
            existing.pdf_url = payload.pdf_url
        existing.is_published = payload.is_published
        existing.erstellt_von_id = current_user.id
        existing.aktualisiert_am = datetime.utcnow()
        db.commit()
        db.refresh(existing)
        return map_weekly_menu_response(existing)

    new_menu = WeeklyMenu(
        calendar_week=payload.calendar_week,
        year=payload.year,
        valid_from=payload.valid_from,
        valid_to=payload.valid_to,
        days_data=raw_days,
        pdf_url=payload.pdf_url,
        is_published=payload.is_published,
        erstellt_von_id=current_user.id,
        aktualisiert_am=datetime.utcnow()
    )
    db.add(new_menu)
    db.commit()
    db.refresh(new_menu)
    return map_weekly_menu_response(new_menu)

@router.put("/menu/{menu_id}", response_model=WeeklyMenuResponse)
def update_weekly_menu(
    menu_id: int,
    payload: WeeklyMenuUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_canteen_permission)
):
    """Aktualisiert einen bestehenden Wochen-Speiseplan."""
    menu = db.query(WeeklyMenu).filter(WeeklyMenu.id == menu_id).first()
    if not menu:
        raise HTTPException(status_code=404, detail="Wochen-Speiseplan nicht gefunden.")

    if payload.calendar_week is not None:
        menu.calendar_week = payload.calendar_week
    if payload.year is not None:
        menu.year = payload.year
    if payload.valid_from is not None:
        menu.valid_from = payload.valid_from
    if payload.valid_to is not None:
        menu.valid_to = payload.valid_to
    if payload.days_data is not None:
        menu.days_data = [d.dict() if hasattr(d, 'dict') else d for d in payload.days_data]
    if payload.pdf_url is not None:
        menu.pdf_url = payload.pdf_url
    if payload.is_published is not None:
        menu.is_published = payload.is_published

    menu.erstellt_von_id = current_user.id
    menu.aktualisiert_am = datetime.utcnow()
    db.commit()
    db.refresh(menu)
    return map_weekly_menu_response(menu)

@router.delete("/menu/{menu_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_weekly_menu(
    menu_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_canteen_permission)
):
    """Löscht einen Wochen-Speiseplan."""
    menu = db.query(WeeklyMenu).filter(WeeklyMenu.id == menu_id).first()
    if not menu:
        raise HTTPException(status_code=404, detail="Wochen-Speiseplan nicht gefunden.")

    db.delete(menu)
    db.commit()
    return None

@router.post("/upload-pdf")
async def upload_canteen_pdf(
    file: UploadFile = File(...),
    current_user: User = Depends(require_canteen_permission)
):
    """Lädt eine PDF-Datei für den Speiseplan hoch."""
    filename = file.filename or "speiseplan.pdf"
    ext = os.path.splitext(filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail="Ungültiges Dateiformat. Es sind nur PDF-Dokumente (.pdf) erlaubt."
        )

    content = await file.read()
    if len(content) > MAX_PDF_SIZE:
        raise HTTPException(
            status_code=400,
            detail="Die PDF-Datei ist zu groß (maximal 15 MB erlaubt)."
        )

    unique_name = f"speiseplan_{uuid.uuid4().hex[:8]}{ext}"
    dest_path = os.path.join(CANTEEN_DIR, unique_name)

    with open(dest_path, "wb") as f:
        f.write(content)

    return {"pdf_url": f"/uploads/canteen/{unique_name}", "filename": filename}
