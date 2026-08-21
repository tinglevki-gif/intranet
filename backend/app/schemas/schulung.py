from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel
from app.models.schulung import SchulungCategory

class TrainingDocumentBase(BaseModel):
    title: str
    description: Optional[str] = None
    category: SchulungCategory = SchulungCategory.GENERAL
    version: str = "1.0"

class TrainingDocumentCreate(TrainingDocumentBase):
    pass

class TrainingDocumentResponse(TrainingDocumentBase):
    id: int
    file_path: str
    file_type: str
    file_size: int
    uploaded_by: Optional[int] = None
    uploader_name: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    chunks_count: int = 0

    class Config:
        from_attributes = True

class TrainingChatSource(BaseModel):
    document_id: int
    document_title: str
    category: str
    page_number: int
    section_title: Optional[str] = None
    score: float
    snippet: str
    download_url: str

class TrainingChatRequest(BaseModel):
    message: str
    category_filter: Optional[str] = None
    history: Optional[List[Dict[str, str]]] = []

class TrainingChatResponse(BaseModel):
    answer: str
    sources: List[TrainingChatSource]
    confidence: float
