import os
import json
import logging
from datetime import date
from typing import Optional, Dict, Any, List
from fastapi import HTTPException, status
from app.core.config import settings

logger = logging.getLogger("ai_service")

def get_iso_week_dates(year: int, week: int) -> List[str]:
    """Calculates Monday through Friday YYYY-MM-DD for given ISO week and year."""
    try:
        mon = date.fromisocalendar(year, week, 1)
        return [date.fromisocalendar(year, week, i + 1).strftime("%Y-%m-%d") for i in range(5)]
    except Exception:
        today = date.today()
        return [today.strftime("%Y-%m-%d")] * 5

def get_gemini_client():
    """Returns an authenticated Gemini GenAI client or raises 503 if not configured."""
    api_key = settings.GEMINI_API_KEY or os.getenv("GEMINI_API_KEY")
    if not api_key or not api_key.strip():
        logger.warning("Gemini AI API Key not configured in settings or environment.")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="KI-Dienst nicht konfiguriert: Google Gemini API-Schlüssel fehlt. Bitte tragen Sie GEMINI_API_KEY in der Umgebungskonfiguration ein."
        )

    try:
        from google import genai
        return genai.Client(api_key=api_key.strip())
    except ImportError as e:
        logger.error(f"google-genai SDK import failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="KI-Dienst nicht verfügbar: Google GenAI SDK ist nicht installiert."
        )
    except Exception as e:
        logger.error(f"Error initializing Gemini client: {e}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Fehler bei der Initialisierung des KI-Dienstes: {str(e)}"
        )

def analyze_and_suggest_ticket_solution(
    title: str,
    description: str,
    category: Optional[str] = None,
    kb_context: Optional[str] = None
) -> Dict[str, Any]:
    """
    Analyzes an enterprise support ticket using Gemini 2.5 Flash.
    Returns suggested category, priority, immediate troubleshooting steps, root cause, and draft response.
    """
    client = get_gemini_client()
    from google.genai import types

    system_instruction = (
        "Du bist der leitende KI-Support-Ingenieur für das Intranet der Tiglev Elementfabrik "
        "(Hersteller von Betonfertigteilen, Spannbeton, CAD/BIM-Planung und Werkslogistik). "
        "Analysiere Störungsmeldungen präzise, technisch fundiert, hilfsbereit und auf Deutsch. "
        "Erstelle eine genaue Problemursachen-Analyse, 2 bis 4 konkrete Sofortmaßnahmen zur Lösung "
        "und einen freundlichen, professionellen Antwortentwurf für den Mitarbeiter."
    )

    prompt = f"""
Bitte analysiere folgendes Support-Ticket:

Titel: {title}
Problembeschreibung:
{description}
Vom Benutzer gewählte Kategorie: {category or 'Nicht spezifiziert'}
Kontext aus bestehender Wissensdatenbank:
{kb_context or 'Keine Vorkenntnisse / Neuer Vorfall'}

Gib das Ergebnis STRENG als valides JSON-Objekt mit folgender Struktur zurück:
{{
  "suggested_category": "IT_SUPPORT" | "HARDWARE" | "SOFTWARE" | "VERTRIEB" | "GEBAEUDE" | "ALLGEMEIN",
  "suggested_priority": "NIEDRIG" | "MITTEL" | "HOCH" | "KRITISCH",
  "immediate_steps": [
    "1. Schritt...",
    "2. Schritt..."
  ],
  "possible_root_cause": "Kurze, präzise technische oder organisatorische Ursachenanalyse.",
  "draft_response": "Hallo [Name],\n\nvielen Dank für Ihre Meldung...\n\nMit freundlichen Grüßen,\nIhr Support-Team"
}}
"""

    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
            config=types.GenerateContentConfig(
                system_instruction=system_instruction,
                response_mime_type="application/json",
                temperature=0.2,
            )
        )

        raw_text = response.text.strip()
        parsed = json.loads(raw_text)

        valid_categories = {"IT_SUPPORT", "HARDWARE", "SOFTWARE", "VERTRIEB", "GEBAEUDE", "ALLGEMEIN"}
        valid_priorities = {"NIEDRIG", "MITTEL", "HOCH", "KRITISCH"}

        sug_cat = parsed.get("suggested_category", "IT_SUPPORT")
        if sug_cat not in valid_categories:
            sug_cat = "IT_SUPPORT"

        sug_prio = parsed.get("suggested_priority", "MITTEL")
        if sug_prio not in valid_priorities:
            sug_prio = "MITTEL"

        return {
            "suggested_category": sug_cat,
            "suggested_priority": sug_prio,
            "immediate_steps": parsed.get("immediate_steps", []),
            "possible_root_cause": parsed.get("possible_root_cause", ""),
            "draft_response": parsed.get("draft_response", "")
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Gemini API call failed for ticket analysis: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Fehler bei der Kommunikation mit dem KI-Modell: {str(e)}"
        )

