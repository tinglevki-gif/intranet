import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, Enum, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.core.database import Base

class TicketStatus(str, enum.Enum):
    OFFEN = "OFFEN"
    IN_BEARBEITUNG = "IN_BEARBEITUNG"
    WARTET_AUF_BENUTZER = "WARTET_AUF_BENUTZER"
    GELOEST = "GELOEST"
    GESCHLOSSEN = "GESCHLOSSEN"

class TicketPriority(str, enum.Enum):
    NIEDRIG = "NIEDRIG"
    MITTEL = "MITTEL"
    HOCH = "HOCH"
    KRITISCH = "KRITISCH"

class TicketCategory(str, enum.Enum):
    IT_SUPPORT = "IT_SUPPORT"
    HARDWARE = "HARDWARE"
    SOFTWARE = "SOFTWARE"
    VERTRIEB = "VERTRIEB"
    GEBAEUDE = "GEBAEUDE"
    ALLGEMEIN = "ALLGEMEIN"

class Ticket(Base):
    __tablename__ = "tickets"

    id = Column(Integer, primary_key=True, index=True)
    ticket_nr = Column(String, unique=True, index=True, nullable=False)
    titel = Column(String, nullable=False)
    beschreibung = Column(Text, nullable=False)
    kategorie = Column(Enum(TicketCategory), default=TicketCategory.ALLGEMEIN, nullable=False, index=True)
    prioritaet = Column(Enum(TicketPriority), default=TicketPriority.MITTEL, nullable=False, index=True)
    status = Column(Enum(TicketStatus), default=TicketStatus.OFFEN, nullable=False, index=True)
    
    ersteller_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    zugewiesen_an_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    
    loesung_dokumentation = Column(Text, nullable=True)
    loesungs_schlagwoerter = Column(JSON, nullable=True, default=list)
    
    erstellt_am = Column(DateTime, default=datetime.utcnow, nullable=False)
    aktualisiert_am = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    geloest_am = Column(DateTime, nullable=True)

    # Relationships
    ersteller = relationship("User", foreign_keys=[ersteller_id])
    zugewiesen_an = relationship("User", foreign_keys=[zugewiesen_an_id])
    messages = relationship(
        "TicketMessage", 
        back_populates="ticket", 
        cascade="all, delete-orphan", 
        order_by="TicketMessage.erstellt_am.asc()"
    )

class TicketMessage(Base):
    __tablename__ = "ticket_messages"

    id = Column(Integer, primary_key=True, index=True)
    ticket_id = Column(Integer, ForeignKey("tickets.id", ondelete="CASCADE"), nullable=False, index=True)
    autor_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    nachricht = Column(Text, nullable=False)
    ist_interne_notiz = Column(Boolean, default=False, nullable=False)
    erstellt_am = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    ticket = relationship("Ticket", back_populates="messages")
    autor = relationship("User", foreign_keys=[autor_id])
