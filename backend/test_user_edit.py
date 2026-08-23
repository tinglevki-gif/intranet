import urllib.request
import json

# 1. Login as Humbert Senf
login_data = json.dumps({'email': 'h.senf@tinglev.de', 'password': 'Passwort123!'}).encode('utf-8')
req = urllib.request.Request('http://127.0.0.1:8000/api/v1/auth/login', data=login_data, headers={'Content-Type': 'application/json'})
with urllib.request.urlopen(req) as resp:
    token_res = json.loads(resp.read().decode('utf-8'))
    humbert_token = token_res['access_token']
    humbert_user = token_res['user']
    print(f"[OK] Logged in as Humbert Senf: ID={humbert_user['id']}, Role={humbert_user['role']}")

headers = {
    'Authorization': f'Bearer {humbert_token}',
    'Content-Type': 'application/json'
}

# 2. Test Humbert Senf updating HIS OWN user record (#38)
humbert_update_payload = json.dumps({
    'first_name': 'Humbert',
    'last_name': 'Senf',
    'full_name': 'Humbert Senf',
    'email': 'h.senf@tinglev.de',
    'role': 'ADMIN',
    'department': 'IT \\ SuperAdmin',
    'position': 'IT-Leiter & SuperAdmin (HUSE)',
    'phone': '+49 33439 86-245',
    'mobile': '0162 / 25 66 144',
    'location': 'Werk Tinglev',
    'is_active': True
}).encode('utf-8')

req_update_self = urllib.request.Request(
    f"http://127.0.0.1:8000/api/v1/admin/users/{humbert_user['id']}",
    data=humbert_update_payload,
    headers=headers,
    method='PUT'
)

with urllib.request.urlopen(req_update_self) as resp:
    updated_self = json.loads(resp.read().decode('utf-8'))
    print(f"[OK] Humbert successfully updated his OWN user profile (#38): {updated_self['full_name']} | Role: {updated_self['role']} | Pos: {updated_self['position']}")

# 3. Test Humbert Senf updating ANOTHER user (e.g. user #2 Anja Knoll)
anja_update_payload = json.dumps({
    'first_name': 'Anja',
    'last_name': 'Knoll',
    'full_name': 'Anja Knoll',
    'email': 'a.knoll@tinglev.de',
    'role': 'MANAGEMENT',
    'department': 'Geschäftsführung',
    'position': 'Geschäftsführerin (ANKN)',
    'phone': '+49 33439 86-230',
    'mobile': '0172 / 38 88 827',
    'location': 'Werk Tinglev',
    'is_active': True
}).encode('utf-8')

req_update_other = urllib.request.Request(
    "http://127.0.0.1:8000/api/v1/admin/users/2",
    data=anja_update_payload,
    headers=headers,
    method='PUT'
)

with urllib.request.urlopen(req_update_other) as resp:
    updated_other = json.loads(resp.read().decode('utf-8'))
    print(f"[OK] Humbert successfully updated user Anja Knoll (#2): {updated_other['full_name']} | Role: {updated_other['role']} | Pos: {updated_other['position']}")
