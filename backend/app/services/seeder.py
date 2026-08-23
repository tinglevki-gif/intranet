import os
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.models.user import User, RoleEnum
from app.models.role import Role
from app.models.announcement import Announcement
from app.models.menu import MenuItem
from app.models.event import Event, EventCategory
from app.models.document import Document, DocumentChunk, DocumentCategory
from app.models.ticket import Ticket, TicketMessage, TicketStatus, TicketPriority, TicketCategory
from app.models.calendar_source import ExternalCalendarSource
from app.core.security import get_password_hash
from app.services.navigation_service import DEFAULT_MENUS

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))), "uploads", "documents")
os.makedirs(UPLOAD_DIR, exist_ok=True)

def seed_database(db: Session):
    """
    Safely and non-destructively populates database with initial seed data.
    IMPORTANT: NEVER deletes or overwrites existing user accounts, passwords, or custom modifications.
    """
    # 1. Seed Menu Items (only if table is empty, or add missing keys)
    existing_menu_keys = {m.key for m in db.query(MenuItem).all()}
    if not existing_menu_keys:
        menu_entries = [
            MenuItem(
                key=item["key"],
                label=item["label"],
                path=item["path"],
                icon=item["icon"],
                section=item["section"],
                order=item["order"],
                allowed_roles=item["allowed_roles"],
                badge=item["badge"],
                is_active=True
            )
            for item in DEFAULT_MENUS
        ]
        db.add_all(menu_entries)
        db.commit()
    else:
        # Add any newly introduced default menus without touching existing items
        missing_menus = [
            MenuItem(
                key=item["key"],
                label=item["label"],
                path=item["path"],
                icon=item["icon"],
                section=item["section"],
                order=item["order"],
                allowed_roles=item["allowed_roles"],
                badge=item["badge"],
                is_active=True
            )
            for item in DEFAULT_MENUS if item["key"] not in existing_menu_keys
        ]
        if missing_menus:
            db.add_all(missing_menus)
            db.commit()

    # 2. Seed Users (NON-DESTRUCTIVE: Never delete or overwrite existing users!)
    has_superadmin = db.query(User).filter(User.role == "ADMIN").first() is not None

    corporate_users_data = [
        # Root: SuperAdmin Carlos Mendoza
        {
            "email": "admin@empresa.com",
            "first_name": "Carlos",
            "last_name": "Mendoza",
            "full_name": "Carlos Mendoza",
            "password": "admin123",
            "role": "ADMIN",
            "department": "Geschäftsführung & IT",
            "position": "Chief Technology Officer & SuperAdmin (CM)",
            "avatar_url": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
            "phone": "+49 89 1234-100",
            "mobile": "+49 170 1234100",
            "location": "München Headquarter",
            "supervisor_id": None,
            "is_active": True
        }
    ]

    if not has_superadmin:
        admin_data = corporate_users_data[0].copy()
        pwd = admin_data.pop("password")
        db.add(User(**admin_data, hashed_password=get_password_hash(pwd)))
        db.commit()

    # 3. Seed Calendar Events (only if empty)
    if db.query(Event).count() == 0:
        now = datetime.now()
        admin_user = db.query(User).filter(User.role == RoleEnum.ADMIN).first()
        admin_id = admin_user.id if admin_user else 1

        demo_events = [
            Event(
                title="Quarterly All-Hands Meeting Q1 2026",
                description="Unternehmensweite Quartalspräsentation der Geschäftsführung. Rückblick auf Q1, Ausblick auf strategische Meilensteine und offene Q&A Session.",
                start_time=datetime(now.year, now.month, min(28, 25), 10, 0),
                end_time=datetime(now.year, now.month, min(28, 25), 11, 30),
                all_day=False,
                location="Auditorium München & Zoom Live Stream",
                category=EventCategory.TOWNHALL,
                department="Geschäftsführung & IT",
                created_by_id=admin_id
            ),
            Event(
                title="Sprint Planning & Product Discovery (Frontend Team)",
                description="Agiles Sprint-Planning für den Release der neuen Intranet-Features. Abstimmung der User Stories und Komponenten-Architektur.",
                start_time=datetime(now.year, now.month, min(28, 22), 9, 30),
                end_time=datetime(now.year, now.month, min(28, 22), 11, 0),
                all_day=False,
                location="Raum Berlin / Google Meet",
                category=EventCategory.MEETING,
                department="Softwareentwicklung",
                created_by_id=admin_id
            ),
            Event(
                title="Cybersecurity Awareness Workshop & 2FA Rollout",
                description="Interaktives IT-Sicherheitstraining zur Erkennung von Phishing, Zero-Trust-Best-Practices und Einrichtung von FIDO2-Sicherheitsschlüsseln.",
                start_time=datetime(now.year, now.month, min(28, 24), 14, 0),
                end_time=datetime(now.year, now.month, min(28, 24), 15, 30),
                all_day=False,
                location="Online Webinar (Teams)",
                category=EventCategory.TRAINING,
                department="IT & Infrastruktur",
                created_by_id=admin_id
            ),
            Event(
                title="Gesetzlicher Feiertag (Karfreitag)",
                description="Bundesweiter gesetzlicher Feiertag in Deutschland, Österreich und der Schweiz.",
                start_time=datetime(2026, 4, 3, 0, 0),
                end_time=datetime(2026, 4, 3, 23, 59),
                all_day=True,
                location="Alle Standorte",
                category=EventCategory.HOLIDAY,
                department=None,
                created_by_id=admin_id
            )
        ]
        db.add_all(demo_events)
        db.commit()

    # 4. Seed Documents and AI Search Chunks (only if empty)
    if db.query(Document).count() == 0:
        admin_user = db.query(User).filter(User.role == RoleEnum.ADMIN).first()
        admin_id = admin_user.id if admin_user else 1

        sample_docs_data = [
            {
                "original_name": "IT_Sicherheitsrichtlinie_und_Passwort_Policy_2026.pdf",
                "file_type": "pdf",
                "file_size": 1420000,
                "category": DocumentCategory.IT_POLICIES,
                "summary": "Verbindliche Richtlinien zur IT-Sicherheit, Multi-Faktor-Authentifizierung (MFA), Passwortkomplexität und Clean-Desk-Policy.",
                "uploader_id": admin_id,
                "chunks": [
                    "Passwort-Richtlinie & Komplexität: Alle Passwörter für Unternehmenssysteme müssen mindestens 12 Zeichen umfassen und Großbuchstaben, Kleinbuchstaben, Ziffern und Sonderzeichen enthalten.",
                    "Multi-Faktor-Authentifizierung (MFA): Für den Zugriff auf das Intranet, Microsoft 365, VPN und alle Cloud-Dienste ist 2FA verpflichtend aktiviert.",
                    "Clean Desk & Bildschirm-Sperre: Mitarbeiter müssen ihre Arbeitsstationen sperren (Windows-Taste + L), wenn sie ihren Schreibtisch verlassen."
                ]
            },
            {
                "original_name": "Homeoffice_und_Mobiles_Arbeiten_Betriebsvereinbarung.pdf",
                "file_type": "pdf",
                "file_size": 880000,
                "category": DocumentCategory.HR,
                "summary": "Betriebsvereinbarung zu mobiler Arbeit, Homeoffice-Ausstattung, Arbeitszeiterfassung und Erreichbarkeit.",
                "uploader_id": admin_id,
                "chunks": [
                    "Homeoffice-Kontingent: Mitarbeiter können in Abstimmung mit ihrem Vorgesetzten bis zu 3 Tage pro Woche mobil bzw. im Homeoffice arbeiten.",
                    "Ergonomie und Arbeitsplatzausstattung: Das Unternehmen stellt einen Laptop, Monitor, Tastatur, Maus und ein Headset für mobiles Arbeiten zur Verfügung.",
                    "Arbeitszeiterfassung: Die geleisteten Arbeitsstunden im mobilen Arbeiten sind tagesaktuell im Intranet-Zeiterfassungssystem einzutragen."
                ]
            },
            {
                "original_name": "Reisekosten_und_Spesenrichtlinie_2026.pdf",
                "file_type": "pdf",
                "file_size": 950000,
                "category": DocumentCategory.FINANCE,
                "summary": "Abrechnung von Dienstreisen, Verpflegungsmehraufwand, Bahntickets und Hotelübernachtungen.",
                "uploader_id": admin_id,
                "chunks": [
                    "Verpflegungspauschalen Inland (Deutschland): Bei einer Abwesenheit von mehr als 8 Stunden beträgt die Pauschale 14 € pro Tag.",
                    "Bahnreisen & Mobilität: Bahnfahrten unter 3 Stunden Fahrzeit sind in der 2. Klasse zu buchen. Ab mehr als 3 Stunden ist die 1. Klasse freigegeben.",
                    "Hotel- und Übernachtungsbudgets: Für Übernachtungen in Metropolregionen gilt ein Richtwert von maximal 130 € pro Nacht."
                ]
            },
            {
                "original_name": "Code_of_Conduct_und_Unternehmenswerte_2026.pdf",
                "file_type": "pdf",
                "file_size": 1150000,
                "category": DocumentCategory.GENERAL,
                "summary": "Verhaltenskodex, Diversität, Antidiskriminierung, Datenschutz und Whistleblowing-Verfahren.",
                "uploader_id": admin_id,
                "chunks": [
                    "Unternehmenswerte der Tiglev Elementfabrik: Wir leben eine Kultur der Offenheit, Innovation, Diversität und gegenseitigen Wertschätzung.",
                    "Hinweisgebersystem & Compliance: Mitarbeiter können vermutete Compliance-Verstöße jederzeit vertraulich an compliance@empresa.com melden.",
                    "Datenschutz & Vertraulichkeit: Kundendaten und geschäftskritische Dokumente unterliegen der DS-GVO und dürfen nur über gesicherte Cloud-Speicher geteilt werden."
                ]
            }
        ]

        for doc_idx, doc_item in enumerate(sample_docs_data):
            unique_file_name = f"seed_{doc_idx + 1}_{doc_item['original_name']}"
            file_path = os.path.join(UPLOAD_DIR, unique_file_name)
            
            with open(file_path, "w", encoding="utf-8") as f:
                f.write(f"=== {doc_item['original_name']} ===\n\n")
                f.write("\n\n".join(doc_item["chunks"]))

            doc_record = Document(
                filename=unique_file_name,
                original_name=doc_item["original_name"],
                file_path=file_path,
                file_type=doc_item["file_type"],
                file_size=doc_item["file_size"],
                category=doc_item["category"],
                summary=doc_item["summary"],
                uploaded_by_id=doc_item["uploader_id"]
            )
            db.add(doc_record)
            db.commit()
            db.refresh(doc_record)

            for c_idx, chunk_text in enumerate(doc_item["chunks"]):
                chunk_record = DocumentChunk(
                    document_id=doc_record.id,
                    chunk_index=c_idx,
                    page_number=1 + (c_idx // 2),
                    content=chunk_text,
                    embedding_json=None
                )
                db.add(chunk_record)

        db.commit()

    # 5. Seed Announcements / Mitteilungszentrale (only if empty)
    if db.query(Announcement).count() == 0:
        admin_user = db.query(User).filter(User.role == RoleEnum.ADMIN).first()
        admin_id = admin_user.id if admin_user else 1
        admin_name = admin_user.full_name if admin_user else "Geschäftsleitung"

        demo_announcements = [
            Announcement(
                title="🚀 Willkommen im neuen Tiglev Elementfabrik Intranet 2026",
                summary="Zentraler digitaler Knotenpunkt für alle Mitarbeiter, Standorte und Abteilungen mit integrierter KI-Dokumentensuche.",
                content="""# Willkommen auf unserer neuen Intranet-Plattform!

Wir freuen uns, den offiziellen Startschuss für das neue **Tiglev Elementfabrik Intranet 2026** zu geben. Diese Plattform verbindet unsere Standorte in Tinglev (DK) und Deutschland und bündelt alle wichtigen Arbeitsprozesse an einem zentralen Ort.

---

### 🔥 Die wichtigsten Neuerungen auf einen Blick:
1. **Intelligente KI-Suche**: Stellen Sie Fragen direkt an technische Handbücher, Sicherheitsrichtlinien und Bauvorschriften.
2. **Dynamische Rollen- & Rechteverwaltung**: Jeder Mitarbeiter sieht genau die Module, die für seinen Bereich relevant sind.
3. **Unternehmenskalender mit iCal-Sync**: Termine, Schichtpläne und Veranstaltungen nahtlos in Outlook oder Apple Kalender abonnieren.
4. **Zentrale Mitteilungszentrale**: Immer aktuell informiert über Unternehmensbeschlüsse, HR-Updates und Sicherheitswarnungen.

> [!NOTE]
> Bei Fragen zur Bedienung oder Anregungen steht Ihnen das IT- und Support-Team jederzeit zur Verfügung.

Vielen Dank an alle Teams, die an diesem Release mitgewirkt haben!""",
                category="Allgemein",
                is_pinned=True,
                cover_image="https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=1200&auto=format&fit=crop&q=80",
                author_name=admin_name,
                author_id=admin_id,
                views_count=142,
                created_at=datetime.utcnow() - timedelta(days=2)
            ),
            Announcement(
                title="🔒 Wichtiges IT-Sicherheitsupdate: 2-Faktor-Authentifizierung & Phishing-Prävention",
                summary="Aktuelle Hinweise zur Cybersicherheit, E-Mail-Prüfung bei externen Lieferantenrechnungen und Aktivierung von 2FA.",
                content="""# IT-Sicherheitsmitteilung: Erhöhte Wachsamkeit bei E-Mails

Aufgrund branchenweiter Sicherheitsvorfälle möchten wir alle Mitarbeiter für verdächtige E-Mails und manipulierte Rechnungsanhänge sensibilisieren.

### 🛡️ Wichtige Verhaltensregeln:
- **Absenderadresse prüfen**: Prüfen Sie stets die tatsächliche Domain des Absenders, insbesondere bei Aufforderungen zur Änderung von Bankverbindungen.
- **Keine Passwörter per Mail**: Die IT-Abteilung wird Sie niemals per Mail oder Telefon nach Ihrem Passwort fragen.
- **Makro-Dateien (.docm, .xlsm)**: Öffnen Sie keine Anhänge aus unbekannten Quellen.

> [!WARNING]
> Sollten Sie eine verdächtige Nachricht erhalten, leiten Sie diese bitte sofort an **security@empresa.com** weiter und klicken Sie auf keine Links!

Für Rückfragen steht der IT-Helpdesk unter der Durchwahl **-300** bereit.""",
                category="IT-Sicherheit",
                is_pinned=True,
                cover_image="https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=1200&auto=format&fit=crop&q=80",
                author_name="Tobias Weber",
                author_id=3,
                views_count=98,
                created_at=datetime.utcnow() - timedelta(days=1)
            ),
            Announcement(
                title="🌴 HR-Update: Urlaubsplanung Sommer 2026 & Überstundenregelung",
                summary="Bitte reichen Sie Ihre Haupturlaubsanträge für die Sommermonate Juni bis August bis spätestens 31. März im Mitarbeiterportal ein.",
                content="""# Liebe Kolleginnen und Kollegen,

die Planung für das Sommerhalbjahr 2026 hat begonnen. Um die Produktionsabläufe in der Fertigungshalle sowie die Kundenbetreuung reibungslos sicherzustellen, bitten wir um rechtzeitige Abstimmung Ihrer Urlaubszeiten.

### 📅 Wichtige Termine:
- **Frist für Sommerurlaub**: Bitte bis **31. März 2026** im Mitarbeiterportal erfassen.
- **Kernbetriebsruhe**: 20. Juli bis 02. August 2026 (Wartungsarbeiten Halle 1 & 2).
- **Resturlaub 2025**: Kann gemäß Betriebsvereinbarung bis zum 30. April 2026 genommen werden.

Bei individuellen Fragen wenden Sie sich gerne direkt an Lucía Fernández aus der Personalabteilung.""",
                category="HR-Update",
                is_pinned=False,
                cover_image="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&auto=format&fit=crop&q=80",
                author_name="Lucía Fernández",
                author_id=2,
                views_count=76,
                created_at=datetime.utcnow() - timedelta(days=4)
            ),
            Announcement(
                title="🏗️ Fertigungshalle 2: Inbetriebnahme der neuen automatisierten Bewehrungsstraße",
                summary="Modernisierung abgeschlossen: Höhere Präzision und verkürzte Durchlaufzeiten bei Betonfertigteilen und Spannbetonelementen.",
                content="""# Modernisierung Fertigungshalle 2 erfolgreich abgeschlossen

Nach dreiwöchiger Umbauphase ging heute die neue vollautomatisierte Bewehrungsstraße planmäßig in Betrieb.

### 📈 Die Vorteile der neuen Anlage:
- **Taktzeiteinsparung**: Reduzierung der Zuschnittzeiten um ca. 28 %.
- **Verbesserte Arbeitssicherheit**: Automatisches Hebesystem entlastet die Mitarbeiter im Schichtbetrieb.
- **Höchste Maßgenauigkeit**: Digitale CAD/CAM-Schnittstelle direkt an das Planungssystem angebunden.

Ein großes Dankeschön an das gesamte Montageteam und die Schichtleiter für den unermüdlichen Einsatz am Wochenende!""",
                category="Produktion & Technik",
                is_pinned=False,
                cover_image="https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=1200&auto=format&fit=crop&q=80",
                author_name=admin_name,
                author_id=admin_id,
                views_count=115,
                created_at=datetime.utcnow() - timedelta(days=6)
            ),
            Announcement(
                title="🎉 Einladung zum Frühlingsevent & Teambuilding 2026",
                summary="Gemeinsames Barbecue, sportliche Team-Challenges und Werksrundgang für alle Mitarbeiter und Familien.",
                content="""# Frühlingsevent Tiglev Elementfabrik 🌸

Wir laden alle Mitarbeiterinnen und Mitarbeiter herzlich zu unserem diesjährigen Frühlingsfest ein!

- **Wann**: Freitag, 24. April 2026 ab 15:30 Uhr
- **Wo**: Werksgelände & Festzelt Tinglev
- **Programm**: Grillbuffet, Live-Musik, Tischkicker-Turnier und Auszeichnung der Mitarbeiterjubiläen.

Bitte gebt bis zum 10. April eure Rückmeldung im Mitarbeiterportal ab, damit das Catering entsprechend planen kann.""",
                category="Event",
                is_pinned=False,
                cover_image="https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=1200&auto=format&fit=crop&q=80",
                author_name="Lucía Fernández",
                author_id=2,
                views_count=89,
                created_at=datetime.utcnow() - timedelta(days=8)
            )
        ]
        db.add_all(demo_announcements)
        db.commit()

    # 6. Seed Helpdesk Tickets (only if empty)
    if db.query(Ticket).count() == 0:
        demo_tickets = [
            Ticket(
                ticket_nr="TK-2026-001",
                titel="2FA-Einrichtung für neues Firmen-Smartphone",
                beschreibung="Ich habe ein neues Firmen-iPhone erhalten und benötige Hilfe bei der Übertragung des Microsoft Authenticators und VPN-Zertifikats.",
                kategorie=TicketCategory.IT_SUPPORT,
                prioritaet=TicketPriority.MITTEL,
                status=TicketStatus.GELOEST,
                ersteller_id=4,  # Mateo
                zugewiesen_an_id=3,  # Tobias (IT Admin)
                loesung_dokumentation="Zwei-Faktor-Authentifizierung im Intranet-Sicherheitsportal zurückgesetzt, neuen QR-Code gescannt und Funktion des VPN-Tunnels erfolgreich getestet.",
                loesungs_schlagwoerter=["2FA", "Authenticator", "VPN", "iPhone"],
                erstellt_am=datetime.utcnow() - timedelta(days=3),
                aktualisiert_am=datetime.utcnow() - timedelta(days=2),
                geloest_am=datetime.utcnow() - timedelta(days=2)
            ),
            Ticket(
                ticket_nr="TK-2026-002",
                titel="CAD/BIM-Softwarelizenzierung Allplan aktualisieren",
                beschreibung="Die Lizenz für Allplan 2026 am Arbeitsplatz der Statik läuft in 5 Tagen ab. Bitte Floating-Lizenz auf dem Lizenzserver verlängern.",
                kategorie=TicketCategory.SOFTWARE,
                prioritaet=TicketPriority.HOCH,
                status=TicketStatus.IN_BEARBEITUNG,
                ersteller_id=7,  # Elena
                zugewiesen_an_id=3,  # Tobias
                loesungs_schlagwoerter=["CAD", "Allplan", "BIM", "Lizenz"],
                erstellt_am=datetime.utcnow() - timedelta(days=1),
                aktualisiert_am=datetime.utcnow() - timedelta(hours=4)
            ),
            Ticket(
                ticket_nr="TK-2026-003",
                titel="Portalkran Demag 32t: Wartungsanzeige Sensor Halle 1",
                beschreibung="Sensor an der Seilwinde meldet sporadisch 'Fehlercode S-14' bei Volllast. Kranbetrieb läuft derzeit mit reduzierter Geschwindigkeit.",
                kategorie=TicketCategory.HARDWARE,
                prioritaet=TicketPriority.KRITISCH,
                status=TicketStatus.OFFEN,
                ersteller_id=8,  # Alexander
                zugewiesen_an_id=None,
                loesungs_schlagwoerter=["Kran", "Demag", "Sensor", "Halle1", "Wartung"],
                erstellt_am=datetime.utcnow() - timedelta(hours=6),
                aktualisiert_am=datetime.utcnow() - timedelta(hours=6)
            ),
            Ticket(
                ticket_nr="TK-2026-004",
                titel="Leistungsverzeichnis-Vorlagen für Vertrieb aktualisieren",
                beschreibung="Die GAEB-Vorlagen für Spannbetonelemente im OneDrive-Vertriebsordner benötigen das aktualisierte Preisdatenblatt Q2 2026.",
                kategorie=TicketCategory.VERTRIEB,
                prioritaet=TicketPriority.NIEDRIG,
                status=TicketStatus.WARTET_AUF_BENUTZER,
                ersteller_id=6,  # Sofia
                zugewiesen_an_id=1,  # Carlos
                loesungs_schlagwoerter=["GAEB", "OneDrive", "Preise", "Vertrieb"],
                erstellt_am=datetime.utcnow() - timedelta(days=2),
                aktualisiert_am=datetime.utcnow() - timedelta(hours=12)
            ),
            Ticket(
                ticket_nr="TK-2026-005",
                titel="Klimaanlage im Besprechungsraum München kühlt nicht",
                beschreibung="Die Raumtemperatur im Konferenzraum München liegt bei 27 °C, Klimasteuerung reagiert nicht auf Temperaturregler.",
                kategorie=TicketCategory.GEBAEUDE,
                prioritaet=TicketPriority.MITTEL,
                status=TicketStatus.OFFEN,
                ersteller_id=2,  # Lucia
                zugewiesen_an_id=None,
                loesungs_schlagwoerter=["Klima", "Gebäude", "München", "Besprechungsraum"],
                erstellt_am=datetime.utcnow() - timedelta(hours=2),
                aktualisiert_am=datetime.utcnow() - timedelta(hours=2)
            )
        ]
        db.add_all(demo_tickets)
        db.commit()

        # Seed initial messages for demo tickets
        demo_messages = [
            TicketMessage(
                ticket_id=demo_tickets[0].id,
                autor_id=4,
                nachricht="Ich habe ein neues Firmen-iPhone erhalten und benötige Hilfe bei der Übertragung des Microsoft Authenticators und VPN-Zertifikats.",
                ist_interne_notiz=False,
                erstellt_am=datetime.utcnow() - timedelta(days=3)
            ),
            TicketMessage(
                ticket_id=demo_tickets[0].id,
                autor_id=3,
                nachricht="Hallo Mateo, ich habe den 2FA-Token im Admin-Portal zurückgesetzt. Bitte melde dich kurz per Teams für den neuen QR-Code.",
                ist_interne_notiz=False,
                erstellt_am=datetime.utcnow() - timedelta(days=2, hours=2)
            ),
            TicketMessage(
                ticket_id=demo_tickets[0].id,
                autor_id=3,
                nachricht="Intern: Neues Gerät ist ein iPhone 15 Pro, Seriennummer im Asset-Management hinterlegt.",
                ist_interne_notiz=True,
                erstellt_am=datetime.utcnow() - timedelta(days=2, hours=1)
            ),
            TicketMessage(
                ticket_id=demo_tickets[1].id,
                autor_id=7,
                nachricht="Die Lizenz für Allplan 2026 am Arbeitsplatz der Statik läuft in 5 Tagen ab. Bitte Floating-Lizenz auf dem Lizenzserver verlängern.",
                ist_interne_notiz=False,
                erstellt_am=datetime.utcnow() - timedelta(days=1)
            ),
            TicketMessage(
                ticket_id=demo_tickets[1].id,
                autor_id=3,
                nachricht="Intern: Lizenzkey beim Allplan-Support angefragt, Ticket #44129 dort offen.",
                ist_interne_notiz=True,
                erstellt_am=datetime.utcnow() - timedelta(hours=4)
            )
        ]
        db.add_all(demo_messages)
        db.commit()

    # 7. Seed External Outlook / iCal Calendar Sources (only if empty)
    if db.query(ExternalCalendarSource).count() == 0:
        # Provide sample iCal content for demo feed
        sample_ics_content = """BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Microsoft Corporation//Outlook 16.0 MIMEDIR//EN
X-WR-CALNAME:Microsoft 365 Feiertage & Brückentage 2026
BEGIN:VEVENT
UID:outlook-sync-001@microsoft365.corp
DTSTAMP:20260101T000000Z
DTSTART;VALUE=DATE:20260501
DTEND;VALUE=DATE:20260502
SUMMARY:🇩🇪 Tag der Arbeit (Gesetzlicher Feiertag)
DESCRIPTION:Offizieller bundesweiter Feiertag. Werk und Verwaltung bleiben geschlossen.
LOCATION:Deutschlandweit
CATEGORIES:HOLIDAY
STATUS:CONFIRMED
END:VEVENT
BEGIN:VEVENT
UID:outlook-sync-002@microsoft365.corp
DTSTAMP:20260101T000000Z
DTSTART;VALUE=DATE:20260514
DTEND;VALUE=DATE:20260515
SUMMARY:✝️ Christi Himmelfahrt / Brückentag
DESCRIPTION:Gesetzlicher Feiertag und empfohlener Brückentag. Notbesetzung in der Instandhaltung.
LOCATION:Tinglev Werk
CATEGORIES:HOLIDAY
STATUS:CONFIRMED
END:VEVENT
BEGIN:VEVENT
UID:outlook-sync-003@microsoft365.corp
DTSTAMP:20260101T000000Z
DTSTART:20260610T090000Z
DTEND:20260610T170000Z
SUMMARY:🏗️ Messe BAU 2026: Standbetreuung & Vertriebsmeeting
DESCRIPTION:Internationaler Branchentreff für Betonfertigteile und serielle Bauelemente. Standhalle B2.
LOCATION:Messegelände München
CATEGORIES:MEETING
STATUS:CONFIRMED
END:VEVENT
END:VCALENDAR"""

        demo_sources = [
            ExternalCalendarSource(
                name="Microsoft 365 Feiertage & Werksferien",
                ics_url=sample_ics_content,
                farbe="#0078D4",  # Outlook Blue
                ist_aktiv=True,
                abteilung=None,
                letzter_status="OK",
                anzahl_termine=3,
                letzte_synchronisation=datetime.utcnow()
            ),
            ExternalCalendarSource(
                name="Outlook Vertriebsmeilensteine & Messen",
                ics_url="https://outlook.office365.com/owa/calendar/sales_feed_demo/reachcalendar.ics",
                farbe="#107C41",  # Office Excel / Sales Green
                ist_aktiv=True,
                abteilung="Vertrieb",
                letzter_status="NEU",
                anzahl_termine=0,
                letzte_synchronisation=None
            )
        ]
        db.add_all(demo_sources)
        db.commit()


