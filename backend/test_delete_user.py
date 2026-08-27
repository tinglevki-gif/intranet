import os
import sys
import unittest
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.main import app
from app.core.database import SessionLocal
from app.models.user import User, RoleEnum
from app.models.announcement import Announcement
from app.models.ticket import Ticket, TicketMessage, TicketStatus, TicketPriority, TicketCategory
from app.models.document import Document, DocumentCategory
from app.core.security import get_password_hash

client = TestClient(app)

class TestDeleteUser(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        # Admin login
        res_admin = client.post("/api/v1/auth/login", json={
            "email": "h.senf@tinglev.de",
            "password": "Passwort123!"
        })
        assert res_admin.status_code == 200, f"Admin login failed: {res_admin.text}"
        cls.admin_token = res_admin.json()["access_token"]
        cls.admin_headers = {"Authorization": f"Bearer {cls.admin_token}"}
        cls.admin_id = res_admin.json()["user"]["id"]

    def test_01_delete_user_with_foreign_keys(self):
        """Test creating a user with announcements, tickets, messages, and deleting them safely."""
        db = SessionLocal()
        # 1. Create a dummy user
        test_user = User(
            email="delete.me@tinglev.de",
            full_name="Delete Candidate",
            role="EMPLOYEE",
            hashed_password=get_password_hash("Passwort123!"),
            is_active=True
        )
        db.add(test_user)
        db.commit()
        db.refresh(test_user)
        user_id = test_user.id

        # 2. Attach an announcement
        ann = Announcement(
            title="Test Announcement by User",
            content="Content",
            author_id=user_id,
            author_name=test_user.full_name
        )
        db.add(ann)

        # 3. Attach a ticket & message
        ticket = Ticket(
            ticket_nr="TK-DEL-001",
            titel="Ticket with user",
            beschreibung="Desc",
            kategorie="IT_SUPPORT",
            prioritaet="MITTEL",
            status="OFFEN",
            ersteller_id=user_id,
            zugewiesen_an_id=user_id
        )
        db.add(ticket)
        db.flush()

        msg = TicketMessage(
            ticket_id=ticket.id,
            autor_id=user_id,
            nachricht="Message from user"
        )
        db.add(msg)

        # 4. Attach a subordinate
        sub = User(
            email="subordinate.user@tinglev.de",
            full_name="Subordinate User",
            role="EMPLOYEE",
            hashed_password=get_password_hash("Passwort123!"),
            supervisor_id=user_id
        )
        db.add(sub)
        db.commit()
        db.close()

        # 5. Call DELETE endpoint
        res = client.delete(f"/api/v1/admin/users/{user_id}", headers=self.admin_headers)
        self.assertEqual(res.status_code, 204, f"Delete failed: {res.text}")

        # 6. Verify in DB
        db = SessionLocal()
        deleted = db.query(User).filter(User.id == user_id).first()
        self.assertIsNone(deleted, "User should be deleted from DB")

        # Verify subordinate supervisor was reassigned
        sub_db = db.query(User).filter(User.email == "subordinate.user@tinglev.de").first()
        self.assertIsNotNone(sub_db)
        self.assertNotEqual(sub_db.supervisor_id, user_id)

        # Verify ticket and message still exist with reassigned foreign keys
        ticket_db = db.query(Ticket).filter(Ticket.ticket_nr == "TK-DEL-001").first()
        self.assertIsNotNone(ticket_db)
        self.assertIsNone(ticket_db.zugewiesen_an_id)
        self.assertEqual(ticket_db.ersteller_id, self.admin_id)

        # Clean up test ticket and subordinate
        db.delete(ticket_db)
        db.delete(sub_db)
        ann_db = db.query(Announcement).filter(Announcement.title == "Test Announcement by User").first()
        if ann_db:
            db.delete(ann_db)
        db.commit()
        db.close()
        print(f"[PASSED] Test 01: Benutzer mit Verknüpfungen (Tickets, Ankündigungen, Hierarchie) erfolgreich und sicher gelöscht.")

if __name__ == "__main__":
    unittest.main()
