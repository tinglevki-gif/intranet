from typing import List, Optional, Any
from sqlalchemy.orm import Session
from app.models.menu import MenuItem
from app.models.role import Role
from app.models.user import User, RoleEnum
from app.schemas.navigation import NavigationResponse, NavigationSection, MenuItemResponse

# System modules definitions for Granular Permissions Matrix
AVAILABLE_MODULES = [
    {
        "key": "announcements",
        "label": "Mitteilungen & News",
        "category": "Hauptbereich",
        "icon": "Megaphone",
        "description": "Unternehmensbekanntmachungen, News-Feed und Eilmeldungen."
    },
    {
        "key": "phone-directory",
        "label": "Telefonverzeichnis",
        "category": "Hauptbereich",
        "icon": "PhoneCall",
        "description": "Durchwahlen, Mobilnummern und Kontaktschnellaktionen."
    },
    {
        "key": "org-chart",
        "label": "Organigramm",
        "category": "Hauptbereich",
        "icon": "Network",
        "description": "Interaktive Unternehmenshierarchie und Baumstruktur."
    },
    {
        "key": "directory",
        "label": "Teamverzeichnis",
        "category": "Hauptbereich",
        "icon": "Users",
        "description": "Mitarbeiterübersicht und Abteilungsfilter."
    },
    {
        "key": "kantine",
        "label": "Kantine & Speiseplan",
        "category": "Hauptbereich",
        "icon": "UtensilsCrossed",
        "description": "Wochen-Speiseplan, Tagesgerichte und Essensvorbestellung."
    },
    {
        "key": "gps",
        "label": "GPS & Flottenortung",
        "category": "Hauptbereich",
        "icon": "Navigation",
        "description": "Live-Telematik, Fahrzeugstatus und Routenüberwachung."
    },
    {
        "key": "vertrieb",
        "label": "Vertrieb & Sales",
        "category": "Hauptbereich",
        "icon": "TrendingUp",
        "description": "Sales-Pipeline, Großprojekte und Vertriebsunterlagen."
    },
    {
        "key": "technik",
        "label": "Technik & Geräte",
        "category": "Hauptbereich",
        "icon": "Cpu",
        "description": "Maschinen-Telemetrie, Wartungspläne und Support-Tickets."
    },
    {
        "key": "abwicklung",
        "label": "Auftragsabwicklung",
        "category": "Hauptbereich",
        "icon": "ClipboardCheck",
        "description": "Auftragstracking von Statik-Freigabe bis Baustellenlogistik."
    },
    {
        "key": "planung",
        "label": "Ressourcen & Planung",
        "category": "Hauptbereich",
        "icon": "CalendarClock",
        "description": "Kapazitätsauslastung der Fertigungslinien und Schichtpläne."
    },
    {
        "key": "schulungen",
        "label": "Schulungen & Handbücher",
        "category": "Hauptbereich",
        "icon": "GraduationCap",
        "description": "Benutzerhandbücher, Videoanleitungen und interaktiver KI-Support-Chatbot."
    },
    {
        "key": "documents",
        "label": "Dokumentenablage & KI",
        "category": "Arbeitsbereich",
        "icon": "FolderOpen",
        "description": "Zentraler Dokumentenspeicher mit semantischer KI-Vektorsuche."
    },
    {
        "key": "calendar",
        "label": "Unternehmenskalender",
        "category": "Arbeitsbereich",
        "icon": "Calendar",
        "description": "Terminverwaltung, Feiertage und iCal-Kalendersynchronisation."
    },
    {
        "key": "tickets",
        "label": "IT-Helpdesk & Tickets",
        "category": "IT & Systeme",
        "icon": "Headphones",
        "description": "Störungsmeldungen, Supportanfragen und Ticketbearbeitung."
    },
    {
        "key": "hr-requests",
        "label": "Urlaubs- & Abwesenheitsverwaltung",
        "category": "Personal & HR",
        "icon": "Clock",
        "description": "Urlaubsanträge, Zeitausgleich und Krankmeldungen."
    },
    {
        "key": "performance",
        "label": "Mitarbeitergespräche & Performance",
        "category": "Personal & HR",
        "icon": "Award",
        "description": "Zielvereinbarungen (OKRs) und Mitarbeiter-Feedback."
    },
    {
        "key": "it-management",
        "label": "IT-Infrastruktur & Sicherheit",
        "category": "IT & Systeme",
        "icon": "Server",
        "description": "Serverstatus, 2FA-Überwachung und Sicherheitsmanagement."
    },
    {
        "key": "admin-users",
        "label": "Benutzerverwaltung",
        "category": "Administration",
        "icon": "UserCheck",
        "description": "Mitarbeiterkonten verwalten, Passwörter zurücksetzen und Berechtigungen vergeben."
    },
    {
        "key": "admin-roles",
        "label": "Rollen & Berechtigungen",
        "category": "Administration",
        "icon": "ShieldCheck",
        "description": "Rollen definieren, RBAC-Matrix anpassen und Berechtigungsstufen steuern."
    },
    {
        "key": "admin-settings",
        "label": "Intranet-Einstellungen",
        "category": "Administration",
        "icon": "Settings",
        "description": "Systemkonfiguration, Navigation und OneDrive-Integration."
    }
]

