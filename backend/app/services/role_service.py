from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from app.models.role import Role
from app.models.user import User, RoleEnum
from app.schemas.role import (
    RoleResponse, 
    PermissionLevelOption, 
    PermissionModuleItem, 
    PermissionsCatalogResponse
)

PERMISSION_LEVELS: List[PermissionLevelOption] = [
    PermissionLevelOption(
        key="none",
        label="Kein Zugriff",
        description="Das Modul ist komplett ausgeblendet und der Zugriff wird verweigert."
    ),
    PermissionLevelOption(
        key="read",
        label="Nur Lesen",
        description="Benutzer können Daten, Tabellen und Berichte einsehen, jedoch keine Änderungen vornehmen."
    ),
    PermissionLevelOption(
        key="read_write",
        label="Lesen & Bearbeiten",
        description="Benutzer können Einträge einsehen, neue Daten erfassen und eigene Vorgänge bearbeiten."
    ),
    PermissionLevelOption(
        key="admin",
        label="Vollzugriff / Admin",
        description="Umfassende Administrationsrechte inklusive Löschen, Konfiguration und Exporten."
    ),
]

SYSTEM_MODULES: List[PermissionModuleItem] = [
    # 1. Hauptbereich
    PermissionModuleItem(
        key="kantine",
        label="Kantine (Speiseplan & Bestellung)",
        category="Hauptbereich",
        icon="UtensilsCrossed",
        description="Wochenspeiseplan, Essensvorbestellungen und Nährwertangaben.",
        default_level="read_write"
    ),
    PermissionModuleItem(
        key="gps",
        label="GPS (Fahrzeugortung & Flotte)",
        category="Hauptbereich",
        icon="Navigation",
        description="Live-Flottenverfolgung, Routen und Baustellenanlieferungen.",
        default_level="read"
    ),
    PermissionModuleItem(
        key="vertrieb",
        label="Vertrieb & Kalkulation",
        category="Hauptbereich",
        icon="TrendingUp",
        description="Vertriebs-Dashboard, Kundenangebote und CRM-Kennzahlen.",
        default_level="read_write"
    ),
    PermissionModuleItem(
        key="technik",
        label="Technik & Instandhaltung",
        category="Hauptbereich",
        icon="Cpu",
        description="Geräteverwaltung, Maschinen-Wartungsintervalle und CAD-Systeme.",
        default_level="read_write"
    ),
    PermissionModuleItem(
        key="abwicklung",
        label="Auftragsabwicklung & QS",
        category="Hauptbereich",
        icon="ClipboardCheck",
        description="Fertigungsprozess, Statik-Freigaben und Beton-Druckprüfungen.",
        default_level="read_write"
    ),
    PermissionModuleItem(
        key="planung",
        label="Ressourcen- & Projektplanung",
        category="Hauptbereich",
        icon="CalendarClock",
        description="Kapazitätsplanung, Schichtpläne und Baustellen-Terminierung.",
        default_level="read_write"
    ),
    PermissionModuleItem(
        key="schulungen",
        label="Schulungen & KI-Wissensassistent",
        category="Hauptbereich",
        icon="GraduationCap",
        description="Benutzerhandbücher, Sicherheitsunterweisungen und RAG-Chatbot.",
        default_level="read_write"
    ),
    PermissionModuleItem(
        key="phone-directory",
        label="Telefonverzeichnis",
        category="Hauptbereich",
        icon="PhoneCall",
        description="Interne Durchwahlen, Mobilnummern und Schnellkontakte.",
        default_level="read"
    ),
    PermissionModuleItem(
        key="org-chart",
        label="Organigramm & Hierarchie",
        category="Hauptbereich",
        icon="Network",
        description="Unternehmenshierarchie und Abteilungsstruktur.",
        default_level="read"
    ),
    PermissionModuleItem(
        key="directory",
        label="Team- & Mitarbeiterverzeichnis",
        category="Hauptbereich",
        icon="Users",
        description="Kollegenübersicht, Standorte und Abteilungsfilter.",
        default_level="read"
    ),

    # 2. Arbeitsbereich
    PermissionModuleItem(
        key="documents",
        label="Dokumentenablage & KI-Suche",
        category="Arbeitsbereich",
        icon="FolderOpen",
        description="Zentraler Speicher für Verträge, Richtlinien und semantische KI-Suche.",
        default_level="read"
    ),
    PermissionModuleItem(
        key="calendar",
        label="Unternehmensweiter Kalender",
        category="Arbeitsbereich",
        icon="Calendar",
        description="Terminplanung, Firmen-Events, Feiertage und iCal-Abonnement.",
        default_level="read_write"
    ),

    # 3. Personal & HR
    PermissionModuleItem(
        key="hr-requests",
        label="Anträge & Urlaubsverwaltung",
        category="Personal & HR",
        icon="ClipboardCheck",
        description="Urlaubsanträge, Gleitzeitausgleich und Krankmeldungen.",
        default_level="read_write"
    ),
    PermissionModuleItem(
        key="performance",
        label="Feedback & Mitarbeiterklima",
        category="Personal & HR",
        icon="Smile",
        description="Mitarbeiterbefragungen, Puls-Checks und Leistungsfeedback.",
        default_level="read"
    ),

    # 4. IT & Systeme
    PermissionModuleItem(
        key="it-management",
        label="IT-Infrastruktur & Sicherheit",
        category="IT & Systeme",
        icon="Server",
        description="Serverstatus, VPN-Tunnel, Firewall und Lizenzverwaltung.",
        default_level="none"
    ),
    PermissionModuleItem(
        key="it-helpdesk",
        label="IT-Helpdesk & Support-Tickets",
        category="IT & Systeme",
        icon="Headphones",
        description="Ticketerstellung, Störungsmeldungen und Service Level Agreements.",
        default_level="read_write"
    ),

    # 5. Administration
    PermissionModuleItem(
        key="admin-users",
        label="Benutzerverwaltung (CRUD & Profile)",
        category="Administration",
        icon="UserCog",
        description="Mitarbeiter anlegen, Rollen zuweisen, Passwörter & Avatare verwalten.",
        default_level="none"
    ),
    PermissionModuleItem(
        key="admin-roles",
        label="Rollen & Berechtigungs-Matrix (RBAC)",
        category="Administration",
        icon="ShieldCheck",
        description="Rollen erstellen, Rechte pro Modul konfigurieren und Berechtigungen steuern.",
        default_level="none"
    ),
    PermissionModuleItem(
        key="admin-settings",
        label="Systemkonfiguration & Audit-Logs",
        category="Administration",
        icon="Sliders",
        description="Globale Intranet-Parameter, Branding und Sicherheitsaudits.",
        default_level="none"
    )
]

