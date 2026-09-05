import os
import sys
from typing import List, Optional
from pydantic import BaseModel

# Absolute path to backend directory (supports PyInstaller frozen mode)
if getattr(sys, 'frozen', False):
    EXE_DIR = os.path.dirname(sys.executable)
    DEFAULT_SQLITE_PATH = os.path.join(EXE_DIR, "intranet.db").replace("\\", "/")
else:
    BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    DEFAULT_SQLITE_PATH = os.path.join(BASE_DIR, "intranet.db").replace("\\", "/")

class Settings(BaseModel):
    PROJECT_NAME: str = "Tiglev Elementfabrik Intranet"
    VERSION: str = "6.0.0"
    API_V1_STR: str = "/api/v1"
    
    # JWT Security settings
    SECRET_KEY: str = os.getenv("SECRET_KEY", "tiglev-elementfabrik-super-secret-jwt-key-2026-production-change-me")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    
    # Database (uses persistent absolute path to intranet.db)
    DATABASE_URL: str = os.getenv("DATABASE_URL", f"sqlite:///{DEFAULT_SQLITE_PATH}")

    # Google Gemini AI Integration
    GEMINI_API_KEY: Optional[str] = os.getenv("GEMINI_API_KEY", None)
    
    # Perseus Security & Awareness Integration
    PERSEUS_API_BASE_URL: str = os.getenv("PERSEUS_API_BASE_URL", "https://perseus-api.prd.production.my.perseus.de")
    PERSEUS_BEARER_TOKEN: Optional[str] = os.getenv("PERSEUS_BEARER_TOKEN", None)
    
    # Navkonzept (AddSecure FleetVision) Live Telemetry Integration
    NAVKONZEPT_COOKIE: str = os.getenv("NAVKONZEPT_COOKIE", "auth_clue=sso; PHPSESSID=TU_PHPSESSID_AQUI")
    NAVKONZEPT_FIRM_ID: int = int(os.getenv("NAVKONZEPT_FIRM_ID", "332"))
    NAVKONZEPT_API_URL: str = os.getenv("NAVKONZEPT_API_URL", "https://portal.navkonzept.com/api/map/leaflet/ajaxGetTableData")
    
    # CORS Origins
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
        "http://localhost",
        "http://127.0.0.1",
    ]

settings = Settings()
