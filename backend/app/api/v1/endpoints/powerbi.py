from fastapi import APIRouter, Depends, HTTPException
from app.services.auth_service import get_current_user
from app.models.user import User
from app.services.powerbi_service import powerbi_service

router = APIRouter()

@router.get("/mengenberechnung/config", tags=["Power BI Analytics"])
def get_mengenberechnung_report_config(
    current_user: User = Depends(get_current_user)
):
    """
    Returns single-license authenticated embed configuration for the Mengenberechnung_V4 report.
    Accessible to all authenticated intranet users via single corporate master account.
    """
    return powerbi_service.get_mengenberechnung_report_config()
