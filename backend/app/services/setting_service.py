from sqlalchemy.orm import Session
from app.models.system_setting import SystemSetting

DEFAULT_SETTINGS = [
    {
        "key": "onedrive_vertrieb_url",
        "value": "https://tiglevelementfabrik-my.sharepoint.com/personal/vertrieb_tiglev_de/Documents/Vertrieb_Projekte_2026",
        "default_value": "https://tiglevelementfabrik-my.sharepoint.com/personal/vertrieb_tiglev_de/Documents/Vertrieb_Projekte_2026",
        "label": "Microsoft OneDrive / SharePoint: Vertriebs-Ordner",
        "category": "integrations",
        "description": "Direkte Verknüpfung zum zentralen Microsoft OneDrive / SharePoint-Ordner für Vertriebsunterlagen, Kundenangebote und Projektkalkulationen.",
        "is_public": True
    },
    {
        "key": "onedrive_technik_url",
        "value": "https://tiglevelementfabrik-my.sharepoint.com/personal/technik_tiglev_de/Documents/CAD_BIM_Elemente_2026",
        "default_value": "https://tiglevelementfabrik-my.sharepoint.com/personal/technik_tiglev_de/Documents/CAD_BIM_Elemente_2026",
        "label": "Microsoft OneDrive / SharePoint: Technik & Statik",
        "category": "integrations",
        "description": "Direkte Verknüpfung zum zentralen OneDrive-Ordner für CAD-Zeichnungen, BIM-Modelle und statische Berechnungen.",
        "is_public": True
    }
]

def seed_default_settings(db: Session):
    """Populates database with initial system settings if not already present."""
    for s_data in DEFAULT_SETTINGS:
        existing = db.query(SystemSetting).filter(SystemSetting.key == s_data["key"]).first()
        if not existing:
            setting = SystemSetting(**s_data)
            db.add(setting)
    db.commit()

def get_setting_value(db: Session, key: str, fallback: str = "") -> str:
    """Helper to fetch a setting value by key."""
    setting = db.query(SystemSetting).filter(SystemSetting.key == key).first()
    return setting.value if setting else fallback
