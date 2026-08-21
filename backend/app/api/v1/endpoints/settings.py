from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.user import User, RoleEnum
from app.models.system_setting import SystemSetting
from app.schemas.setting import (
    SystemSettingResponse, 
    SystemSettingUpdate, 
    PublicSettingResponse
)
from app.services.auth_service import get_current_user, require_roles

router = APIRouter()
admin_router = APIRouter(dependencies=[Depends(require_roles([RoleEnum.ADMIN]))])

# --- User / Module Endpoints ---

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
