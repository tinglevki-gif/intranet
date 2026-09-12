import zipfile
import xml.etree.ElementTree as ET
import json

def parse_xlsx(filename):
    with zipfile.ZipFile(filename, 'r') as z:
        strings = []
        if 'xl/sharedStrings.xml' in z.namelist():
            tree = ET.parse(z.open('xl/sharedStrings.xml'))
            for elem in tree.iter('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}t'):
                strings.append(elem.text or "")

        sheet_tree = ET.parse(z.open('xl/worksheets/sheet1.xml'))
        sheet = sheet_tree.getroot()
        
        rows = []
        for r in sheet.iter('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}row'):
            row_vals = []
            for c in r.iter('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}c'):
                t = c.attrib.get('t')
                v = c.find('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}v')
                val = ""
                if v is not None and v.text is not None:
                    if t == 's':
                        idx = int(v.text)
                        val = strings[idx] if idx < len(strings) else ""
                    else:
                        val = v.text
                row_vals.append(val.strip())
            if any(row_vals):
                rows.append(row_vals)
        return rows

rows = parse_xlsx('Users.xlsx')
current_dept = "Allgemein"

users_dict_list = []

dept_role_map = {
    'Geschäftsführung': 'MANAGEMENT',
    'Geschäftsentwicklung': 'BUSINESS_DEV',
    'Rezeption': 'RECEPTION',
    'Vertriebsabteilung': 'SALES',
    'Kontrolle': 'CONTROLLING_QS',
    'Technik': 'TECHNIK',
    'Buchhaltung': 'ACCOUNTING',
    'Produktion \\ Planung': 'PRODUKTION',
    'Abwicklung': 'ABWICKLUNG',
    'IT \\ SuperAdmin': 'IT_ADMIN'
}

avatars = {
    'Anja Knoll': 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=250&auto=format&fit=crop&q=80',
    'Anas Guist': 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=250&auto=format&fit=crop&q=80',
    'Cagla Karayigit': 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=250&auto=format&fit=crop&q=80',
    'Susanne Merten': 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=250&auto=format&fit=crop&q=80',
    'Andreas Walker': 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=250&auto=format&fit=crop&q=80',
    'Petra Petersen': 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=250&auto=format&fit=crop&q=80',
    'Andreas Liebow': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=250&auto=format&fit=crop&q=80',
    'Stefan Meyer': 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=250&auto=format&fit=crop&q=80',
    'Kamel Al Daher': 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=250&auto=format&fit=crop&q=80',
    'Beatrix Kopczak': 'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=250&auto=format&fit=crop&q=80',
    'Oja Morina Cal': 'https://images.unsplash.com/photo-1573497019418-b400bb3ab074?w=250&auto=format&fit=crop&q=80',
    'Jan Fischer': 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=250&auto=format&fit=crop&q=80',
    'Andreas Braun': 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=250&auto=format&fit=crop&q=80',
    'Ingrid Müller': 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=250&auto=format&fit=crop&q=80',
    'Christiane Benz': 'https://images.unsplash.com/photo-1598550874175-4d0ef436c909?w=250&auto=format&fit=crop&q=80',
    'Frank Beutling': 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=250&auto=format&fit=crop&q=80',
    'Ryan Würfel': 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=250&auto=format&fit=crop&q=80',
    'Ane Steinmetz (Azubi)': 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=250&auto=format&fit=crop&q=80',
    'Ahmad Quddosy': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=250&auto=format&fit=crop&q=80',
    'Dani Daher': 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=250&auto=format&fit=crop&q=80',
    'Cihad Sözen': 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=250&auto=format&fit=crop&q=80',
    'Diana Moskalyk (Azubi)': 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=250&auto=format&fit=crop&q=80',
    'Barbara Peters': 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=250&auto=format&fit=crop&q=80',
    'Steffen Martsch': 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=250&auto=format&fit=crop&q=80',
    'Rodica Petrean': 'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=250&auto=format&fit=crop&q=80',
    'Moritz Thorn': 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=250&auto=format&fit=crop&q=80',
    'Matthias Grade': 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=250&auto=format&fit=crop&q=80',
    'Carmen Pietsch': 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=250&auto=format&fit=crop&q=80',
    'Mario Köcher': 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=250&auto=format&fit=crop&q=80',
    'Ingo Thiele': 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=250&auto=format&fit=crop&q=80',
    'Franko Pade': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=250&auto=format&fit=crop&q=80',
    'Haci Cal': 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=250&auto=format&fit=crop&q=80',
    'Martin Scheffler': 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=250&auto=format&fit=crop&q=80',
    'Jenny Rudolph': 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=250&auto=format&fit=crop&q=80',
    'Torsten Anton': 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=250&auto=format&fit=crop&q=80',
    'Robert Kuhaupt': 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=250&auto=format&fit=crop&q=80',
    'Humbert Senf': 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=250&auto=format&fit=crop&q=80',
}

for r in rows[4:]:
    if not r: continue
    tag = r[0].strip()
    if tag == 'Rolle':
        current_dept = r[1].strip()
    elif tag == 'Name':
        full_name = r[1].strip()
        ext = r[2].strip() if len(r) > 2 else ""
        email = r[3].strip() if len(r) > 3 else ""
        mobile = r[4].strip() if len(r) > 4 else ""
        code = r[5].strip() if len(r) > 5 else ""

        if not email and full_name:
            email_parts = full_name.lower().split()
            email = f"{email_parts[0][0]}.{email_parts[-1]}@tinglev.de"

        first_name = full_name.split()[0] if full_name else ""
        last_name = " ".join(full_name.split()[1:]) if len(full_name.split()) > 1 else ""

        phone = f"+49 33439 86-{ext}" if ext else "+49 33439 86-0"
        role_slug = dept_role_map.get(current_dept, 'EMPLOYEE')
        if full_name == 'Humbert Senf':
            role_slug = 'ADMIN'

        avatar = avatars.get(full_name, 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=250&auto=format&fit=crop&q=80')

        user_obj = {
            "email": email,
            "first_name": first_name,
            "last_name": last_name,
            "full_name": full_name,
            "password": "Passwort123!",
            "role": role_slug,
            "department": current_dept,
            "position": f"{current_dept} ({code})" if code else current_dept,
            "avatar_url": avatar,
            "phone": phone,
            "mobile": mobile,
            "location": "Werk Tinglev",
            "supervisor_id": None,
            "is_active": True
        }
        users_dict_list.append(user_obj)

print(f"Generated {len(users_dict_list)} users!")
with open('scratch_full_users_code.json', 'w', encoding='utf-8') as f:
    json.dump(users_dict_list, f, ensure_ascii=False, indent=2)
