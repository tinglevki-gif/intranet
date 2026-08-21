import os
import uuid
import shutil
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, Form, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.user import User, RoleEnum
from app.models.schulung import TrainingDocument, TrainingChunk, SchulungCategory
from app.schemas.schulung import (
    TrainingDocumentResponse, 
    TrainingChatRequest, 
    TrainingChatResponse, 
    TrainingChatSource
)
from app.services.auth_service import get_current_user, require_roles, require_module_permission
from app.services.training_ai_service import extract_and_chunk_training_file, perform_training_rag_chat

router = APIRouter()

# Storage directory for training documents
BACKEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", ".."))
UPLOAD_ROOT = os.path.join(BACKEND_DIR, "uploads")
SCHULUNGEN_DIR = os.path.join(UPLOAD_ROOT, "schulungen")
os.makedirs(SCHULUNGEN_DIR, exist_ok=True)

ALLOWED_EXTENSIONS = {".pdf", ".docx", ".txt", ".md"}
MAX_FILE_SIZE = 25 * 1024 * 1024  # 25 MB

def map_training_doc_response(doc: TrainingDocument) -> TrainingDocumentResponse:
    uploader_name = doc.uploader.full_name if doc.uploader else "System-Schulungsstelle"
    return TrainingDocumentResponse(
        id=doc.id,
        title=doc.title,
        description=doc.description,
        category=doc.category,
        file_path=doc.file_path,
        file_type=doc.file_type,
        file_size=doc.file_size,
        version=doc.version,
        uploaded_by=doc.uploaded_by,
        uploader_name=uploader_name,
        created_at=doc.created_at,
        updated_at=doc.updated_at,
        chunks_count=len(doc.chunks) if doc.chunks else 0
    )

@router.get("", response_model=List[TrainingDocumentResponse])
def list_training_documents(
    query: Optional[str] = None,
    category: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_module_permission("schulungen"))
):
    """List all available corporate training documents and user manuals."""
    q = db.query(TrainingDocument)

    if category and category != "ALL":
        q = q.filter(TrainingDocument.category == category)

    if query:
        search = f"%{query.lower().strip()}%"
        q = q.filter(
            (TrainingDocument.title.ilike(search)) |
            (TrainingDocument.description.ilike(search))
        )

    docs = q.order_by(TrainingDocument.created_at.desc()).all()
    return [map_training_doc_response(d) for d in docs]

@router.get("/{doc_id}/download")
def download_training_document(
    doc_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_module_permission("schulungen"))
):
    """Securely download a training document file."""
    doc = db.query(TrainingDocument).filter(TrainingDocument.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Dokument nicht gefunden")

    file_name = os.path.basename(doc.file_path)
    full_path = os.path.join(SCHULUNGEN_DIR, file_name)

    if not os.path.exists(full_path):
        raise HTTPException(status_code=404, detail="Dokumentdatei auf dem Server nicht gefunden")

    return FileResponse(
        path=full_path,
        filename=f"{doc.title}.{doc.file_type}",
        media_type="application/octet-stream"
    )

@router.post("/upload", response_model=TrainingDocumentResponse, status_code=status.HTTP_201_CREATED)
async def upload_training_document(
    title: str = Form(...),
    description: Optional[str] = Form(None),
    category: SchulungCategory = Form(SchulungCategory.GENERAL),
    version: str = Form("1.0"),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([RoleEnum.ADMIN]))
):
    """
    SuperAdmin only: Upload a training manual, extract text, chunk and index it for AI chatbot.
    """
    file_ext = os.path.splitext(file.filename)[1].lower() if file.filename else ".pdf"
    if file_ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Ungültiges Dateiformat. Erlaubt sind: {', '.join(ALLOWED_EXTENSIONS)}"
        )

    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail="Die Dateigröße überschreitet das Limit von 25 MB."
        )

    clean_file_type = file_ext.replace(".", "")
    unique_filename = f"manual_{uuid.uuid4().hex[:10]}_{os.path.basename(file.filename)}"
    dest_path = os.path.join(SCHULUNGEN_DIR, unique_filename)

    with open(dest_path, "wb") as f:
        f.write(content)

    # 1. Create document record
    doc = TrainingDocument(
        title=title.strip(),
        description=description.strip() if description else None,
        category=category,
        file_path=f"/uploads/schulungen/{unique_filename}",
        file_type=clean_file_type,
        file_size=len(content),
        version=version.strip() if version else "1.0",
        uploaded_by=current_user.id
    )
    db.add(doc)
    db.flush()

    # 2. Extract text & create semantic chunks
    chunks_data = extract_and_chunk_training_file(dest_path, clean_file_type)
    for c_data in chunks_data:
        chunk = TrainingChunk(
            document_id=doc.id,
            chunk_index=c_data["chunk_index"],
            page_number=c_data["page_number"],
            section_title=c_data.get("section_title"),
            content=c_data["content"]
        )
        db.add(chunk)

    db.commit()
    db.refresh(doc)

    return map_training_doc_response(doc)

@router.delete("/{doc_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_training_document(
    doc_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([RoleEnum.ADMIN]))
):
    """
    SuperAdmin only: Delete a training manual and its AI chunks from the system.
    """
    doc = db.query(TrainingDocument).filter(TrainingDocument.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Dokument nicht gefunden")

    # Clean up file on disk
    file_name = os.path.basename(doc.file_path)
    full_path = os.path.join(SCHULUNGEN_DIR, file_name)
    if os.path.exists(full_path):
        try:
            os.remove(full_path)
        except Exception as e:
            print(f"Warning: Could not remove manual file {full_path}: {e}")

    db.delete(doc)
    db.commit()
    return None

@router.post("/chat", response_model=TrainingChatResponse)
def training_rag_chat(
    req: TrainingChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_module_permission("schulungen"))
):
    """
    Interactive AI Training Assistant Chatbot (RAG Engine).
    Answers employee questions and provides exact citations from manuals.
    """
    if not req.message or not req.message.strip():
        raise HTTPException(status_code=400, detail="Nachricht darf nicht leer sein.")

    res = perform_training_rag_chat(
        db=db,
        message=req.message.strip(),
        category_filter=req.category_filter,
        history=req.history
    )

    sources = [TrainingChatSource(**s) for s in res["sources"]]
    return TrainingChatResponse(
        answer=res["answer"],
        sources=sources,
        confidence=res["confidence"]
    )
