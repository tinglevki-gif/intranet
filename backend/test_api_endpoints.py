import requests
from app.core.database import SessionLocal
from app.models.role import Role
from app.models.user import User
from app.models.geofence import Geofence
from app.models.delivery_tracking import DeliveryTrackingShare
from app.models.maintenance import VehicleMeta, MaintenanceInterval
from app.models.reconciliation import TripReconciliation
from app.models.security import FleetSecurityEvent, FleetSecuritySetting
from app.core.security import create_access_token

def test_api():
    print("Testing REST API Endpoints with direct Token Generation...")
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.role == "ADMIN").first() or db.query(User).first()
        if not user:
            print("No user found in DB!")
            return
        
        token = create_access_token(subject=user.email)
        headers = {"Authorization": f"Bearer {token}"}

        # 1. Test GET /fleet/security/logs?type=ALL&limit=50
        r_logs = requests.get("http://localhost:8000/api/v1/fleet/security/logs?type=ALL&limit=50", headers=headers)
        print("GET /fleet/security/logs -> Status:", r_logs.status_code, "Items:", len(r_logs.json().get("items", [])))
        assert r_logs.status_code == 200

        # 2. Test GET /fleet/security/settings
        r_set = requests.get("http://localhost:8000/api/v1/fleet/security/settings", headers=headers)
        print("GET /fleet/security/settings -> Status:", r_set.status_code, "Max Yard Speed:", r_set.json().get("max_yard_speed"))
        assert r_set.status_code == 200

        # 3. Test GET /fleet/security/stats
        r_stats = requests.get("http://localhost:8000/api/v1/fleet/security/stats", headers=headers)
        print("GET /fleet/security/stats -> Status:", r_stats.status_code, "Unacknowledged:", r_stats.json().get("unacknowledged_events"))
        assert r_stats.status_code == 200

        # 4. Test GET /fleet/vehicles (Auto-Security-Evaluation)
        r_eval = requests.get("http://localhost:8000/api/v1/fleet/vehicles", headers=headers)
        print("GET /fleet/vehicles (Auto-Security-Evaluation) -> Status:", r_eval.status_code, "Vehicles:", len(r_eval.json().get("vehicles", [])))
        assert r_eval.status_code == 200

        print("================================================================================")
        print("🎉 ALL SECURITY REST API ENDPOINTS VALIDATED SUCCESSFULLY (HTTP 200 OK)!")
        print("================================================================================")
    finally:
        db.close()

if __name__ == "__main__":
    test_api()
