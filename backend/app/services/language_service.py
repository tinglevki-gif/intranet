from sqlalchemy.orm import Session
from app.models.language import LanguageConfig

DEFAULT_LANGUAGES = [
    {
        "code": "de",
        "name": "Deutsch",
        "native_name": "Deutsch",
        "flag": "🇩🇪",
        "locale": "de-DE",
        "is_active": True,
        "is_default": True,
        "order": 1
    },
    {
        "code": "en",
        "name": "Englisch",
        "native_name": "English",
        "flag": "🇬🇧",
        "locale": "en-US",
        "is_active": False,
        "is_default": False,
        "order": 2
    },
    {
        "code": "es",
        "name": "Spanisch",
        "native_name": "Español",
        "flag": "🇪🇸",
        "locale": "es-ES",
        "is_active": False,
        "is_default": False,
        "order": 3
    },
    {
        "code": "pl",
        "name": "Polnisch",
        "native_name": "Polski",
        "flag": "🇵🇱",
        "locale": "pl-PL",
        "is_active": False,
        "is_default": False,
        "order": 4
    },
    {
        "code": "tr",
        "name": "Türkisch",
        "native_name": "Türkçe",
        "flag": "🇹🇷",
        "locale": "tr-TR",
        "is_active": False,
        "is_default": False,
        "order": 5
    },
    {
        "code": "da",
        "name": "Dänisch",
        "native_name": "Dansk",
        "flag": "🇩🇰",
        "locale": "da-DK",
        "is_active": False,
        "is_default": False,
        "order": 6
    }
]

def seed_default_languages(db: Session):
    """Populates database with initial system language configurations if not present."""
    for lang_data in DEFAULT_LANGUAGES:
        existing = db.query(LanguageConfig).filter(LanguageConfig.code == lang_data["code"]).first()
        if not existing:
            new_lang = LanguageConfig(**lang_data)
            db.add(new_lang)
    db.commit()

    # Ensure at least one language is default
    default_lang = db.query(LanguageConfig).filter(LanguageConfig.is_default == True).first()
    if not default_lang:
        de_lang = db.query(LanguageConfig).filter(LanguageConfig.code == "de").first()
        if de_lang:
            de_lang.is_default = True
            de_lang.is_active = True
            db.commit()
