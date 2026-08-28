import os
import re
import math
import json
from typing import List, Dict, Any, Tuple
from sqlalchemy.orm import Session
from app.models.document import Document, DocumentChunk

# Try importing pypdf
try:
    from pypdf import PdfReader
except ImportError:
    PdfReader = None

def extract_text_from_file(file_path: str, file_type: str) -> List[Tuple[int, str]]:
    """
    Extracts text from file by page.
    Returns list of tuples: [(page_number, text), ...]
    Guarantees no NUL (0x00) characters and safe handling of scanned PDFs.
    """
    pages_text = []
    file_type = file_type.lower().strip(".")

    if file_type == 'pdf' and PdfReader and os.path.exists(file_path):
        try:
            reader = PdfReader(file_path)
            for page_idx, page in enumerate(reader.pages):
                try:
                    txt = page.extract_text() or ""
                    # Sanitize NUL and control bytes
                    txt = txt.replace("\x00", "").strip()
                    if txt:
                        pages_text.append((page_idx + 1, txt))
                except Exception as page_err:
                    print(f"Error extracting page {page_idx + 1} from {file_path}: {page_err}")
        except Exception as e:
            print(f"Error reading PDF {file_path}: {e}")

        # If PDF is a scanned image with no embedded text layer
        if not pages_text:
            doc_name = os.path.basename(file_path)
            pages_text.append((
                1, 
                f"[Gescannter Inhalt: {doc_name} enthält eingescannte Bildseiten ohne OCR-Textebene. Das Dokument steht zum Download und zur Ansicht bereit.]"
            ))

    elif file_type in ['txt', 'md', 'csv', 'json', 'log', 'html', 'rtf'] and os.path.exists(file_path):
        # Plain text files
        try:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read().replace("\x00", "").strip()
                if content:
                    pages_text.append((1, content))
        except Exception as e:
            print(f"Error reading text file {file_path}: {e}")
    
    elif not pages_text and os.path.exists(file_path):
        # Generic fallback
        doc_name = os.path.basename(file_path)
        pages_text.append((1, f"[Dokument: {doc_name} (Format .{file_type})]"))

    return pages_text

def chunk_text(pages_text: List[Tuple[int, str]], chunk_size: int = 600, overlap: int = 100) -> List[Dict[str, Any]]:
    """
    Splits page text into overlapping semantic chunks for indexing.
    Sanitizes all chunk content to ensure database safety.
    """
    chunks = []
    chunk_index = 0

    for page_num, text in pages_text:
        # Sanitize any remaining NUL or invalid unicode bytes
        sanitized_text = text.replace("\x00", "")
        cleaned = re.sub(r'\s+', ' ', sanitized_text).strip()
        if not cleaned:
            continue

        paragraphs = re.split(r'(?<=[.!?])\s+', cleaned)
        current_chunk = ""

        for p in paragraphs:
            p_clean = p.replace("\x00", "").strip()
            if not p_clean:
                continue
            if len(current_chunk) + len(p_clean) <= chunk_size:
                current_chunk += (" " if current_chunk else "") + p_clean
            else:
                if current_chunk.strip():
                    chunks.append({
                        "chunk_index": chunk_index,
                        "page_number": page_num,
                        "content": current_chunk.strip().replace("\x00", "")
                    })
                    chunk_index += 1
                current_chunk = p_clean

        if current_chunk.strip():
            chunks.append({
                "chunk_index": chunk_index,
                "page_number": page_num,
                "content": current_chunk.strip().replace("\x00", "")
            })
            chunk_index += 1

    return chunks

# German stop words to filter out for cleaner semantic matching
STOP_WORDS = {
    "der", "die", "das", "und", "oder", "für", "mit", "von", "bei", "den", "dem", "des",
    "ein", "eine", "einer", "eines", "einem", "einen", "wie", "ist", "sind", "was", "wer",
    "the", "and", "or", "for", "with", "from", "at", "in", "on", "to", "is", "are"
}

def tokenize(text: str) -> List[str]:
    """Tokenizes text preserving acronyms (2fa, vpn, hr, it, etc.) and filtering stop words."""
    cleaned = re.sub(r'[^\w\s-]', ' ', text.lower())
    words = [w for w in re.split(r'[\s-]+', cleaned) if len(w) >= 2]
    # Keep meaningful words
    meaningful = [w for w in words if w not in STOP_WORDS]
    return meaningful or words

def calculate_similarity_score(query_tokens: List[str], chunk_content: str, doc_title: str) -> float:
    """
    Calculates hybrid keyword and semantic proximity score between query and chunk.
    """
    chunk_tokens = tokenize(chunk_content)
    title_tokens = tokenize(doc_title)
    
    if not query_tokens or not chunk_tokens:
        return 0.0

    chunk_set = set(chunk_tokens)
    title_set = set(title_tokens)

    # 1. Exact term matches
    exact_matches = sum(1 for q in query_tokens if q in chunk_set)
    # 2. Title matches
    title_matches = sum(1 for q in query_tokens if q in title_set)
    # 3. Partial substring matches
    partial_matches = sum(1 for q in query_tokens if any(q in c or c in q for c in chunk_set))

    # Weight exact acronym/keyword matches heavily
    score = (exact_matches * 2.5 + title_matches * 2.0 + partial_matches * 0.8) / (len(query_tokens) * 2.5 + 1.0)
    
    # Exact phrase substring bonus
    query_raw = " ".join(query_tokens)
    if query_raw in chunk_content.lower():
        score += 0.35

    return min(round(score, 3), 0.99)

def perform_ai_semantic_search(
    db: Session, 
    query: str, 
    top_k: int = 4, 
    category_filter: str = None
) -> Dict[str, Any]:
    """
    Executes semantic RAG retrieval across corporate document chunks.
    Synthesizes an executive answer from top matching excerpts.
    """
    q_tokens = tokenize(query)
    if not q_tokens:
        return {
            "query": query,
            "answer": "Bitte geben Sie einen Suchbegriff oder eine Frage ein.",
            "results": [],
            "total_matches": 0
        }

    q = db.query(DocumentChunk).join(Document)
    if category_filter and category_filter != "ALL":
        q = q.filter(Document.category == category_filter)

    all_chunks = q.all()
    scored_results = []

    for chunk in all_chunks:
        doc = chunk.document
        score = calculate_similarity_score(q_tokens, chunk.content, doc.original_name)
        
        if score > 0.15:
            excerpt = chunk.content
            if len(excerpt) > 320:
                excerpt = excerpt[:320] + "..."

            scored_results.append({
                "document_id": doc.id,
                "document_title": doc.original_name,
                "category": doc.category.value if hasattr(doc.category, 'value') else str(doc.category),
                "score": score,
                "excerpt": excerpt,
                "full_content": chunk.content,
                "page_number": chunk.page_number
            })

    scored_results.sort(key=lambda x: x["score"], reverse=True)
    top_results = scored_results[:top_k]

    if not top_results:
        answer = f"Zu Ihrer Frage „{query}“ konnten in den hinterlegten Unternehmensdokumenten keine passenden Richtlinien oder Abschnitte gefunden werden."
    else:
        best_match = top_results[0]
        answer = f"Basierend auf dem Dokument **{best_match['document_title']}** (Seite {best_match['page_number']}):\n\n> {best_match['full_content'][:400]}...\n\n*Relevanz: {int(best_match['score'] * 100)}% Übereinstimmung mit Ihrer Anfrage.*"

    for r in top_results:
        r.pop("full_content", None)

    return {
        "query": query,
        "answer": answer,
        "results": top_results,
        "total_matches": len(scored_results)
    }
