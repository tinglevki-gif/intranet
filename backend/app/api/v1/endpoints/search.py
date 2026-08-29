from typing import List, Optional, Dict, Any, Union
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc
from app.core.database import get_db
from app.models.user import User
from app.models.document import Document, DocumentChunk
from app.models.announcement import Announcement
from pydantic import BaseModel

router = APIRouter()

# Fixed catalog of intranet tools and modules with multilingual / domain keywords
SYSTEM_TOOLS = [
    {
        "id": "tool_kantine",
        "title": "Kantine & Speiseplan",
        "subtitle": "Tagesgerichte & Wochenspeiseplan",
        "description": "Aktueller Menüplan, Allergene, Preise und Vorbestellungen für die Betriebskantine.",
        "category": "Alltag & Service",
        "url": "/kantine",
        "icon": "Utensils",
        "badge": "Kantine",
        "keywords": ["kantine", "essen", "mittagessen", "speiseplan", "menü", "canteen", "food", "lunch", "jedzenie", "restauracja"]
    },
    {
        "id": "tool_gps",
        "title": "GPS Telematik & Fuhrpark",
        "subtitle": "Flottenübersicht & Fahrzeugstatus",
        "description": "Live-Ortung von Betonmischern, LKWs, Lieferstatus und Baustellen-Routen.",
        "category": "Logistik & Flotte",
        "url": "/gps",
        "icon": "Navigation",
        "badge": "Telematik",
        "keywords": ["gps", "fuhrpark", "lkw", "flotte", "fahrzeuge", "telematik", "routen", "lieferung", "transport", "tracking", "vehicles"]
    },
    {
        "id": "tool_vertrieb",
        "title": "Vertrieb & CRM",
        "subtitle": "SharePoint Vertriebs-Ordner & Kunden",
        "description": "Zentrale Kundenangebote, Projektkalkulationen und Vertriebsunterlagen.",
        "category": "Hauptbereich",
        "url": "/vertrieb",
        "icon": "TrendingUp",
        "badge": "Vertrieb",
        "keywords": ["vertrieb", "sales", "kunden", "crm", "angebote", "kalkulation", "projekte", "sharepoint", "onedrive", "sprzedaż"]
    },
    {
        "id": "tool_technik",
        "title": "Technik, Statik & CAD",
        "subtitle": "BIM-Modelle, Elementplanung & Statik",
        "description": "Zentraler Zugriff auf technische Zeichnungen, Fertigteilpläne und Prüfstatiken.",
        "category": "Hauptbereich",
        "url": "/technik",
        "icon": "Layers",
        "badge": "Technik",
        "keywords": ["technik", "cad", "bim", "statik", "zeichnungen", "fertigteile", "beton", "konstruktion", "engineering", "technika"]
    },
    {
        "id": "tool_abwicklung",
        "title": "Auftragsabwicklung & ERP",
        "subtitle": "Produktionsaufträge & Werksteuerung",
        "description": "Status von Kundenaufträgen, Fertigungslosen und Baustellen-Lieferterminen.",
        "category": "Hauptbereich",
        "url": "/abwicklung",
        "icon": "Briefcase",
        "badge": "ERP",
        "keywords": ["abwicklung", "auftrag", "aufträge", "erp", "produktion", "fertigung", "lieferung", "werk", "orders", "realizacja"]
    },
    {
        "id": "tool_planung",
        "title": "Montage- & Bauzeitenplanung",
        "subtitle": "Terminpläne & Baustellenkoordination",
        "description": "Gantt-Bauzeitenpläne, Kraneinsatz, Montagekolonnen und Taktplanung.",
        "category": "Hauptbereich",
        "url": "/planung",
        "icon": "CalendarClock",
        "badge": "Montage",
        "keywords": ["planung", "montage", "bauzeiten", "baustelle", "termine", "kran", "schedule", "planning", "harmonogram"]
    },
    {
        "id": "tool_it",
        "title": "IT-Infrastruktur & Sicherheits-Dashboard",
        "subtitle": "Serverüberwachung, Perseus & IT-Status",
        "description": "Echtzeit-Status der Firmen-Server, Netzwerke und Perseus Cyber-Security Hub.",
        "category": "IT & Sicherheit",
        "url": "/it-management",
        "icon": "ShieldCheck",
        "badge": "IT-Security",
        "keywords": ["it", "server", "sicherheit", "security", "perseus", "infrastruktur", "netzwerk", "status", "uptime"]
    },
    {
        "id": "tool_schulungen",
        "title": "Schulungen & KI-Lernportal",
        "subtitle": "Arbeitssicherheit, Brandschutz & Compliance",
        "description": "Digitale Unterweisungen mit interaktivem KI-Tutor und Zertifikatsnachweisen.",
        "category": "Qualifikation",
        "url": "/schulungen",
        "icon": "GraduationCap",
        "badge": "Schulungen",
        "keywords": ["schulung", "schulungen", "kurs", "training", "unterweisung", "brandschutz", "arbeitssicherheit", "compliance", "zertifikat", "ki"]
    },
    {
        "id": "tool_phone",
        "title": "Telefonbuch & Schnellwahl",
        "subtitle": "Standorte Altlandsberg & DK Tinglev",
        "description": "Direktdurchwahlen (#100-#199), Mobilnummern, E-Mail-Adressen und Notfallnummern.",
        "category": "Kommunikation",
        "url": "/phone-directory",
        "icon": "Phone",
        "badge": "Kontakte",
        "keywords": ["telefon", "telefonbuch", "durchwahl", "nummer", "kontakt", "anruf", "phone", "extension", "directory", "kontakty"]
    },
    {
        "id": "tool_orgchart",
        "title": "Organigramm & Teamstruktur",
        "subtitle": "Hierarchie, Werksleitung & Abteilungen",
        "description": "Visuelle Firmenstruktur, Abteilungsleiter und Zuständigkeiten.",
        "category": "Organisation",
        "url": "/org-chart",
        "icon": "Network",
        "badge": "Organigramm",
        "keywords": ["organigramm", "struktur", "hierarchie", "team", "abteilung", "leiter", "orgchart", "hierarchy"]
    },
    {
        "id": "tool_calendar",
        "title": "Unternehmenskalender & Urlaubsplaner",
        "subtitle": "Betriebsferien, Meetings & Schichten",
        "description": "Zentraler Kalender für Werksveranstaltungen, Schichtpläne und Feiertage.",
        "category": "Termine",
        "url": "/calendar",
        "icon": "Calendar",
        "badge": "Kalender",
        "keywords": ["kalender", "termine", "urlaub", "events", "schicht", "ferien", "calendar", "meetings"]
    },
    {
        "id": "tool_documents",
        "title": "Dokumentenablage & OCR-Archiv",
        "subtitle": "Richtlinien, Formulare, OCR-Extraktion",
        "description": "Zentrales Dokumentenarchiv mit automatischer Texterkennung und KI-Suche.",
        "category": "Dokumente",
        "url": "/documents",
        "icon": "FolderGit2",
        "badge": "Dokumente",
        "keywords": ["dokumente", "dokument", "ablage", "pdf", "ocr", "formulare", "richtlinien", "verträge", "files", "archive"]
    },
    {
        "id": "tool_tickets",
        "title": "IT-Helpdesk & Support-Tickets",
        "subtitle": "Störungsmeldungen & Arbeitsplatzanfragen",
        "description": "Support-Anfragen an das IT- und Facility-Team mit Status-Tracking.",
        "category": "Support",
        "url": "/tickets",
        "icon": "LifeBuoy",
        "badge": "Helpdesk",
        "keywords": ["ticket", "tickets", "hilfe", "support", "helpdesk", "störung", "problem", "it-support"]
    },
    {
        "id": "tool_admin_settings",
        "title": "System-Administration & Branding",
        "subtitle": "Logo, Menüs, Sprachen & Konfiguration",
        "description": "SuperAdmin-Verwaltung für Unternehmens-Branding, Navigation und Cloud-Speicher.",
        "category": "Administration",
        "url": "/admin/settings",
        "icon": "Sliders",
        "badge": "SuperAdmin",
        "keywords": ["admin", "einstellungen", "branding", "logo", "konfiguration", "menü", "sprachen", "settings"]
    },
    {
        "id": "tool_admin_users",
        "title": "Benutzer- & Mitarbeiterverwaltung",
        "subtitle": "Accounts, Rollen und Abteilungen",
        "description": "Mitarbeiterkonten anlegen, Berechtigungen bearbeiten und Passwörter verwalten.",
        "category": "Administration",
        "url": "/admin/users",
        "icon": "Users",
        "badge": "SuperAdmin",
        "keywords": ["benutzer", "mitarbeiter", "accounts", "user", "passwort", "verwaltung", "users"]
    }
]

