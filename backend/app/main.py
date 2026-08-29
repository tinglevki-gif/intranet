import os
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.core.config import settings
from app.core.database import engine, Base, SessionLocal
from app.api.v1.api import api_router
from app.services.seeder import seed_database
from sqlalchemy import text

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("main")

# Ensure schema migrations for newly added columns across PostgreSQL and SQLite
with engine.connect() as conn:
    dialect = engine.dialect.name
    try:
        if dialect == "postgresql":
            conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS allowed_modules JSON DEFAULT NULL;"))
            conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS custom_permissions JSON DEFAULT NULL;"))
            conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS custom_role_id INTEGER DEFAULT NULL;"))
            conn.execute(text("ALTER TABLE announcements ADD COLUMN IF NOT EXISTS views_count INTEGER DEFAULT 0;"))
            conn.execute(text("ALTER TABLE announcements ADD COLUMN IF NOT EXISTS author_id INTEGER DEFAULT NULL;"))
            conn.execute(text("ALTER TABLE announcements ADD COLUMN IF NOT EXISTS author_name VARCHAR DEFAULT 'Geschäftsleitung';"))
            conn.execute(text("ALTER TABLE announcements ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT 0;"))
            
            # Documents OCR & Classification migrations
            conn.execute(text("ALTER TABLE documents ADD COLUMN IF NOT EXISTS ocr_applied BOOLEAN DEFAULT FALSE;"))
            conn.execute(text("ALTER TABLE documents ADD COLUMN IF NOT EXISTS ocr_confidence FLOAT DEFAULT NULL;"))
            conn.execute(text("ALTER TABLE documents ADD COLUMN IF NOT EXISTS doc_type VARCHAR DEFAULT NULL;"))
            conn.execute(text("ALTER TABLE documents ADD COLUMN IF NOT EXISTS extracted_metadata TEXT DEFAULT NULL;"))
            conn.execute(text("ALTER TABLE documents ADD COLUMN IF NOT EXISTS detected_language VARCHAR DEFAULT 'deu';"))
            conn.execute(text("ALTER TABLE documents ADD COLUMN IF NOT EXISTS folder_path VARCHAR DEFAULT NULL;"))
            conn.commit()
            logger.info("PostgreSQL schema migrations verified.")
        elif dialect == "sqlite":
            # Users migrations
            res = conn.execute(text("PRAGMA table_info(users)"))
            cols = [r[1] for r in res.fetchall()]
            if "allowed_modules" not in cols:
                conn.execute(text("ALTER TABLE users ADD COLUMN allowed_modules JSON DEFAULT NULL;"))
            if "custom_permissions" not in cols:
                conn.execute(text("ALTER TABLE users ADD COLUMN custom_permissions JSON DEFAULT NULL;"))
            if "custom_role_id" not in cols:
                conn.execute(text("ALTER TABLE users ADD COLUMN custom_role_id INTEGER DEFAULT NULL;"))
            conn.commit()

            # Announcements migrations
            res_ann = conn.execute(text("PRAGMA table_info(announcements)"))
            cols_ann = [r[1] for r in res_ann.fetchall()]
            if cols_ann:
                if "views_count" not in cols_ann:
                    conn.execute(text("ALTER TABLE announcements ADD COLUMN views_count INTEGER DEFAULT 0;"))
                if "author_id" not in cols_ann:
                    conn.execute(text("ALTER TABLE announcements ADD COLUMN author_id INTEGER DEFAULT NULL;"))
                if "author_name" not in cols_ann:
                    conn.execute(text("ALTER TABLE announcements ADD COLUMN author_name VARCHAR DEFAULT 'Geschäftsleitung';"))
                if "is_pinned" not in cols_ann:
                    conn.execute(text("ALTER TABLE announcements ADD COLUMN is_pinned BOOLEAN DEFAULT 0;"))
                conn.commit()

            # Documents OCR migrations
            res_doc = conn.execute(text("PRAGMA table_info(documents)"))
            cols_doc = [r[1] for r in res_doc.fetchall()]
            if cols_doc:
                if "ocr_applied" not in cols_doc:
                    conn.execute(text("ALTER TABLE documents ADD COLUMN ocr_applied BOOLEAN DEFAULT 0;"))
                if "ocr_confidence" not in cols_doc:
                    conn.execute(text("ALTER TABLE documents ADD COLUMN ocr_confidence FLOAT DEFAULT NULL;"))
                if "doc_type" not in cols_doc:
                    conn.execute(text("ALTER TABLE documents ADD COLUMN doc_type VARCHAR DEFAULT NULL;"))
                if "extracted_metadata" not in cols_doc:
                    conn.execute(text("ALTER TABLE documents ADD COLUMN extracted_metadata TEXT DEFAULT NULL;"))
                if "detected_language" not in cols_doc:
                    conn.execute(text("ALTER TABLE documents ADD COLUMN detected_language VARCHAR DEFAULT 'deu';"))
                if "folder_path" not in cols_doc:
                    conn.execute(text("ALTER TABLE documents ADD COLUMN folder_path VARCHAR DEFAULT NULL;"))
                conn.commit()

            logger.info("SQLite schema migrations verified.")
    except Exception as e:
        logger.warning(f"Schema migration note: {e}")