CONTROLLABLE_MODULE_KEYS = [m["key"] for m in AVAILABLE_MODULES]

# Default system menu structure
DEFAULT_MENUS = [
    # 1. Hauptbereich (Alle Rollen)
    {
        "key": "dashboard",
        "label": "Dashboard",
        "path": "/",
        "icon": "LayoutDashboard",
        "section": "Hauptbereich",
        "order": 1,
        "allowed_roles": ["ADMIN", "HR_MANAGER", "IT_ADMIN", "EMPLOYEE"],
        "badge": None,
    },
    {
        "key": "announcements",
        "label": "Mitteilungen & News",
        "path": "/announcements",
        "icon": "Megaphone",
        "section": "Hauptbereich",
        "order": 2,
        "allowed_roles": ["ADMIN", "HR_MANAGER", "IT_ADMIN", "EMPLOYEE"],
        "badge": None,
    },
    {
        "key": "phone-directory",
        "label": "Telefonverzeichnis",
        "path": "/phone-directory",
        "icon": "PhoneCall",
        "section": "Hauptbereich",
        "order": 3,
        "allowed_roles": ["ADMIN", "HR_MANAGER", "IT_ADMIN", "EMPLOYEE"],
        "badge": None,
    },
    {
        "key": "org-chart",
        "label": "Organigramm",
        "path": "/org-chart",
        "icon": "Network",
        "section": "Hauptbereich",
        "order": 4,
        "allowed_roles": ["ADMIN", "HR_MANAGER", "IT_ADMIN", "EMPLOYEE"],
        "badge": "Hierarchie",
    },
    {
        "key": "directory",
        "label": "Teamverzeichnis",
        "path": "/directory",
        "icon": "Users",
        "section": "Hauptbereich",
        "order": 5,
        "allowed_roles": ["ADMIN", "HR_MANAGER", "IT_ADMIN", "EMPLOYEE"],
        "badge": None,
    },
    {
        "key": "kantine",
        "label": "Kantine (Speiseplan)",
        "path": "/kantine",
        "icon": "UtensilsCrossed",
        "section": "Hauptbereich",
        "order": 6,
        "allowed_roles": ["ADMIN", "HR_MANAGER", "IT_ADMIN", "EMPLOYEE"],
        "badge": "Menü",
    },
    {
        "key": "gps",
        "label": "GPS (Fahrzeugortung)",
        "path": "/gps",
        "icon": "Navigation",
        "section": "Hauptbereich",
        "order": 7,
        "allowed_roles": ["ADMIN", "HR_MANAGER", "IT_ADMIN", "EMPLOYEE"],
        "badge": "Live",
    },
    {
        "key": "vertrieb",
        "label": "Vertrieb & Sales",
        "path": "/vertrieb",
        "icon": "TrendingUp",
        "section": "Hauptbereich",
        "order": 8,
        "allowed_roles": ["ADMIN", "HR_MANAGER", "IT_ADMIN", "EMPLOYEE"],
        "badge": None,
    },
    {
        "key": "technik",
        "label": "Technik & Geräte",
        "path": "/technik",
        "icon": "Cpu",
        "section": "Hauptbereich",
        "order": 9,
        "allowed_roles": ["ADMIN", "HR_MANAGER", "IT_ADMIN", "EMPLOYEE"],
        "badge": None,
    },
    {
        "key": "abwicklung",
        "label": "Auftragsabwicklung",
        "path": "/abwicklung",
        "icon": "ClipboardCheck",
        "section": "Hauptbereich",
        "order": 10,
        "allowed_roles": ["ADMIN", "HR_MANAGER", "IT_ADMIN", "EMPLOYEE"],
        "badge": "Prozess",
    },
    {
        "key": "planung",
        "label": "Ressourcen & Planung",
        "path": "/planung",
        "icon": "CalendarClock",
        "section": "Hauptbereich",
        "order": 11,
        "allowed_roles": ["ADMIN", "HR_MANAGER", "IT_ADMIN", "EMPLOYEE"],
        "badge": None,
    },
    {
        "key": "schulungen",
        "label": "Schulungen & KI",
        "path": "/schulungen",
        "icon": "GraduationCap",
        "section": "Hauptbereich",
        "order": 12,
        "allowed_roles": ["ADMIN", "HR_MANAGER", "IT_ADMIN", "EMPLOYEE"],
        "badge": "KI Bot",
    },

    # 2. Arbeitsbereich / Workplace (Alle Rollen)
    {
        "key": "documents",
        "label": "Dokumentenablage",
        "path": "/documents",
        "icon": "FolderOpen",
        "section": "Arbeitsbereich",
        "order": 13,
        "allowed_roles": ["ADMIN", "HR_MANAGER", "IT_ADMIN", "EMPLOYEE"],
        "badge": None,
    },
    {
        "key": "calendar",
        "label": "Unternehmenskalender",
        "path": "/calendar",
        "icon": "Calendar",
        "section": "Arbeitsbereich",
        "order": 14,
        "allowed_roles": ["ADMIN", "HR_MANAGER", "IT_ADMIN", "EMPLOYEE"],
        "badge": None,
        "is_active": False,
    },

    # 3. Personal & HR (HR_MANAGER & ADMIN)
    {
        "key": "hr-requests",
        "label": "Anträge & Urlaub",
        "path": "/hr/requests",
        "icon": "Clock",
        "section": "Personal & HR",
        "order": 15,
        "allowed_roles": ["ADMIN", "HR_MANAGER"],
        "badge": "Ausstehend",
    },
    {
        "key": "performance",
        "label": "Feedback & Klima",
        "path": "/hr/performance",
        "icon": "Award",
        "section": "Personal & HR",
        "order": 16,
        "allowed_roles": ["ADMIN", "HR_MANAGER"],
        "badge": None,
    },

    # 4. IT & Systeme (IT_ADMIN & ADMIN)
    {
        "key": "it-management",
        "label": "IT-Infrastruktur & Sicherheit",
        "path": "/it/management",
        "icon": "Server",
        "section": "IT & Systeme",
        "order": 17,
        "allowed_roles": ["ADMIN", "IT_ADMIN"],
        "badge": "IT Admin",
    },
    {
        "key": "it-helpdesk",
        "label": "IT-Helpdesk & Tickets",
        "path": "/tickets",
        "icon": "Headphones",
        "section": "IT & Systeme",
        "order": 18,
        "allowed_roles": ["ADMIN", "HR_MANAGER", "IT_ADMIN", "EMPLOYEE"],
        "badge": "Helpdesk",
    },

    # 5. Administration (SuperAdmin / ADMIN)
    {
        "key": "admin-users",
        "label": "Benutzerverwaltung",
        "path": "/admin/users",
        "icon": "UserCog",
        "section": "Administration",
        "order": 19,
        "allowed_roles": ["ADMIN"],
        "badge": "Admin",
    },
    {
        "key": "admin-roles",
        "label": "Rollen & Berechtigungen",
        "path": "/admin/roles",
        "icon": "ShieldCheck",
        "section": "Administration",
        "order": 20,
        "allowed_roles": ["ADMIN"],
        "badge": "RBAC",
    },
    {
        "key": "admin-settings",
        "label": "Intranet-Einstellungen",
        "path": "/admin/settings",
        "icon": "Sliders",
        "section": "Administration",
        "order": 21,
        "allowed_roles": ["ADMIN"],
        "badge": None,
    }
]

