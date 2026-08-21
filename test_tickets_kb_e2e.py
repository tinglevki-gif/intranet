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

def patch_json(url, data, token=None):
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    req = urllib.request.Request(url, data=json.dumps(data).encode("utf-8"), headers=headers, method="PATCH")
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
    print("=== E2E TEST: TICKET WISSENSDATENBANK & SMART-ASSIST SUCHE ===")
    
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

    # 2. Seed / Trigger Seeder to ensure demo tickets exist
    post_json(f"{BASE_API}/auth/seed", {}, admin_token)

    # 3. Knowledge Base Volltext- & Tag-Suche
    print("\n2. Wissensdatenbank-Suche (GET /tickets/knowledge-base/search):")
    
    # 3a. Allgemeine KB-Abfrage (ohne Query)
    status_kb_all, kb_all = get_json(f"{BASE_API}/tickets/knowledge-base/search", emp_token)
    assert status_kb_all == 200
    print(f"   - Gesamtanzahl gelöster dokumentierter Fälle: {kb_all['total']}")
    assert kb_all['total'] >= 1

    # 3b. Gezielte Suche nach "2FA Smartphone"
    query_param = urllib.parse.quote("2FA Smartphone")
    status_kb_2fa, kb_2fa = get_json(f"{BASE_API}/tickets/knowledge-base/search?q={query_param}", emp_token)
    assert status_kb_2fa == 200
    assert kb_2fa['total'] >= 1
    top_hit = kb_2fa['results'][0]
    print(f"   - Treffer für '2FA Smartphone': Ticket '{top_hit['ticket_nr']}' - '{top_hit['titel']}'")
    print(f"   - Techniker: {top_hit['techniker_name']}")
    print(f"   - Lösungsschritte: {top_hit['loesungsschritte'][:50]}...")
    print(f"   - Relevanz-Score: {top_hit['relevance_score']} -> OK")
    assert "2FA" in top_hit["loesungs_schlagwoerter"]
    assert top_hit["relevance_score"] is not None and top_hit["relevance_score"] > 0

    # 3c. Filter nach Kategorie IT_SUPPORT vs GEBAEUDE
    status_cat_it, kb_cat_it = get_json(f"{BASE_API}/tickets/knowledge-base/search?kategorie=IT_SUPPORT", emp_token)
    assert status_cat_it == 200
    assert all(r['kategorie'] == 'IT_SUPPORT' for r in kb_cat_it['results'])
    print(f"   - Kategorie-Filter 'IT_SUPPORT': {kb_cat_it['total']} Treffer -> OK")

    # 4. Smart Assist Lösungsvorschläge während Ticketerstellung
    print("\n3. Smart-Assist Vorschlagssystem (GET /tickets/suggest-solutions):")
    
    # 4a. Benutzer tippt Titel ein
    suggest_query = urllib.parse.quote("Neues Smartphone Microsoft 2FA Authenticator einrichten")
    status_sug, sug_res = get_json(f"{BASE_API}/tickets/suggest-solutions?titel={suggest_query}&kategorie=IT_SUPPORT", emp_token)
    assert status_sug == 200
    print(f"   - Vorschläge gefunden: {sug_res['has_suggestions']} (Anzahl: {sug_res['suggestions_count']})")
    assert sug_res['has_suggestions'] is True
    sug_hit = sug_res['suggestions'][0]
    print(f"   - Bester Lösungsvorschlag: '{sug_hit['titel']}' (Score: {sug_hit['relevance_score']}) -> OK")

    # 4b. Sehr kurze oder leere Eingabe
    status_empty_sug, empty_sug = get_json(f"{BASE_API}/tickets/suggest-solutions?titel=Hi", emp_token)
    assert status_empty_sug == 200
    assert empty_sug['has_suggestions'] is False
    print("   - Leere / zu kurze Eingabe liefert korrekterweise keine Vorschläge -> OK")

    # 5. Ausschlussprüfung: Ungelöste Tickets dürfen NIE in der Knowledge Base erscheinen
    print("\n4. Ausschluss ungelöster Tickets aus der Wissensdatenbank:")
    temp_ticket_data = {
        "titel": "Test 2FA Problem noch ungelöst",
        "beschreibung": "Dieses Ticket ist noch offen und darf keinesfalls in der Wissensdatenbank auftauchen.",
        "kategorie": "IT_SUPPORT",
        "prioritaet": "HOCH",
        "loesungs_schlagwoerter": ["2FA", "Ungeloest"]
    }
    status_create, temp_ticket = post_json(f"{BASE_API}/tickets", temp_ticket_data, emp_token)
    assert status_create == 201
    temp_id = temp_ticket["id"]

    # Prüfen, dass das ungelöste Ticket nicht in der KB erscheint
    q_search_temp = urllib.parse.quote("Test 2FA Problem noch ungelöst")
    _, kb_check = get_json(f"{BASE_API}/tickets/knowledge-base/search?q={q_search_temp}", emp_token)
    temp_in_kb = any(r['id'] == temp_id for r in kb_check['results'])
    print(f"   - Ungelöstes Ticket in Knowledge Base auffindbar: {temp_in_kb} (False erwartet) -> OK")
    assert not temp_in_kb, "FEHLER: Ungelöstes Ticket erscheint in der Wissensdatenbank!"

    # Jetzt lösen und erneut prüfen
    resolve_data = {
        "status": "GELOEST",
        "loesung_dokumentation": "Problem wurde gelöst durch Aktualisierung des Time-Based One-Time Password Algorithmus.",
        "loesungs_schlagwoerter": ["2FA", "TOTP", "Algorithmus"]
    }
    status_res, _ = patch_json(f"{BASE_API}/tickets/{temp_id}/status", resolve_data, admin_token)
    assert status_res == 200

    # Jetzt MUSS es in der KB erscheinen
    _, kb_check_after = get_json(f"{BASE_API}/tickets/knowledge-base/search?q={q_search_temp}", emp_token)
    temp_in_kb_after = any(r['id'] == temp_id for r in kb_check_after['results'])
    print(f"   - Gelöstes Ticket nach Dokumentation in Knowledge Base auffindbar: {temp_in_kb_after} (True erwartet) -> OK")
    assert temp_in_kb_after, "FEHLER: Gelöstes Ticket erscheint nach Lösung nicht in der Wissensdatenbank!"

    # Cleanup
    delete_req(f"{BASE_API}/tickets/{temp_id}", admin_token)
    print("   - Temporäres Test-Ticket bereinigt -> OK")

    print("\n>>> ALLE TESTS FÜR WISSENSDATENBANK & SMART-ASSIST ERFOLGREICH BESTANDEN! <<<")

if __name__ == "__main__":
    main()
