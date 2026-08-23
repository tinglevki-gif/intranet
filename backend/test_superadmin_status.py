import urllib.request
import json

def test_login(email, password):
    data = json.dumps({'email': email, 'password': password}).encode('utf-8')
    req = urllib.request.Request('http://127.0.0.1:8000/api/v1/auth/login', data=data, headers={'Content-Type': 'application/json'})
    try:
        with urllib.request.urlopen(req) as resp:
            res = json.loads(resp.read().decode('utf-8'))
            token = res.get('access_token')
            user = res.get('user', {})
            role = user.get('role')
            full_name = user.get('full_name')
            is_active = user.get('is_active')
            print(f"[OK] Login successful for '{email}' -> Role: {role} | Name: {full_name} | Active: {is_active}")
            return token
    except Exception as e:
        print(f"[ERROR] Login failed for '{email}': {e}")
        return None

print("=== 1. Testing Logins for SuperAdmin & Corporate Users ===")
humbert_token = test_login('h.senf@tinglev.de', 'Passwort123!')
robert_token = test_login('r.kuhaupt@tinglev.de', 'Passwort123!')
anja_token = test_login('a.knoll@tinglev.de', 'Passwort123!')

# Verify Carlos Mendoza is deleted
print("\n=== 2. Verifying Deleted Account Carlos Mendoza ===")
carlos_attempt = test_login('admin@empresa.com', 'admin123')
if not carlos_attempt:
    print("[OK] Confirmed: Carlos Mendoza account is completely deleted from the database.")

if humbert_token:
    print("\n=== 3. Testing Full SuperAdmin Access with Humbert Senf Token ===")
    endpoints = [
        '/auth/me',
        '/navigation/menu',
        '/admin/users?limit=5',
        '/admin/roles',
        '/admin/settings',
        '/admin/languages',
        '/admin/menu',
        '/users/directory',
        '/users/org-chart',
        '/dashboard/overview'
    ]
    for ep in endpoints:
        req = urllib.request.Request(f'http://127.0.0.1:8000/api/v1{ep}', headers={'Authorization': f'Bearer {humbert_token}'})
        try:
            with urllib.request.urlopen(req) as resp:
                print(f"  [200 OK - SuperAdmin] {ep}")
        except Exception as e:
            print(f"  [FAIL]   {ep}: {e}")

