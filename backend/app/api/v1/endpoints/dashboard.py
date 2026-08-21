from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.user import User
from app.models.announcement import Announcement, AnnouncementCategory
from app.schemas.dashboard import DashboardData, StatCard, QuickTool, CompanyEvent, AnnouncementResponse
from app.services.auth_service import get_current_user

router = APIRouter()

# Fixed curated tools catalog
QUICK_TOOLS_CATALOG: List[QuickTool] = [
    QuickTool(
        id="tool-payroll",
        title="Mitarbeiterportal & Abrechnung",
        category="Personal & HR",
        description="Gehaltsabrechnungen, Lohnsteuerbescheinigungen und Nachweise einsehen.",
        icon="CreditCard",
        url="#payroll",
        color="from-blue-600 to-indigo-600",
        badge="Abrechnung verfügbar"
    ),
    QuickTool(
        id="tool-vacations",
        title="Urlaubs- & Abwesenheitsverwaltung",
        category="Personal & HR",
        description="Urlaub und Sonderurlaub beantragen und aktuellen Saldo einsehen.",
        icon="CalendarCheck",
        url="#vacations",
        color="from-emerald-500 to-teal-600",
        badge="18 Tage Resturlaub"
    ),
    QuickTool(
        id="tool-jira",
        title="Projektmanagement & Aufgaben",
        category="Technik & Projekte",
        description="Kanban-Boards, Aufgabenverfolgung und Bauprojekt-Tickets.",
        icon="Kanban",
        url="#jira",
        color="from-sky-500 to-blue-700",
        badge=None
    ),
    QuickTool(
        id="tool-cloud-drive",
        title="Zentraler Cloud-Speicher",
        category="Dokumente & Vorlagen",
        description="Unternehmenspräsentationen, Vorlagen und Werksrichtlinien.",
        icon="FolderOpen",
        url="#drive",
        color="from-amber-500 to-orange-600",
        badge=None
    ),
    QuickTool(
        id="tool-desk-booking",
        title="Besprechungsräume & Buchung",
        category="Standort & Räume",
        description="Konferenzräume, Videokonferenzen und Arbeitsplatzreservierung.",
        icon="Building2",
        url="#booking",
        color="from-purple-500 to-violet-600",
        badge="2 Räume frei"
    ),
    QuickTool(
        id="tool-it-helpdesk",
        title="IT-Support & Helpdesk",
        category="IT-Infrastruktur",
        description="Störungsmeldungen, Hardware-Bestellungen und IT-Zugänge.",
        icon="Headphones",
        url="#helpdesk",
        color="from-rose-500 to-red-600",
        badge="SLA < 15 Min"
    )
]

COMPANY_EVENTS: List[CompanyEvent] = [
    CompanyEvent(
        id="evt-1",
        title="All-Hands Meeting Q1 2026",
        date="28. Feb 2026",
        time="10:00 - 11:30 Uhr",
        type="townhall",
        location="Auditorium Tinglev / Live-Stream",
        attendees_count=145
    ),
    CompanyEvent(
        id="evt-2",
        title="Geburtstag Mateo Silva",
        date="03. Mär 2026",
        time=None,
        type="birthday",
        location="Abteilung Fertigung & Technik",
        attendees_count=None
    ),
    CompanyEvent(
        id="evt-3",
        title="Workshop Statik- & KI-Optimierung",
        date="07. Mär 2026",
        time="16:00 - 17:30 Uhr",
        type="meeting",
        location="Konferenzraum Kopenhagen / Meet",
        attendees_count=32
    ),
    CompanyEvent(
        id="evt-4",
        title="Feiertag / Betriebsruhe",
        date="19. Mär 2026",
        time="Ganztägig",
        type="holiday",
        location="Alle Standorte (DE & DK)",
        attendees_count=None
    )
]

@router.get("/overview", response_model=DashboardData)
def get_dashboard_overview(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Aggregated payload for fast single-roundtrip dashboard initialization."""
    # Fetch active announcements
    announcements_db = db.query(Announcement).order_by(Announcement.is_pinned.desc(), Announcement.created_at.desc()).limit(6).all()
    
    # Calculate live stats
    total_colleagues = db.query(User).filter(User.is_active == True).count()
    
    stats: List[StatCard] = [
        StatCard(
            id="stat-team",
            title="Aktive Mitarbeiter",
            value=f"{total_colleagues} Personen",
            change="+3 diesen Monat",
            change_type="positive",
            icon="Users",
            description="Am Standort & im Homeoffice"
        ),
        StatCard(
            id="stat-vacations",
            title="Verfügbare Urlaubstage",
            value="18 Tage",
            change="Resturlaub 2026",
            change_type="neutral",
            icon="Palmtree",
            description="Urlaubsanspruch aktiv"
        ),
        StatCard(
            id="stat-tickets",
            title="Offene Anträge",
            value="2 in Bearbeitung",
            change="1 in Prüfung bei HR",
            change_type="positive",
            icon="Clock",
            description="Tickets & Genehmigungen"
        ),
        StatCard(
            id="stat-events",
            title="Nächstes Event",
            value="All-Hands Q1",
            change="In 8 Tagen",
            change_type="neutral",
            icon="Calendar",
            description="Ergebnispräsentation"
        )
    ]
    
    return DashboardData(
        stats=stats,
        announcements=announcements_db,
        quick_tools=QUICK_TOOLS_CATALOG,
        upcoming_events=COMPANY_EVENTS,
        system_status="Betriebsbereit 99.98%"
    )

@router.get("/announcements", response_model=List[AnnouncementResponse])
def get_announcements(
    category: Optional[str] = None,
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Returns corporate announcements with category filtering."""
    q = db.query(Announcement)
    if category and category.upper() not in ["ALL", "ALLE", ""]:
        q = q.filter(Announcement.category.ilike(f"%{category}%"))
    
    return q.order_by(Announcement.is_pinned.desc(), Announcement.created_at.desc()).limit(limit).all()

@router.post("/announcements/{announcement_id}/read")
def mark_announcement_as_read(
    announcement_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Mark an announcement as read/viewed for the current user."""
    announcement = db.query(Announcement).filter(Announcement.id == announcement_id).first()
    if not announcement:
        return {"status": "not_found"}
    
    announcement.views_count += 1
    db.commit()
    return {"status": "success", "views_count": announcement.views_count}
