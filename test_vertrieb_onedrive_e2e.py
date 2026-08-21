import urllib.request
import urllib.error
import json
import sys

if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

BASE_API = "http://127.0.0.1:8000/api/v1"

def post_json(url, data=None, token=None):
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    payload = json.dumps(data).encode("utf-8") if data is not None else b"{}"
    req = urllib.request.Request(url, data=payload, headers=headers, method="POST")
    try:
        with urllib.request.urlopen(req) as resp:
            return resp.status, json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read().decode("utf-8")) if e.headers.get("content-type") == "application/json" else {}

def put_json(url, data, token=None):
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    req = urllib.request.Request(url, data=json.dumps(data).encode("utf-8"), headers=headers, method="PUT")
    try:
        with urllib.request.urlopen(req) as resp:
            return resp.status, json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read().decode("utf-8")) if e.headers.get("content-type") == "application/json" else {}

def get_json(url, token=None):
    headers = {}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req) as resp:
            return resp.status, json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        return e.code, None

def main():
    print("=== E2E TEST: MICROSOFT ONEDRIVE / SHAREPOINT VERTRIEBS-VERKNÜPFUNG ===")
    
    # 1. Login SuperAdmin and Employee
    status, admin_auth = post_json(f"{BASE_API}/auth/login", {"email": "admin@empresa.com", "password": "admin123"})
    assert status == 200, "SuperAdmin Login failed"
    admin_token = admin_auth["access_token"]
    print(f"1. SuperAdmin Login: OK -> {admin_auth['user']['full_name']} (ADMIN)")

    status, emp_auth = post_json(f"{BASE_API}/auth/login", {"email": "empleado@empresa.com", "password": "emp123"})
    assert status == 200, "Employee Login failed"
    emp_token = emp_auth["access_token"]
    print(f"   Mitarbeiter Login: OK -> {emp_auth['user']['full_name']} (EMPLOYEE)")

    # 2. Public / Authenticated user setting retrieval
    print("\n2. Mitarbeiter ruft Vertriebs-OneDrive URL ab (GET /settings/onedrive_vertrieb_url):")
    status_get, setting_data = get_json(f"{BASE_API}/settings/onedrive_vertrieb_url", emp_token)
    assert status_get == 200, f"GET setting failed with status {status_get}"
    print(f"   - URL geladen: {setting_data['value']}")
    print(f"   - Label: {setting_data['label']} -> OK")
    assert "sharepoint.com" in setting_data["value"]

    # 3. RBAC Security: Employee cannot modify settings or list admin settings
    print("\n3. RBAC-Prüfung für Mitarbeiter (Admin-Routen müssen 403 Forbidden sein):")
    status_admin_get, _ = get_json(f"{BASE_API}/admin/settings", emp_token)
    print(f"   - GET /admin/settings (Employee): Status {status_admin_get} (403 erwartet) -> OK")
    assert status_admin_get == 403

    status_admin_put, _ = put_json(f"{BASE_API}/admin/settings/onedrive_vertrieb_url", {"value": "https://hacked.com"}, emp_token)
    print(f"   - PUT /admin/settings/onedrive_vertrieb_url (Employee): Status {status_admin_put} (403 erwartet) -> OK")
    assert status_admin_put == 403

    # 4. SuperAdmin retrieves all admin settings
    print("\n4. SuperAdmin ruft vollständige Integrationseinstellungen ab (GET /admin/settings):")
    status_all, all_settings = get_json(f"{BASE_API}/admin/settings", admin_token)
    assert status_all == 200
    print(f"   - Gefundene Einstellungen: {len(all_settings)}")
    for s in all_settings:
        print(f"     * [{s['key']}] {s['label']}: {s['value']}")
    assert len(all_settings) >= 1

    # 5. SuperAdmin updates the OneDrive URL
    custom_url = "https://tiglevelementfabrik-my.sharepoint.com/personal/vertrieb_tiglev_de/Documents/Vertrieb_Projekte_2026_NEU"
    print(f"\n5. SuperAdmin aktualisiert die Vertriebs-URL (PUT /admin/settings/onedrive_vertrieb_url):")
    status_update, updated_setting = put_json(f"{BASE_API}/admin/settings/onedrive_vertrieb_url", {"value": custom_url}, admin_token)
    assert status_update == 200
    print(f"   - Aktualisierter Wert: {updated_setting['value']} -> OK")
    assert updated_setting["value"] == custom_url

    # 6. Verify employee receives the new updated URL
    print("\n6. Mitarbeiter ruft aktualisierte URL ab:")
    _, emp_updated = get_json(f"{BASE_API}/settings/onedrive_vertrieb_url", emp_token)
    assert emp_updated["value"] == custom_url
    print(f"   - Verifiziert: Mitarbeiter erhält dynamisch neuen Link '{emp_updated['value']}' -> OK")

    # 7. SuperAdmin resets to default
    print("\n7. SuperAdmin setzt die Einstellung auf Standardwert zurück (POST /admin/settings/onedrive_vertrieb_url/reset):")
    status_reset, reset_setting = post_json(f"{BASE_API}/admin/settings/onedrive_vertrieb_url/reset", {}, admin_token)
    assert status_reset == 200
    print(f"   - Standardwert wiederhergestellt: {reset_setting['value']} -> OK")
    assert reset_setting["value"] == reset_setting["default_value"]

    print("\n>>> ALLE TESTS FÜR MICROSOFT ONEDRIVE VERTRIEBS-VERKNÜPFUNG ERFOLGREICH BESTANDEN! <<<")

if __name__ == "__main__":
    main()