ALL_MODULE_KEYS = [m.key for m in SYSTEM_MODULES]

DEFAULT_SYSTEM_ROLES_CONFIG = [
    {
        "name": "SuperAdmin",
        "slug": "ADMIN",
        "description": "Vollzugriff auf alle Unternehmensmodule, Benutzerverwaltung, Rollen-Matrix und Systemkonfiguration.",
        "is_system_role": True,
        "permissions": {k: "admin" for k in ALL_MODULE_KEYS}
    },
    {
        "name": "HR-Manager",
        "slug": "HR_MANAGER",
        "description": "Verwaltung von Personalthemen, Urlaubsanträgen, Teamübersichten und Mitarbeiterdokumenten.",
        "is_system_role": True,
        "permissions": {
            "kantine": "read_write",
            "gps": "read",
            "vertrieb": "read",
            "technik": "read",
            "abwicklung": "read",
            "planung": "read_write",
            "schulungen": "read_write",
            "phone-directory": "read_write",
            "org-chart": "read_write",
            "directory": "read_write",
            "documents": "read_write",
            "calendar": "admin",
            "hr-requests": "admin",
            "performance": "admin",
            "it-management": "none",
            "it-helpdesk": "read_write",
            "admin-users": "read",
            "admin-roles": "none",
            "admin-settings": "none",
        }
    },
    {
        "name": "IT-Administrator",
        "slug": "IT_ADMIN",
        "description": "Verwaltung der IT-Infrastruktur, Serverüberwachung, Helpdesk-Tickets, Technik und Sicherheitsleitfäden.",
        "is_system_role": True,
        "permissions": {
            "kantine": "read_write",
            "gps": "read_write",
            "vertrieb": "read",
            "technik": "admin",
            "abwicklung": "read",
            "planung": "read",
            "schulungen": "admin",
            "phone-directory": "read_write",
            "org-chart": "read",
            "directory": "read",
            "documents": "admin",
            "calendar": "read_write",
            "hr-requests": "read",
            "performance": "read",
            "it-management": "admin",
            "it-helpdesk": "admin",
            "admin-users": "read_write",
            "admin-roles": "none",
            "admin-settings": "read",
        }
    },
    {
        "name": "Mitarbeiter",
        "slug": "EMPLOYEE",
        "description": "Standardzugriff auf alle täglichen Arbeitsmodule, Kantine, Schulungen, Kalender und IT-Support.",
        "is_system_role": True,
        "permissions": {
            "kantine": "read_write",
            "gps": "read",
            "vertrieb": "read",
            "technik": "read",
            "abwicklung": "read_write",
            "planung": "read_write",
            "schulungen": "read",
            "phone-directory": "read",
            "org-chart": "read",
            "directory": "read",
            "documents": "read",
            "calendar": "read_write",
            "hr-requests": "read_write",
            "performance": "read",
            "it-management": "none",
            "it-helpdesk": "read_write",
            "admin-users": "none",
            "admin-roles": "none",
            "admin-settings": "none",
        }
    },
    {
        "name": "Vertriebsleiter",
        "slug": "SALES_LEAD",
        "description": "Erweiterte Zugriffsrechte für Vertriebs-Dashboards, Baustellen-Disposition und Auftragsabwicklung.",
        "is_system_role": False,
        "permissions": {
            "kantine": "read_write",
            "gps": "read_write",
            "vertrieb": "admin",
            "technik": "read",
            "abwicklung": "read_write",
            "planung": "read_write",
            "schulungen": "read_write",
            "phone-directory": "read",
            "org-chart": "read",
            "directory": "read",
            "documents": "read_write",
            "calendar": "read_write",
            "hr-requests": "read_write",
            "performance": "read",
            "it-management": "none",
            "it-helpdesk": "read_write",
            "admin-users": "none",
            "admin-roles": "none",
            "admin-settings": "none",
        }
    },
    {
        "name": "Werkstudent / Praktikant",
        "slug": "WORKING_STUDENT",
        "description": "Eingeschränkter Lesezugriff auf ausgewählte Hauptbereich-Module, Firmenkalender und Schulungsassistent.",
        "is_system_role": False,
        "permissions": {
            "kantine": "read_write",
            "gps": "none",
            "vertrieb": "none",
            "technik": "read",
            "abwicklung": "read",
            "planung": "read",
            "schulungen": "read",
            "phone-directory": "read",
            "org-chart": "read",
            "directory": "read",
            "documents": "read",
            "calendar": "read",
            "hr-requests": "read",
            "performance": "none",
            "it-management": "none",
            "it-helpdesk": "read_write",
            "admin-users": "none",
            "admin-roles": "none",
            "admin-settings": "none",
        }
    }
]