SECTION_MIGRATION_MAP = {
    "Principal": "Hauptbereich",
    "Espacio de Trabajo": "Arbeitsbereich",
    "Gestión & RRHH": "Personal & HR",
    "Gesti\u00f3n & RRHH": "Personal & HR",
    "Administración": "Administration",
    "Administraci\u00f3n": "Administration",
}

def migrate_menu_items_to_german(db: Session):
    """
    Safely migrates legacy Spanish menu labels, sections, and badges to German in database.
    Preserves custom ordering and active status.
    """
    default_dict = {item["key"]: item for item in DEFAULT_MENUS}
    existing_items = db.query(MenuItem).all()
    updated = False

    for item in existing_items:
        if item.key in default_dict:
            src = default_dict[item.key]
            # If section is in Spanish migration map, update to German
            if item.section in SECTION_MIGRATION_MAP:
                item.section = SECTION_MIGRATION_MAP[item.section]
                updated = True
            elif not item.section:
                item.section = src["section"]
                updated = True

            # If label has legacy Spanish text, update to German
            spanish_labels = {
                "Dashboard Principal", "Comunicados & Noticias", "Directorio de Equipo",
                "Gestor Documental", "Calendario Corporativo", "Solicitudes & Vacaciones",
                "Evaluaciones & Clima", "Gestión de Usuarios", "Gesti\u00f3n de Usuarios",
                "Configuración Intranet", "Configuraci\u00f3n Intranet"
            }
            if item.label in spanish_labels:
                item.label = src["label"]
                updated = True

            # Clear fake static counter badges for announcements
            if item.key == "announcements" or item.badge in ["3 Nuevos", "3 Neue", "3 Neu"]:
                if item.badge is not None:
                    item.badge = None
                    updated = True
            elif item.badge == "Pendientes":
                item.badge = "Ausstehend"
                updated = True

    if updated:
        db.commit()

