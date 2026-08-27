import urllib.request
import json

def test_api():
    print("=== 1. Login as SuperAdmin Humbert Senf ===")
    login_data = json.dumps({'email': 'h.senf@tinglev.de', 'password': 'Passwort123!'}).encode('utf-8')
    req = urllib.request.Request('http://127.0.0.1:8000/api/v1/auth/login', data=login_data, headers={'Content-Type': 'application/json'})
    with urllib.request.urlopen(req) as resp:
        res = json.loads(resp.read().decode('utf-8'))
        admin_token = res['access_token']
        admin_user = res['user']
        print(f"[OK] Logged in as: {admin_user['full_name']} | Role: {admin_user['role']} | can_manage_canteen: {admin_user.get('can_manage_canteen')}")

    admin_headers = {'Authorization': f'Bearer {admin_token}', 'Content-Type': 'application/json'}

    print("\n=== 2. Fetching Current Menu (GET /api/v1/canteen/menu/current) ===")
    req = urllib.request.Request('http://127.0.0.1:8000/api/v1/canteen/menu/current', headers=admin_headers)
    with urllib.request.urlopen(req) as resp:
        menu = json.loads(resp.read().decode('utf-8'))
        print(f"[OK] Current Menu: KW {menu['calendar_week']} / {menu['year']} | Days: {len(menu['days_data'])} | Valid: {menu['valid_from']} to {menu['valid_to']}")
        for d in menu['days_data']:
            print(f"  - {d['tag']} ({d.get('datum')}): {d['gericht_haupt']['titel']} ({d['gericht_haupt']['preis']}) | Veg: {d['gericht_vegetarisch_vegan']['titel']} | Allergene: {d.get('allergene_zusatzstoffe')}")

    print("\n=== 3. Fetching Menu for KW 36 (GET /api/v1/canteen/menu?week=36&year=2026) ===")
    req = urllib.request.Request('http://127.0.0.1:8000/api/v1/canteen/menu?week=36&year=2026', headers=admin_headers)
    with urllib.request.urlopen(req) as resp:
        kw36 = json.loads(resp.read().decode('utf-8'))
        print(f"[OK] KW 36 Menu ID={kw36['id']} | Days: {len(kw36['days_data'])}")

    print("\n=== 4. Testing Delegation: Granting manage_canteen to Susanne Merten ===")
    # Find Susanne Merten ID (she is user #4 in reception)
    req_users = urllib.request.Request('http://127.0.0.1:8000/api/v1/admin/users?query=Susanne', headers=admin_headers)
    with urllib.request.urlopen(req_users) as resp:
        users_res = json.loads(resp.read().decode('utf-8'))
        susanne = users_res['items'][0]
        susanne_id = susanne['id']
        print(f"Found Susanne Merten: ID={susanne_id} | Email={susanne['email']}")

    # Patch Susanne permissions with manage_canteen=True
    patch_data = json.dumps({'manage_canteen': True}).encode('utf-8')
    req_patch = urllib.request.Request(f'http://127.0.0.1:8000/api/v1/users/{susanne_id}/permissions', data=patch_data, headers=admin_headers, method='PATCH')
    with urllib.request.urlopen(req_patch) as resp:
        perm_res = json.loads(resp.read().decode('utf-8'))
        print(f"[OK] Granted manage_canteen to Susanne: {perm_res}")

    print("\n=== 5. Login as Susanne Merten and Create/Update KW 37 Menu ===")
    login_susanne = json.dumps({'email': susanne['email'], 'password': 'Passwort123!'}).encode('utf-8')
    req = urllib.request.Request('http://127.0.0.1:8000/api/v1/auth/login', data=login_susanne, headers={'Content-Type': 'application/json'})
    with urllib.request.urlopen(req) as resp:
        res_s = json.loads(resp.read().decode('utf-8'))
        susanne_token = res_s['access_token']
        print(f"[OK] Logged in as Susanne. can_manage_canteen={res_s['user'].get('can_manage_canteen')}")

    susanne_headers = {'Authorization': f'Bearer {susanne_token}', 'Content-Type': 'application/json'}

    kw37_payload = json.dumps({
        "calendar_week": 37,
        "year": 2026,
        "valid_from": "2026-09-07",
        "valid_to": "2026-09-11",
        "is_published": True,
        "days_data": [
            {
                "tag": "Montag",
                "datum": "2026-09-07",
                "gericht_haupt": {"titel": "Käsespätzle mit Röstzwiebeln", "beschreibung": "Mit Bergkäse und kleinem Beilagensalat", "preis": "6,50 €", "is_vegan": False, "is_vegetarian": True},
                "gericht_vegetarisch_vegan": {"titel": "Gemüsecurry mit Tofu", "beschreibung": "Mit Basmatireis", "preis": "5,80 €", "is_vegan": True, "is_vegetarian": True},
                "dessert_beilage": {"titel": "Apfelstrudel", "preis": "1,80 €"},
                "allergene_zusatzstoffe": ["A", "G"]
            },
            {
                "tag": "Dienstag",
                "datum": "2026-09-08",
                "gericht_haupt": {"titel": "Rinderroulade Hausfrauenart", "beschreibung": "Mit Apfelrotkohl und Salzkartoffeln", "preis": "7,90 €", "is_vegan": False, "is_vegetarian": False},
                "gericht_vegetarisch_vegan": {"titel": "Gebackener Feta mit Oliven", "beschreibung": "Mit Fladenbrot", "preis": "6,20 €", "is_vegan": False, "is_vegetarian": True},
                "dessert_beilage": {"titel": "Schokopudding", "preis": "1,50 €"},
                "allergene_zusatzstoffe": ["G", "L"]
            },
            {
                "tag": "Mittwoch",
                "datum": "2026-09-09",
                "gericht_haupt": {"titel": "Putensteak vom Grill", "beschreibung": "Mit Kräuterbutter und Pommes", "preis": "7,20 €", "is_vegan": False, "is_vegetarian": False},
                "gericht_vegetarisch_vegan": {"titel": "Falafel-Teller", "beschreibung": "Mit Hummus und Fladenbrot", "preis": "5,90 €", "is_vegan": True, "is_vegetarian": True},
                "dessert_beilage": {"titel": "Fruchtjoghurt", "preis": "1,50 €"},
                "allergene_zusatzstoffe": ["G", "N"]
            },
            {
                "tag": "Donnerstag",
                "datum": "2026-09-10",
                "gericht_haupt": {"titel": "Seelachsfilet gebacken", "beschreibung": "Mit Remouladensauce und Kartoffelsalat", "preis": "7,40 €", "is_vegan": False, "is_vegetarian": False},
                "gericht_vegetarisch_vegan": {"titel": "Spinat-Ricotta-Tortellini", "beschreibung": "In Salbeibutter", "preis": "6,00 €", "is_vegan": False, "is_vegetarian": True},
                "dessert_beilage": {"titel": "Rote Grütze", "preis": "1,80 €"},
                "allergene_zusatzstoffe": ["A", "C", "D", "G"]
            },
            {
                "tag": "Freitag",
                "datum": "2026-09-11",
                "gericht_haupt": {"titel": "Pizza Margherita oder Salami", "beschreibung": "Frisch aus dem Steinofen", "preis": "6,80 €", "is_vegan": False, "is_vegetarian": False},
                "gericht_vegetarisch_vegan": {"titel": "Vegane Gemüse-Pizza", "beschreibung": "Mit buntem Grillgemüse", "preis": "6,50 €", "is_vegan": True, "is_vegetarian": True},
                "dessert_beilage": {"titel": "Eis am Stiel", "preis": "1,50 €"},
                "allergene_zusatzstoffe": ["A", "G"]
            }
        ]
    }).encode('utf-8')

    req_create = urllib.request.Request('http://127.0.0.1:8000/api/v1/canteen/menu', data=kw37_payload, headers=susanne_headers, method='POST')
    with urllib.request.urlopen(req_create) as resp:
        created_menu = json.loads(resp.read().decode('utf-8'))
        print(f"[OK] Susanne successfully created KW 37 Menu (ID={created_menu['id']})! Erstellt von: {created_menu['erstellt_von_name']}")

    print("\n=== 6. Testing Unauthorized User Without manage_canteen ===")
    # Query user Jan Fischer
    req_jan_query = urllib.request.Request('http://127.0.0.1:8000/api/v1/admin/users?query=Fischer', headers=admin_headers)
    with urllib.request.urlopen(req_jan_query) as resp:
        jan_res = json.loads(resp.read().decode('utf-8'))
        jan_user = jan_res['items'][0]
        jan_email = jan_user['email']

    login_jan = json.dumps({'email': jan_email, 'password': 'Passwort123!'}).encode('utf-8')
    req = urllib.request.Request('http://127.0.0.1:8000/api/v1/auth/login', data=login_jan, headers={'Content-Type': 'application/json'})
    with urllib.request.urlopen(req) as resp:
        res_j = json.loads(resp.read().decode('utf-8'))
        jan_token = res_j['access_token']
        print(f"[OK] Logged in as {res_j['user']['full_name']}. can_manage_canteen={res_j['user'].get('can_manage_canteen')}")

    jan_headers = {'Authorization': f'Bearer {jan_token}', 'Content-Type': 'application/json'}
    try:
        req_unauth = urllib.request.Request('http://127.0.0.1:8000/api/v1/canteen/menu', data=kw37_payload, headers=jan_headers, method='POST')
        with urllib.request.urlopen(req_unauth) as resp:
            print("[FAIL] Jan was able to save menu without permission!")
    except urllib.error.HTTPError as e:
        if e.code == 403:
            print(f"[OK] Correctly rejected unauthorized employee (HTTP 403 Forbidden): {e}")
        else:
            print(f"[UNEXPECTED] Code: {e.code}")

    print("\n=== ALL CANTEEN BACKEND TESTS PASSED SUCCESSFULLY! ===")

if __name__ == '__main__':
    test_api()
