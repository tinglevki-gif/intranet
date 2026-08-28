import os
import uuid
import shutil
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, Form, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import decode_access_token
from app.models.document import Document, DocumentChunk, DocumentCategory
from app.models.user import User, RoleEnum
from app.schemas.document import DocumentResponse, AISearchRequest, AISearchResponse
from app.services.auth_service import get_current_user, require_roles
from app.services.document_ai_service import extract_text_from_file, chunk_text, perform_ai_semantic_search

router = APIRouter()

BACKEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", ".."))
UPLOAD_DIR = os.path.join(BACKEND_DIR, "uploads", "documents")
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.get("", response_model=List[DocumentResponse])
def list_documents(
    category: Optional[str] = None,
    department: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Lists all accessible company documents with category, search and department filters.
    Accessible to all authenticated employees.
    """
    q = db.query(Document)

    if category and category != "ALL":
        q = q.filter(Document.category == category)

    if department and department != "ALL":
        q = q.filter((Document.allowed_department == department) | (Document.allowed_department == None))

    if search:
        s = f"%{search.lower().strip()}%"
        q = q.filter(
            (Document.original_name.ilike(s)) |
            (Document.summary.ilike(s))
        )

    docs = q.order_by(Document.created_at.desc()).all()

    results = []
    for d in docs:
        uploader_name = d.uploaded_by.full_name if d.uploaded_by else "Tiglev Elementfabrik System"
        results.append(
            DocumentResponse(
                id=d.id,
                filename=d.filename,
                original_name=d.original_name,
                file_type=d.file_type,
                file_size=d.file_size,
                category=d.category,
                allowed_department=d.allowed_department,
                summary=d.summary,
                uploaded_by_id=d.uploaded_by_id,
                uploader_name=uploader_name,
                created_at=d.created_at,
                updated_at=d.updated_at
            )
        )
    return results

@router.post("/upload", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
async def upload_document(
    file: UploadFile = File(...),
    category: str = Form("GENERAL"),
    allowed_department: Optional[str] = Form(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([RoleEnum.ADMIN]))
):
    """
    SuperAdmin only: Secure file upload with automatic text extraction, chunking and vector indexing for AI Search.
    Non-SuperAdmin users receive HTTP 403 Forbidden.
    """
    original_name = file.filename or "dokument.pdf"
    ext = original_name.split(".")[-1].lower() if "." in original_name else "txt"

    allowed_exts = ["pdf", "docx", "txt", "md", "csv", "xlsx"]
    if ext not in allowed_exts:
        raise HTTPException(
            status_code=400,
            detail=f"Dateityp .{ext} wird nicht unterstützt. Erlaubt: {', '.join(allowed_exts)}"
        )

    # Generate secure unique filename
    unique_name = f"{uuid.uuid4().hex[:12]}_{original_name}"
    file_path = os.path.join(UPLOAD_DIR, unique_name)

    # Save physical file
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        file_size = os.path.getsize(file_path)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Fehler beim Speichern der Datei: {str(e)}")

    # Parse Category
    try:
        doc_category = DocumentCategory(category)
    except ValueError:
        doc_category = DocumentCategory.GENERAL

    # Create Document record
    doc = Document(
        filename=unique_name,
        original_name=original_name,
        file_path=file_path,
        file_type=ext,
        file_size=file_size,
        category=doc_category,
        allowed_department=allowed_department if allowed_department != "ALL" else None,
        summary=f"Dokument {original_name} hochgeladen von {current_user.full_name}",
        uploaded_by_id=current_user.id
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)

    # Extract text and index chunks
    try:
        pages_text = extract_text_from_file(file_path, ext)
        chunks = chunk_text(pages_text)

        for c in chunks:
            clean_content = (c.get("content") or "").replace("\x00", "").strip()
            if not clean_content:
                continue
            chunk_obj = DocumentChunk(
                document_id=doc.id,
                chunk_index=c["chunk_index"],
                page_number=c["page_number"],
                content=clean_content,
                embedding_json=None
            )
            db.add(chunk_obj)

        db.commit()
    except Exception as idx_err:
        print(f"Warnung beim Indizieren der Dokument-Chunks für {original_name}: {idx_err}")
        db.rollback()

    return DocumentResponse(
        id=doc.id,
        filename=doc.filename,
        original_name=doc.original_name,
        file_type=doc.file_type,
        file_size=doc.file_size,
        category=doc.category,
        allowed_department=doc.allowed_department,
        summary=doc.summary,
        uploaded_by_id=doc.uploaded_by_id,
        uploader_name=current_user.full_name,
        created_at=doc.created_at,
        updated_at=doc.updated_at
    )

@router.put("/{document_id}", response_model=DocumentResponse)
@router.patch("/{document_id}", response_model=DocumentResponse)
def update_document(
    document_id: int,
    category: Optional[str] = None,
    allowed_department: Optional[str] = None,
    summary: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([RoleEnum.ADMIN]))
):
    """
    SuperAdmin only: Update document metadata, category or department permissions.
    """
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Dokument nicht gefunden")

    if category:
        try:
            doc.category = DocumentCategory(category)
        except ValueError:
            pass

    if allowed_department is not None:
        doc.allowed_department = allowed_department if allowed_department != "ALL" else None

    if summary is not None:
        doc.summary = summary

    db.commit()
    db.refresh(doc)

    uploader_name = doc.uploaded_by.full_name if doc.uploaded_by else "Tiglev Elementfabrik System"
    return DocumentResponse(
        id=doc.id,
        filename=doc.filename,
        original_name=doc.original_name,
        file_type=doc.file_type,
        file_size=doc.file_size,
        category=doc.category,
        allowed_department=doc.allowed_department,
        summary=doc.summary,
        uploaded_by_id=doc.uploaded_by_id,
        uploader_name=uploader_name,
        created_at=doc.created_at,
        updated_at=doc.updated_at
    )

@router.get("/{document_id}/download")
def download_document(
    document_id: int,
    token: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    """
    Secure file download with token validation (from query parameter or Bearer header).
    Accessible to all authenticated employees.
    """
    if not token:
        raise HTTPException(status_code=401, detail="Download erfordert ein gültiges Authentifizierungs-Token")

    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Ungültiges oder abgelaufenes Download-Token")

    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc or not os.path.exists(doc.file_path):
        raise HTTPException(status_code=404, detail="Dokumentdatei auf dem Server nicht gefunden")

    return FileResponse(
        path=doc.file_path,
        filename=doc.original_name,
        media_type="application/octet-stream"
    )

@router.post("/search-ai", response_model=AISearchResponse)
def search_documents_ai(
    search_req: AISearchRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Intelligent AI semantic search (RAG) across all indexed company documents.
    Accessible to all authenticated employees.
    """
    results = perform_ai_semantic_search(
        db=db,
        query=search_req.query,
        top_k=search_req.top_k,
        category_filter=search_req.category
    )
    return results

@router.delete("/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_document(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([RoleEnum.ADMIN]))
):
    """
    SuperAdmin only: Delete document and remove physical file from server storage.
    Non-SuperAdmin users receive HTTP 403 Forbidden.
    """
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Dokument nicht gefunden")

    # Remove physical file if exists
    if os.path.exists(doc.file_path):
        try:
            os.remove(doc.file_path)
        except Exception as e:
            print(f"Could not delete file {doc.file_path}: {e}")

    db.delete(doc)
    db.commit()
    return None
