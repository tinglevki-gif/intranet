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
                row_vals.append(val)
            if any(row_vals):
                rows.append(row_vals)
        return rows

rows = parse_xlsx('Users.xlsx')
for idx, r in enumerate(rows):
    print(f"Row {idx}: {r}")

with open('scratch_raw_rows.json', 'w', encoding='utf-8') as f:
    json.dump(rows, f, ensure_ascii=False, indent=2)
