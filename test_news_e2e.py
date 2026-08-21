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

def upload_file_multipart(url, filename, file_bytes, content_type, token=None):
    boundary = f"----WebKitFormBoundary{uuid.uuid4().hex}"
    headers = {
        "Content-Type": f"multipart/form-data; boundary={boundary}"
    }
    if token:
        headers["Authorization"] = f"Bearer {token}"

    body = []
    body.append(f"--{boundary}\r\n".encode("utf-8"))
    body.append(f'Content-Disposition: form-data; name="file"; filename="{filename}"\r\n'.encode("utf-8"))
    body.append(f"Content-Type: {content_type}\r\n\r\n".encode("utf-8"))
    body.append(file_bytes)
    body.append(f"\r\n--{boundary}--\r\n".encode("utf-8"))

    payload = b"".join(body)
    req = urllib.request.Request(url, data=payload, headers=headers, method="POST")
    try:
        with urllib.request.urlopen(req) as resp:
            return resp.status, json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read().decode("utf-8")) if e.headers.get("content-type") == "application/json" else {}

def main():
    print("=== E2E TEST: MITTEILUNGSZENTRALE & UNTERNEHMENSNEWS ===")
    
    # 1. Login SuperAdmin and Employee
    status, admin_auth = post_json(f"{BASE_API}/auth/login", {"email": "admin@empresa.com", "password": "admin123"})
    assert status == 200, "Admin login failed"
    admin_token = admin_auth["access_token"]
    print(f"1. SuperAdmin Login: OK -> {admin_auth['user']['full_name']} ({admin_auth['user']['role']})")

    status, emp_auth = post_json(f"{BASE_API}/auth/login", {"email": "empleado@empresa.com", "password": "emp123"})
    assert status == 200, "Employee login failed"
    emp_token = emp_auth["access_token"]
    print(f"   Mitarbeiter Login: OK -> {emp_auth['user']['full_name']} ({emp_auth['user']['role']})")

    # 2. Test RBAC: Regular employee cannot write / edit / delete news
    print("\n2. RBAC-Prüfung für Mitarbeiter (Schreibrechte müssen 403 Forbidden sein):")
    status_create_emp, _ = post_json(f"{BASE_API}/news", {"title": "Hack News", "content": "Test"}, emp_token)
    print(f"   - POST /news (Employee): Status {status_create_emp} (403 erwartet) -> OK")
    assert status_create_emp == 403

    status_update_emp, _ = put_json(f"{BASE_API}/news/1", {"title": "Hack Update"}, emp_token)
    print(f"   - PUT /news/1 (Employee): Status {status_update_emp} (403 erwartet) -> OK")
    assert status_update_emp == 403

    status_delete_emp = delete_req(f"{BASE_API}/news/1", emp_token)
    print(f"   - DELETE /news/1 (Employee): Status {status_delete_emp} (403 erwartet) -> OK")
    assert status_delete_emp == 403

    status_upload_emp, _ = upload_file_multipart(f"{BASE_API}/news/upload-cover", "test.png", b"\x89PNG\r\n\x1a\n", "image/png", emp_token)
    print(f"   - POST /news/upload-cover (Employee): Status {status_upload_emp} (403 erwartet) -> OK")
    assert status_upload_emp == 403

    # 3. SuperAdmin uploads a cover image
    print("\n3. SuperAdmin lädt Titelbild hoch:")
    fake_png_bytes = b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15c4"
    status_upload, upload_data = upload_file_multipart(f"{BASE_API}/news/upload-cover", "werkshalle.png", fake_png_bytes, "image/png", admin_token)
    print(f"   - Upload Status: {status_upload} -> URL: {upload_data.get('url')}")
    assert status_upload == 200
    assert "url" in upload_data
    cover_url = upload_data["url"]

    # 4. SuperAdmin creates a new pinned news article
    print("\n4. SuperAdmin erstellt neuen Beitrag mit Pinned-Status & Markdown:")
    article_payload = {
        "title": "⚡ Sonderankündigung: Neue ISO 9001 Zertifizierung für Werk Tinglev",
        "summary": "Erfolgreiches Qualitätsaudit ohne Beanstandungen abgeschlossen. Neue Produktionsstandards ab sofort in Kraft.",
        "content": """# ISO 9001:2026 Re-Zertifizierung erfolgreich!

Wir freuen uns bekanntzugeben, dass unser Werk in Tinglev das jährliche **TÜV-Qualitätsaudit** mit Bestnoten bestanden hat.

### 🌟 Schwerpunkte des Audits:
1. **Präzisionsfertigung von Betonelementen**: Höchste Maßhaltigkeit und Dokumentation.
2. **Arbeitssicherheit & Gesundheitsschutz**: Vorbildliche Einhaltung aller Schutzmaßnahmen.
3. **Digitale Rückverfolgbarkeit**: Chargenprüfung in Echtzeit über das Intranet.

> [!NOTE]
> Das offizielle Zertifikat steht ab sofort in der Dokumentenablage zum Download bereit.

Herzlichen Dank an das gesamte Qualitätssicherungsteam!""",
        "category": "Produktion & Technik",
        "is_pinned": True,
        "cover_image": cover_url
    }

    status_create, created_article = post_json(f"{BASE_API}/news", article_payload, admin_token)
    print(f"   - Erstellt: Status {status_create} -> ID: {created_article['id']}, Titel: '{created_article['title']}'")
    assert status_create == 201
    assert created_article["is_pinned"] is True
    assert created_article["author_name"] == "Carlos Mendoza"
    assert created_article["category"] == "Produktion & Technik"
    new_id = created_article["id"]

    # 5. List news and verify sorting (pinned first) & category filter
    print("\n5. News-Liste abrufen und Filter testen:")
    status_list, all_news = get_json(f"{BASE_API}/news", emp_token)
    assert status_list == 200
    print(f"   - Gesamtanzahl Beiträge: {len(all_news)}")
    assert len(all_news) >= 1
    # Check that first item is pinned
    assert all_news[0]["is_pinned"] is True
    print(f"   - Erster Beitrag im Feed: '{all_news[0]['title']}' (Pinned: {all_news[0]['is_pinned']}) -> OK")

    # Category filter
    status_cat, cat_news = get_json(f"{BASE_API}/news?category=Produktion", emp_token)
    assert status_cat == 200
    print(f"   - Filter 'Produktion & Technik': {len(cat_news)} Beiträge gefunden -> OK")
    assert any(n["id"] == new_id for n in cat_news)

    # Search filter
    status_search, search_news = get_json(f"{BASE_API}/news?q=Zertifizierung", emp_token)
    assert status_search == 200
    print(f"   - Suche nach 'Zertifizierung': {len(search_news)} Treffer -> OK")
    assert any(n["id"] == new_id for n in search_news)

    # 6. Detail View and View Count Increment
    print("\n6. Detailansicht abrufen und View-Count prüfen:")
    status_detail_1, detail_1 = get_json(f"{BASE_API}/news/{new_id}", emp_token)
    assert status_detail_1 == 200
    initial_views = detail_1["views_count"]
    print(f"   - Aufruf 1: Views = {initial_views}")

    status_detail_2, detail_2 = get_json(f"{BASE_API}/news/{new_id}", emp_token)
    assert status_detail_2 == 200
    print(f"   - Aufruf 2: Views = {detail_2['views_count']} (Inkrementiert) -> OK")
    assert detail_2["views_count"] == initial_views + 1

    # 7. SuperAdmin updates the article
    print("\n7. SuperAdmin bearbeitet den Beitrag:")
    update_payload = {
        "title": "⚡ Sonderankündigung: ISO 9001 Zertifizierung mit Auszeichnung!",
        "is_pinned": False,
        "category": "Allgemein"
    }
    status_update, updated_article = put_json(f"{BASE_API}/news/{new_id}", update_payload, admin_token)
    assert status_update == 200
    print(f"   - Aktualisiert: '{updated_article['title']}' (Pinned: {updated_article['is_pinned']}, Kategorie: {updated_article['category']}) -> OK")
    assert updated_article["title"] == "⚡ Sonderankündigung: ISO 9001 Zertifizierung mit Auszeichnung!"
    assert updated_article["is_pinned"] is False
    assert updated_article["category"] == "Allgemein"

    # 8. Check Dashboard Overview Integration
    print("\n8. Dashboard Overview API prüfen:")
    status_dash, dash_data = get_json(f"{BASE_API}/dashboard/overview", emp_token)
    assert status_dash == 200
    dash_announcements = dash_data.get("announcements", [])
    print(f"   - Dashboard Ankündigungen: {len(dash_announcements)} Einträge geladen -> OK")
    assert len(dash_announcements) > 0

    # 9. SuperAdmin deletes the test article
    print("\n9. SuperAdmin löscht den Testbeitrag:")
    status_delete = delete_req(f"{BASE_API}/news/{new_id}", admin_token)
    print(f"   - DELETE Status: {status_delete} (204 erwartet) -> OK")
    assert status_delete == 204

    # Verify 404 after deletion
    status_deleted_get, _ = get_json(f"{BASE_API}/news/{new_id}", admin_token)
    print(f"   - GET nach Löschen: Status {status_deleted_get} (404 erwartet) -> OK")
    assert status_deleted_get == 404

    print("\n>>> ALLE TESTS FÜR MITTEILUNGSZENTRALE & UNTERNEHMENSNEWS ERFOLGREICH BESTANDEN! <<<")

if __name__ == "__main__":
    main()
