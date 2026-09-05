import os
import sys
import unittest
from datetime import datetime, date
from fastapi.testclient import TestClient

# Ensure app is in path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__))))

from app.main import app
from app.core.database import SessionLocal
from app.core.security import create_access_token
from app.models.user import User, RoleEnum
from app.models.geofence import Geofence, GeofenceType, VehicleGeofenceEvent, GeofenceEventType, VehicleStay
from app.services.geofence_service import calculate_haversine_distance, geofence_service, seed_default_geofences

class TestGeofencingAndStays(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)
        self.db = SessionLocal()
        user = self.db.query(User).first()
        if not user:
            user_id = 1
        else:
            user_id = user.id
        self.token = create_access_token(user_id)
        self.headers = {"Authorization": f"Bearer {self.token}"}

    def tearDown(self):
        self.db.close()

    def test_haversine_formula_accuracy(self):
        # Berlin Alexanderplatz (52.5219, 13.4132) to Brandenburger Tor (52.5163, 13.3777)
        # Real distance is approx 2.4 - 2.5 km (2450 m)
        dist = calculate_haversine_distance(52.5219, 13.4132, 52.5163, 13.3777)
        self.assertGreater(dist, 2300.0)
        self.assertLess(dist, 2600.0)

        # Identical point distance should be 0.0
        self.assertEqual(calculate_haversine_distance(52.5584, 13.7656, 52.5584, 13.7656), 0.0)

    def test_geofence_seeding(self):
        seed_default_geofences(self.db)
        geofences = self.db.query(Geofence).all()
        self.assertGreaterEqual(len(geofences), 4)
        factory = self.db.query(Geofence).filter(Geofence.name.like("%Altlandsberg%")).first()
        self.assertIsNotNone(factory)
        self.assertEqual(factory.type, GeofenceType.FACTORY)

    def test_geofence_evaluation_lifecycle(self):
        # 1. Run evaluation
        eval_result = geofence_service.evaluate_fleet(self.db)
        self.assertEqual(eval_result["status"], "success")
        self.assertIn("evaluated_vehicles", eval_result)
        self.assertGreater(eval_result["evaluated_vehicles"], 0)

        # Check that stays were opened for vehicles located at Altlandsberg (MOL-TE 102)
        stays_summary = geofence_service.get_stays_summary(self.db, target_date=date.today())
        self.assertIn("total_stays", stays_summary)
        self.assertIn("stays", stays_summary)

    def test_geofence_rest_endpoints(self):
        # 1. GET /api/v1/fleet/geofences
        r_list = self.client.get("/api/v1/fleet/geofences", headers=self.headers)
        self.assertEqual(r_list.status_code, 200)
        geofences = r_list.json()
        self.assertIsInstance(geofences, list)
        self.assertGreaterEqual(len(geofences), 1)

        # 2. POST /api/v1/fleet/geofences (Create test geofence)
        new_geo = {
            "name": "Test-Baustelle Potsdam Medienstadt",
            "type": "CONSTRUCTION_SITE",
            "latitude": 52.3850,
            "longitude": 13.1200,
            "radius_meters": 450,
            "is_active": True,
            "description": "Automatisch erstellter Test-Geofence"
        }
        r_create = self.client.post("/api/v1/fleet/geofences", json=new_geo, headers=self.headers)
        self.assertEqual(r_create.status_code, 201)
        created_id = r_create.json()["id"]

        # 3. PUT /api/v1/fleet/geofences/{id}
        r_update = self.client.put(
            f"/api/v1/fleet/geofences/{created_id}",
            json={"radius_meters": 550, "description": "Aktualisierter Radius"},
            headers=self.headers
        )
        self.assertEqual(r_update.status_code, 200)
        self.assertEqual(r_update.json()["radius_meters"], 550)

        # 4. GET /api/v1/fleet/stays?date=YYYY-MM-DD
        today_str = date.today().isoformat()
        r_stays = self.client.get(f"/api/v1/fleet/stays?date={today_str}", headers=self.headers)
        self.assertEqual(r_stays.status_code, 200)
        self.assertIn("total_stays", r_stays.json())
        self.assertIn("stays", r_stays.json())

        # 5. GET /api/v1/fleet/events
        r_events = self.client.get("/api/v1/fleet/events?limit=20", headers=self.headers)
        self.assertEqual(r_events.status_code, 200)
        self.assertIsInstance(r_events.json(), list)

        # 6. POST /api/v1/fleet/monitor/run
        r_run = self.client.post("/api/fleet/monitor/run", headers=self.headers)
        self.assertEqual(r_run.status_code, 200)
        self.assertEqual(r_run.json()["status"], "success")

        # 7. DELETE /api/v1/fleet/geofences/{id}
        r_del = self.client.delete(f"/api/v1/fleet/geofences/{created_id}", headers=self.headers)
        self.assertEqual(r_del.status_code, 204)

if __name__ == "__main__":
    unittest.main()
