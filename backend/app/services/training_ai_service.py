import os
import re
import json
import math
from typing import List, Dict, Any, Tuple, Optional
from sqlalchemy.orm import Session
from app.models.schulung import TrainingDocument, TrainingChunk, SchulungCategory

# Try importing pypdf
try:
    from pypdf import PdfReader
except ImportError:
    PdfReader = None

# Stop words for semantic analysis
STOP_WORDS = {
    "der", "die", "das", "und", "oder", "für", "mit", "von", "bei", "den", "dem", "des",
    "ein", "eine", "einer", "eines", "einem", "einen", "wie", "ist", "sind", "was", "wer", "wo", "wann", "warum",
    "kann", "können", "ich", "du", "er", "sie", "es", "wir", "ihr", "im", "in", "an", "am", "auf", "nach", "zu", "zum", "zur",
    "reiche", "reichen", "erstelle", "erstellen", "funktioniert", "bediene", "bedienen", "gelten", "gilt", "welche", "welcher", "welches",
    "the", "and", "or", "for", "with", "from", "at", "in", "on", "to", "is", "are", "how", "can"
}

def stem_de(w: str) -> str:
    """German suffix stemming for robust lexical/semantic matching."""
    w = w.lower().strip()
    for suffix in ["anträge", "antrag", "antrags", "ungen", "zeiten", "regeln", "liche", "lichen", "licher", "liches", "ung", "ern", "en", "er", "es", "em", "e", "s"]:
        if len(w) > len(suffix) + 3 and w.endswith(suffix):
            return w[:-len(suffix)]
    return w

def tokenize(text: str) -> List[str]:
    """Extracts meaningful keywords from text."""
    cleaned = re.sub(r'[^\w\s-]', ' ', text.lower())
    words = [w for w in re.split(r'[\s-]+', cleaned) if len(w) >= 2]
    meaningful = [w for w in words if w not in STOP_WORDS]
    return meaningful or words

def extract_and_chunk_training_file(file_path: str, file_type: str) -> List[Dict[str, Any]]:
    """Extracts text by page and breaks it into semantic chunks."""
    pages_text = []
    file_type = file_type.lower().strip(".")

    if file_type == 'pdf' and PdfReader and os.path.exists(file_path):
        try:
            reader = PdfReader(file_path)
            for page_idx, page in enumerate(reader.pages):
                txt = page.extract_text() or ""
                if txt.strip():
                    pages_text.append((page_idx + 1, txt.strip()))
        except Exception as e:
            print(f"Error reading PDF {file_path}: {e}")

    if not pages_text and os.path.exists(file_path):
        try:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
                if content.strip():
                    # If file contains page markers
                    page_splits = re.split(r'(?i)<!--\s*page\s*(\d+)\s*-->|===+\s*seite\s*(\d+)\s*===+', content)
                    if len(page_splits) > 1:
                        current_p = 1
                        for segment in page_splits:
                            if not segment:
                                continue
                            if segment.isdigit():
                                current_p = int(segment)
                            else:
                                if segment.strip():
                                    pages_text.append((current_p, segment.strip()))
                    else:
                        pages_text.append((1, content.strip()))
        except Exception as e:
            print(f"Error reading text file {file_path}: {e}")

    # Chunking
    chunks = []
    chunk_index = 0

    for page_num, text in pages_text:
        cleaned = re.sub(r'\s+', ' ', text).strip()
        if not cleaned:
            continue

        paragraphs = re.split(r'(?<=[.!?])\s+|\n\n+', cleaned)
        current_chunk = ""
        current_section = None

        for p in paragraphs:
            if p.startswith('#') or (len(p) < 60 and p.endswith(':')):
                current_section = p.replace('#', '').strip()

            if len(current_chunk) + len(p) <= 600:
                current_chunk += ("\n" if current_chunk else "") + p
            else:
                if current_chunk.strip():
                    chunks.append({
                        "chunk_index": chunk_index,
                        "page_number": page_num,
                        "section_title": current_section or f"Abschnitt {chunk_index + 1}",
                        "content": current_chunk.strip()
                    })
                    chunk_index += 1
                current_chunk = p

        if current_chunk.strip():
            chunks.append({
                "chunk_index": chunk_index,
                "page_number": page_num,
                "section_title": current_section or f"Abschnitt {chunk_index + 1}",
                "content": current_chunk.strip()
            })
            chunk_index += 1

    return chunks

