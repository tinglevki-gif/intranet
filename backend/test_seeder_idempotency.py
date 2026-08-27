"""
Comprehensive Idempotency & Write Protection Test Suite for seeder.py
"""
import sys
import os
import logging

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Setup path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.core.database import Base
from app.models.user import User, RoleEnum
from app.models.role import Role
from app.models.menu import MenuItem
from app.models.event import Event, EventCategory
from app.models.document import Document, DocumentChunk, DocumentCategory
from app.models.ticket import Ticket, TicketMessage, TicketStatus, TicketPriority, TicketCategory
from app.models.calendar_source import ExternalCalendarSource
from app.models.canteen import WeeklyMenu
from app.services.seeder import seed_database
from app.services.role_service import seed_default_roles
from app.services.language_service import seed_default_languages
from app.services.setting_service import seed_default_settings
from app.services.training_ai_service import seed_default_training_manuals

def run_tests():
    logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
    print("\n========================================================")
    print("🚀 STARTE VERIFIKATIONSTEST: SEEDER-IDEMPOTENZ & SCHREIBSCHUTZ")
    print("========================================================\n")

    # Use an in-memory SQLite database to test fresh initialization and repeated seeding
    engine = create_engine("sqlite:///:memory:", echo=False)
    Session = sessionmaker(bind=engine)
    Base.metadata.create_all(bind=engine)

    upload_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "uploads")

    # --- TEST 1: Fresh Database Initialization ---
    print("TEST 1: Initialisiere eine frische, leere Datenbank...")
    db = Session()
    try:
        assert db.query(User).count() == 0, "DB sollte anfangs leer sein"
        seed_database(db)
        seed_default_roles(db)
        seed_default_training_manuals(db, upload_dir)
        seed_default_languages(db)
        seed_default_settings(db)
        
        user_count_initial = db.query(User).count()
        menu_count_initial = db.query(MenuItem).count()
        event_count_initial = db.query(Event).count()
        doc_count_initial = db.query(Document).count()
        ticket_count_initial = db.query(Ticket).count()
        canteen_count_initial = db.query(WeeklyMenu).count()
        
        print(f"  [OK] Initiales Seeding abgeschlossen:")
        print(f"       - Benutzer: {user_count_initial}")
        print(f"       - Menüeinträge: {menu_count_initial}")
        print(f"       - Events: {event_count_initial}")
        print(f"       - Dokumente: {doc_count_initial}")
        print(f"       - Tickets: {ticket_count_initial}")
        print(f"       - Kantinen-Menüs: {canteen_count_initial}")
        
        assert user_count_initial >= 1, "Mindestens SuperAdmin muss angelegt worden sein"
    finally:
        db.close()

    # --- TEST 2: Idempotenz bei zweitem Seeder-Aufruf (keine Duplikate) ---
    print("\nTEST 2: Wiederholter Seeder-Aufruf (Idempotenz-Prüfung)...")
    db = Session()
    try:
        seed_database(db)
        seed_default_roles(db)
        seed_default_training_manuals(db, upload_dir)
        seed_default_languages(db)
        seed_default_settings(db)

        assert db.query(User).count() == user_count_initial, "Benutzeranzahl darf sich nicht ändern"
        assert db.query(MenuItem).count() == menu_count_initial, "Menüanzahl darf sich nicht ändern"
        assert db.query(Event).count() == event_count_initial, "Eventanzahl darf sich nicht ändern"
        assert db.query(Document).count() == doc_count_initial, "Dokumentenanzahl darf sich nicht ändern"
        assert db.query(Ticket).count() == ticket_count_initial, "Ticketanzahl darf sich nicht ändern"
        assert db.query(WeeklyMenu).count() == canteen_count_initial, "Kantinenanzahl darf sich nicht ändern"
        print("  [OK] Wiederholter Seeder-Lauf hat keine Duplikate erzeugt und wurde sauber übersprungen.")
    finally:
        db.close()

    # --- TEST 3: Schreibschutz für modifizierte Benutzerdaten ---
    print("\nTEST 3: Benutzer ändert Name, Position, E-Mail und Passwort...")
    db = Session()
    try:
        user = db.query(User).first()
        assert user is not None
        
        original_id = user.id
        custom_name = "Dr. Humbert Senf (Modifiziert)"
        custom_position = "Chief Executive Officer"
        custom_email = "h.senf.custom@tinglev.de"
        custom_hash = "$2b$12$customfakehashvalueforpersistencytesting12345"
        
        user.full_name = custom_name
        user.position = custom_position
        user.email = custom_email
        user.hashed_password = custom_hash
        db.commit()
        print(f"  [OK] Benutzerdaten manuell geändert: Name='{user.full_name}', Email='{user.email}'")

        # Now simulate multiple restarts / seeder invocations
        print("  Simuliere 3 Container-Neustarts / Seeder-Aufrufe...")
        for i in range(3):
            seed_database(db)
            seed_default_roles(db)
            seed_default_languages(db)
            seed_default_settings(db)

        # Verify modified user is 100% preserved
        db.expire_all()
        persisted_user = db.query(User).filter(User.id == original_id).first()
        assert persisted_user is not None
        assert persisted_user.full_name == custom_name, "FEHLER: full_name wurde zurückgesetzt!"
        assert persisted_user.position == custom_position, "FEHLER: position wurde zurückgesetzt!"
        assert persisted_user.email == custom_email, "FEHLER: email wurde zurückgesetzt!"
        assert persisted_user.hashed_password == custom_hash, "FEHLER: passwort wurde zurückgesetzt!"
        print(f"  [OK] Alle manuellen Änderungen blieben nach wiederholten Seeder-Läufen vollständig erhalten!")
    finally:
        db.close()

    # --- TEST 4: Enum-Validität ---
    print("\nTEST 4: Validiere alle verwendeten Enums auf Integrität...")
    assert hasattr(DocumentCategory, "IT_POLICIES")
    assert hasattr(DocumentCategory, "HR")
    assert hasattr(DocumentCategory, "FINANCE")
    assert hasattr(DocumentCategory, "GENERAL")
    assert hasattr(RoleEnum, "ADMIN")
    assert hasattr(EventCategory, "TOWNHALL")
    assert hasattr(EventCategory, "MEETING")
    assert hasattr(EventCategory, "TRAINING")
    assert hasattr(EventCategory, "HOLIDAY")
    assert hasattr(TicketCategory, "IT_SUPPORT")
    assert hasattr(TicketStatus, "GELOEST")
    assert hasattr(TicketPriority, "KRITISCH")
    print("  [OK] Alle Enums sind gültig und fehlerfrei definiert.")

    # --- TEST 5: Vorhandene Produktionsdatenbank prüfen ---
    print("\nTEST 5: Teste gegen die reale SQLite-Datenbank (intranet.db)...")
    from app.core.database import SessionLocal
    prod_db = SessionLocal()
    try:
        user_cnt = prod_db.query(User).count()
        print(f"  - Reale DB enthält {user_cnt} Benutzer.")
        if user_cnt > 0:
            first_user = prod_db.query(User).first()
            orig_name = first_user.full_name
            seed_database(prod_db)
            prod_db.expire_all()
            user_after = prod_db.query(User).filter(User.id == first_user.id).first()
            assert user_after.full_name == orig_name, "Reale DB-Benutzerdaten wurden verändert!"
            print(f"  [OK] Reale Datenbank geschützt: '{orig_name}' unverändert beibehalten.")
    finally:
        prod_db.close()

    print("\n========================================================")
    print("🎉 ALLE TESTS ERFOLGREICH BESTANDEN!")
    print("========================================================\n")

if __name__ == "__main__":
    run_tests()
