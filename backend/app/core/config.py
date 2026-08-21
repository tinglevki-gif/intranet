import os
from typing import List
from pydantic import BaseModel

# Absolute path to backend directory
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
