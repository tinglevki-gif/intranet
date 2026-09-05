import logging
from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from app.models.user import User
from app.schemas.fleet import FleetVehiclesResponse
from app.services.auth_service import get_current_user
from app.services.navkonzept_service import navkonzept_fleet_service

logger = logging.getLogger("fleet_endpoint")

router = APIRouter()

@router.get(
    "/vehicles",
    response_model=FleetVehiclesResponse,
    status_code=status.HTTP_200_OK,
    summary="Liefert Live-Fahrzeugtelemetrie (Navkonzept)",
    description="Liefert die aktuellen GPS-Koordinaten, Geschwindigkeiten, Status und Standorte der Fahrzeugflotte (45s In-Memory-Cache)."
)
def get_fleet_vehicles(
    force_refresh: bool = Query(False, description="Cache umgehen und frische Daten von Navkonzept abfragen"),
    current_user: User = Depends(get_current_user)
):
    """
    Liefert die Flottentelemetrie für autorisierte Intranet-Benutzer.
    """
    telemetry_data = navkonzept_fleet_service.get_vehicles(force_refresh=force_refresh)
    return telemetry_data
