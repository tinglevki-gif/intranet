import os
import sys
import unittest
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.main import app
from app.core.database import SessionLocal
from app.models.user import User

client = TestClient(app)

class TestUserImportExport(unittest.TestCase):

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

    def test_01_download_import_template(self):
        """Test downloading standard CSV template."""
        res = client.get("/api/v1/admin/users/import/template", headers=self.admin_headers)
        self.assertEqual(res.status_code, 200)
        self.assertIn("text/csv", res.headers.get("content-type", ""))
        self.assertIn("email;first_name;last_name", res.text)
        print("[PASSED] Test 01: CSV-Import-Vorlage heruntergeladen.")

    def test_02_export_users_csv_and_json(self):
        """Test exporting users in CSV and JSON formats."""
        # CSV
        res_csv = client.get("/api/v1/admin/users/export?format=csv", headers=self.admin_headers)
        self.assertEqual(res_csv.status_code, 200)
        self.assertIn("text/csv", res_csv.headers.get("content-type", ""))
        self.assertIn("h.senf@tinglev.de", res_csv.text)

        # JSON
        res_json = client.get("/api/v1/admin/users/export?format=json", headers=self.admin_headers)
        self.assertEqual(res_json.status_code, 200)
        data = res_json.json()
        self.assertIsInstance(data, list)
        self.assertTrue(any(u["email"] == "h.senf@tinglev.de" for u in data))
        print(f"[PASSED] Test 02: Benutzer-Export in CSV & JSON erfolgreich ({len(data)} Benutzer).")

    def test_03_preview_import_valid_and_invalid_rows(self):
        """Test previewing CSV with both new users, existing updates, and invalid emails."""
        csv_content = """email;first_name;last_name;department;position;role;is_active
new.user1@tinglev.de;Test;User1;Produktion;Monteur;EMPLOYEE;Ja
h.senf@tinglev.de;Humbert;Senf;IT \\ SuperAdmin;IT-Leiter;ADMIN;Ja
invalid-email-format;Bad;Email;General;Mitarbeiter;EMPLOYEE;Ja
"""
        files = {"file": ("test_preview.csv", csv_content.encode("utf-8-sig"), "text/csv")}
        res = client.post("/api/v1/admin/users/import/preview", files=files, headers=self.admin_headers)
        self.assertEqual(res.status_code, 200)
        preview = res.json()
        
        self.assertEqual(preview["total_rows"], 3)
        self.assertEqual(preview["create_count"], 1) # new.user1
        self.assertEqual(preview["update_count"], 1) # h.senf
        self.assertEqual(preview["error_count"], 1)  # invalid-email-format
        print(f"[PASSED] Test 03: Pre-Validation Preview erfolgreich (Create: {preview['create_count']}, Update: {preview['update_count']}, Errors: {preview['error_count']})")

    def test_04_execute_import(self):
        """Test executing import and verifying user creation in database."""
        # Clean up previously created test user if exists for idempotency
        db = SessionLocal()
        existing = db.query(User).filter(User.email == "import.test.user@tinglev.de").first()
        if existing:
            db.delete(existing)
            db.commit()
        db.close()

        csv_content = """email;first_name;last_name;department;position;role;can_manage_canteen;is_active;password
import.test.user@tinglev.de;Imported;Tester;Qualitätskontrolle;Prüfingenieur;EMPLOYEE;Ja;Ja;Passwort123!
"""
        files = {"file": ("test_import.csv", csv_content.encode("utf-8-sig"), "text/csv")}
        data = {"update_existing": "true", "default_password": "Passwort123!"}
        
        res = client.post("/api/v1/admin/users/import", files=files, data=data, headers=self.admin_headers)
        self.assertEqual(res.status_code, 200)
        summary = res.json()
        
        self.assertEqual(summary["created_count"], 1)
        self.assertEqual(summary["error_count"], 0)

        # Verify in DB
        db = SessionLocal()
        created_user = db.query(User).filter(User.email == "import.test.user@tinglev.de").first()
        self.assertIsNotNone(created_user)
        self.assertEqual(created_user.full_name, "Imported Tester")
        self.assertEqual(created_user.department, "Qualitätskontrolle")
        self.assertTrue(created_user.can_manage_canteen)
        db.close()
        print(f"[PASSED] Test 04: Benutzer erfolgreich importiert und in DB persistiert.")

if __name__ == "__main__":
    unittest.main()
