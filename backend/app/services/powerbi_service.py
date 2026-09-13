import logging
from typing import Dict, Any
from app.core.config import settings

logger = logging.getLogger("powerbi_service")

class PowerBIService:
    """
    Manages single corporate license Power BI report embedding for the intranet.
    Ensures a single master account token / embed configuration is served to all intranet users.
    """

    def get_mengenberechnung_report_config() -> Dict[str, Any]:
        embed_url = settings.POWERBI_EMBED_URL
        report_id = settings.POWERBI_REPORT_ID
        
        # If embed_url is set, use configured URL, otherwise generate default configuration
        return {
            "report_name": "Mengenberechnung_V4",
            "title": "Mengenberechnung & Materialbilanz V4",
            "report_id": report_id,
            "embed_url": embed_url,
            "single_account_mode": True,
            "license_type": "Corporate Single Master Account (Intranet Unified)",
            "is_configured": bool(embed_url),
            "pbix_filename": "Mengenberechnung_V4.pbix",
            "sections": [
                {"id": "sec-1", "name": "Gesamtübersicht Mengen & Tonnage"},
                {"id": "sec-2", "name": "Betonrezepturen & Rohstoffbilanz"},
                {"id": "sec-3", "name": "Elementgruppen & Auswertung"},
                {"id": "sec-4", "name": "Maschinenkapazitäten & Verschnitt"}
            ]
        }

powerbi_service = PowerBIService()
