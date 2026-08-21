from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.user import User, RoleEnum
from app.models.language import LanguageConfig
from app.schemas.language import (
    LanguageResponse, 
    LanguageUpdate, 
    ActiveLanguagesResponse
)
from app.services.auth_service import get_current_user, require_roles

router = APIRouter()
admin_router = APIRouter(dependencies=[Depends(require_roles([RoleEnum.ADMIN]))])

# --- Public / All Users Endpoints ---

@router.get("/active", response_model=ActiveLanguagesResponse, tags=["Sprachverwaltung (i18n)"])
def get_active_languages(db: Session = Depends(get_db)):
    """
    Returns all currently active languages for the application language switcher.
    Accessible to all users and visitors.
    """
    active_langs = db.query(LanguageConfig).filter(
        LanguageConfig.is_active == True
    ).order_by(LanguageConfig.order.asc(), LanguageConfig.id.asc()).all()

    default_lang = db.query(LanguageConfig).filter(
        LanguageConfig.is_default == True
    ).first()

    default_code = default_lang.code if default_lang else "de"

    # Fallback guarantee: If no active languages found in DB, return default German
    if not active_langs:
        de_lang = db.query(LanguageConfig).filter(LanguageConfig.code == "de").first()
        if de_lang:
            de_lang.is_active = True
            de_lang.is_default = True
            db.commit()
            active_langs = [de_lang]

    return ActiveLanguagesResponse(
        default_language=default_code,
        total_active=len(active_langs),
        languages=active_langs
    )


# --- SuperAdmin Endpoints ---

@admin_router.get("", response_model=List[LanguageResponse], tags=["SuperAdmin Sprachverwaltung"])
def list_all_languages_admin(db: Session = Depends(get_db)):
    """
    SuperAdmin only: List all configured system languages, both active and inactive.
    """
    return db.query(LanguageConfig).order_by(LanguageConfig.order.asc(), LanguageConfig.id.asc()).all()

@admin_router.patch("/{code}", response_model=LanguageResponse, tags=["SuperAdmin Sprachverwaltung"])
def update_language_status(
    code: str,
    payload: LanguageUpdate,
    db: Session = Depends(get_db)
):
    """
    SuperAdmin only: Toggle active status or change default language.
    Guarantees that the default language cannot be deactivated and at least one language remains active.
    """
    lang = db.query(LanguageConfig).filter(LanguageConfig.code == code.lower()).first()
    if not lang:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Sprache mit Code '{code}' nicht gefunden."
        )

    # 1. Handle is_default change
    if payload.is_default is True:
        # Set all languages to is_default = False
        db.query(LanguageConfig).update({LanguageConfig.is_default: False})
        lang.is_default = True
        lang.is_active = True # Default language must be active

    # 2. Handle is_active change
    if payload.is_active is not None:
        if payload.is_active is False:
            # Safety Check A: Cannot deactivate default language
            if lang.is_default:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Die Standardsprache '{lang.name}' kann nicht deaktiviert werden. Bitte legen Sie zuerst eine andere Sprache als Standard fest."
                )

            # Safety Check B: Cannot deactivate the last remaining active language
            active_count = db.query(LanguageConfig).filter(
                LanguageConfig.is_active == True,
                LanguageConfig.id != lang.id
            ).count()
            if active_count == 0:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Mindestens eine Systemsprache muss aktiv bleiben."
                )

        lang.is_active = payload.is_active

    if payload.order is not None:
        lang.order = payload.order

    db.commit()
    db.refresh(lang)
    return lang

@admin_router.post("/{code}/set-default", response_model=LanguageResponse, tags=["SuperAdmin Sprachverwaltung"])
def set_default_language(
    code: str,
    db: Session = Depends(get_db)
):
    """
    SuperAdmin only: Set a language as system default and ensure it is active.
    """
    lang = db.query(LanguageConfig).filter(LanguageConfig.code == code.lower()).first()
    if not lang:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Sprache mit Code '{code}' nicht gefunden."
        )

    # Clear previous default
    db.query(LanguageConfig).update({LanguageConfig.is_default: False})
    
    lang.is_default = True
    lang.is_active = True
    db.commit()
    db.refresh(lang)

    return lang