def calculate_chunk_score(query_tokens: List[str], chunk_text: str, doc_title: str) -> float:
    """Calculates relevance score between user question and a manual chunk with stemming."""
    chunk_tokens = tokenize(chunk_text)
    title_tokens = tokenize(doc_title)
    if not query_tokens or not chunk_tokens:
        return 0.0

    chunk_set = set(chunk_tokens)
    title_set = set(title_tokens)
    chunk_stems = set(stem_de(c) for c in chunk_tokens)
    title_stems = set(stem_de(t) for t in title_tokens)

    exact_matches = 0
    title_matches = 0
    stem_matches = 0

    for q in query_tokens:
        q_stem = stem_de(q)
        if q in chunk_set or q in chunk_text.lower():
            exact_matches += 1
        elif q_stem in chunk_stems:
            stem_matches += 1

        if q in title_set or q in doc_title.lower() or q_stem in title_stems:
            title_matches += 1

    score = (exact_matches * 3.2 + title_matches * 4.0 + stem_matches * 2.0) / (len(query_tokens) * 3.5 + 1.0)
    
    # Exact phrase substring bonus
    query_raw = " ".join(query_tokens)
    if query_raw in chunk_text.lower():
        score += 0.35

    return min(round(score, 3), 0.99)

def perform_training_rag_chat(
    db: Session,
    message: str,
    category_filter: Optional[str] = None,
    history: Optional[List[Dict[str, str]]] = None
) -> Dict[str, Any]:
    """
    RAG Chatbot retrieval engine:
    1. Finds most relevant training manual chunks using semantic matching.
    2. Synthesizes a structured, friendly and exact instructional answer.
    3. Cites the exact manual name, page number, section and snippet.
    """
    q_tokens = tokenize(message)
    if not q_tokens:
        return {
            "answer": "Bitte stellen Sie eine Frage zu den Schulungsinhalten, Software-Funktionen oder internen Richtlinien.",
            "sources": [],
            "confidence": 0.0
        }

    q = db.query(TrainingChunk).join(TrainingDocument)
    if category_filter and category_filter != "ALL":
        q = q.filter(TrainingDocument.category == category_filter)

    all_chunks = q.all()
    scored_chunks = []

    for chunk in all_chunks:
        doc = chunk.document
        score = calculate_chunk_score(q_tokens, chunk.content, doc.title)
        if score > 0.15:
            snippet = chunk.content
            if len(snippet) > 280:
                snippet = snippet[:280] + "..."

            scored_chunks.append({
                "document_id": doc.id,
                "document_title": doc.title,
                "category": doc.category.value if hasattr(doc.category, 'value') else str(doc.category),
                "page_number": chunk.page_number,
                "section_title": chunk.section_title or f"Seite {chunk.page_number}",
                "score": score,
                "snippet": snippet,
                "full_content": chunk.content,
                "download_url": f"/api/v1/schulungen/{doc.id}/download"
            })

    scored_chunks.sort(key=lambda x: x["score"], reverse=True)
    top_sources = scored_chunks[:3]

    if not top_sources:
        answer = (
            f"Zu Ihrer Frage „**{message}**“ konnte in den aktuellen Schulungsunterlagen kein passender Treffer gefunden werden.\n\n"
            f"💡 **Tipp:** Versuchen Sie konkrete Schlagwörter zu verwenden (z. B. *Urlaubsantrag*, *Statik-Freigabe*, *Schutzkleidung*, *2FA VPN*)."
        )
        confidence = 0.1
    else:
        best = top_sources[0]
        confidence = best["score"]
        
        # Build clean synthesized answer from the best context
        doc_ref = f"**{best['document_title']}** (Seite {best['page_number']})"
        content_text = best["full_content"]

        answer = (
            f"Hier ist die Anleitung gemäß unserem Schulungsdokument {doc_ref}:\n\n"
            f"{content_text}\n\n"
            f"📌 *Weiterführende Details und Formulare finden Sie direkt im verlinkten Handbuch unten.*"
        )

    # Format sources for response
    clean_sources = []
    for s in top_sources:
        clean_sources.append({
            "document_id": s["document_id"],
            "document_title": s["document_title"],
            "category": s["category"],
            "page_number": s["page_number"],
            "section_title": s["section_title"],
            "score": s["score"],
            "snippet": s["snippet"],
            "download_url": s["download_url"]
        })

    return {
        "answer": answer,
        "sources": clean_sources,
        "confidence": confidence
    }

