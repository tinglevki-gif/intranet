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
    print("=== E2E TEST: HELPDESK & TICKET-SYSTEM BACKEND ===")
    
    # 1. Login Accounts
    status_admin, admin_auth = post_json(f"{BASE_API}/auth/login", {"email": "admin@empresa.com", "password": "admin123"})
    if status_admin != 200:
        status_admin, admin_auth = post_json(f"{BASE_API}/auth/login", {"email": "humbert.admin@empresa.com", "password": "admin123"})
    assert status_admin == 200, "SuperAdmin Login failed"
    admin_token = admin_auth["access_token"]
    
    status_it, it_auth = post_json(f"{BASE_API}/auth/login", {"email": "it_admin@empresa.com", "password": "it123"})
    assert status_it == 200, "IT Admin Login failed"
    it_token = it_auth["access_token"]
    it_user_id = it_auth["user"]["id"]

    status_emp, emp_auth = post_json(f"{BASE_API}/auth/login", {"email": "empleado@empresa.com", "password": "emp123"})
    assert status_emp == 200, "Employee Login failed"
    emp_token = emp_auth["access_token"]
    emp_user_id = emp_auth["user"]["id"]

    print("1. Login erfolgreich: SuperAdmin, IT-Admin (Tobias Weber), Mitarbeiter (Mateo Silva)")

    # 2. Seed / Trigger Seeder to ensure demo tickets exist
    post_json(f"{BASE_API}/auth/seed", {}, admin_token)

    # 3. Employee creates a new ticket
    print("\n2. Mitarbeiter erstellt neues Support-Ticket:")
    new_ticket_data = {
        "titel": "🖥️ Monitor in Fertigungshalle 2 flackert bei Sonneneinstrahlung",
        "beschreibung": "Der 32-Zoll Industrie-Monitor an Arbeitsstation 4 verliert zeitweise das Signal und flackert stark bei hoher Helligkeit.",
        "kategorie": "HARDWARE",
        "prioritaet": "HOCH",
        "loesungs_schlagwoerter": ["Monitor", "Halle2", "Hardware", "Display"]
    }
    status_create, created_ticket = post_json(f"{BASE_API}/tickets", new_ticket_data, emp_token)
    assert status_create == 201, f"Ticket creation failed: {status_create}"
    ticket_id = created_ticket["id"]
    ticket_nr = created_ticket["ticket_nr"]
    print(f"   - Ticket erstellt: ID {ticket_id}, Nr: '{ticket_nr}', Status: '{created_ticket['status']}' -> OK")
    assert created_ticket["status"] == "OFFEN"
    assert created_ticket["ersteller_id"] == emp_user_id
    assert created_ticket["kategorie"] == "HARDWARE"
    assert created_ticket["prioritaet"] == "HOCH"

    # 4. List Tickets & RBAC Visibility Filter
    print("\n3. Ticket-Listenabruf & RBAC-Filter prüfen:")
    status_list_emp, emp_tickets = get_json(f"{BASE_API}/tickets", emp_token)
    assert status_list_emp == 200
    print(f"   - Mitarbeiter sieht eigene/zugewiesene Tickets: {emp_tickets['total']} Tickets")

    status_list_it, it_tickets = get_json(f"{BASE_API}/tickets", it_token)
    assert status_list_it == 200
    print(f"   - IT-Admin sieht alle Unternehmens-Tickets: {it_tickets['total']} Tickets -> OK")
    assert it_tickets["total"] >= emp_tickets["total"]

    # 5. IT-Admin assigns ticket to self
    print("\n4. Ticket-Zuweisung an IT-Admin:")
    status_assign, assigned_ticket = patch_json(f"{BASE_API}/tickets/{ticket_id}/assign", {"zugewiesen_an_id": it_user_id}, it_token)
    assert status_assign == 200
    print(f"   - Zugewiesen an: {assigned_ticket['zugewiesen_an_name']} (ID: {assigned_ticket['zugewiesen_an_id']})")
    print(f"   - Status nach Zuweisung automatisch: '{assigned_ticket['status']}' (Erwartet: 'IN_BEARBEITUNG') -> OK")
    assert assigned_ticket["status"] == "IN_BEARBEITUNG"
    assert assigned_ticket["zugewiesen_an_id"] == it_user_id

    # 6. IT-Admin posts internal note
    print("\n5. IT-Admin verfasst eine INTERNE Notiz:")
    internal_note_data = {
        "nachricht": "🔒 INTERNE NOTIZ: Neues DisplayPort-Kabel liegt im IT-Lager Regal C2 bereit. Techniker prüft vor Ort um 14:00 Uhr.",
        "ist_interne_notiz": True
    }
    status_note, note_res = post_json(f"{BASE_API}/tickets/{ticket_id}/messages", internal_note_data, it_token)
    assert status_note == 201
    print(f"   - Interne Notiz erstellt: ID {note_res['id']}, Notiz: {note_res['ist_interne_notiz']} -> OK")

    # 7. Employee tries to create internal note -> 403 Forbidden
    print("\n6. Mitarbeiter versucht interne Notiz zu erstellen (Rechteprüfung):")
    status_emp_note, emp_note_res = post_json(f"{BASE_API}/tickets/{ticket_id}/messages", internal_note_data, emp_token)
    assert status_emp_note == 403, f"Expected 403 Forbidden, got {status_emp_note}"
    print(f"   - Mitarbeiter-Schreibversuch für interne Notiz: Status {status_emp_note} (403 Forbidden erwartet) -> OK")

    # 8. Employee posts standard message
    print("\n7. Mitarbeiter verfasst normale Antwort:")
    emp_msg_data = {
        "nachricht": "Vielen Dank für die schnelle Rückmeldung! Ich bin bis 16:30 Uhr am Leitstand Halle 2 erreichbar.",
        "ist_interne_notiz": False
    }
    status_msg, msg_res = post_json(f"{BASE_API}/tickets/{ticket_id}/messages", emp_msg_data, emp_token)
    assert status_msg == 201
    print(f"   - Mitarbeiter-Nachricht erstellt -> OK")

    # 9. Verify internal note filtering for employee vs IT-Admin
    print("\n8. Prüfung der internen Notizen-Filterung in der Detailansicht:")
    status_det_emp, emp_detail = get_json(f"{BASE_API}/tickets/{ticket_id}", emp_token)
    assert status_det_emp == 200
    emp_has_internal = any(m["ist_interne_notiz"] for m in emp_detail["messages"])
    print(f"   - Mitarbeiter sieht interne Notizen: {emp_has_internal} (False erwartet) -> OK")
    assert not emp_has_internal, "FEHLER: Mitarbeiter kann interne IT-Notizen einsehen!"

    status_det_it, it_detail = get_json(f"{BASE_API}/tickets/{ticket_id}", it_token)
    assert status_det_it == 200
    it_has_internal = any(m["ist_interne_notiz"] for m in it_detail["messages"])
    print(f"   - IT-Admin sieht interne Notizen: {it_has_internal} (True erwartet) -> OK")
    assert it_has_internal, "FEHLER: IT-Admin kann interne Notizen nicht sehen!"

    # 10. Test validation: Resolve ticket without solution documentation -> 422 Unprocessable Entity
    print("\n9. Validierungsprüfung bei Status 'GELOEST' ohne Lösungsdokumentation:")
    invalid_resolve = {
        "status": "GELOEST",
        "loesung_dokumentation": ""
    }
    status_inv, inv_res = patch_json(f"{BASE_API}/tickets/{ticket_id}/status", invalid_resolve, it_token)
    assert status_inv in [400, 422], f"Expected 400/422, got {status_inv}"
    print(f"   - Abschluss ohne Lösungsdokumentation: Status {status_inv} (Abgelehnt wie erwartet) -> OK")

    # 11. Successfully resolve ticket with documentation
    print("\n10. Erfolgreicher Ticketabschluss mit Lösungsdokumentation:")
    valid_resolve = {
        "status": "GELOEST",
        "loesung_dokumentation": "DisplayPort-Kabel gegen doppelt geschirmtes Industriekabel ausgetauscht und Monitor-Helligkeitssensor neu kalibriert.",
        "loesungs_schlagwoerter": ["DisplayPort", "Kabeltausch", "Sensor", "Kalibrierung"]
    }
    status_res, res_ticket = patch_json(f"{BASE_API}/tickets/{ticket_id}/status", valid_resolve, it_token)
    assert status_res == 200
    print(f"   - Ticket erfolgreich gelöst: Status '{res_ticket['status']}'")
    print(f"   - Lösungsdokumentation: '{res_ticket['loesung_dokumentation'][:40]}...'")
    print(f"   - Gelöst am: {res_ticket['geloest_am']} -> OK")
    assert res_ticket["status"] == "GELOEST"
    assert res_ticket["geloest_am"] is not None
    assert len(res_ticket["loesung_dokumentation"]) >= 10

    # 12. Statistics Summary
    print("\n11. KPI- und Statistik-Endpunkt prüfen:")
    status_stats, stats_data = get_json(f"{BASE_API}/tickets/stats/summary", it_token)
    assert status_stats == 200
    print(f"   - Gesamt: {stats_data['total']}, Offen: {stats_data['offen']}, In Bearbeitung: {stats_data['in_bearbeitung']}, Gelöst: {stats_data['geloest']}")
    print(f"   - Kategorien: {list(stats_data['nach_kategorie'].keys())}")
    assert stats_data["total"] >= 1
    assert stats_data["geloest"] >= 1

    # 13. Cleanup
    print("\n12. Test-Ticket bereinigen:")
    del_status = delete_req(f"{BASE_API}/tickets/{ticket_id}", admin_token)
    assert del_status == 204
    print("   - Test-Ticket gelöscht (Status 204) -> OK")

    print("\n>>> ALLE HELPDESK- UND TICKET-SYSTEM TESTS ERFOLGREICH BESTANDEN! <<<")

if __name__ == "__main__":
    main()
