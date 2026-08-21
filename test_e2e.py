import urllib.request
import urllib.error
import json
import mimetypes
import uuid
import sys

if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

BASE_API = "http://127.0.0.1:8000/api/v1"

def post_json(url, data, token=None):
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    req = urllib.request.Request(url, data=json.dumps(data).encode("utf-8"), headers=headers, method="POST")
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode("utf-8"))

def put_json(url, data, token=None):
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    req = urllib.request.Request(url, data=json.dumps(data).encode("utf-8"), headers=headers, method="PUT")
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode("utf-8"))

def get_json(url, token):
    req = urllib.request.Request(url, headers={"Authorization": f"Bearer {token}"})
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode("utf-8"))

def delete_req(url, token=None):
    headers = {}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    req = urllib.request.Request(url, headers=headers, method="DELETE")
    try:
        with urllib.request.urlopen(req) as resp:
            return resp.status
    except urllib.error.HTTPError as e:
        return e.code

def main():
    print("=== E2E TEST: DYNAMISCHE ROLLENVERWALTUNG & RBAC-MATRIX ===")
    
    # 1. SuperAdmin Login
    admin_login = post_json(f"{BASE_API}/auth/login", {"email": "admin@empresa.com", "password": "admin123"})
    admin_token = admin_login["access_token"]
    print(f"1. Auth SuperAdmin: OK -> {admin_login['user']['full_name']}")

    # 2. Get Permissions Catalog
    catalog = get_json(f"{BASE_API}/admin/roles/permissions-catalog", admin_token)
    print(f"2. Berechtigungskatalog geladen: {len(catalog['modules'])} Module, {len(catalog['levels'])} Stufen -> OK")
    assert len(catalog['modules']) >= 16

    # 3. List Roles
    roles = get_json(f"{BASE_API}/admin/roles", admin_token)
    print(f"3. Vorhandene Rollen ({len(roles)} Rollen):")
    for r in roles:
        print(f"   - [{r['slug']}] {r['name']} (System: {r['is_system_role']}, Benutzer: {r['users_count']})")
    assert len(roles) >= 4

    # 4. Create new Custom Role
    custom_role_payload = {
        "name": "Schichtleiter Betonfertigteile",
        "slug": "SHIFT_LEAD_CONCRETE",
        "description": "Zuständig für Fertigungshalle 1 & 2, Schichtplanung und Qualitätsabnahme.",
        "permissions": {
            "abwicklung": "admin",
            "planung": "read_write",
            "technik": "read_write",
            "kantine": "read_write",
            "schulungen": "read_write",
            "documents": "read",
            "calendar": "read_write",
            "gps": "read",
            "phone-directory": "read",
            "org-chart": "read",
            "directory": "read",
            "admin-users": "none",
            "admin-roles": "none",
            "admin-settings": "none"
        }
    }
    new_role = post_json(f"{BASE_API}/admin/roles", custom_role_payload, admin_token)
    print(f"\n4. Neue Rolle angelegt: '{new_role['name']}' (ID: {new_role['id']}, Slug: #{new_role['slug']}) -> OK")
    assert new_role["slug"] == "SHIFT_LEAD_CONCRETE"
    assert new_role["permissions"]["abwicklung"] == "admin"

    # 5. Update Custom Role
    updated_role = put_json(
        f"{BASE_API}/admin/roles/{new_role['id']}",
        {
            "name": "Leitender Schichtleiter Betonwerk",
            "description": "Erweiterte Disposition und QS-Freigaben.",
            "permissions": {
                "gps": "read_write"
            }
        },
        admin_token
    )
    print(f"5. Rolle aktualisiert: '{updated_role['name']}' -> OK")
    assert updated_role["name"] == "Leitender Schichtleiter Betonwerk"
    assert updated_role["permissions"]["gps"] == "read_write"

    # 6. Safety Check: Cannot delete system role
    sys_role = [r for r in roles if r["is_system_role"]][0]
    status_sys_del = delete_req(f"{BASE_API}/admin/roles/{sys_role['id']}", admin_token)
    print(f"6. Schutz vor Löschen von Systemrollen (#{sys_role['slug']}): Status {status_sys_del} (400 erwartet) -> OK")
    assert status_sys_del == 400

    # 7. Create user assigned to new custom role
    test_user_email = f"schichtleiter_{uuid.uuid4().hex[:6]}@empresa.com"
    test_user = post_json(
        f"{BASE_API}/admin/users",
        {
            "email": test_user_email,
            "password": "password123",
            "first_name": "Klaus",
            "last_name": "Weber",
            "full_name": "Klaus Weber",
            "department": "Fertigung & Produktion",
            "position": "Schichtleiter Halle 1",
            "role": "EMPLOYEE",
            "custom_role_id": new_role["id"]
        },
        admin_token
    )
    print(f"\n7. Testbenutzer erstellt und Rolle zugewiesen: {test_user['full_name']} (ID: {test_user['id']}, Role: {test_user['custom_role_name']}) -> OK")
    assert test_user["custom_role_id"] == new_role["id"]

    # 8. Login as new role user and verify dynamic menu
    user_login = post_json(f"{BASE_API}/auth/login", {"email": test_user_email, "password": "password123"})
    user_token = user_login["access_token"]
    user_menu = get_json(f"{BASE_API}/navigation/menu", user_token)
    
    visible_keys = []
    for sec in user_menu["sections"]:
        for item in sec["items"]:
            visible_keys.append(item["key"])
    
    print(f"8. Menü für Rolle '{updated_role['name']}':")
    print(f"   Sichtbare Module ({len(visible_keys)}): {visible_keys}")
    assert "abwicklung" in visible_keys
    assert "planung" in visible_keys
    assert "schulungen" in visible_keys
    assert "admin-users" not in visible_keys  # Not permitted for this custom role
    print("   -> Dynamische Menüberechtigung erfolgreich validiert!")

    # 9. Safety Check: Cannot delete role while users are assigned
    status_assigned_del = delete_req(f"{BASE_API}/admin/roles/{new_role['id']}", admin_token)
    print(f"9. Schutz vor Löschen aktiver Rollen: Status {status_assigned_del} (400 erwartet) -> OK")
    assert status_assigned_del == 400

    # 10. Clean up: Delete test user, then delete custom role
    del_user_status = delete_req(f"{BASE_API}/admin/users/{test_user['id']}", admin_token)
    assert del_user_status == 204
    print(f"10. Testbenutzer gelöscht (Status 204) -> OK")

    del_role_status = delete_req(f"{BASE_API}/admin/roles/{new_role['id']}", admin_token)
    assert del_role_status == 204
    print(f"11. Benutzerdefinierte Rolle gelöscht (Status 204) -> OK")

    print("\n>>> ALLE ROLLENVERWALTUNGS- UND RBAC-TESTS ERFOLGREICH BESTANDEN! <<<")

if __name__ == "__main__":
    main()
