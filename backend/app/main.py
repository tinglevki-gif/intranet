import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.core.config import settings
from app.core.database import engine, Base, SessionLocal
from app.api.v1.api import api_router
from app.services.seeder import seed_database

from sqlalchemy import text

# Ensure schema migrations for newly added columns
with engine.connect() as conn:
    try:
        # Users migrations
        res = conn.execute(text("PRAGMA table_info(users)"))
        cols = [r[1] for r in res.fetchall()]
        if "allowed_modules" not in cols:
            conn.execute(text("ALTER TABLE users ADD COLUMN allowed_modules JSON DEFAULT NULL;"))
            conn.commit()
        if "custom_role_id" not in cols:
            conn.execute(text("ALTER TABLE users ADD COLUMN custom_role_id INTEGER DEFAULT NULL;"))
            conn.commit()
    except Exception as e:
        pass

    try:
        # Announcements migrations
        res = conn.execute(text("PRAGMA table_info(announcements)"))
        cols = [r[1] for r in res.fetchall()]
        if cols:
            if "views_count" not in cols:
                conn.execute(text("ALTER TABLE announcements ADD COLUMN views_count INTEGER DEFAULT 0;"))
                conn.commit()
            if "author_id" not in cols:
                conn.execute(text("ALTER TABLE announcements ADD COLUMN author_id INTEGER DEFAULT NULL;"))
                conn.commit()
            if "author_name" not in cols:
                conn.execute(text("ALTER TABLE announcements ADD COLUMN author_name VARCHAR DEFAULT 'Geschäftsleitung';"))
                conn.commit()
            if "is_pinned" not in cols:
                conn.execute(text("ALTER TABLE announcements ADD COLUMN is_pinned BOOLEAN DEFAULT 0;"))
                conn.commit()
    except Exception as e:
        pass

from app.models.role import Role
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

os.makedirs(AVATAR_DIR, exist_ok=True)
os.makedirs(DOCS_DIR, exist_ok=True)
os.makedirs(SCHULUNGEN_DIR, exist_ok=True)
os.makedirs(NEWS_DIR, exist_ok=True)

# Create all database tables on startup
Base.metadata.create_all(bind=engine)

# Seed initial default demo data
db = SessionLocal()
try:
    seed_database(db)
    seed_default_roles(db)
    seed_default_training_manuals(db, UPLOAD_ROOT)
    seed_default_languages(db)
    seed_default_settings(db)
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