# =========================================================================
# SEED INITIAL DEFAULT CORPORATE TRAINING MANUALS
# =========================================================================

DEMO_MANUALS_DATA = [
    {
        "title": "Benutzerhandbuch: Auftragsabwicklung & Qualitätssicherung",
        "description": "Vollständiger Leitfaden für die 4-stufige Fertigungskette, statische Freigaben, Labor-Druckprüfungen und Baustellen-Logistik.",
        "category": SchulungCategory.SOFTWARE,
        "file_name": "Handbuch_Auftragsabwicklung_Tiglev.pdf",
        "version": "2.4",
        "pages": [
            (1, "1. Einführung in das Modul Auftragsabwicklung (Tiglev Elementfabrik).\nDas Modul Abwicklung steuert den gesamten Lebenszyklus eines Fertigteil-Auftrags vom Statik-Eingang bis zur Anlieferung an die Baustelle."),
            (2, "2. Schritt 1: Statische Freigabe & Werkplanung.\nVor Produktionsstart muss der Prüfingenieur die Bewehrungspläne und statischen Berechnungen digital abzeichnen. Im System wird der Status auf 'Statik-Freigabe erteilt' gesetzt, wodurch die Schalungsfertigung in Halle 1 und Halle 2 freigeschaltet wird."),
            (3, "3. Schritt 2 & 3: Betonfertigung und QS-Laborprüfung.\nNach dem Gießen und der Aushärtung in den beheizten Klimakammern entnimmt das Baustofflabor Prüfwürfel. Die Druckfestigkeit (C30/37 bis C50/60) wird nach 28 Tagen bzw. Frühaushärtung gemessen. Liegen die Werte innerhalb der Toleranz nach DIN EN 206, wird das digitale CE-Werkszeugnis generiert."),
            (4, "4. Schritt 4: Baustellenlogistik & Innenlader-Verladung.\nSobald der Auftrag auf 'Versandbereit' steht, weist die Disposition LKW-Züge zu. Innenlader und Tieflader werden über die Portalkrananlage (Demag 32t) beladen. Der Fahrer erhält den digitalen Lieferschein mit GPS-Trackingcode.")
        ]
    },
    {
        "title": "Leitfaden: Urlaubsanträge, Gleitzeit & Abwesenheiten",
        "description": "Schritt-für-Schritt Anleitung für Mitarbeiter zur Beantragung von Erholungsurlaub, Zeitausgleich und Krankmeldungen im Intranet.",
        "category": SchulungCategory.ONBOARDING,
        "file_name": "Leitfaden_Urlaubsantraege_und_Zeiterfassung.pdf",
        "version": "1.8",
        "pages": [
            (1, "1. Allgemeine Urlaubsregelungen bei Tiglev Elementfabrik.\nJedem Vollzeitmitarbeiter stehen jährlich 30 Arbeitstage Erholungsurlaub zu. Urlaubsanträge müssen mindestens 14 Tage vor Antritt über das Intranet eingereicht werden."),
            (2, "2. Einreichung eines Urlaubsantrags im Mitarbeiterportal.\n1. Klicken Sie in der Sidebar auf 'Anträge & Urlaub' oder auf dem Dashboard auf das Schnelltool 'Urlaubsverwaltung'.\n2. Wählen Sie den ersten und letzten Urlaubstag im Kalender aus.\n3. Klicken Sie auf 'Antrag einreichen'. Ihr direkter Vorgesetzter erhält automatisch eine Benachrichtigung zur Genehmigung.\n4. Nach Freigabe wird der Urlaub im Firmenkalender eingetragen."),
            (3, "3. Krankmeldungen & Arbeitsunfähigkeitsbescheinigung (eAU).\nBei Arbeitsunfähigkeit muss bis spätestens 08:30 Uhr am ersten Krankheitstag die Abteilungsleitung telefonisch oder per Chat informiert werden. Die ärztliche eAU wird ab dem 3. Kalendertag elektronisch über die Krankenkasse abgerufen.")
        ]
    },
    {
        "title": "Arbeitssicherheit & UVV: Werksgelände Tinglev",
        "description": "Verbindliche Sicherheitsvorschriften, Persönliche Schutzausrüstung (PSA), Kranbedienung und Notfallmaßnahmen.",
        "category": SchulungCategory.SAFETY,
        "file_name": "Sicherheitsschulung_Werksgelaende_Tinglev.pdf",
        "version": "3.1",
        "pages": [
            (1, "1. Grundregeln auf dem Werksgelände Tinglev.\nAuf dem gesamten Produktions- und Freilagergelände gilt absolute PSA-Pflicht: Sicherheitsschuhe S3 mit Durchtrittschutz, Warnweste (Klasse 2) und Schutzhelm bei laufendem Kranbetrieb."),
            (2, "2. Sicherheitsabstände bei Kran- und Staplerbetrieb.\nDer Aufenthalt unter schwebenden Lasten (Portalkran Demag 32t, Deckenkrane Halle 1–3) ist strengstens untersagt. Der Schwenkbereich von 5 Metern um schwere Betonfertigteile muss stets frei bleiben. Stapler haben auf den markierten Fahrwegen Vorrang. Die Höchstgeschwindigkeit auf dem Werksgelände beträgt 15 km/h."),
            (3, "3. Notfallmaßnahmen & Erste Hilfe.\nNotfall-Sammelplatz: Haupttor Nord vor dem Verwaltungsgebäude.\nErsthelfer-Stationen befinden sich in Halle 1 (neben Leitstand) und Halle 3 (Werkstattbüro). Notruf intern: Durchwahl #112.")
        ]
    },
    {
        "title": "IT-Leitfaden: 2FA-Einrichtung, VPN & Helpdesk",
        "description": "Anleitung zur Absicherung des Benutzerkontos mit Zwei-Faktor-Authentifizierung (2FA), Remoteverbindung und Ticketerstellung.",
        "category": SchulungCategory.IT_GUIDES,
        "file_name": "IT_Onboarding_und_2FA_Einrichtung.pdf",
        "version": "2.0",
        "pages": [
            (1, "1. Zwei-Faktor-Authentifizierung (2FA) einrichten.\nZur Sicherung des Unternehmenszugangs ist für alle Mitarbeiter 2FA obligatorisch:\n1. Laden Sie Microsoft Authenticator oder Google Authenticator auf Ihr Smartphone.\n2. Öffnen Sie die Intranet-Einstellungen -> Sicherheit -> '2FA aktivieren'.\n3. Scannen Sie den angezeigten QR-Code und geben Sie den 6-stelligen Code zur Bestätigung ein."),
            (2, "2. VPN-Zugang für Homeoffice & Außendienst.\nFür den Zugriff auf interne CAD-Server und Produktionsdatenbanken von außerhalb nutzen Sie den Tiglev Secure VPN Client (WireGuard / OpenVPN). Starten Sie die Anwendung und melden Sie sich mit Ihren Intranet-Zugangsdaten an."),
            (3, "3. IT-Helpdesk & Support-Tickets.\nBei Hardwaredefekten, Softwareproblemen oder neuen Zugangsrechten erstellen Sie ein Ticket im Bereich 'IT & Systeme' -> 'IT-Helpdesk'. Notfall-Tickets für Produktionsstillstände werden mit Priorität 1 (Reaktionszeit < 15 Minuten) bearbeitet.")
        ]
    }
]

