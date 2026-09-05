import os
import sys
import unittest
from fastapi.testclient import TestClient

# Ensure app is in path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__))))

from app.main import app
from app.services.navkonzept_service import navkonzept_fleet_service
from app.services.auth_service import create_access_token
from app.models.user import RoleEnum

class TestFleetTelemetry(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)
        self.token = create_access_token(data={"sub": "admin@tinglev-elementfabrik.de", "role": RoleEnum.ADMIN.value})
        self.headers = {"Authorization": f"Bearer {self.token}"}

    def test_navkonzept_service_get_vehicles(self):
        data = navkonzept_fleet_service.get_vehicles(force_refresh=True)
        self.assertIn("total", data)
        self.assertIn("vehicles", data)
        self.assertIn("is_live", data)
        self.assertGreater(data["total"], 0)
        self.assertEqual(len(data["vehicles"]), data["total"])

        first_v = data["vehicles"][0]
        self.assertIn("plate", first_v)
        self.assertIn("lat", first_v)
        self.assertIn("lon", first_v)
        self.assertIn("speed", first_v)
        self.assertIsInstance(first_v["lat"], float)
        self.assertIsInstance(first_v["lon"], float)

    def test_fleet_endpoint_authenticated(self):
        # Test /api/v1/fleet/vehicles
        response = self.client.get("/api/v1/fleet/vehicles", headers=self.headers)
        self.assertEqual(response.status_code, 200, f"Failed: {response.text}")
        payload = response.json()
        self.assertIn("total", payload)
        self.assertIn("vehicles", payload)
        self.assertGreater(payload["total"], 0)

        # Test alias /api/fleet/vehicles
        response_alias = self.client.get("/api/fleet/vehicles", headers=self.headers)
        self.assertEqual(response_alias.status_code, 200, f"Failed alias: {response_alias.text}")

    def test_fleet_endpoint_unauthorized(self):
        response = self.client.get("/api/v1/fleet/vehicles")
        self.assertEqual(response.status_code, 401)

if __name__ == "__main__":
    unittest.main()
