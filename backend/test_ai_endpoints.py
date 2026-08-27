import os
import sys
from fastapi.testclient import TestClient

# Ensure backend root is in sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.main import app
from app.core.config import settings

client = TestClient(app)

def test_ai_without_api_key():
    print("\n--- TEST 1: KI-Endpunkte ohne API-Schlüssel (503 Service Unavailable) ---")
    settings.GEMINI_API_KEY = None
    if "GEMINI_API_KEY" in os.environ:
        del os.environ["GEMINI_API_KEY"]

    # 1. Ticket Suggestion without auth should fail with 401
    res_no_auth = client.post("/api/v1/ai/tickets/suggest", json={
        "title": "Drucker druckt nicht",
        "description": "Papierstau in Fach 2"
    })
    print(f"Ticket Suggestion No Auth status: {res_no_auth.status_code}")
    assert res_no_auth.status_code == 401, f"Expected 401, got {res_no_auth.status_code}"

    # Log in as admin to get token
    login_res = client.post("/api/v1/auth/login", json={
        "email": "h.senf@tinglev.de",
        "password": "Passwort123!"
    })
    assert login_res.status_code == 200, f"Login failed: {login_res.text}"
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Ticket Suggestion with Auth but no Gemini Key should return 503
    res_ticket = client.post("/api/v1/ai/tickets/suggest", json={
        "title": "CAD-Lizenz abgelaufen",
        "description": "AutoCAD zeigt Lizenzfehler 0x80004005 nach Windows-Update.",
        "category": "SOFTWARE"
    }, headers=headers)
    print(f"Ticket Suggestion With Auth (No Key) status: {res_ticket.status_code}, response: {res_ticket.text}")
    assert res_ticket.status_code == 503
    assert "KI-Dienst nicht konfiguriert" in res_ticket.json()["detail"]

    # 3. Canteen Menu Generate with Auth but no Gemini Key should return 503
    res_canteen = client.post("/api/v1/ai/canteen/generate", json={
        "calendar_week": 35,
        "year": 2026,
        "theme_or_notes": "Italienische Woche"
    }, headers=headers)
    print(f"Canteen Menu Generate With Auth (No Key) status: {res_canteen.status_code}, response: {res_canteen.text}")
    assert res_canteen.status_code == 503
    assert "KI-Dienst nicht konfiguriert" in res_canteen.json()["detail"]

    print("--> Test 1 erfolgreich: 503 Fallback und Autorisierung funktionieren einwandfrei.")

if __name__ == "__main__":
    test_ai_without_api_key()
    print("\n[SUCCESS] Alle KI-Endpunkttests erfolgreich bestanden!")
