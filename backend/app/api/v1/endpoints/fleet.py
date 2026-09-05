import logging
from datetime import date
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, Query, Path, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.user import User
from app.models.geofence import Geofence
from app.schemas.fleet import FleetVehiclesResponse
from app.schemas.geofence import (
    GeofenceCreate, 
    GeofenceUpdate, 
    GeofenceResponse, 
    VehicleStayResponse, 
    StaysSummaryResponse, 
    VehicleGeofenceEventResponse
)
from app.services.auth_service import get_current_user
from app.services.navkonzept_service import navkonzept_fleet_service
from app.services.geofence_service import geofence_service

logger = logging.getLogger("fleet_endpoint")

router = APIRouter()

# =========================================================================
# 1. LIVE FLEET TELEMETRY (NAVKONZEPT)
# =========================================================================

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
    return navkonzept_fleet_service.get_vehicles(force_refresh=force_refresh)

# =========================================================================
# 2. GEOFENCES CRUD
# =========================================================================

@router.get(
    "/geofences",
    response_model=List[GeofenceResponse],
    status_code=status.HTTP_200_OK,
    summary="Liste aller Geofence-Zonen",
    description="Liefert alle definierten Geofences inklusive der Anzahl aktuell anwesender Fahrzeuge."
)
def list_geofences(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return geofence_service.get_geofences_with_stats(db)

@router.post(
    "/geofences",
    response_model=GeofenceResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Neuen Geofence anlegen",
    description="Erstellt eine neue geografische Überwachungszone (Werk, Baustelle, Lieferant, Parkplatz)."
)
def create_geofence(
    payload: GeofenceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    new_geofence = Geofence(
        name=payload.name,
        type=payload.type,
        latitude=payload.latitude,
        longitude=payload.longitude,
        radius_meters=payload.radius_meters,
        is_active=payload.is_active,
        description=payload.description
    )
    db.add(new_geofence)
    db.commit()
    db.refresh(new_geofence)

    # Nach Neuanlage sofort Flottenprüfung durchführen
    try:
        geofence_service.evaluate_fleet(db)
    except Exception as e:
        logger.warning("Fehler bei Folge-Evaluierung nach Geofence-Erstellung: %s", e)

    return GeofenceResponse(
        id=new_geofence.id,
        name=new_geofence.name,
        type=new_geofence.type,
        latitude=new_geofence.latitude,
        longitude=new_geofence.longitude,
        radius_meters=new_geofence.radius_meters,
        is_active=new_geofence.is_active,
        description=new_geofence.description,
        created_at=new_geofence.created_at,
        updated_at=new_geofence.updated_at,
        active_vehicles_count=0
    )

@router.get(
    "/geofences/{geofence_id}",
    response_model=GeofenceResponse,
    status_code=status.HTTP_200_OK,
    summary="Geofence Details abrufen"
)
def get_geofence_by_id(
    geofence_id: int = Path(..., description="ID des Geofence"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    geofence = db.query(Geofence).filter(Geofence.id == geofence_id).first()
    if not geofence:
        raise HTTPException(status_code=404, detail="Geofence nicht gefunden.")
    
    stats_list = geofence_service.get_geofences_with_stats(db)
    target = next((g for g in stats_list if g["id"] == geofence_id), None)
    return target if target else geofence

@router.put(
    "/geofences/{geofence_id}",
    response_model=GeofenceResponse,
    status_code=status.HTTP_200_OK,
    summary="Geofence aktualisieren"
)
def update_geofence(
    payload: GeofenceUpdate,
    geofence_id: int = Path(..., description="ID des Geofence"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    geofence = db.query(Geofence).filter(Geofence.id == geofence_id).first()
    if not geofence:
        raise HTTPException(status_code=404, detail="Geofence nicht gefunden.")

    if payload.name is not None:
        geofence.name = payload.name
    if payload.type is not None:
        geofence.type = payload.type
    if payload.latitude is not None:
        geofence.latitude = payload.latitude
    if payload.longitude is not None:
        geofence.longitude = payload.longitude
    if payload.radius_meters is not None:
        geofence.radius_meters = payload.radius_meters
    if payload.is_active is not None:
        geofence.is_active = payload.is_active
    if payload.description is not None:
        geofence.description = payload.description

    db.commit()
    db.refresh(geofence)

    # Nach Aktualisierung neu prüfen
    try:
        geofence_service.evaluate_fleet(db)
    except Exception as e:
        logger.warning("Fehler bei Folge-Evaluierung nach Geofence-Update: %s", e)

    stats_list = geofence_service.get_geofences_with_stats(db)
    target = next((g for g in stats_list if g["id"] == geofence_id), None)
    return target if target else geofence

@router.delete(
    "/geofences/{geofence_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Geofence löschen"
)
def delete_geofence(
    geofence_id: int = Path(..., description="ID des Geofence"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    geofence = db.query(Geofence).filter(Geofence.id == geofence_id).first()
    if not geofence:
        raise HTTPException(status_code=404, detail="Geofence nicht gefunden.")

    db.delete(geofence)
    db.commit()
    return None

# =========================================================================
# 3. STANDZEITEN & LADEZEITEN AUSWERTUNG (STAYS)
# =========================================================================

@router.get(
    "/stays",
    response_model=StaysSummaryResponse,
    status_code=status.HTTP_200_OK,
    summary="Auswertung der Stand-, Lade- und Entladezeiten",
    description="Liefert die Standzeiten aller Fahrzeuge an definierten Geofences für ein bestimmtes Datum."
)
def get_vehicle_stays_summary(
    date: Optional[date] = Query(None, description="Ziel-Datum (Standard: Heute im Format YYYY-MM-DD)"),
    geofence_id: Optional[int] = Query(None, description="Optionaler Filter nach Geofence-ID"),
    vehicle_id: Optional[str] = Query(None, description="Optionaler Filter nach Fahrzeug-ID / Kennzeichen"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Auswertung der Lade-, Entlade- und Verweilzeiten der Flotte pro Tag.
    """
    return geofence_service.get_stays_summary(
        db=db,
        target_date=date,
        geofence_id=geofence_id,
        vehicle_id=vehicle_id
    )

# =========================================================================
# 4. GEOFENCE EREIGNISSE & MANUELLER EVALUATION TRIGGER
# =========================================================================

@router.get(
    "/events",
    response_model=List[VehicleGeofenceEventResponse],
    status_code=status.HTTP_200_OK,
    summary="Chronologisches Geofence-Ereignisprotokoll (Audit-Log)",
    description="Liefert alle 'ENTER' und 'EXIT' Ereignisse der Flotte."
)
def list_geofence_events(
    limit: int = Query(50, ge=1, le=500, description="Maximale Anzahl Einträge"),
    geofence_id: Optional[int] = Query(None, description="Filter nach Geofence"),
    vehicle_id: Optional[str] = Query(None, description="Filter nach Fahrzeug"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return geofence_service.get_events(
        db=db,
        limit=limit,
        geofence_id=geofence_id,
        vehicle_id=vehicle_id
    )

@router.post(
    "/monitor/run",
    status_code=status.HTTP_200_OK,
    summary="Manuelle Geofencing-Überprüfung anstoßen",
    description="Triggert die sofortige Prüfung aller Fahrzeuge gegen alle Geofences via Haversine-Distanz."
)
def trigger_geofence_evaluation(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return geofence_service.evaluate_fleet(db)
