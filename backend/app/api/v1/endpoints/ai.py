from fastapi import APIRouter, Depends, HTTPException, status
from app.models.user import User
from app.services.auth_service import get_current_user
from app.api.v1.endpoints.canteen import require_canteen_permission
from app.schemas.ai import (
    TicketAISuggestRequest,
    TicketAISuggestResponse,
    CanteenAIGenerateRequest,
    CanteenAIGenerateResponse
)
from app.services.ai_service import (
    analyze_and_suggest_ticket_solution,
    generate_weekly_canteen_menu
)

router = APIRouter()

@router.post("/tickets/suggest", response_model=TicketAISuggestResponse, summary="KI-Lösungsvorschlag & Störungsanalyse für Tickets")
def suggest_ticket_solution(
    payload: TicketAISuggestRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Analysiert Störungstickets mit Google Gemini 2.5 Flash und liefert automatische
    Kategorie-/Prioritäts-Empfehlungen, Sofortmaßnahmen, Ursachenanalyse und einen Antwortentwurf.
    """
    result = analyze_and_suggest_ticket_solution(
        title=payload.title,
        description=payload.description,
        category=payload.category,
        kb_context=payload.kb_context
    )
    return result

@router.post("/canteen/generate", response_model=CanteenAIGenerateResponse, summary="KI-Wochenspeiseplan-Generator für Betriebsrestaurant")
def generate_canteen_menu(
    payload: CanteenAIGenerateRequest,
    current_user: User = Depends(require_canteen_permission)
):
    """
    Generiert einen 5-Tage-Wochenspeiseplan (Montag bis Freitag) mit Hauptgerichten,
    vegetarischen/veganen Alternativen, Desserts, Preisen und Allergen-Deklarationen.
    Erfordert Kantinen-Verwaltungsrechte oder SuperAdmin-Rolle.
    """
    result = generate_weekly_canteen_menu(
        calendar_week=payload.calendar_week,
        year=payload.year,
        theme_or_notes=payload.theme_or_notes
    )
    return result
