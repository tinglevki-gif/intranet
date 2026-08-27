import os
import sys
import unittest
from unittest.mock import MagicMock, patch

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.services import ai_service
from app.core.config import settings

class TestAIServiceUnit(unittest.TestCase):

    def setUp(self):
        settings.GEMINI_API_KEY = "test-mock-gemini-key-12345"

    @patch("google.genai.Client")
    def test_analyze_and_suggest_ticket_solution(self, mock_client_cls):
        mock_client = MagicMock()
        mock_client_cls.return_value = mock_client

        mock_response = MagicMock()
        mock_response.text = """
        {
            "suggested_category": "HARDWARE",
            "suggested_priority": "HOCH",
            "immediate_steps": [
                "1. Netzkabel und DisplayPort-Verbindung am Docking-Hub prüfen",
                "2. Grafiktreiber per Tastenkombination Win+Ctrl+Shift+B neustarten"
            ],
            "possible_root_cause": "Defektes DisplayPort-Kabel oder Firmware-Problem des Thunderbolt-Docks.",
            "draft_response": "Hallo Max,\\n\\nbitte prüfe zuerst die Kabelverbindung..."
        }
        """
        mock_client.models.generate_content.return_value = mock_response

        with patch("app.services.ai_service.get_gemini_client", return_value=mock_client):
            result = ai_service.analyze_and_suggest_ticket_solution(
                title="Bildschirm bleibt schwarz",
                description="Nach dem Anschließen an die Dockingstation kein Bild.",
                category="HARDWARE"
            )

        self.assertEqual(result["suggested_category"], "HARDWARE")
        self.assertEqual(result["suggested_priority"], "HOCH")
        self.assertEqual(len(result["immediate_steps"]), 2)
        self.assertIn("Thunderbolt-Dock", result["possible_root_cause"])
        self.assertIn("Hallo Max", result["draft_response"])
        print("[PASSED] Unit Test Ticket Analysis with Gemini 2.5 Flash Mock")

    @patch("google.genai.Client")
    def test_generate_weekly_canteen_menu(self, mock_client_cls):
        mock_client = MagicMock()
        mock_client_cls.return_value = mock_client

        mock_response = MagicMock()
        mock_response.text = """
        {
            "calendar_week": 35,
            "year": 2026,
            "days_data": [
                {
                    "tag": "Montag",
                    "datum": "2026-08-24",
                    "gericht_haupt": {
                        "titel": "Rinderroulade Hausfrauenart",
                        "beschreibung": "Mit Apfelrotkohl und Salzkartoffeln",
                        "preis": "7,50 €",
                        "kalorien": "680 kcal",
                        "is_vegan": false,
                        "is_vegetarian": false
                    },
                    "gericht_vegetarisch_vegan": {
                        "titel": "Gemüse-Curry mit Kokos",
                        "beschreibung": "Mit Basmatireis und Kichererbsen",
                        "preis": "5,80 €",
                        "kalorien": "480 kcal",
                        "is_vegan": true,
                        "is_vegetarian": true
                    },
                    "dessert_beilage": {
                        "titel": "Vanillepudding mit Himbeeren",
                        "preis": "1,80 €"
                    },
                    "allergene_zusatzstoffe": ["A", "C", "G"]
                },
                {
                    "tag": "Dienstag",
                    "datum": "2026-08-25",
                    "gericht_haupt": { "titel": "Hähnchenschnitzel", "preis": "6,90 €" },
                    "gericht_vegetarisch_vegan": { "titel": "Spinat-Käse-Quiche", "preis": "5,80 €" },
                    "dessert_beilage": { "titel": "Obstsalat", "preis": "1,80 €" },
                    "allergene_zusatzstoffe": ["A", "G"]
                },
                {
                    "tag": "Mittwoch",
                    "datum": "2026-08-26",
                    "gericht_haupt": { "titel": "Spaghetti Bolognese", "preis": "6,80 €" },
                    "gericht_vegetarisch_vegan": { "titel": "Pasta Primavera", "preis": "5,60 €" },
                    "dessert_beilage": { "titel": "Tiramisu", "preis": "2,00 €" },
                    "allergene_zusatzstoffe": ["A", "C", "G"]
                },
                {
                    "tag": "Donnerstag",
                    "datum": "2026-08-27",
                    "gericht_haupt": { "titel": "Lachsfilet", "preis": "8,20 €" },
                    "gericht_vegetarisch_vegan": { "titel": "Gefüllte Zucchini", "preis": "5,80 €" },
                    "dessert_beilage": { "titel": "Panna Cotta", "preis": "1,80 €" },
                    "allergene_zusatzstoffe": ["D", "G"]
                },
                {
                    "tag": "Freitag",
                    "datum": "2026-08-28",
                    "gericht_haupt": { "titel": "Tinglev Burger", "preis": "7,80 €" },
                    "gericht_vegetarisch_vegan": { "titel": "Falafel-Teller", "preis": "5,60 €" },
                    "dessert_beilage": { "titel": "Schokomousse", "preis": "1,80 €" },
                    "allergene_zusatzstoffe": ["A", "G", "N"]
                }
            ]
        }
        """
        mock_client.models.generate_content.return_value = mock_response

        with patch("app.services.ai_service.get_gemini_client", return_value=mock_client):
            result = ai_service.generate_weekly_canteen_menu(
                calendar_week=35,
                year=2026,
                theme_or_notes="Deutsche Klassiker"
            )

        self.assertEqual(result["calendar_week"], 35)
        self.assertEqual(len(result["days_data"]), 5)
        self.assertEqual(result["days_data"][0]["tag"], "Montag")
        self.assertEqual(result["days_data"][0]["gericht_haupt"]["titel"], "Rinderroulade Hausfrauenart")
        self.assertEqual(result["days_data"][0]["gericht_vegetarisch_vegan"]["is_vegan"], True)
        self.assertEqual(result["days_data"][4]["tag"], "Freitag")
        print("[PASSED] Unit Test Canteen Menu Generation with Gemini 2.5 Flash Mock")

if __name__ == "__main__":
    unittest.main()
