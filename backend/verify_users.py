import urllib.request
import json

# 1. Login as Admin
login_data = json.dumps({'email': 'admin@empresa.com', 'password': 'admin123'}).encode('utf-8')
req = urllib.request.Request('http://127.0.0.1:8000/api/v1/auth/login', data=login_data, headers={'Content-Type': 'application/json'})
with urllib.request.urlopen(req) as resp:
    token_res = json.loads(resp.read().decode('utf-8'))
    token = token_res['access_token']
    print('Admin login successful! Token acquired.')

# 2. Get users list
headers = {'Authorization': f'Bearer {token}'}
req_users = urllib.request.Request('http://127.0.0.1:8000/api/v1/admin/users?limit=50', headers=headers)
with urllib.request.urlopen(req_users) as resp:
    users_data = json.loads(resp.read().decode('utf-8'))
    total_count = users_data.get('total')
    print(f'Total users via Admin API: {total_count}')
    print('\nAll 38 Users via Admin API:')
    for idx, u in enumerate(users_data.get('items', []), 1):
        print(f"{idx:2d}. {u.get('full_name')} ({u.get('email')}) | Role: {u.get('role')} | Dept: {u.get('department')} | Tel: {u.get('phone')} | Mob: {u.get('mobile')}")

# 3. Get roles list
req_roles = urllib.request.Request('http://127.0.0.1:8000/api/v1/admin/roles', headers=headers)
with urllib.request.urlopen(req_roles) as resp:
    roles_data = json.loads(resp.read().decode('utf-8'))
    print(f'\nTotal roles via API: {len(roles_data)}')
    for r in roles_data:
        print(f"  - [{r.get('slug')}] {r.get('name')}: {r.get('users_count')} users assigned")

# 4. Check Phone Directory endpoint
req_dir = urllib.request.Request('http://127.0.0.1:8000/api/v1/users/directory', headers=headers)
with urllib.request.urlopen(req_dir) as resp:
    dir_data = json.loads(resp.read().decode('utf-8'))
    print(f'\nTotal employees in Phone Directory: {len(dir_data)}')

# 5. Check Org Chart endpoint
req_org = urllib.request.Request('http://127.0.0.1:8000/api/v1/users/org-chart', headers=headers)
with urllib.request.urlopen(req_org) as resp:
    org_data = json.loads(resp.read().decode('utf-8'))
    print(f'Org Chart root nodes: {len(org_data)}')
