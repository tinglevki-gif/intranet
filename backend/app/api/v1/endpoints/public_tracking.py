import logging
from datetime import datetime
from fastapi import APIRouter, Depends, Path, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.delivery_tracking import DeliveryTrackingShare
from app.schemas.delivery_tracking import PublicTrackingResponse
from app.services.eta_service import eta_calculation_service

logger = logging.getLogger("public_tracking_endpoint")

router = APIRouter()

@router.get(
    "/track/{token}",
    response_model=PublicTrackingResponse,
    status_code=status.HTTP_200_OK,
    summary="Öffentliche Live-Lieferverfolgung & ETA (Baustelle / Mobilkräne)",
    description="Öffentlich zugänglicher Endpunkt zur Echtzeit-Verfolgung der Ankunft eines LKW für Bauleiter und Montageleiter. Streng token-validiert und datenschutzkonform."
)
def track_delivery_public(
    token: str = Path(..., description="Sicherheits-Token der Freigabe"),
    db: Session = Depends(get_db)
):
    """
    Liefert den bereinigten Live-Status, die GPS-Position und die ETA des LKW für die Baustelle.
    """
    share = db.query(DeliveryTrackingShare).filter(DeliveryTrackingShare.token == token).first()
    
    if not share:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ungültiger Tracking-Link. Bitte überprüfen Sie die Webadresse."
        )

    if not share.is_active:
        raise HTTPException(
            status_code=status.HTTP_410_GONE,
            detail="Dieser Tracking-Link wurde von der Disposition deaktiviert oder widerrufen."
        )

    if share.expires_at < datetime.utcnow():
        raise HTTPException(
            status_code=status.HTTP_410_GONE,
            detail=f"Dieser Tracking-Link ist abgelaufen (Gültig bis: {share.expires_at.strftime('%d.%m.%Y %H:%M Uhr')})."
        )

    # ETA und Distanz berechnen
    eta_data = eta_calculation_service.calculate_eta_for_share(share)
    
    if not eta_data:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Telemetriedaten des Fahrzeugs stehen aktuell nicht zur Verfügung."
        )

    return eta_data
