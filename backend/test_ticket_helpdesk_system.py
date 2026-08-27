import os
import sys
import unittest
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.main import app
from app.core.database import SessionLocal
from app.models.user import User, RoleEnum
from app.models.ticket import Ticket, TicketMessage, TicketStatus, TicketPriority, TicketCategory

client = TestClient(app)

class TestTicketHelpdeskSystem(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        # 1. Admin / Support Login
        res_admin = client.post("/api/v1/auth/login", json={
            "email": "h.senf@tinglev.de",
            "password": "Passwort123!"
        })
        assert res_admin.status_code == 200, f"Admin login failed: {res_admin.text}"
        cls.admin_token = res_admin.json()["access_token"]
        cls.admin_headers = {"Authorization": f"Bearer {cls.admin_token}"}

        # 2. Get or create a regular employee user
        db = SessionLocal()
        emp = db.query(User).filter(User.role == RoleEnum.EMPLOYEE).first()
        if not emp:
            # Look for any non-admin user
            emp = db.query(User).filter(User.email != "h.senf@tinglev.de").first()
        cls.employee_id = emp.id if emp else 2
        cls.employee_email = emp.email if emp else "employee@tinglev.de"
        db.close()

    def test_01_create_ticket(self):
        """Test creating a new ticket with auto-generated sequential ticket number."""
        payload = {
            "titel": "VPN-Verbindung bricht nach 10 Minuten ab",
            "beschreibung": "Beim Arbeiten im Homeoffice trennt sich der Cisco AnyConnect VPN-Tunnel reproduzierbar nach ca. 10 Minuten.",
            "kategorie": "IT_SUPPORT",
            "prioritaet": "HOCH",
            "loesungs_schlagwoerter": ["VPN", "Homeoffice", "Cisco", "Timeout"]
        }
        res = client.post("/api/v1/tickets", json=payload, headers=self.admin_headers)
        self.assertEqual(res.status_code, 201, f"Ticket creation failed: {res.text}")
        data = res.json()
        
        self.assertTrue(data["ticket_nr"].startswith("TK-2026-"))
        self.assertEqual(data["titel"], payload["titel"])
        self.assertEqual(data["kategorie"], "IT_SUPPORT")
        self.assertEqual(data["status"], "OFFEN")
        self.assertGreater(data["id"], 0)
        
        self.__class__.created_ticket_id = data["id"]
        print(f"[PASSED] Test 01: Ticket erstellt mit Ticket-Nr: {data['ticket_nr']}")

    def test_02_list_and_filter_tickets(self):
        """Test listing tickets with status, priority, and category filters."""
        res = client.get("/api/v1/tickets?kategorie=IT_SUPPORT", headers=self.admin_headers)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("items", data)
        self.assertIn("total", data)
        self.assertTrue(any(t["id"] == self.created_ticket_id for t in data["items"]))
        print(f"[PASSED] Test 02: Ticket-Liste & Filterung (Gesamt: {data['total']})")

    def test_03_ticket_messaging_and_internal_notes(self):
        """Test adding public replies and internal IT notes to ticket timeline."""
        ticket_id = self.created_ticket_id

        # 1. Add public reply
        res_msg = client.post(f"/api/v1/tickets/{ticket_id}/messages", json={
            "nachricht": "Bitte prüfen Sie, ob in den FritzBox-Einstellungen IPv6 aktiviert ist.",
            "ist_interne_notiz": False
        }, headers=self.admin_headers)
        self.assertEqual(res_msg.status_code, 201)
        self.assertFalse(res_msg.json()["ist_interne_notiz"])

        # 2. Add internal IT note
        res_internal = client.post(f"/api/v1/tickets/{ticket_id}/messages", json={
            "nachricht": "INTERN: Bekannter Bug mit MTU-Größe 1400 bei Telekom-Glasfaser.",
            "ist_interne_notiz": True
        }, headers=self.admin_headers)
        self.assertEqual(res_internal.status_code, 201)
        self.assertTrue(res_internal.json()["ist_interne_notiz"])

        # 3. Verify detail endpoint returns messages
        res_detail = client.get(f"/api/v1/tickets/{ticket_id}", headers=self.admin_headers)
        self.assertEqual(res_detail.status_code, 200)
        detail_data = res_detail.json()
        self.assertGreaterEqual(len(detail_data["messages"]), 2)
        print(f"[PASSED] Test 03: Ticket-Nachrichten & interne Notizen ({len(detail_data['messages'])} Nachrichten)")

    def test_04_status_update_with_solution_validation(self):
        """Test status transitions and mandatory solution documentation for GELOEST."""
        ticket_id = self.created_ticket_id

        # 1. Attempting to set GELOEST without documentation must fail (422 / validation error)
        res_fail = client.patch(f"/api/v1/tickets/{ticket_id}/status", json={
            "status": "GELOEST"
        }, headers=self.admin_headers)
        self.assertEqual(res_fail.status_code, 422, "Expected 422 validation error when closing without solution")

        # 2. Providing proper solution documentation must succeed
        solution_text = "MTU-Wert am Client über netsh auf 1350 gesetzt und DPD-Keepalive im VPN-Profil von 30s auf 10s konfiguriert."
        res_solve = client.patch(f"/api/v1/tickets/{ticket_id}/status", json={
            "status": "GELOEST",
            "loesung_dokumentation": solution_text,
            "loesungs_schlagwoerter": ["VPN", "MTU", "Keepalive", "Telekom"]
        }, headers=self.admin_headers)
        self.assertEqual(res_solve.status_code, 200)
        self.assertEqual(res_solve.json()["status"], "GELOEST")
        self.assertEqual(res_solve.json()["loesung_dokumentation"], solution_text)
        print("[PASSED] Test 04: Statusänderung & Pflicht-Lösungsdokumentation für GELOEST")

    def test_05_knowledge_base_search(self):
        """Test full-text search in Knowledge Base across solved tickets."""
        # Search for "MTU" or "VPN"
        res_search = client.get("/api/v1/tickets/knowledge-base/search?q=VPN+MTU", headers=self.admin_headers)
        self.assertEqual(res_search.status_code, 200)
        data = res_search.json()
        self.assertGreater(data["total"], 0)
        
        first_res = data["results"][0]
        self.assertIn("loesungsschritte", first_res)
        self.assertTrue(len(first_res["loesungsschritte"]) > 0)
        print(f"[PASSED] Test 05: Lösungs-Wissensdatenbank Volltext-Suche ({data['total']} Treffer, Top-Score: {first_res.get('relevance_score')})")

    def test_06_smart_assist_suggestions(self):
        """Test real-time solution suggestions when user types ticket title."""
        res_suggest = client.get("/api/v1/tickets/suggest-solutions?titel=VPN+trennt+Verbindung&kategorie=IT_SUPPORT", headers=self.admin_headers)
        self.assertEqual(res_suggest.status_code, 200)
        data = res_suggest.json()
        self.assertTrue(data["has_suggestions"])
        self.assertGreater(data["suggestions_count"], 0)
        print(f"[PASSED] Test 06: Smart Assist Live-Vorschläge ({data['suggestions_count']} Lösungsvorschläge)")

    def test_07_ticket_stats_summary(self):
        """Test KPI statistics endpoint."""
        res_stats = client.get("/api/v1/tickets/stats/summary", headers=self.admin_headers)
        self.assertEqual(res_stats.status_code, 200)
        stats = res_stats.json()
        self.assertIn("total", stats)
        self.assertIn("offen", stats)
        self.assertIn("geloest", stats)
        self.assertIn("nach_kategorie", stats)
        print(f"[PASSED] Test 07: Ticket-KPI-Zusammenfassung (Total: {stats['total']}, Gelöst: {stats['geloest']})")

if __name__ == "__main__":
    unittest.main()
