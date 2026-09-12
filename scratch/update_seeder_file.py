import json

with open('scratch/scratch_full_users_code.json', 'r', encoding='utf-8') as f:
    users_data = json.load(f)

formatted_users = json.dumps(users_data, indent=12, ensure_ascii=False)

with open('backend/app/services/seeder.py', 'r', encoding='utf-8') as f:
    seeder_code = f.read()

# Replace corporate_users_data block
start_marker = "corporate_users_data = ["
end_marker = "        if not existing_admin and db.query(User).first() is None:"

if start_marker in seeder_code:
    pre = seeder_code.split(start_marker)[0]
    post = seeder_code.split(end_marker)[1]
    
    new_block = f"corporate_users_data = {json.dumps(users_data, indent=12, ensure_ascii=False)}\n\n"
    new_seeder_code = pre + new_block + "        if db.query(User).count() <= 1:\n            for udata in corporate_users_data:\n                if not db.query(User).filter(User.email == udata['email']).first():\n                    u_copy = udata.copy()\n                    pwd = u_copy.pop('password', 'Passwort123!')\n                    db.add(User(**u_copy, hashed_password=get_password_hash(pwd)))\n            db.commit()\n            logger.info('Seeder: 37 Firmenmitarbeiter im Verzeichnis initialisiert.')\n\n" + end_marker + post

    with open('backend/app/services/seeder.py', 'w', encoding='utf-8') as f:
        f.write(new_seeder_code)
    print("Updated seeder.py successfully!")
else:
    print("Could not find start_marker in seeder.py!")