def get_navigation_for_role(db: Session, user_role: Any, current_user: Optional[User] = None) -> NavigationResponse:
    """
    Returns grouped navigation sections filtered by:
    1. Role hierarchy (RoleEnum or str)
    2. Granular module permissions (current_user.allowed_modules or current_user.custom_role)
    """
    user_role_str = user_role.value if hasattr(user_role, 'value') else str(user_role)
    is_admin = user_role_str == "ADMIN" or user_role == RoleEnum.ADMIN

    db_items = db.query(MenuItem).filter(MenuItem.is_active == True).order_by(MenuItem.order).all()
    
    # If no items in DB yet, fallback to DEFAULT_MENUS
    items_to_filter = []
    if db_items:
        items_to_filter = [
            MenuItemResponse(
                id=item.id,
                key=item.key,
                label=item.label,
                path=item.path,
                icon=item.icon,
                section=item.section,
                order=item.order,
                allowed_roles=item.allowed_roles or [],
                badge=item.badge,
                is_active=item.is_active
            )
            for item in db_items
        ]
    else:
        items_to_filter = [
            MenuItemResponse(
                id=idx + 1,
                key=item_data["key"],
                label=item_data["label"],
                path=item_data["path"],
                icon=item_data["icon"],
                section=item_data["section"],
                order=item_data["order"],
                allowed_roles=item_data["allowed_roles"],
                badge=item_data["badge"],
                is_active=item_data.get("is_active", True)
            )
            for idx, item_data in enumerate(DEFAULT_MENUS)
            if item_data.get("is_active", True)
        ]
    
    # Filter by user role & individual module permissions
    filtered_items: List[MenuItemResponse] = []

    # If current_user has granular restrictions:
    user_allowed_modules = current_user.allowed_modules if (current_user and current_user.allowed_modules is not None) else None
    role_permissions = current_user.custom_role.permissions if (current_user and current_user.custom_role and current_user.custom_role.permissions) else None

    for item in items_to_filter:
        # 1. Role Check
        role_allowed = is_admin or user_role_str in item.allowed_roles
        if not role_allowed:
            continue

        # 2. Granular Module Permission Check
        if not is_admin:
            # Core navigation items (dashboard, announcements) are always visible
            if item.key not in ["dashboard", "announcements"] and item.key in CONTROLLABLE_MODULE_KEYS:
                # Explicit user override takes highest precedence
                if user_allowed_modules is not None:
                    if item.key not in user_allowed_modules:
                        continue
                # Next, check custom role permission matrix
                elif role_permissions is not None:
                    perm = role_permissions.get(item.key, "read")
                    if perm == "none":
                        continue

        filtered_items.append(item)
            
    # Group into sections
    sections_map = {}
    for item in filtered_items:
        sec = item.section
        if sec not in sections_map:
            sections_map[sec] = []
        sections_map[sec].append(item)
        
    sections = [
        NavigationSection(section=section_name, items=items)
        for section_name, items in sections_map.items()
    ]
    
    return NavigationResponse(sections=sections, user_role=user_role_str)
