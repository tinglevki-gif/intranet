import os
import re
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

def set_cell_background(cell, hex_color):
    shading_elm = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{hex_color}"/>')
    cell._tc.get_or_add_tcPr().append(shading_elm)

def create_user_guide_docx(md_path, output_docx_path, base_img_dir):
    doc = Document()

    # Configure Margins (2.2 cm)
    for section in doc.sections:
        section.top_margin = Inches(0.85)
        section.bottom_margin = Inches(0.85)
        section.left_margin = Inches(0.85)
        section.right_margin = Inches(0.85)

    # Base styling
    normal_style = doc.styles['Normal']
    normal_style.font.name = 'Calibri'
    normal_style.font.size = Pt(10.5)
    normal_style.font.color.rgb = RGBColor(0x33, 0x41, 0x55) # Slate 700

    # Colors
    NAVY = RGBColor(0x0F, 0x17, 0x2A) # Slate 900
    SKY = RGBColor(0x02, 0x84, 0xC7)  # Sky 600
    DARK_BLUE = RGBColor(0x1E, 0x3A, 0x8A)

    with open(md_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    in_quote = False
    quote_text = []

    for line in lines:
        line_str = line.rstrip('\r\n')
        stripped = line_str.strip()

        # Handle Blockquotes
        if stripped.startswith('>'):
            in_quote = True
            quote_text.append(stripped.lstrip('> ').strip())
            continue
        elif in_quote:
            # End of quote block
            if quote_text:
                full_quote = " ".join(quote_text)
                # Create a callout table
                table = doc.add_table(rows=1, cols=1)
                table.alignment = WD_TABLE_ALIGNMENT.CENTER
                cell = table.cell(0, 0)
                cell.width = Inches(6.5)
                set_cell_background(cell, "F0F9FF") # Light sky tint
                
                # Add text to callout
                p = cell.paragraphs[0]
                p.paragraph_format.space_before = Pt(6)
                p.paragraph_format.space_after = Pt(6)
                p.paragraph_format.left_indent = Inches(0.15)
                p.paragraph_format.right_indent = Inches(0.15)
                
                # Format bold text within quote
                format_inline_text(p, full_quote, italic=False, color=RGBColor(0x03, 0x69, 0xA1))
                doc.add_paragraph() # Spacing
                quote_text = []
            in_quote = False

        if not stripped:
            continue

        # Horizontal Rule
        if stripped in ['---', '***', '___']:
            p = doc.add_paragraph()
            p.paragraph_format.space_before = Pt(4)
            p.paragraph_format.space_after = Pt(4)
            run = p.add_run('━' * 60)
            run.font.size = Pt(8)
            run.font.color.rgb = RGBColor(0xCB, 0xD5, 0xE1) # Slate 300
            continue

        # Headings
        if stripped.startswith('# '):
            h = doc.add_heading(level=1)
            h.paragraph_format.space_before = Pt(14)
            h.paragraph_format.space_after = Pt(4)
            run = h.add_run(stripped[2:])
            run.font.name = 'Calibri'
            run.font.size = Pt(22)
            run.font.bold = True
            run.font.color.rgb = DARK_BLUE
            continue
        elif stripped.startswith('## '):
            h = doc.add_heading(level=2)
            h.paragraph_format.space_before = Pt(12)
            h.paragraph_format.space_after = Pt(4)
            run = h.add_run(stripped[3:])
            run.font.name = 'Calibri'
            run.font.size = Pt(15)
            run.font.bold = True
            run.font.color.rgb = SKY
            continue
        elif stripped.startswith('### '):
            h = doc.add_heading(level=3)
            h.paragraph_format.space_before = Pt(10)
            h.paragraph_format.space_after = Pt(3)
            run = h.add_run(stripped[4:])
            run.font.name = 'Calibri'
            run.font.size = Pt(12.5)
            run.font.bold = True
            run.font.color.rgb = NAVY
            continue
        elif stripped.startswith('#### '):
            h = doc.add_heading(level=4)
            h.paragraph_format.space_before = Pt(8)
            h.paragraph_format.space_after = Pt(2)
            run = h.add_run(stripped[5:])
            run.font.name = 'Calibri'
            run.font.size = Pt(11)
            run.font.bold = True
            run.font.color.rgb = SKY
            continue

        # Image tag: ![Alt text](image_path)
        img_match = re.match(r'!\[(.*?)\]\((.*?)\)', stripped)
        if img_match:
            alt_text, rel_img_path = img_match.groups()
            # Normalize image path
            img_filename = os.path.basename(rel_img_path)
            full_img_path = os.path.join(base_img_dir, img_filename)
            
            if os.path.exists(full_img_path):
                p_img = doc.add_paragraph()
                p_img.paragraph_format.space_before = Pt(6)
                p_img.paragraph_format.space_after = Pt(2)
                p_img.alignment = WD_ALIGN_PARAGRAPH.CENTER
                run_img = p_img.add_run()
                run_img.add_picture(full_img_path, width=Inches(5.8))
                
                # Image Caption
                p_cap = doc.add_paragraph()
                p_cap.paragraph_format.space_before = Pt(1)
                p_cap.paragraph_format.space_after = Pt(8)
                p_cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
                cap_run = p_cap.add_run(f"Abbildung: {alt_text}")
                cap_run.font.size = Pt(9)
                cap_run.font.italic = True
                cap_run.font.color.rgb = RGBColor(0x64, 0x74, 0x8B) # Slate 500
            else:
                p_missing = doc.add_paragraph(f"[Bild: {alt_text} ({rel_img_path})]")
                p_missing.paragraph_format.space_after = Pt(6)
            continue

        # Bullet lists (- Item or * Item)
        if stripped.startswith('- ') or stripped.startswith('* '):
            p = doc.add_paragraph(style='List Bullet')
            p.paragraph_format.space_before = Pt(1)
            p.paragraph_format.space_after = Pt(2)
            format_inline_text(p, stripped[2:])
            continue

        # Numbered list (1. Item, 2. Item, etc.)
        num_match = re.match(r'^(\d+)\.\s+(.*)', stripped)
        if num_match:
            idx, content = num_match.groups()
            p = doc.add_paragraph(style='List Number')
            p.paragraph_format.space_before = Pt(1)
            p.paragraph_format.space_after = Pt(2)
            format_inline_text(p, content)
            continue

        # Regular Paragraph
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(2)
        p.paragraph_format.space_after = Pt(4)
        p.paragraph_format.line_spacing = 1.15
        format_inline_text(p, stripped)

    # Save document
    os.makedirs(os.path.dirname(output_docx_path), exist_ok=True)
    doc.save(output_docx_path)
    print(f"Successfully created: {output_docx_path}")

def format_inline_text(paragraph, text, italic=False, color=None):
    # Regex for bold (**text** or __text__) and code (`code`)
    parts = re.split(r'(\*\*.*?\*\*|`.*?`|\*.*?\*)', text)
    for part in parts:
        if not part:
            continue
        if part.startswith('**') and part.endswith('**'):
            run = paragraph.add_run(part[2:-2])
            run.bold = True
        elif part.startswith('*') and part.endswith('*'):
            run = paragraph.add_run(part[1:-1])
            run.italic = True
        elif part.startswith('`') and part.endswith('`'):
            run = paragraph.add_run(part[1:-1])
            run.font.name = 'Consolas'
            run.font.size = Pt(9.5)
            run.font.color.rgb = RGBColor(0x0F, 0x17, 0x2A)
        else:
            run = paragraph.add_run(part)
        
        if italic:
            run.italic = True
        if color:
            run.font.color.rgb = color

if __name__ == '__main__':
    md_file = 'docs/BENUTZERHANDBUCH_ANWENDER.md'
    docx_file = 'docs/BENUTZERHANDBUCH_ANWENDER.docx'
    img_dir = 'docs/images/user_guide'
    create_user_guide_docx(md_file, docx_file, img_dir)