# Schemas
class EmployeeSearchResult(BaseModel):
    id: int
    name: str
    position: Optional[str] = None
    department: Optional[str] = None
    email: str
    phone: Optional[str] = None
    mobile: Optional[str] = None
    avatar_url: Optional[str] = None
    role: str
    url: str

class DocumentSearchResult(BaseModel):
    id: int
    title: str
    original_name: str
    file_type: str
    file_size: int
    category: str
    doc_type: Optional[str] = None
    summary: Optional[str] = None
    download_url: str
    url: str

class ToolSearchResult(BaseModel):
    id: str
    title: str
    subtitle: str
    description: str
    category: str
    url: str
    icon: str
    badge: str

class NewsSearchResult(BaseModel):
    id: int
    title: str
    summary: Optional[str] = None
    content_snippet: str
    category: str
    is_pinned: bool
    author_name: str
    created_at: str
    url: str

class UnifiedSearchResponse(BaseModel):
    query: str
    total_count: int
    employees: List[EmployeeSearchResult]
    documents: List[DocumentSearchResult]
    tools: List[ToolSearchResult]
    news: List[NewsSearchResult]


@router.get("", response_model=UnifiedSearchResponse, tags=["Globale Intranet-Suche"])
def global_search(
    q: str = Query(..., min_length=1, description="Suchbegriff (z. B. Name, Dokument, Tool oder Stichwort)"),
    limit: int = Query(6, ge=1, le=20),
    db: Session = Depends(get_db)
):
    query_str = q.strip().lower()
    search_pattern = f"%{query_str}%"

    # 1. Search Employees / Mitarbeiter
    matching_users = db.query(User).filter(
        or_(
            User.full_name.ilike(search_pattern),
            User.first_name.ilike(search_pattern),
            User.last_name.ilike(search_pattern),
            User.email.ilike(search_pattern),
            User.department.ilike(search_pattern),
            User.position.ilike(search_pattern),
            User.phone.ilike(search_pattern),
            User.mobile.ilike(search_pattern)
        )
    ).order_by(User.last_name.asc()).limit(limit).all()

    employees = [
        EmployeeSearchResult(
            id=u.id,
            name=u.full_name or f"{u.first_name or ''} {u.last_name or ''}".strip(),
            position=u.position,
            department=u.department,
            email=u.email,
            phone=u.phone,
            mobile=u.mobile,
            avatar_url=u.avatar_url,
            role=u.role.value if hasattr(u.role, 'value') else str(u.role),
            url="/phone-directory"
        )
        for u in matching_users
    ]

    # 2. Search Documents / Dokumente & OCR Chunks
    # Also find documents matching inside OCR text chunks
    chunk_matching_doc_ids = [
        row[0] for row in db.query(DocumentChunk.document_id).filter(
            DocumentChunk.content.ilike(search_pattern)
        ).distinct().limit(limit).all()
    ]

    matching_docs = db.query(Document).filter(
        or_(
            Document.original_name.ilike(search_pattern),
            Document.summary.ilike(search_pattern),
            Document.extracted_metadata.ilike(search_pattern),
            Document.id.in_(chunk_matching_doc_ids) if chunk_matching_doc_ids else False
        )
    ).order_by(desc(Document.created_at)).limit(limit).all()

    documents = [
        DocumentSearchResult(
            id=d.id,
            title=d.original_name,
            original_name=d.original_name,
            file_type=d.file_type or "pdf",
            file_size=d.file_size or 0,
            category=d.category.value if hasattr(d.category, 'value') else str(d.category),
            doc_type=d.doc_type,
            summary=d.summary,
            download_url=f"/api/v1/documents/{d.id}/download",
            url="/documents"
        )
        for d in matching_docs
    ]

    # 3. Search Tools & Navigation Modules
    tools: List[ToolSearchResult] = []
    for tool in SYSTEM_TOOLS:
        score = 0
        if query_str in tool["title"].lower():
            score += 3
        if query_str in tool["subtitle"].lower():
            score += 2
        if query_str in tool["description"].lower():
            score += 1
        if any(query_str in kw or kw in query_str for kw in tool["keywords"]):
            score += 3

        if score > 0:
            tools.append(ToolSearchResult(
                id=tool["id"],
                title=tool["title"],
                subtitle=tool["subtitle"],
                description=tool["description"],
                category=tool["category"],
                url=tool["url"],
                icon=tool["icon"],
                badge=tool["badge"]
            ))
            if len(tools) >= limit:
                break

    # 4. Search News & Announcements
    matching_news = db.query(Announcement).filter(
        or_(
            Announcement.title.ilike(search_pattern),
            Announcement.summary.ilike(search_pattern),
            Announcement.content.ilike(search_pattern),
            Announcement.category.ilike(search_pattern)
        )
    ).order_by(desc(Announcement.is_pinned), desc(Announcement.created_at)).limit(limit).all()

    news = [
        NewsSearchResult(
            id=n.id,
            title=n.title,
            summary=n.summary,
            content_snippet=(n.summary if n.summary else n.content[:140] + ("..." if len(n.content) > 140 else "")),
            category=n.category or "Allgemein",
            is_pinned=bool(n.is_pinned),
            author_name=n.author_name or "Unternehmenskommunikation",
            created_at=n.created_at.strftime("%d.%m.%Y") if n.created_at else "",
            url="/announcements"
        )
        for n in matching_news
    ]

    total_count = len(employees) + len(documents) + len(tools) + len(news)

    return UnifiedSearchResponse(
        query=q,
        total_count=total_count,
        employees=employees,
        documents=documents,
        tools=tools,
        news=news
    )
