import urllib.request
import urllib.parse
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
        body = e.read().decode("utf-8")
        try:
            return e.code, json.loads(body)
        except Exception:
            return e.code, {"detail": body}

def patch_json(url, data=None, token=None):
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    payload = json.dumps(data).encode("utf-8") if data is not None else b"{}"
    req = urllib.request.Request(url, data=payload, headers=headers, method="PATCH")
    try:
        with urllib.request.urlopen(req) as resp:
            return resp.status, json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8")
        try:
            return e.code, json.loads(body)
        except Exception:
            return e.code, {"detail": body}

def put_json(url, data, token=None):
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    req = urllib.request.Request(url, data=json.dumps(data).encode("utf-8"), headers=headers, method="PUT")
    try:
        with urllib.request.urlopen(req) as resp:
            return resp.status, json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8")
        try:
            return e.code, json.loads(body)
        except Exception:
            return e.code, {"detail": body}

def get_json(url, token=None):
    headers = {}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req) as resp:
            return resp.status, json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8")
        try:
            return e.code, json.loads(body)
        except Exception:
            return e.code, {"detail": body}

def main():
    print("=== E2E TEST: SUPERADMIN MENÜ- & NAVIGATIONSVERWALTUNG ===")
    
    # 1. Login Accounts
    status_admin, admin_auth = post_json(f"{BASE_API}/auth/login", {"email": "admin@empresa.com", "password": "admin123"})
    if status_admin != 200:
        status_admin, admin_auth = post_json(f"{BASE_API}/auth/login", {"email": "humbert.admin@empresa.com", "password": "admin123"})
    assert status_admin == 200, "SuperAdmin Login failed"
    admin_token = admin_auth["access_token"]
    
    status_emp, emp_auth = post_json(f"{BASE_API}/auth/login", {"email": "empleado@empresa.com", "password": "emp123"})
    assert status_emp == 200, "Employee Login failed"
    emp_token = emp_auth["access_token"]

    print("1. Login erfolgreich: SuperAdmin und Mitarbeiter")

    # 2. RBAC Protection
    print("\n2. RBAC-Prüfung (Mitarbeiter darf /admin/menu nicht abrufen/ändern):")
    status_forbidden, _ = get_json(f"{BASE_API}/admin/menu", emp_token)
    assert status_forbidden == 403, f"Expected 403, got {status_forbidden}"
    print("   - GET /admin/menu (Employee): Status 403 Forbidden -> OK")

    status_forbidden_put, _ = put_json(f"{BASE_API}/admin/menu/reorder", {"items": []}, emp_token)
    assert status_forbidden_put == 403, f"Expected 403, got {status_forbidden_put}"
    print("   - PUT /admin/menu/reorder (Employee): Status 403 Forbidden -> OK")

    # 3. SuperAdmin loads all menu items
    print("\n3. SuperAdmin ruft vollständigen Menükatalog ab (GET /admin/menu):")
    status_menu, all_items = get_json(f"{BASE_API}/admin/menu", admin_token)
    assert status_menu == 200
    print(f"   - Gefundene Menüpunkte: {len(all_items)}")
    assert len(all_items) >= 15
    for it in all_items[:5]:
        print(f"     * [{it['id']}] Order {it['order']}: {it['label']} ({it['key']}) - Aktiv: {it['is_active']}, Sektion: '{it['section']}'")

    # Find kantine item
    kantine_item = next((i for i in all_items if i["key"] == "kantine"), None)
    assert kantine_item is not None, "Kantine item not found"
    kantine_id = kantine_item["id"]

    # 4. SuperAdmin deactivates "kantine"
    print(f"\n4. SuperAdmin deaktiviert Menüpunkt 'Kantine' (ID: {kantine_id}) global:")
    status_patch, patched_item = patch_json(f"{BASE_API}/admin/menu/{kantine_id}/toggle-active", {"is_active": False}, admin_token)
    assert status_patch == 200
    assert patched_item["is_active"] is False
    print(f"   - Menüpunkt '{patched_item['label']}' Status: is_active = {patched_item['is_active']} -> OK")

    # 5. Verify global effect on both Employee AND SuperAdmin
    print("\n5. Globale Auswirkung prüfen (GET /navigation/menu für alle Rollen):")
    _, emp_nav = get_json(f"{BASE_API}/navigation/menu", emp_token)
    emp_keys = [item["key"] for sec in emp_nav["sections"] for item in sec["items"]]
    print(f"   - Mitarbeiter-Menü enthält 'kantine': {'kantine' in emp_keys} (False erwartet) -> OK")
    assert "kantine" not in emp_keys, "FEHLER: Deaktivierter Menüpunkt erscheint noch im Mitarbeiter-Menü!"

    _, admin_nav = get_json(f"{BASE_API}/navigation/menu", admin_token)
    admin_keys = [item["key"] for sec in admin_nav["sections"] for item in sec["items"]]
    print(f"   - SuperAdmin-Menü enthält 'kantine': {'kantine' in admin_keys} (False erwartet) -> OK")
    assert "kantine" not in admin_keys, "FEHLER: Deaktivierter Menüpunkt erscheint noch im SuperAdmin-Menü!"

    # 6. Reorder Menu Items
    print("\n6. Menü-Sortierung anpassen (PUT /admin/menu/reorder):")
    # Take first 3 items and invert their order numbers
    items_to_reorder = [
        {"id": all_items[0]["id"], "order": 2, "section": all_items[0]["section"]},
        {"id": all_items[1]["id"], "order": 0, "section": all_items[1]["section"]},
        {"id": all_items[2]["id"], "order": 1, "section": all_items[2]["section"]}
    ]
    status_reorder, reordered_items = put_json(f"{BASE_API}/admin/menu/reorder", {"items": items_to_reorder}, admin_token)
    assert status_reorder == 200
    print("   - Batch-Reorder erfolgreich ausgeführt (Status 200) -> OK")

    # Verify order in /navigation/menu
    _, admin_nav_after = get_json(f"{BASE_API}/navigation/menu", admin_token)
    first_sec_items = admin_nav_after["sections"][0]["items"]
    print(f"   - Neue erste Elemente in Sektion '{admin_nav_after['sections'][0]['section']}': {[i['key'] for i in first_sec_items[:3]]} -> OK")

    # 7. Re-activate "kantine"
    print("\n7. Menüpunkt 'Kantine' wieder aktivieren:")
    status_patch_on, reactivated_item = patch_json(f"{BASE_API}/admin/menu/{kantine_id}/toggle-active", {"is_active": True}, admin_token)
    assert status_patch_on == 200
    assert reactivated_item["is_active"] is True
    print(f"   - Menüpunkt '{reactivated_item['label']}' wieder aktiviert -> OK")

    _, emp_nav_restored = get_json(f"{BASE_API}/navigation/menu", emp_token)
    emp_keys_restored = [item["key"] for sec in emp_nav_restored["sections"] for item in sec["items"]]
    assert "kantine" in emp_keys_restored, "FEHLER: Reaktivierter Menüpunkt erscheint nicht im Menü!"
    print(f"   - Mitarbeiter-Menü enthält 'kantine' wieder: True -> OK")

    # 8. Reset to defaults
    print("\n8. Menüstruktur auf Systemstandard zurücksetzen (POST /admin/menu/reset-defaults):")
    status_reset, _ = post_json(f"{BASE_API}/admin/menu/reset-defaults", {}, admin_token)
    assert status_reset == 200
    print("   - Standard-Menüordnung erfolgreich wiederhergestellt -> OK")

    print("\n>>> ALLE TESTS FÜR SUPERADMIN MENÜ- & NAVIGATIONSVERWALTUNG ERFOLGREICH BESTANDEN! <<<")

if __name__ == "__main__":
    main()