def seed_default_training_manuals(db: Session, upload_root: str):
    """Creates default PDF/Text manual files and indexes their chunks."""
    manuals_dir = os.path.join(upload_root, "schulungen")
    os.makedirs(manuals_dir, exist_ok=True)

    existing_count = db.query(TrainingDocument).count()
    if existing_count > 0:
        return

    admin_user = db.query(TrainingDocument).first()

    for item in DEMO_MANUALS_DATA:
        file_path = os.path.join(manuals_dir, item["file_name"])
        
        full_text = ""
        for page_num, text_content in item["pages"]:
            full_text += f"<!-- page {page_num} -->\n{text_content}\n\n"

        with open(file_path, "w", encoding="utf-8") as f:
            f.write(full_text)

        doc = TrainingDocument(
            title=item["title"],
            description=item["description"],
            category=item["category"],
            file_path=f"/uploads/schulungen/{item['file_name']}",
            file_type="pdf",
            file_size=len(full_text.encode("utf-8")),
            version=item["version"],
            uploaded_by=1
        )
        db.add(doc)
        db.flush()

        for idx, (page_num, text_content) in enumerate(item["pages"]):
            first_line = text_content.split('\n')[0].replace('#', '').strip()
            chunk = TrainingChunk(
                document_id=doc.id,
                chunk_index=idx,
                page_number=page_num,
                section_title=first_line[:80],
                content=text_content.strip()
            )
            db.add(chunk)

    db.commit()
    print("Seed: Default corporate training manuals & AI chunks successfully indexed.")