def seed_default_roles(db: Session):
    """Ensures all default system and template roles are seeded and linked."""
    for role_cfg in DEFAULT_SYSTEM_ROLES_CONFIG:
        existing = db.query(Role).filter(Role.slug == role_cfg["slug"]).first()
        if not existing:
            role = Role(
                name=role_cfg["name"],
                slug=role_cfg["slug"],
                description=role_cfg["description"],
                is_system_role=role_cfg["is_system_role"],
                permissions=role_cfg["permissions"]
            )
            db.add(role)
            db.flush()
        else:
            # Update permissions if missing keys
            perms = dict(existing.permissions or {})
            updated = False
            for k, default_lvl in role_cfg["permissions"].items():
                if k not in perms:
                    perms[k] = default_lvl
                    updated = True
            if updated:
                existing.permissions = perms

    db.commit()

    # Link existing users without custom_role_id to their matching role by RoleEnum
    roles_by_slug = {r.slug: r.id for r in db.query(Role).all()}
    users = db.query(User).filter(User.custom_role_id == None).all()
    for u in users:
        role_slug = u.role.value if hasattr(u.role, 'value') else str(u.role)
        if role_slug in roles_by_slug:
            u.custom_role_id = roles_by_slug[role_slug]

    db.commit()
    print("Seed: Dynamic RBAC Roles and default permission matrices successfully verified.")
