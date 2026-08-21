from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel
from app.models.document import DocumentCategory

class DocumentBase(BaseModel):
    original_name: str
    category: DocumentCategory = DocumentCategory.GENERAL
    allowed_department: Optional[str] = None
    summary: Optional[str] = None

class DocumentResponse(DocumentBase):
    id: int
    filename: str
    file_type: str
    file_size: int
    uploaded_by_id: Optional[int] = None
    uploader_name: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class AISearchRequest(BaseModel):
    query: str
    top_k: int = 5
    category: Optional[str] = None

class AISearchResultItem(BaseModel):
    document_id: int
    document_title: str
    category: str
    score: float
    excerpt: str
    page_number: int

class AISearchResponse(BaseModel):
    query: str
    answer: str
    results: List[AISearchResultItem]
    total_matches: int
