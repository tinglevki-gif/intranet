import zipfile
import xml.etree.ElementTree as ET
import json

def parse_xlsx(filename):
    with zipfile.ZipFile(filename, 'r') as z:
        # Load shared strings
        strings = []
        if 'xl/sharedStrings.xml' in z.namelist():
            tree = ET.parse(z.open('xl/sharedStrings.xml'))
            for elem in tree.iter('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}t'):
                strings.append(elem.text or "")

        # Load sheet1
        sheet_tree = ET.parse(z.open('xl/worksheets/sheet1.xml'))
        sheet = sheet_tree.getroot()
        
        rows = []
        ns = {'s': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
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
                row_vals.append(val)
            if row_vals:
                rows.append(row_vals)
        return rows

rows = parse_xlsx('Users.xlsx')
headers = rows[0]
data = []
for r in rows[1:]:
    obj = {}
    for idx, h in enumerate(headers):
        obj[h] = r[idx] if idx < len(r) else ""
    data.append(obj)

print(json.dumps(data, indent=2, ensure_ascii=False))
with open('scratch_users.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)
