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

def patch_json(url, data, token=None):
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    req = urllib.request.Request(url, data=json.dumps(data).encode("utf-8"), headers=headers, method="PATCH")
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
    print("=== E2E TEST: DYNAMISCHE SYSTEM-SPRACHVERWALTUNG (i18n) ===")
    
    # 1. Login SuperAdmin and Employee
    status, admin_auth = post_json(f"{BASE_API}/auth/login", {"email": "admin@empresa.com", "password": "admin123"})
    assert status == 200, "SuperAdmin Login failed"
    admin_token = admin_auth["access_token"]
    print(f"1. SuperAdmin Login: OK -> {admin_auth['user']['full_name']} (ADMIN)")

    status, emp_auth = post_json(f"{BASE_API}/auth/login", {"email": "empleado@empresa.com", "password": "emp123"})
    assert status == 200, "Employee Login failed"
    emp_token = emp_auth["access_token"]
    print(f"   Mitarbeiter Login: OK -> {emp_auth['user']['full_name']} (EMPLOYEE)")

    # 1b. Reset all languages to active for clean baseline
    for code in ['de', 'en', 'es', 'pl', 'tr', 'da']:
        patch_json(f"{BASE_API}/admin/languages/{code}", {"is_active": True}, admin_token)
    post_json(f"{BASE_API}/admin/languages/de/set-default", {}, admin_token)

    # 2. RBAC Security: Employee cannot modify or access admin language endpoints
    print("\n2. RBAC-Prüfung für Mitarbeiter (Admin-Routen müssen 403 Forbidden sein):")
    status_admin_get_emp, _ = get_json(f"{BASE_API}/admin/languages", emp_token)
    print(f"   - GET /admin/languages (Employee): Status {status_admin_get_emp} (403 erwartet) -> OK")
    assert status_admin_get_emp == 403

    status_patch_emp, _ = patch_json(f"{BASE_API}/admin/languages/en", {"is_active": False}, emp_token)
    print(f"   - PATCH /admin/languages/en (Employee): Status {status_patch_emp} (403 erwartet) -> OK")
    assert status_patch_emp == 403

    status_default_emp, _ = post_json(f"{BASE_API}/admin/languages/en/set-default", {}, emp_token)
    print(f"   - POST /admin/languages/en/set-default (Employee): Status {status_default_emp} (403 erwartet) -> OK")
    assert status_default_emp == 403

    # 3. Public active languages endpoint
    print("\n3. Öffentliche / Mitarbeiter-Sprachabfrage (GET /languages/active):")
    status_active, active_data = get_json(f"{BASE_API}/languages/active", emp_token)
    assert status_active == 200
    print(f"   - Aktive Sprachen geladen ({active_data['total_active']} aktiv): {[l['code'] for l in active_data['languages']]}")
    print(f"   - Standardsprache: {active_data['default_language']}")
    assert active_data["total_active"] >= 4
    assert active_data["default_language"] == "de"

    # 4. SuperAdmin lists all languages
    print("\n4. SuperAdmin ruft vollständige Sprachkonfiguration ab (GET /admin/languages):")
    status_all, all_langs = get_json(f"{BASE_API}/admin/languages", admin_token)
    assert status_all == 200
    print(f"   - Alle Sprachen ({len(all_langs)} konfiguriert):")
    for l in all_langs:
        print(f"     * [{l['code'].upper()}] {l['flag']} {l['name']} ({l['locale']}) - Aktiv: {l['is_active']}, Standard: {l['is_default']}")
    assert len(all_langs) >= 6

    # 5. SuperAdmin deactivates a language (e.g. English)
    print("\n5. SuperAdmin deaktiviert die Sprache 'Englisch' (PATCH /admin/languages/en):")
    status_toggle_off, deactivated_lang = patch_json(f"{BASE_API}/admin/languages/en", {"is_active": False}, admin_token)
    assert status_toggle_off == 200
    print(f"   - Sprache '{deactivated_lang['name']}' Status: is_active = {deactivated_lang['is_active']} -> OK")
    assert deactivated_lang["is_active"] is False

    # Verify active list no longer includes 'en'
    status_active_check, active_after_toggle = get_json(f"{BASE_API}/languages/active", emp_token)
    assert status_active_check == 200
    active_codes = [l["code"] for l in active_after_toggle["languages"]]
    print(f"   - Aktive Sprachen nach Deaktivierung von EN: {active_codes}")
    assert "en" not in active_codes
    assert "de" in active_codes

    # 6. Safety Check: Cannot deactivate default language
    print("\n6. Schutz vor Deaktivierung der Standardsprache 'Deutsch':")
    status_fail_de, fail_resp = patch_json(f"{BASE_API}/admin/languages/de", {"is_active": False}, admin_token)
    print(f"   - Versuch 'de' zu deaktivieren: Status {status_fail_de} (400 erwartet, Detail: '{fail_resp.get('detail')}') -> OK")
    assert status_fail_de == 400

    # 7. SuperAdmin changes default language to Spanish
    print("\n7. SuperAdmin ändert Standardsprache auf 'Spanisch' (POST /admin/languages/es/set-default):")
    status_set_es, es_default = post_json(f"{BASE_API}/admin/languages/es/set-default", {}, admin_token)
    assert status_set_es == 200
    print(f"   - Neue Standardsprache: '{es_default['name']}' (is_default: {es_default['is_default']}, is_active: {es_default['is_active']}) -> OK")
    assert es_default["is_default"] is True
    assert es_default["is_active"] is True

    # Verify active list reports 'es' as default
    _, active_es_def = get_json(f"{BASE_API}/languages/active", emp_token)
    assert active_es_def["default_language"] == "es"
    print(f"   - Verifiziert: /languages/active default_language = '{active_es_def['default_language']}' -> OK")

    # 8. Reset default language back to German and re-activate English
    print("\n8. Wiederherstellung: Standardsprache zurück auf 'Deutsch' und 'Englisch' reaktivieren:")
    status_set_de, _ = post_json(f"{BASE_API}/admin/languages/de/set-default", {}, admin_token)
    assert status_set_de == 200
    print(f"   - Standardsprache zurück auf Deutsch: OK")

    status_reactivate_en, en_active = patch_json(f"{BASE_API}/admin/languages/en", {"is_active": True}, admin_token)
    assert status_reactivate_en == 200
    assert en_active["is_active"] is True
    print(f"   - 'Englisch' wieder aktiviert: OK")

    # Final active check
    _, final_active = get_json(f"{BASE_API}/languages/active", emp_token)
    final_codes = [l["code"] for l in final_active["languages"]]
    print(f"   - Finale aktive Sprachen ({len(final_codes)}): {final_codes} -> OK")
    assert "de" in final_codes
    assert "en" in final_codes
    assert "es" in final_codes

    print("\n>>> ALLE TESTS FÜR DYNAMISCHE SYSTEM-SPRACHVERWALTUNG ERFOLGREICH BESTANDEN! <<<")

if __name__ == "__main__":
    main()