def generate_weekly_canteen_menu(
    calendar_week: int,
    year: int,
    theme_or_notes: Optional[str] = None
) -> Dict[str, Any]:
    """
    Generates a balanced 5-day corporate canteen weekly menu (Monday to Friday) using Gemini 2.5 Flash.
    """
    client = get_gemini_client()
    from google.genai import types

    dates = get_iso_week_dates(year, calendar_week)
    day_names = ["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag"]

    system_instruction = (
        "Du bist der Chefkoch und Menüplaner für das Betriebsrestaurant der Tiglev Elementfabrik in Deutschland/Dänemark. "
        "Erstelle einen abwechslungsreichen, schmackhaften und ausgewogenen Wochen-Speiseplan für Montag bis Freitag. "
        "Jeder Tag muss ein vollwertiges Fleisch-/Fischgericht (Hauptgericht), ein kreatives vegetarisches oder veganes Gericht "
        "sowie ein Dessert oder eine Tagessuppe enthalten. Alle Preise sind in Euro mit €-Symbol formatiert (z. B. '6,90 €', '5,80 €', '1,80 €'). "
        "Gib passende Allergen-Kürzel an (A=Gluten, C=Ei, D=Fisch, F=Soja, G=Milch/Laktose, H=Nüsse, L=Sellerie, M=Senf, N=Sesam)."
    )

    theme_prompt = f"Motto / Besondere Wünsche für diese Woche: {theme_or_notes}" if theme_or_notes else "Motto: Frische regionale und internationale Küche mit saisonalen Zutaten."

    prompt = f"""
Erstelle einen kompletten Wochenspeiseplan für Kalenderwoche {calendar_week} im Jahr {year}.
{theme_prompt}

Tage und zugehörige Daten:
1. Montag ({dates[0]})
2. Dienstag ({dates[1]})
3. Mittwoch ({dates[2]})
4. Donnerstag ({dates[3]})
5. Freitag ({dates[4]})

Gib das Ergebnis STRENG als valides JSON-Objekt mit folgender Struktur zurück:
{{
  "calendar_week": {calendar_week},
  "year": {year},
  "days_data": [
    {{
      "tag": "Montag",
      "datum": "{dates[0]}",
      "gericht_haupt": {{
        "titel": "Klassisches Hähnchenschnitzel Wiener Art",
        "beschreibung": "Mit Pommes Frites oder Kartoffelsalat, Zitrone und Preiselbeeren",
        "preis": "6,90 €",
        "kalorien": "740 kcal",
        "is_vegan": false,
        "is_vegetarian": false
      }},
      "gericht_vegetarisch_vegan": {{
        "titel": "Mediterrane Gemüse-Lasagne",
        "beschreibung": "Mit Zucchini, Auberginen, fruchtiger Tomatensauce und Rucola",
        "preis": "5,80 €",
        "kalorien": "520 kcal",
        "is_vegan": false,
        "is_vegetarian": true
      }},
      "dessert_beilage": {{
        "titel": "Grießpudding mit Waldbeer-Kompott",
        "preis": "1,80 €"
      }},
      "allergene_zusatzstoffe": ["A", "C", "G"]
    }}
    // ... Dienstag, Mittwoch, Donnerstag, Freitag
  ]
}}
"""

    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
            config=types.GenerateContentConfig(
                system_instruction=system_instruction,
                response_mime_type="application/json",
                temperature=0.4,
            )
        )

        raw_text = response.text.strip()
        parsed = json.loads(raw_text)

        days_raw = parsed.get("days_data", [])
        formatted_days = []

        for idx, day_name in enumerate(day_names):
            day_entry = days_raw[idx] if idx < len(days_raw) else {}
            
            # Format Hauptgericht
            gh = day_entry.get("gericht_haupt", {})
            if isinstance(gh, str):
                gh = {"titel": gh, "beschreibung": "", "preis": "6,90 €", "kalorien": "", "is_vegan": False, "is_vegetarian": False}
            else:
                preis_val = gh.get("preis", "6,90 €")
                if isinstance(preis_val, (int, float)):
                    preis_val = f"{preis_val:.2f} €".replace(".", ",")
                gh["preis"] = str(preis_val)

            # Format Veggie
            gveg = day_entry.get("gericht_vegetarisch_vegan", {})
            if isinstance(gveg, str):
                gveg = {"titel": gveg, "beschreibung": "", "preis": "5,80 €", "kalorien": "", "is_vegan": False, "is_vegetarian": True}
            else:
                preis_veg = gveg.get("preis", "5,80 €")
                if isinstance(preis_veg, (int, float)):
                    preis_veg = f"{preis_veg:.2f} €".replace(".", ",")
                gveg["preis"] = str(preis_veg)
                if "is_vegetarian" not in gveg:
                    gveg["is_vegetarian"] = True

            # Format Dessert
            dess = day_entry.get("dessert_beilage", {})
            if isinstance(dess, str):
                dess = {"titel": dess, "preis": "1,80 €"}
            else:
                d_preis = dess.get("preis", "1,80 €")
                if isinstance(d_preis, (int, float)):
                    d_preis = f"{d_preis:.2f} €".replace(".", ",")
                dess["preis"] = str(d_preis)

            allergene = day_entry.get("allergene_zusatzstoffe", [])
            if not isinstance(allergene, list):
                allergene = ["A", "G"]

            formatted_days.append({
                "tag": day_name,
                "datum": dates[idx],
                "gericht_haupt": gh,
                "gericht_vegetarisch_vegan": gveg,
                "dessert_beilage": dess,
                "allergene_zusatzstoffe": allergene
            })

        return {
            "calendar_week": calendar_week,
            "year": year,
            "days_data": formatted_days
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Gemini API call failed for canteen menu generation: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Fehler bei der Menü-Generierung über KI: {str(e)}"
        )