from app.models.role import Role
from app.models.canteen import WeeklyMenu
from app.models.schulung import TrainingDocument, TrainingChunk
from app.models.announcement import Announcement
from app.models.language import LanguageConfig
from app.models.system_setting import SystemSetting
from app.models.ticket import Ticket, TicketMessage
from app.models.calendar_source import ExternalCalendarSource
from app.services.role_service import seed_default_roles
from app.services.training_ai_service import seed_default_training_manuals
from app.services.language_service import seed_default_languages
from app.services.setting_service import seed_default_settings

# Upload Directories Setup
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
UPLOAD_ROOT = os.path.join(BASE_DIR, "uploads")
AVATAR_DIR = os.path.join(UPLOAD_ROOT, "avatars")
DOCS_DIR = os.path.join(UPLOAD_ROOT, "documents")
SCHULUNGEN_DIR = os.path.join(UPLOAD_ROOT, "schulungen")
NEWS_DIR = os.path.join(UPLOAD_ROOT, "news")
CANTEEN_DIR = os.path.join(UPLOAD_ROOT, "canteen")

os.makedirs(AVATAR_DIR, exist_ok=True)
os.makedirs(DOCS_DIR, exist_ok=True)
os.makedirs(SCHULUNGEN_DIR, exist_ok=True)
os.makedirs(NEWS_DIR, exist_ok=True)
os.makedirs(CANTEEN_DIR, exist_ok=True)

# Create all database tables on startup
Base.metadata.create_all(bind=engine)

from app.services.navigation_service import migrate_menu_items_to_german
from app.services.seeder import seed_default_user_avatars, sync_announcements_authors

# Seed initial default demo data (strictly idempotent & write-protected)
db = SessionLocal()
try:
    logger.info("Prüfe Datenbank-Initialisierung und Standardkonfigurationen beim Serverstart...")
    seed_database(db)
    migrate_menu_items_to_german(db)
    seed_default_user_avatars(db)
    sync_announcements_authors(db)
    seed_default_roles(db)
    seed_default_training_manuals(db, UPLOAD_ROOT)
    seed_default_languages(db)
    seed_default_settings(db)
    logger.info("Initialisierungsprüfung erfolgreich beendet.")
except Exception as e:
    logger.error(f"Fehler bei der Initialisierung beim Serverstart: {e}", exc_info=True)
finally:
    db.close()

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="API REST para Intranet Corporativa con autenticación JWT, RBAC, Organigrama, Calendario, Documentos, Unternehmensnews und Mitteilungszentrale.",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url=f"{settings.API_V1_STR}/docs",
    redoc_url=f"{settings.API_V1_STR}/redoc",
)

# Configure CORS for local development and frontend client
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Static Files for Uploads (Avatars, Public Assets, News Cover Images)
app.mount("/uploads", StaticFiles(directory=UPLOAD_ROOT), name="uploads")

# Register API routes for both /api/v1 and /api (alias)
app.include_router(api_router, prefix=settings.API_V1_STR)
app.include_router(api_router, prefix="/api")

from fastapi.responses import FileResponse

# Production Frontend SPA Serving
FRONTEND_DIST = os.path.join(BASE_DIR, "frontend_dist")
if not os.path.exists(FRONTEND_DIST):
    alt_dist = os.path.join(os.path.dirname(BASE_DIR), "frontend", "dist")
    if os.path.exists(alt_dist):
        FRONTEND_DIST = alt_dist

if os.path.exists(FRONTEND_DIST) and os.path.isfile(os.path.join(FRONTEND_DIST, "index.html")):
    assets_dir = os.path.join(FRONTEND_DIST, "assets")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="spa_assets")

    @app.get("/health", tags=["General"])
    def health_check():
        return {"status": "healthy"}

    @app.get("/{full_path:path}", tags=["Frontend"])
    async def serve_spa(full_path: str):
        # Serve static file if exists in frontend dist
        if full_path:
            file_path = os.path.join(FRONTEND_DIST, full_path)
            if os.path.isfile(file_path):
                return FileResponse(file_path)
        # Fallback to index.html for React Router SPA
        return FileResponse(os.path.join(FRONTEND_DIST, "index.html"))
else:
    @app.get("/", tags=["General"])
    def root():
        return {
            "app": settings.PROJECT_NAME,
            "version": settings.VERSION,
            "status": "online",
            "docs": f"{settings.API_V1_STR}/docs",
            "ical_feed": f"{settings.API_V1_STR}/calendar/feed.ics"
        }

    @app.get("/health", tags=["General"])
    def health_check():
        return {"status": "healthy"}
