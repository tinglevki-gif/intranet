import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, Enum, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

class SchulungCategory(str, enum.Enum):
    ONBOARDING = "Onboarding"
    SOFTWARE = "Software-Bedienung"
    SAFETY = "Arbeitssicherheit"
    IT_GUIDES = "IT-Leitfäden"
    GENERAL = "Allgemein"

class TrainingDocument(Base):
    __tablename__ = "training_documents"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False, index=True)
    description = Column(Text, nullable=True)
    category = Column(Enum(SchulungCategory), default=SchulungCategory.GENERAL, nullable=False, index=True)
    file_path = Column(String, nullable=False)
    file_type = Column(String, nullable=False)  # pdf, docx, txt, md
    file_size = Column(Integer, nullable=False, default=0)
    version = Column(String, nullable=False, default="1.0")
    uploaded_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    uploader = relationship("User", foreign_keys=[uploaded_by])
    chunks = relationship("TrainingChunk", back_populates="document", cascade="all, delete-orphan")

class TrainingChunk(Base):
    __tablename__ = "training_chunks"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("training_documents.id", ondelete="CASCADE"), nullable=False)
    chunk_index = Column(Integer, nullable=False)
    page_number = Column(Integer, default=1, nullable=False)
    section_title = Column(String, nullable=True)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    document = relationship("TrainingDocument", back_populates="chunks")
