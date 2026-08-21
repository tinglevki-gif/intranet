# 🏢 Tiglev Elementfabrik - Moderne Enterprise Intranet Plattform

[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688.svg?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18.3-61DAFB.svg?logo=react&logoColor=black)](https://reactjs.org)
[![Vite](https://img.shields.io/badge/Vite-5.4-646CFF.svg?logo=vite&logoColor=white)](https://vitejs.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC.svg?logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
[![Docker](https://img.shields.io/badge/Docker-Multi--Stage-2496ED.svg?logo=docker&logoColor=white)](https://www.docker.com)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16%20%2B%20pgvector-336791.svg?logo=postgresql&logoColor=white)](https://github.com/pgvector/pgvector)
[![Nginx](https://img.shields.io/badge/Nginx-Reverse%20Proxy-009639.svg?logo=nginx&logoColor=white)](https://nginx.org)

Eine hochmoderne, modulare und produktionsreife Intranet-Plattform für die **Tiglev Elementfabrik** zur vernetzten Unternehmenskommunikation, Mitarbeiterverwaltung, interaktiven Organigrammen, Kalendersynchronisation und intelligenten KI-Dokumentensuche.

---

## 🌟 Funktionsumfang (Phasen 1–6)

1. **🔐 Authentifizierung & 4-Stufen RBAC (Phase 1)**
   - Sichere JWT-Authentifizierung mit Bcrypt-Passwort-Hashing.
   - 4-Tier RBAC-Rollenmodell: `SuperAdmin`, `HR_Admin`, `IT_Admin`, `Empleado`.
2. **🌐 Mehrsprachigkeit & Dynamisches UI (Phase 2)**
   - **4 Sprachen**: Deutsch (`de` Standard), Englisch (`en`), Polnisch (`pl`), Türkisch (`tr`) mit 1-Klick-Umschalter direkt im Header unter dem Branding.
   - **Wetter-Widget**: Echtzeit-Wetterabfrage via öffentlicher Open-Meteo API mit Standortauswahl (München, Berlin, Frankfurt, London, Warschau, Istanbul, Madrid, Wien, Zürich).
   - **Dynamische Sidebar**: Backend-gesteuerte Navigation passend zur Rolle des Benutzers.
3. **📞 Telefonverzeichnis & Interaktives Organigramm (Phase 3)**
   - **Telefonbuch**: Schnelle Suche nach Namen, Abteilungen oder internen Kurzwahlen (`#100`, `#200`, `#300`) mit Direktaktionen (Anruf, E-Mail).
   - **Organigramm-Baum**: Visueller, kollabierbarer Hierarchiebaum mit Zoom-/Pan-Steuerung und Teamstrukturen.
4. **📅 Unternehmenskalender & iCalendar-Synchronisation (Phase 4)**
   - **FullCalendar Integration**: Monats- (`dayGridMonth`), Wochen- (`timeGridWeek`) und Tagesansichten (`timeGridDay`).
   - **Farbcodierte Kategorien**: All-Hands, Meetings, Feiertage, Schulungen, HR-Events.
   - **Standardisierter iCal-Feed (`.ics` / RFC 5545)**: 1-Klick-Abonnement für MS Outlook, Apple Calendar und Google Calendar.
5. **📄 Sichere Dokumentenablage & Intelligente KI-Suche (Phase 5)**
   - **Drag & Drop Upload**: Upload von PDF, DOCX, TXT mit automatischer Textextraktion (`pypdf`).
   - **Semantische KI-Suche (RAG)**: Fragen in natürlicher Sprache stellen (*„Wie viele Tage Homeoffice sind erlaubt?“*) – liefert präzise KI-Antworten mit zitierten Textstellen, Seitenzahlen und Relevanzwerten.
   - **Token-geschützter Download**: Verhindert unberechtigten Direktzugriff auf interne Unternehmensrichtlinien.
6. **🚀 Produktions-Bereitstellung & Docker-Containerisierung (Phase 6)**
   - Multi-Stage Dockerfiles für Frontend (Nginx) und Backend (FastAPI).
   - `docker-compose.yml` für schlüsselfertigen Start inklusive PostgreSQL mit `pgvector`.
   - Nginx Reverse Proxy mit Sicherheits-Headern, Gzip-Kompression und SPA-Routing.

---

## 🚀 Schnellstart mit Docker Compose (1 Befehl)

```bash
# In das Projektverzeichnis wechseln
cd intranet-corp

# Alle Services bauen und im Hintergrund starten
docker compose up --build -d
```

Nach wenigen Sekunden sind alle Dienste einsatzbereit:
- **🌐 Intranet Portal (Frontend)**: [http://localhost](http://localhost) (Port 80)
- **⚡ REST API & Swagger Docs**: [http://localhost:8000/api/v1/docs](http://localhost:8000/api/v1/docs)
- **📅 iCalendar Feed URL**: [http://localhost:8000/api/v1/calendar/feed.ics](http://localhost:8000/api/v1/calendar/feed.ics)

Container stoppen:
```bash
docker compose down
```

---

## 💻 Lokale Entwicklung ohne Docker

### Voraussetzungen
- Python 3.11+
- Node.js 20+ und npm

### 1. Backend starten
```bash
cd backend
pip install -r requirements.txt
python run.py
```
> Das Backend startet auf `http://127.0.0.1:8000`. Die SQLite-Datenbank wird beim ersten Start automatisch initialisiert und mit Demo-Daten befüllt.

### 2. Frontend starten
```bash
cd frontend
npm install
npm run dev
```
> Das Frontend startet auf `http://localhost:5173`.

### 3. Schnellstart-Skripte (Windows)
Doppelklick auf:
- `start.bat` oder in PowerShell: `.\start.ps1`

---

## 👥 Standard-Benutzer & RBAC-Testkonten

Die Datenbank wird automatisch mit folgenden vorkonfigurierten Rollen und Mitarbeitern besetzt:

| Rolle | E-Mail | Passwort | Beschreibung & Berechtigungen |
| :--- | :--- | :--- | :--- |
| **SuperAdmin** | `admin@empresa.com` | `admin123` | Vollzugriff auf alle Module, Benutzerverwaltung & Systeme |
| **HR_Admin** | `hr@empresa.com` | `hr123` | Personalwesen, Urlaubsanträge, Organigramm & Richtlinien |
| **IT_Admin** | `it_admin@empresa.com` | `it123` | IT-Infrastruktur, Telemetrie, 2FA/VPN, Helpdesk |
| **Empleado** | `empleado@empresa.com` | `emp123` | Mitarbeiter-Zugang zu Telefonbuch, Kalender, Dokumenten & KI |

---

## 📡 API-Endpunkt-Übersicht

| Methode | Endpunkt | Beschreibung |
| :--- | :--- | :--- |
| `POST` | `/api/v1/auth/login` | Benutzeranmeldung & Ausgabe des JWT-Tokens |
| `GET` | `/api/v1/auth/me` | Profil des angemeldeten Benutzers abfragen |
| `GET` | `/api/v1/navigation/menu` | Dynamische Menüstruktur passend zur Benutzerrolle |
| `GET` | `/api/v1/dashboard/overview` | Dashboard-Kennzahlen, Mitteilungen und Termine |
| `GET` | `/api/v1/users/directory` | Telefonverzeichnis mit Suche nach Name, Durchwahl oder Abteilung |
| `GET` | `/api/v1/users/org-chart` | Hierarchischer Strukturbaum für das interaktive Organigramm |
| `GET` | `/api/v1/calendar/events` | Unternehmenskalender-Termine (gefiltert nach Kategorie/Monat) |
| `POST` | `/api/v1/calendar/events` | Neuen Termin anlegen (mit Rollenprüfung) |
| `GET` | `/api/v1/calendar/feed.ics` | **RFC 5545 iCalendar Feed** für Outlook & Google Calendar |
| `GET` | `/api/v1/documents` | Unternehmensdokumente abrufen (Kategorie-/Volltextfilter) |
| `POST` | `/api/v1/documents/upload` | Datei-Upload mit automatischer Textextraktion & Vektorisierung |
| `GET` | `/api/v1/documents/{id}/download` | Geschützter Download mit Token-Validierung |
| `POST` | `/api/v1/documents/search-ai` | **Semantische KI-Suche (RAG)** mit zitierten Passagen |

---

## 🛡️ Sicherheits-Auditing & Best Practices

- **Passwortsicherheit**: Alle Passwörter werden mit `bcrypt` und individuellen Salt-Runden gehasht.
- **JWT-Autorisierung**: Sichere Token mit konfigurierbarer Ablaufzeit (`HS256`).
- **Rollenbasierte Zugriffskontrolle (RBAC)**: Streng validierte Dependency Injections auf Endpunktebene.
- **Dokumentensicherheit**: Dateinamen werden mit UUIDs anonymisiert und physisch im geschützten `uploads/`-Verzeichnis abgelegt. Ein Download ist ohne gültiges JWT-Token unmöglich.
- **Nginx Security Headers**:
  - `X-Frame-Options: SAMEORIGIN` (Schutz vor Clickjacking)
  - `X-Content-Type-Options: nosniff` (Schutz vor MIME-Type-Confusion)
  - `X-XSS-Protection: 1; mode=block`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Permissions-Policy: camera=(), microphone=(), geolocation=()`

---

## 🧪 E2E-Tests ausführen

```bash
python test_e2e.py
```

---

© 2026 Tiglev Elementfabrik Intranet Platform • Alle Rechte vorbehalten.
