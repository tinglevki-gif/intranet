import os
import sys
import time
import subprocess
import json
import logging
from datetime import datetime, timezone
from fastapi import APIRouter
from app.core.config import settings

logger = logging.getLogger("license_endpoint")

router = APIRouter()

TRIAL_DURATION_MS = 10 * 24 * 60 * 60 * 1000  # 10 Days in MS

def _get_trial_info():
    """
    Computes trial status based on system installation or token timestamp.
    """
    now = time.time() * 1000  # ms
    
    # Try reading persistent token file if on Windows
    install_time = None
    common_files = os.environ.get("COMMONPROGRAMFILES") or "C:\\Program Files\\Common Files"
    token_path = os.path.join(common_files, "TinglevData", ".trial_token")
    if not os.path.exists(token_path):
        program_data = os.environ.get("PROGRAMDATA") or "C:\\ProgramData"
        token_path = os.path.join(program_data, "TinglevData", ".trial_token")

    # If file exists, we can extract timestamp or use file creation time
    if os.path.exists(token_path):
        try:
            stat = os.stat(token_path)
            install_time = stat.st_ctime * 1000
        except Exception:
            pass

    # Fallback to backend executable / database creation time or now
    if not install_time:
        db_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))), "intranet.db")
        if os.path.exists(db_path):
            try:
                install_time = os.stat(db_path).st_ctime * 1000
            except Exception:
                install_time = now
        else:
            install_time = now

    expiry_time = install_time + TRIAL_DURATION_MS
    remaining_ms = max(0, expiry_time - now)
    
    remaining_days = int(remaining_ms // (1000 * 60 * 60 * 24))
    remaining_hours = int((remaining_ms % (1000 * 60 * 60 * 24)) // (1000 * 60 * 60))
    
    is_valid = remaining_ms > 0
    expiry_dt = datetime.fromtimestamp(expiry_time / 1000, tz=timezone.utc)
    expiry_date_str = expiry_dt.strftime("%d.%m.%Y, %H:%M Uhr")

    return {
        "is_trial": getattr(settings, "IS_TRIAL_BUILD", True),
        "remaining_days": remaining_days,
        "remaining_hours": remaining_hours,
        "is_valid": is_valid,
        "expiry_date": expiry_date_str,
        "status": "VALID" if is_valid else "TRIAL_EXPIRED"
    }

@router.get("/status", summary="Liefert den aktuellen Testphasen-Status (Trial Edition)")
def get_license_status():
    """
    Liefert die verbleibenden Tage und Stunden der 10-tägigen Testversion.
    """
    if not getattr(settings, "IS_TRIAL_BUILD", False):
        return {
            "is_trial": False,
            "remaining_days": 999,
            "remaining_hours": 0,
            "is_valid": True,
            "expiry_date": "Unbegrenzt (Vollversion)",
            "status": "VALID"
        }

    return _get_trial_info()
