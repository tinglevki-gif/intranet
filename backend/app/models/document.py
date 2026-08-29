import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, Enum, ForeignKey, Boolean, Float
from sqlalchemy.orm import relationship
from app.core.database import Base

class DocumentCategory(str, enum.Enum):
    HR = "HR"                      # Personal, Urlaub, Betriebsvereinbarungen
    IT = "IT"                      # IT & Technik
    IT_POLICIES = "IT_POLICIES"    # IT-Sicherheit, 2FA, VPN, Passwörter
    FINANCE = "FINANCE"            # Spesen, Reisekosten, Abrechnungen
    GENERAL = "GENERAL"            # Code of Conduct, Compliance, Leitbilder
    BRAND = "BRAND"                # Markenhandbuch, Vorlagen, Präsentationen

class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, nullable=False, unique=True)
    original_name = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    file_type = Column(String, nullable=False)  # pdf, png, jpg, docx, txt, md
    file_size = Column(Integer, nullable=False)  # in bytes
    category = Column(Enum(DocumentCategory), default=DocumentCategory.GENERAL, nullable=False)
    allowed_department = Column(String, nullable=True)
    summary = Column(Text, nullable=True)

    # Automatic OCR & Document Classification
    ocr_applied = Column(Boolean, default=False, nullable=False)
    ocr_confidence = Column(Float, nullable=True)
    doc_type = Column(String, nullable=True)          # e.g., Rechnung, Vertrag, Richtlinie, Beleg
    extracted_metadata = Column(Text, nullable=True)   # JSON string with structured entities (date, amount, ref, company)
    detected_language = Column(String, default="deu")  # deu, eng
    folder_path = Column(String, nullable=True)        # categorized relative folder e.g. HR/ or FINANCE/

    uploaded_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    uploaded_by = relationship("User", foreign_keys=[uploaded_by_id])

    chunks = relationship(
        "DocumentChunk",
        back_populates="document",
        cascade="all, delete-orphan"
    )

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class DocumentChunk(Base):
    __tablename__ = "document_chunks"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id", ondelete="CASCADE"), nullable=False)
    chunk_index = Column(Integer, nullable=False)
    page_number = Column(Integer, default=1)
    content = Column(Text, nullable=False)
    embedding_json = Column(Text, nullable=True)  # JSON-encoded vector or token weights

    document = relationship("Document", back_populates="chunks")
    created_at = Column(DateTime, default=datetime.utcnow)
