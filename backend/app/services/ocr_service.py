import os
import re
import json
import shutil
import logging
from typing import Dict, Any, List, Tuple, Optional
from datetime import datetime

logger = logging.getLogger("intranet.ocr")

# Safe imports for OCR & Image Processing libraries
try:
    from PIL import Image
except ImportError:
    Image = None

try:
    import pytesseract
except ImportError:
    pytesseract = None

try:
    import pdf2image
except ImportError:
    pdf2image = None


def is_ocr_available() -> bool:
    """Checks if Tesseract OCR engine and python wrappers are available."""
    if not (pytesseract and Image):
        return False
    try:
        # Check if tesseract binary can be executed
        pytesseract.get_tesseract_version()
        return True
    except Exception:
        return False


def extract_ocr_from_image(file_path: str, lang: str = "deu+eng") -> Tuple[str, float]:
    """
    Runs Tesseract OCR on an image file (PNG, JPG, TIFF, WEBP, etc.).
    Returns extracted text and average confidence score (0.0 - 100.0).
    """
    if not is_ocr_available() or not Image:
        return "", 0.0

    try:
        with Image.open(file_path) as img:
            # Convert palette/RGBA images to RGB for optimal OCR accuracy
            if img.mode not in ("L", "RGB"):
                img = img.convert("RGB")

            # Extract detailed OCR data including confidence
            data = pytesseract.image_to_data(img, lang=lang, output_type=pytesseract.Output.DICT)
            text = pytesseract.image_to_string(img, lang=lang)

            confidences = [int(c) for c in data.get("conf", []) if str(c).isdigit() and int(c) >= 0]
            avg_conf = (sum(confidences) / len(confidences)) if confidences else 85.0

            clean_text = (text or "").replace("\x00", "").strip()
            return clean_text, round(avg_conf, 1)
    except Exception as e:
        logger.warning(f"OCR image extraction error for {file_path}: {e}")
        return "", 0.0


def extract_ocr_from_pdf(file_path: str, max_pages: int = 15, lang: str = "deu+eng") -> List[Tuple[int, str, float]]:
    """
    Converts scanned PDF pages into high-resolution images via pdf2image (poppler)
    and executes Tesseract OCR for each page.
    Returns [(page_number, text, page_confidence), ...]
    """
    if not is_ocr_available() or not pdf2image:
        return []

    results = []
    try:
        # Convert first max_pages of PDF to PIL Images (dpi=250 for crisp OCR)
        images = pdf2image.convert_from_path(file_path, dpi=250, first_page=1, last_page=max_pages)
        for idx, img in enumerate(images):
            try:
                data = pytesseract.image_to_data(img, lang=lang, output_type=pytesseract.Output.DICT)
                txt = pytesseract.image_to_string(img, lang=lang)
                
                confidences = [int(c) for c in data.get("conf", []) if str(c).isdigit() and int(c) >= 0]
                page_conf = (sum(confidences) / len(confidences)) if confidences else 85.0
                
                clean_txt = (txt or "").replace("\x00", "").strip()
                if clean_txt:
                    results.append((idx + 1, clean_txt, round(page_conf, 1)))
            except Exception as page_e:
                logger.warning(f"OCR error on PDF page {idx + 1} of {file_path}: {page_e}")
    except Exception as e:
        logger.warning(f"pdf2image conversion error for {file_path}: {e}")

    return results


