from fastapi import APIRouter
from app.api.v1.endpoints import (
    auth, 
    navigation, 
    dashboard, 
    news,
    languages,
    settings,
    users, 
    calendar, 
    documents, 
    admin_users,
    admin_roles,
    schulungen,
    tickets,
    canteen,
    ai,
    perseus,
    search,
    fleet,
    public_tracking
)

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["Authentifizierung & Anmeldung"])
api_router.include_router(navigation.router, prefix="/navigation", tags=["Dynamische Navigation & Menüs"])
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["Unternehmens-Dashboard"])
api_router.include_router(news.router, prefix="/news", tags=["Unternehmensnews & Mitteilungen"])
api_router.include_router(languages.router, prefix="/languages", tags=["Sprachverwaltung (i18n)"])
api_router.include_router(settings.router, prefix="/settings", tags=["System-Einstellungen & Integrationen"])
api_router.include_router(users.router, prefix="/users", tags=["Mitarbeiterverzeichnis & Benutzer"])
api_router.include_router(calendar.router, prefix="/calendar", tags=["Unternehmenskalender"])
api_router.include_router(documents.router, prefix="/documents", tags=["Dokumentenverwaltung & KI-Suche"])
api_router.include_router(canteen.router, prefix="/canteen", tags=["Kantine & Speiseplan"])
api_router.include_router(ai.router, prefix="/ai", tags=["Google Gemini KI-Dienste"])
api_router.include_router(perseus.router, prefix="/security/perseus", tags=["Perseus Security & Awareness Hub"])
api_router.include_router(search.router, prefix="/search", tags=["Globale Intranet-Suche"])
api_router.include_router(admin_users.router, prefix="/admin/users", tags=["SuperAdmin Benutzerverwaltung"])
api_router.include_router(admin_roles.router, prefix="/admin/roles", tags=["SuperAdmin Rollen- & Berechtigungsverwaltung"])
api_router.include_router(languages.admin_router, prefix="/admin/languages", tags=["SuperAdmin Sprachverwaltung"])
api_router.include_router(settings.admin_router, prefix="/admin/settings", tags=["SuperAdmin System-Einstellungen"])
api_router.include_router(calendar.admin_router, prefix="/admin/calendar-sources", tags=["SuperAdmin Kalender-Quellen"])
api_router.include_router(navigation.admin_router, prefix="/admin/menu", tags=["SuperAdmin Menüverwaltung"])
api_router.include_router(schulungen.router, prefix="/schulungen", tags=["Schulungen & KI-Chatbot"])
api_router.include_router(tickets.router, prefix="/tickets", tags=["Helpdesk & Ticket-System"])
api_router.include_router(fleet.router, prefix="/fleet", tags=["Flottenortung & GPS Telemetrie (Navkonzept)"])
api_router.include_router(public_tracking.router, prefix="/public", tags=["Öffentliche Live-Lieferverfolgung (Baustelle / ETA)"])
