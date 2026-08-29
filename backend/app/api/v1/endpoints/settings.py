import os
import uuid
import shutil
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.user import User, RoleEnum
from app.models.system_setting import SystemSetting
from app.schemas.setting import (
    SystemSettingResponse, 
    SystemSettingUpdate, 
    PublicSettingResponse,
    BrandingResponse,
    BrandingUpdate
)
from app.services.auth_service import get_current_user, require_roles
from app.services.setting_service import get_setting_value

router = APIRouter()
admin_router = APIRouter(dependencies=[Depends(require_roles([RoleEnum.ADMIN]))])

BACKEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", ".."))
COMPANY_UPLOAD_DIR = os.path.join(BACKEND_DIR, "uploads", "company")
os.makedirs(COMPANY_UPLOAD_DIR, exist_ok=True)

# Helper function to get current branding dictionary
def fetch_branding_dict(db: Session) -> BrandingResponse:
    return BrandingResponse(
        company_name=get_setting_value(db, "company_name", "TINGLEV"),
        company_suffix=get_setting_value(db, "company_suffix", "ELEMENTFABRIK"),
        company_tagline=get_setting_value(db, "company_tagline", "PORTAL INTRANET"),
        company_logo_url=get_setting_value(db, "company_logo_url", "")
    )


# --- Public / User Endpoints ---

@router.get("/branding", response_model=BrandingResponse, tags=["Unternehmens-Branding"])
def get_branding(db: Session = Depends(get_db)):
    """
    Returns public company branding parameters (name, suffix, tagline, custom logo URL).
    Accessible to all users (including login screen and sidebar).
    """
    return fetch_branding_dict(db)


@router.get("/{key}", response_model=PublicSettingResponse, tags=["System-Einstellungen & Integrationen"])
def get_setting_by_key(
    key: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Returns a specific configuration setting by key for authenticated users.
    """
    setting = db.query(SystemSetting).filter(SystemSetting.key == key).first()
    if not setting:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Einstellung mit Schlüssel '{key}' nicht gefunden."
        )

    return PublicSettingResponse(
        key=setting.key,
        value=setting.value,
        label=setting.label
    )


# --- SuperAdmin Endpoints ---

@admin_router.put("/branding", response_model=BrandingResponse, tags=["SuperAdmin Einstellungen"])
def update_branding(
    payload: BrandingUpdate,
    db: Session = Depends(get_db)
):
    """
    SuperAdmin only: Update company name, suffix, and tagline.
    """
    for key, val in [
        ("company_name", payload.company_name.strip()),
        ("company_suffix", payload.company_suffix.strip()),
        ("company_tagline", payload.company_tagline.strip()),
    ]:
        setting = db.query(SystemSetting).filter(SystemSetting.key == key).first()
        if setting:
            setting.value = val
        else:
            setting = SystemSetting(
                key=key,
                value=val,
                default_value=val,
                label=key,
                category="branding",
                is_public=True
            )
            db.add(setting)
    
    db.commit()
    return fetch_branding_dict(db)


@admin_router.post("/branding/logo", response_model=BrandingResponse, tags=["SuperAdmin Einstellungen"])
async def upload_company_logo(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    SuperAdmin only: Upload a custom company logo (PNG, JPG, SVG, WEBP).
    """
    if not file or not file.filename:
        raise HTTPException(status_code=400, detail="Keine Datei ausgewählt.")

    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in [".png", ".jpg", ".jpeg", ".svg", ".webp", ".gif"]:
        raise HTTPException(
            status_code=400, 
            detail="Ungültiges Dateiformat. Bitte laden Sie ein Bild im Format PNG, JPG, SVG oder WEBP hoch."
        )

    # Generate unique filename for company logo
    unique_filename = f"logo_{uuid.uuid4().hex[:12]}{ext}"
    dest_path = os.path.join(COMPANY_UPLOAD_DIR, unique_filename)

    with open(dest_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    logo_url = f"/uploads/company/{unique_filename}"

    setting = db.query(SystemSetting).filter(SystemSetting.key == "company_logo_url").first()
    if setting:
        setting.value = logo_url
    else:
        setting = SystemSetting(
            key="company_logo_url",
            value=logo_url,
            default_value="",
            label="Firmenlogo-URL",
            category="branding",
            is_public=True
        )
        db.add(setting)

    db.commit()
    return fetch_branding_dict(db)


@admin_router.post("/branding/reset", response_model=BrandingResponse, tags=["SuperAdmin Einstellungen"])
def reset_branding_to_default(db: Session = Depends(get_db)):
    """
    SuperAdmin only: Reset all branding parameters and company logo to default Tinglev Elementfabrik.
    """
    defaults = {
        "company_name": "TINGLEV",
        "company_suffix": "ELEMENTFABRIK",
        "company_tagline": "PORTAL INTRANET",
        "company_logo_url": ""
    }

    for key, def_val in defaults.items():
        setting = db.query(SystemSetting).filter(SystemSetting.key == key).first()
        if setting:
            setting.value = def_val

    db.commit()
    return fetch_branding_dict(db)


@admin_router.get("", response_model=List[SystemSettingResponse], tags=["SuperAdmin Einstellungen"])
def list_all_settings(db: Session = Depends(get_db)):
    """
    SuperAdmin only: List all system configuration parameters and integrations.
    """
    return db.query(SystemSetting).order_by(SystemSetting.category.asc(), SystemSetting.id.asc()).all()


@admin_router.put("/{key}", response_model=SystemSettingResponse, tags=["SuperAdmin Einstellungen"])
def update_setting(
    key: str,
    payload: SystemSettingUpdate,
    db: Session = Depends(get_db)
):
    """
    SuperAdmin only: Update a system configuration setting value (e.g. OneDrive URL).
    """
    setting = db.query(SystemSetting).filter(SystemSetting.key == key).first()
    if not setting:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Einstellung mit Schlüssel '{key}' nicht gefunden."
        )

    new_val = payload.value.strip()
    if not new_val:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Der Konfigurationswert darf nicht leer sein."
        )

    setting.value = new_val
    db.commit()
    db.refresh(setting)
    return setting


@admin_router.post("/{key}/reset", response_model=SystemSettingResponse, tags=["SuperAdmin Einstellungen"])
def reset_setting_to_default(
    key: str,
    db: Session = Depends(get_db)
):
    """
    SuperAdmin only: Reset a setting back to its original system default value.
    """
    setting = db.query(SystemSetting).filter(SystemSetting.key == key).first()
    if not setting:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Einstellung mit Schlüssel '{key}' nicht gefunden."
        )

    setting.value = setting.default_value
    db.commit()
    db.refresh(setting)
    return setting