def extract_structured_entities(text: str, filename: str) -> Dict[str, Any]:
    """
    Parses OCR / document text with smart regex heuristics to extract:
    - Document Type (Rechnung, Arbeitsvertrag, Gehaltsabrechnung, Richtlinie, etc.)
    - Dates (e.g. 15.02.2026)
    - Amounts (e.g. 1.250,00 €)
    - Invoice / Reference Numbers
    - IBAN
    - Company / Issuer Entities
    """
    metadata: Dict[str, Any] = {
        "dates_found": [],
        "amounts_found": [],
        "invoice_numbers": [],
        "iban_found": [],
        "detected_doc_type": "Allgemeines Dokument",
        "suggested_category": "GENERAL",
        "key_entities": []
    }

    if not text:
        return metadata

    # 1. Date Extraction (DD.MM.YYYY, DD/MM/YYYY, YYYY-MM-DD)
    date_patterns = [
        r'\b(0?[1-9]|[12][0-9]|3[01])\.(0?[1-9]|1[012])\.(20\d\d|19\d\d)\b',
        r'\b(20\d\d)-(0?[1-9]|1[012])-(0?[1-9]|[12][0-9]|3[01])\b'
    ]
    found_dates = set()
    for pattern in date_patterns:
        for match in re.finditer(pattern, text):
            found_dates.add(match.group(0))
    metadata["dates_found"] = sorted(list(found_dates))[:4]

    # 2. Monetary Amounts (e.g., 1.450,50 €, 250,00 EUR, € 99.00)
    amount_pattern = r'(?:(?:EUR|€)\s*[\d\.,]+|[\d\.,]+\s*(?:EUR|€))\b'
    amounts = set()
    for match in re.finditer(amount_pattern, text):
        val = match.group(0).strip()
        if any(c.isdigit() for c in val):
            amounts.add(val)
    metadata["amounts_found"] = list(amounts)[:3]

    # 3. Invoice / Reference Number Extraction
    inv_pattern = r'(?i)(?:Rechnungs(?:-| )?(?:Nr\.?|nummer)|Invoice(?:\s*No\.?)?|Beleg(?:-| )?(?:Nr\.?|nummer)|Ref(?:erenz)?(?:\.|\:)?)\s*[:#\s]*([A-Z0-9\-\/]{4,24})'
    inv_matches = re.findall(inv_pattern, text)
    if inv_matches:
        metadata["invoice_numbers"] = list(set(inv_matches))[:2]

    # 4. IBAN Extraction
    iban_pattern = r'\b[A-Z]{2}[0-9]{2}(?:[ ]?[0-9]{4}){4,7}(?:[ ]?[0-9]{1,4})?\b'
    ibans = re.findall(iban_pattern, text)
    if ibans:
        metadata["iban_found"] = [i.replace(" ", "") for i in set(ibans)][:2]

    # 5. Smart Document Classification & Categorization
    text_lower = (filename + " " + text).lower()

    if any(k in text_lower for k in ["rechnung", "rechnungsnr", "invoice", "gutschrift", "mwst", "umsatzsteuer", "ust-idnr", "zahlungsziel", "gesamtbetrag", "steuer"]):
        metadata["detected_doc_type"] = "Rechnung / Finanzbeleg"
        metadata["suggested_category"] = "FINANCE"
    elif any(k in text_lower for k in ["arbeitsvertrag", "zusatzvereinbarung", "gehalt", "lohn", "probezeit", "arbeitgeber", "arbeitnehmer", "kündigung", "urlaubsanspruch", "einstellung"]):
        metadata["detected_doc_type"] = "Arbeitsvertrag / Personalakte"
        metadata["suggested_category"] = "HR"
    elif any(k in text_lower for k in ["entgeltabrechnung", "gehaltsabrechnung", "brutto-bezüge", "netto-auszahlung", "sv-abzüge", "lohnsteuerbescheinigung"]):
        metadata["detected_doc_type"] = "Gehaltsabrechnung"
        metadata["suggested_category"] = "HR"
    elif any(k in text_lower for k in ["it-sicherheit", "sicherheitsrichtlinie", "passwort", "2fa", "datenschutz", "vpn", "zero-trust", "it-infrastruktur", "firewall", "dsgvo"]):
        metadata["detected_doc_type"] = "IT-Sicherheitsrichtlinie"
        metadata["suggested_category"] = "IT_POLICIES"
    elif any(k in text_lower for k in ["zertifikat", "schulungsnachweis", "teilnahmebescheinigung", "urkunde", "befähigung", "tüv", "dekra", "audit"]):
        metadata["detected_doc_type"] = "Zertifikat & Nachweis"
        metadata["suggested_category"] = "HR"
    elif any(k in text_lower for k in ["corporate design", "markenhandbuch", "logo", "farbpalette", "typografie", "vorlage", "branding"]):
        metadata["detected_doc_type"] = "Brand & CI-Richtlinie"
        metadata["suggested_category"] = "BRAND"
    elif any(k in text_lower for k in ["protokoll", "meeting", "gesellschafter", "geschäftsbericht", "leitbild", "compliance"]):
        metadata["detected_doc_type"] = "Geschäftsdokument / Protokoll"
        metadata["suggested_category"] = "GENERAL"

    return metadata


def organize_document_storage(
    base_upload_dir: str, 
    category_str: str, 
    source_file_path: str, 
    unique_filename: str
) -> Tuple[str, str]:
    """
    Organizes document physical storage into categorized subdirectories:
    uploads/documents/<CATEGORY>/<filename>
    Returns (final_physical_path, relative_folder_path).
    """
    category_folder = category_str.upper()
    target_dir = os.path.join(base_upload_dir, category_folder)
    os.makedirs(target_dir, exist_ok=True)

    dest_file_path = os.path.join(target_dir, unique_filename)

    # If source path is different from destination, move or copy
    if os.path.abspath(source_file_path) != os.path.abspath(dest_file_path):
        try:
            shutil.move(source_file_path, dest_file_path)
        except Exception as e:
            logger.warning(f"Could not move document to categorized folder: {e}")
            dest_file_path = source_file_path

    relative_folder = f"{category_folder}/"
    return dest_file_path, relative_folder


def generate_document_preview_page1(file_path: str, file_type: str, cache_dir: str) -> Optional[str]:
    """
    Renders and caches the first page of a document as a high-quality PNG image for instant modal preview.
    - If image (PNG, JPG, etc.): returns original image path.
    - If PDF: uses pdf2image to rasterize page 1 into a crisp PNG (dpi=160).
    Returns absolute path to the preview image, or None.
    """
    file_type = file_type.lower().strip(".")
    if not os.path.exists(file_path):
        return None

    # If already an image
    if file_type in ['png', 'jpg', 'jpeg', 'webp', 'bmp']:
        return file_path

    # If PDF
    if file_type == 'pdf' and pdf2image:
        os.makedirs(cache_dir, exist_ok=True)
        base_name = os.path.basename(file_path)
        clean_name = base_name.replace(' ', '_').split('.')[0]
        preview_filename = f"preview_{clean_name}_p1.png"
        preview_path = os.path.join(cache_dir, preview_filename)

        if os.path.exists(preview_path) and os.path.getsize(preview_path) > 0:
            return preview_path

        try:
            images = pdf2image.convert_from_path(file_path, dpi=160, first_page=1, last_page=1)
            if images and len(images) > 0:
                images[0].save(preview_path, format="PNG", optimize=True)
                return preview_path
        except Exception as e:
            logger.warning(f"Could not render PDF preview page 1 for {file_path}: {e}")

    return None
