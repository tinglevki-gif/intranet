import requests
from app.core.config import settings

def test_api():
    print("Testing REST API Endpoints...")
    res = requests.post("http://localhost:8000/api/v1/auth/login", data={"username": "admin@tinglev.de", "password": "adminpassword"})
    if res.status_code != 200:
        print("Login failed:", res.status_code, res.text)
        return

    token = res.json().get("access_token")
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

    # 4. Test POST /fleet/security/evaluate
    r_eval = requests.get("http://localhost:8000/api/v1/fleet/vehicles", headers=headers)
    print("GET /fleet/vehicles (Auto-Security-Evaluation) -> Status:", r_eval.status_code, "Vehicles:", len(r_eval.json().get("vehicles", [])))
    assert r_eval.status_code == 200

    print("✅ All REST API endpoints tested and functioning properly!")

if __name__ == "__main__":
    test_api()
