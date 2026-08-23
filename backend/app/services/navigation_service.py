from typing import List, Optional, Any
from sqlalchemy.orm import Session
from app.models.menu import MenuItem
from app.models.user import User, RoleEnum
from app.schemas.navigation import NavigationResponse, NavigationSection, MenuItemResponse

# System modules definitions for Granular Permissions Matrix
AVAILABLE_MODULES = [
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
        "key": "schulungen",
        "label": "Schulungen & Handbücher",
        "category": "Hauptbereich",
        "icon": "GraduationCap",
        "description": "Benutzerhandbücher, Videoanleitungen und interaktiver KI-Support-Chatbot."
    },
    {
        "key": "admin-roles",
        "label": "Rollen & Berechtigungen",
        "category": "Administration",
        "icon": "ShieldCheck",
        "description": "Rollen definieren, RBAC-Matrix anpassen und Berechtigungsstufen steuern."
    }
]

CONTROLLABLE_MODULE_KEYS = [m["key"] for m in AVAILABLE_MODULES]

# Default system menu structure
DEFAULT_MENUS = [
    # 1. Hauptbereich (Alle Rollen)
    {
        "key": "dashboard",
        "label": "Dashboard Principal",
        "path": "/",
        "icon": "LayoutDashboard",
        "section": "Principal",
        "order": 1,
        "allowed_roles": ["ADMIN", "HR_MANAGER", "IT_ADMIN", "EMPLOYEE"],
        "badge": None,
    },
    {
        "key": "announcements",
        "label": "Comunicados & Noticias",
        "path": "/announcements",
        "icon": "Megaphone",
        "section": "Principal",
        "order": 2,
        "allowed_roles": ["ADMIN", "HR_MANAGER", "IT_ADMIN", "EMPLOYEE"],
        "badge": "3 Nuevos",
    },
    {
        "key": "phone-directory",
        "label": "Telefonverzeichnis",
        "path": "/phone-directory",
        "icon": "PhoneCall",
        "section": "Principal",
        "order": 3,
        "allowed_roles": ["ADMIN", "HR_MANAGER", "IT_ADMIN", "EMPLOYEE"],
        "badge": None,
    },
    {
        "key": "org-chart",
        "label": "Organigramm",
        "path": "/org-chart",
        "icon": "Network",
        "section": "Principal",
        "order": 4,
        "allowed_roles": ["ADMIN", "HR_MANAGER", "IT_ADMIN", "EMPLOYEE"],
        "badge": "Hierarchie",
    },
    {
        "key": "directory",
        "label": "Directorio de Equipo",
        "path": "/directory",
        "icon": "Users",
        "section": "Principal",
        "order": 5,
        "allowed_roles": ["ADMIN", "HR_MANAGER", "IT_ADMIN", "EMPLOYEE"],
        "badge": None,
    },
    {
        "key": "kantine",
        "label": "Kantine (Speiseplan)",
        "path": "/kantine",
        "icon": "UtensilsCrossed",
        "section": "Principal",
        "order": 6,
        "allowed_roles": ["ADMIN", "HR_MANAGER", "IT_ADMIN", "EMPLOYEE"],
        "badge": "Menü",
    },
    {
        "key": "gps",
        "label": "GPS (Fahrzeugortung)",
        "path": "/gps",
        "icon": "Navigation",
        "section": "Principal",
        "order": 7,
        "allowed_roles": ["ADMIN", "HR_MANAGER", "IT_ADMIN", "EMPLOYEE"],
        "badge": "Live",
    },
    {
        "key": "vertrieb",
        "label": "Vertrieb (Sales-Dashboard)",
        "path": "/vertrieb",
        "icon": "TrendingUp",
        "section": "Principal",
        "order": 8,
        "allowed_roles": ["ADMIN", "HR_MANAGER", "IT_ADMIN", "EMPLOYEE"],
        "badge": None,
    },
    {
        "key": "technik",
        "label": "Technik (Geräte & Support)",
        "path": "/technik",
        "icon": "Cpu",
        "section": "Principal",
        "order": 9,
        "allowed_roles": ["ADMIN", "HR_MANAGER", "IT_ADMIN", "EMPLOYEE"],
        "badge": None,
    },
    {
        "key": "abwicklung",
        "label": "Abwicklung (Auftragsprozesse)",
        "path": "/abwicklung",
        "icon": "ClipboardCheck",
        "section": "Principal",
        "order": 10,
        "allowed_roles": ["ADMIN", "HR_MANAGER", "IT_ADMIN", "EMPLOYEE"],
        "badge": "Prozess",
    },
    {
        "key": "planung",
        "label": "Planung (Ressourcen & Projekte)",
        "path": "/planung",
        "icon": "CalendarClock",
        "section": "Principal",
        "order": 11,
        "allowed_roles": ["ADMIN", "HR_MANAGER", "IT_ADMIN", "EMPLOYEE"],
        "badge": None,
    },
    {
        "key": "schulungen",
        "label": "Schulungen & KI-Chatbot",
        "path": "/schulungen",
        "icon": "GraduationCap",
        "section": "Principal",
        "order": 12,
        "allowed_roles": ["ADMIN", "HR_MANAGER", "IT_ADMIN", "EMPLOYEE"],
        "badge": "KI Bot",
    },

    # 2. Arbeitsbereich / Workplace (Alle Rollen)
    {
        "key": "documents",
        "label": "Gestor Documental",
        "path": "/documents",
        "icon": "FolderOpen",
        "section": "Espacio de Trabajo",
        "order": 12,
        "allowed_roles": ["ADMIN", "HR_MANAGER", "IT_ADMIN", "EMPLOYEE"],
        "badge": None,
    },
    {
        "key": "calendar",
        "label": "Calendario Corporativo",
        "path": "/calendar",
        "icon": "Calendar",
        "section": "Espacio de Trabajo",
        "order": 13,
        "allowed_roles": ["ADMIN", "HR_MANAGER", "IT_ADMIN", "EMPLOYEE"],
        "badge": None,
        "is_active": False,
    },

    # 3. Personal & HR (HR_MANAGER & ADMIN)
    {
        "key": "hr-requests",
        "label": "Solicitudes & Vacaciones",
        "path": "/hr/requests",
        "icon": "Clock",
        "section": "Gestión & RRHH",
        "order": 14,
        "allowed_roles": ["ADMIN", "HR_MANAGER"],
        "badge": "Pendientes",
    },
    {
        "key": "performance",
        "label": "Evaluaciones & Clima",
        "path": "/hr/performance",
        "icon": "Award",
        "section": "Gestión & RRHH",
        "order": 15,
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
        "order": 16,
        "allowed_roles": ["ADMIN", "IT_ADMIN"],
        "badge": "IT Admin",
    },
    {
        "key": "it-helpdesk",
        "label": "IT-Helpdesk & Tickets",
        "path": "/tickets",
        "icon": "Headphones",
        "section": "IT & Systeme",
        "order": 17,
        "allowed_roles": ["ADMIN", "HR_MANAGER", "IT_ADMIN", "EMPLOYEE"],
        "badge": "Helpdesk",
    },

    # 5. Administration (SuperAdmin / ADMIN)
    {
        "key": "admin-users",
        "label": "Gestión de Usuarios",
        "path": "/admin/users",
        "icon": "UserCog",
        "section": "Administración",
        "order": 17,
        "allowed_roles": ["ADMIN"],
        "badge": "Admin",
    },
    {
        "key": "admin-roles",
        "label": "Rollen & Berechtigungen",
        "path": "/admin/roles",
        "icon": "ShieldCheck",
        "section": "Administración",
        "order": 18,
        "allowed_roles": ["ADMIN"],
        "badge": "RBAC",
    },
    {
        "key": "admin-settings",
        "label": "Configuración Intranet",
        "path": "/admin/settings",
        "icon": "Sliders",
        "section": "Administración",
        "order": 19,
        "allowed_roles": ["ADMIN"],
        "badge": None,
    }
]

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
