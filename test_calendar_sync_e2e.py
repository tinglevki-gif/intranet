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
    print("=== E2E TEST: UNTERNEHMENSKALENDER OUTLOOK / ICAL SYNCHRONISATION ===")
    
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

    # 2. Seed / Trigger Seeder to ensure demo sources exist
    post_json(f"{BASE_API}/auth/seed", {}, admin_token)

    # 3. Fetch active calendar sources
    print("\n2. Externe Kalenderquellen abrufen (GET /calendar/sources):")
    status_sources, sources = get_json(f"{BASE_API}/calendar/sources", emp_token)
    assert status_sources == 200
    print(f"   - Aktive externe Quellen: {len(sources)}")
    for s in sources:
        print(f"     * [{s['id']}] {s['name']} ({s['farbe']}) - Status: {s['letzter_status']}, Termine: {s['anzahl_termine']}")
    assert len(sources) >= 1

    # 4. Fetch merged calendar events (Internal + Outlook Sync)
    print("\n3. Synchronisierte Kalendertermine abrufen (GET /calendar/events):")
    status_events, events = get_json(f"{BASE_API}/calendar/events", emp_token)
    assert status_events == 200
    print(f"   - Gesamtanzahl Termine (Interne + Outlook): {len(events)}")
    
    external_events = [e for e in events if e.get("is_external") is True]
    print(f"   - Davon extern aus Outlook synchronisiert: {len(external_events)}")
    assert len(external_events) >= 1, "FEHLER: Keine externen Outlook-Termine gefunden!"
    
    first_ext = external_events[0]
    print(f"   - Beispiel-Outlook-Termin: '{first_ext['title']}'")
    print(f"     * Quelle: {first_ext['source_name']} (Farbe: {first_ext['source_color']})")
    print(f"     * Start: {first_ext['start_time']}, Ganztägig: {first_ext['all_day']}")
    print(f"     * Autor/Badge: '{first_ext['author_name']}' -> OK")

    # 5. SuperAdmin adds a new test calendar source with valid iCal stream
    print("\n4. SuperAdmin fügt neue Outlook-.ics-Quelle hinzu (POST /admin/calendar-sources):")
    test_ics = """BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Microsoft Corporation//Outlook 16.0 MIMEDIR//EN
BEGIN:VEVENT
UID:test-sync-innovations-workshop@outlook.corp
DTSTAMP:20260101T000000Z
DTSTART:20260715T100000Z
DTEND:20260715T120000Z
SUMMARY:🚀 Q3 Innovations-Workshop Fertigung
DESCRIPTION:Test-Event für externe Kalendersynchronisation mit Maschinenbauern.
LOCATION:Konferenzraum Berlin
CATEGORIES:MEETING
STATUS:CONFIRMED
END:VEVENT
END:VCALENDAR"""

    new_source_data = {
        "name": "Microsoft 365 Innovationskalender",
        "ics_url": test_ics,
        "farbe": "#8764B8",  # OneNote Purple
        "ist_aktiv": True,
        "abteilung": "Technik"
    }
    status_create_src, created_source = post_json(f"{BASE_API}/admin/calendar-sources", new_source_data, admin_token)
    assert status_create_src == 201
    source_id = created_source["id"]
    print(f"   - Quelle erstellt: ID {source_id}, Name: '{created_source['name']}', Status: '{created_source['letzter_status']}' -> OK")
    assert created_source["letzter_status"] == "OK"
    assert created_source["anzahl_termine"] == 1

    # 6. Verify the newly synced event appears in GET /calendar/events
    print("\n5. Prüfen, ob der neu synchronisierte Termin im Kalender-Feed auftaucht:")
    status_events_after, events_after = get_json(f"{BASE_API}/calendar/events", emp_token)
    assert status_events_after == 200
    new_event_found = any("Innovations-Workshop" in e["title"] for e in events_after)
    print(f"   - Termin 'Innovations-Workshop' im Kalender vorhanden: {new_event_found} -> OK")
    assert new_event_found, "FEHLER: Neu synchronisierter Termin erscheint nicht im Kalender!"

    # 7. SuperAdmin deactivates the source (PUT /admin/calendar-sources/{id})
    print("\n6. SuperAdmin deaktiviert die Quelle (ist_aktiv = False):")
    update_data = {
        "ist_aktiv": False
    }
    status_upd, upd_source = put_json(f"{BASE_API}/admin/calendar-sources/{source_id}", update_data, admin_token)
    assert status_upd == 200
    assert upd_source["ist_aktiv"] is False
    print(f"   - Quelle erfolgreich deaktiviert (ist_aktiv: {upd_source['ist_aktiv']}) -> OK")

    # Verify event disappeared after deactivation
    _, events_deact = get_json(f"{BASE_API}/calendar/events", emp_token)
    deact_event_found = any("Innovations-Workshop" in e["title"] for e in events_deact)
    print(f"   - Deaktivierter Termin noch im Kalender sichtbar: {deact_event_found} (False erwartet) -> OK")
    assert not deact_event_found, "FEHLER: Deaktivierte Quelle liefert weiterhin Termine aus!"

    # 8. Test immediate manual sync (POST /admin/calendar-sources/{id}/sync)
    print("\n7. Sofortige manuelle Synchronisation testen (POST /admin/calendar-sources/{id}/sync):")
    status_sync, sync_res = post_json(f"{BASE_API}/admin/calendar-sources/{source_id}/sync", {}, admin_token)
    assert status_sync == 200
    print(f"   - Manuelle Synchronisation ausgeführt: Status '{sync_res['letzter_status']}' -> OK")

    # 9. Cleanup test source (DELETE /admin/calendar-sources/{id})
    print("\n8. Test-Kalenderquelle bereinigen:")
    del_status = delete_req(f"{BASE_API}/admin/calendar-sources/{source_id}", admin_token)
    assert del_status == 204
    print("   - Test-Quelle gelöscht (Status 204) -> OK")

    print("\n>>> ALLE TESTS FÜR OUTLOOK / ICAL KALENDERSYNCHRONISATION ERFOLGREICH BESTANDEN! <<<")

if __name__ == "__main__":
    main()
