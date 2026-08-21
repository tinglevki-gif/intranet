import urllib.request
import urllib.error
import json
import sys
import os

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
    print("=== E2E TEST: PERMANENTE DATENPERSISTENZ & SEED-SCHUTZ ===")
    
    # 1. Login with whatever email SuperAdmin currently has (admin@empresa.com or humbert.admin@empresa.com)
    admin_login_email = "admin@empresa.com"
    status, admin_auth = post_json(f"{BASE_API}/auth/login", {"email": admin_login_email, "password": "admin123"})
    if status != 200:
        admin_login_email = "humbert.admin@empresa.com"
        status, admin_auth = post_json(f"{BASE_API}/auth/login", {"email": admin_login_email, "password": "admin123"})
    
    assert status == 200, f"SuperAdmin Login failed with status {status}"
    admin_token = admin_auth["access_token"]
    admin_id = admin_auth["user"]["id"]
    print(f"1. SuperAdmin Login: OK -> ID: {admin_id}, Name: {admin_auth['user']['full_name']}, Email: {admin_auth['user']['email']}")

    # 2. SuperAdmin updates his own profile to custom values
    print("\n2. SuperAdmin ändert sein Profil (Name, E-Mail, Position):")
    new_profile_data = {
        "full_name": "Humbert Administrator",
        "first_name": "Humbert",
        "last_name": "Administrator",
        "email": "humbert.admin@empresa.com",
        "position": "Leitung IT & Hauptadministrator",
        "department": "Geschäftsführung & IT"
    }
    status_update, updated_user = put_json(f"{BASE_API}/admin/users/{admin_id}", new_profile_data, admin_token)
    assert status_update == 200, f"Update SuperAdmin failed: {status_update}"
    print(f"   - SuperAdmin erfolgreich aktualisiert: '{updated_user['full_name']}' ({updated_user['email']}) -> OK")
    assert updated_user["full_name"] == "Humbert Administrator"
    assert updated_user["email"] == "humbert.admin@empresa.com"

    # 3. Create a new custom user
    print("\n3. Neuen Testbenutzer anlegen:")
    custom_user_data = {
        "email": "persistenz.tester@empresa.com",
        "full_name": "Dr. Sarah Lindemann",
        "first_name": "Sarah",
        "last_name": "Lindemann",
        "password": "testerpass123",
        "role": "EMPLOYEE",
        "department": "Statik & Konstruktion",
        "position": "Senior Statikerin"
    }
    status_create, created_user = post_json(f"{BASE_API}/admin/users", custom_user_data, admin_token)
    assert status_create == 201, f"Create user failed: {status_create}"
    custom_user_id = created_user["id"]
    print(f"   - Neuer Benutzer erstellt: ID {custom_user_id} - '{created_user['full_name']}' -> OK")

    # 4. Create a new custom news post
    print("\n4. Neuen benutzerdefinierten News-Beitrag anlegen:")
    custom_news_data = {
        "title": "🧪 Test-Mitteilung für Datenpersistenz-Prüfung",
        "summary": "Dieser Beitrag darf bei einem Server-Neustart keinesfalls gelöscht werden.",
        "content": "### Persistenz-Test\n\nDieser Inhalt muss einen Serverneustart und Seeder-Aufruf überstehen.",
        "category": "Allgemein",
        "is_pinned": False
    }
    status_news, created_news = post_json(f"{BASE_API}/news", custom_news_data, admin_token)
    assert status_news == 201
    custom_news_id = created_news["id"]
    print(f"   - News-Beitrag erstellt: ID {custom_news_id} - '{created_news['title']}' -> OK")

    # 5. SIMULATE SERVER RESTART / POST /auth/seed (which runs seed_database, seed_default_roles, etc.)
    print("\n5. Server-Neustart / Seeder-Aufruf simulieren (POST /auth/seed):")
    status_reseed, reseed_res = post_json(f"{BASE_API}/auth/seed", {}, admin_token)
    assert status_reseed == 200
    print(f"   - Seeder-Ausführung abgeschlossen: '{reseed_res.get('message')}' -> OK")

    # 6. VERIFICATION: Ensure SuperAdmin was NOT overwritten or reset back to Carlos Mendoza
    print("\n6. Verifikation nach Neustart / Seeder-Lauf:")
    status_get_admin, admin_after_restart = get_json(f"{BASE_API}/admin/users/{admin_id}", admin_token)
    assert status_get_admin == 200
    print(f"   - SuperAdmin Name: '{admin_after_restart['full_name']}' (Erwartet: 'Humbert Administrator')")
    print(f"   - SuperAdmin Email: '{admin_after_restart['email']}' (Erwartet: 'humbert.admin@empresa.com')")
    assert admin_after_restart["full_name"] == "Humbert Administrator", "FEHLER: SuperAdmin wurde mit Default-Werten überschrieben!"
    assert admin_after_restart["email"] == "humbert.admin@empresa.com", "FEHLER: SuperAdmin-Email wurde zurückgesetzt!"
    print("   -> SUPERADMIN-DATEN ERFOLGREICH BEIBEHALTEN (KEIN RESET)!")

    # Verify custom user still exists
    status_get_user, user_after_restart = get_json(f"{BASE_API}/admin/users/{custom_user_id}", admin_token)
    assert status_get_user == 200
    assert user_after_restart["email"] == "persistenz.tester@empresa.com"
    print(f"   - Benutzer '{user_after_restart['full_name']}' existiert weiterhin -> OK")

    # Verify custom news post still exists
    status_get_news, news_after_restart = get_json(f"{BASE_API}/news/{custom_news_id}", admin_token)
    assert status_get_news == 200
    print(f"   - News-Beitrag '{news_after_restart['title']}' existiert weiterhin -> OK")

    # Verify login with updated SuperAdmin credentials
    print("\n7. Login-Test mit aktualisierten SuperAdmin-Zugangsdaten:")
    status_login_new, new_auth = post_json(f"{BASE_API}/auth/login", {"email": "humbert.admin@empresa.com", "password": "admin123"})
    assert status_login_new == 200
    print(f"   - Login mit 'humbert.admin@empresa.com': Status {status_login_new} -> OK")

    # 8. Cleanup test artifacts and restore demo email
    print("\n8. Bereinigung der Testdaten:")
    delete_req(f"{BASE_API}/admin/users/{custom_user_id}", admin_token)
    delete_req(f"{BASE_API}/news/{custom_news_id}", admin_token)

    # Restore default email for other test suites
    restore_data = {
        "full_name": "Carlos Mendoza",
        "first_name": "Carlos",
        "last_name": "Mendoza",
        "email": "admin@empresa.com",
        "position": "Chief Technology Officer & SuperAdmin",
        "department": "Geschäftsführung & IT"
    }
    put_json(f"{BASE_API}/admin/users/{admin_id}", restore_data, admin_token)
    print("   - SuperAdmin-Daten für nachfolgende Tests zurückgesetzt -> OK")

    print("\n>>> ALLE TESTS FÜR PERMANENTE DATENPERSISTENZ ERFOLGREICH BESTANDEN! <<<")

if __name__ == "__main__":
    main()
