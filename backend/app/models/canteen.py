from datetime import datetime, date
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Date, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.core.database import Base

class WeeklyMenu(Base):
    __tablename__ = "weekly_menus"

    id = Column(Integer, primary_key=True, index=True)
    calendar_week = Column(Integer, index=True, nullable=False)  # e.g. 35
    year = Column(Integer, index=True, nullable=False)           # e.g. 2026
    valid_from = Column(Date, nullable=False)                    # Montag der Woche
    valid_to = Column(Date, nullable=False)                      # Freitag / Sonntag der Woche
    
    # JSON-Struktur für Montag bis Freitag:
    # [
    #   {
    #     "tag": "Montag",
    #     "datum": "2026-08-24",
    #     "gericht_haupt": {"titel": "...", "beschreibung": "...", "preis": "6,90 €", "kalorien": "680 kcal"},
    #     "gericht_vegetarisch_vegan": {"titel": "...", "beschreibung": "...", "preis": "5,90 €", "is_vegan": False, "is_vegetarian": True},
    #     "dessert_beilage": {"titel": "...", "preis": "1,80 €"},
    #     "allergene_zusatzstoffe": ["A", "C", "G"]
    #   },
    #   ...
    # ]
    days_data = Column(JSON, nullable=False, default=list)

    pdf_url = Column(String, nullable=True)                      # Optionaler Upload-Pfad zum PDF-Speiseplan
    is_published = Column(Boolean, default=True, nullable=False) # Standard: Veröffentlicht

    erstellt_von_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    erstellt_von = relationship("User", foreign_keys=[erstellt_von_id])

    aktualisiert_am = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)
