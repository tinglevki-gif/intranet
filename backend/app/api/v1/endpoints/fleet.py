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
from app.services.maintenance_service import maintenance_service
from app.models.maintenance import MaintenanceInterval, MaintenanceLog, VehicleMeta
from app.models.reconciliation import TripReconciliation
from app.schemas.maintenance import (
    MaintenanceIntervalCreate,
    MaintenanceIntervalUpdate,
    MaintenanceIntervalResponse,
    MaintenanceLogCreate,
    MaintenanceLogResponse,
    MaintenanceAlertResponse
)
from app.schemas.reconciliation import (
    TripReconciliationRequest,
    TripReconciliationResponse,
    MonthlyWaitingTimesSummaryResponse
)
from app.services.reconciliation_service import reconciliation_service
from app.services.dispatch_service import dispatch_service
from app.schemas.dispatch import (
    NearestVehicleRequest,
    NearestVehicleResponse
)
from app.models.security import FleetSecurityEvent, FleetSecuritySetting, FleetSecurityEventType
from app.schemas.security import (
    FleetSecurityEventResponse,
    FleetSecurityLogsResponse,
    FleetSecuritySettingUpdate,
    FleetSecuritySettingResponse,
    FleetSecurityAcknowledgeRequest,
    FleetSecurityStatsResponse,
    FleetSecurityEvaluateResponse
)
from app.services.security_service import security_service

logger = logging.getLogger("fleet_endpoint")

router = APIRouter()

# =========================================================================
# 1. LIVE FLEET TELEMETRY (NAVKONZEPT) & DISPATCH CLASSIFICATION
# =========================================================================

@router.get(
    "/vehicles",
    response_model=FleetVehiclesResponse,
    status_code=status.HTTP_200_OK,
    summary="Liefert Live-Fahrzeugtelemetrie (Navkonzept) mit Disponenten-Klassifizierung",
    description="Liefert die aktuellen GPS-Koordinaten, Geschwindigkeiten, Status, Standorte und Disponenten-Status der Fahrzeugflotte."
)
def get_fleet_vehicles(
    force_refresh: bool = Query(False, description="Cache umgehen und frische Daten von Navkonzept abfragen"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Liefert die Flottentelemetrie für autorisierte Intranet-Benutzer, aktualisiert Laufleistungen,
    prüft Sicherheitsregeln (Werkshof-Geschwindigkeit & Ruhezeiten) und berechnet Disponenten-Status.
    """
    data = navkonzept_fleet_service.get_vehicles(force_refresh=force_refresh)
    vehicles = data.get("vehicles", [])
    
    # Automatische Aktualisierung der Gesamtkilometerstände in vehicles_meta
    try:
        if vehicles:
            maintenance_service.sync_telemetry_mileage(db, vehicles)
    except Exception as e:
        logger.warning("Fehler beim automatischen Mileage-Sync: %s", e)

    # Automatische Prüfung von Werksschutz- & Flottensicherheitsregeln
    try:
        if vehicles:
            security_service.evaluate_security_rules(db, vehicles)
    except Exception as e:
        logger.error("Fehler bei der automatischen Sicherheitsüberwachung: %s", e)

    # Automatische Klassifizierung für Disponenten-Portal (5 logistische Zustände & Dispatch Summary)
    try:
        data = dispatch_service.enrich_fleet_telemetry(db, data)
    except Exception as e:
        logger.error("Fehler bei Disponenten-Klassifizierung: %s", e)

    return data

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

# =========================================================================
# 5. LIVE-LIEFERVERFOLGUNG & DISPONENTEN FREIGABEN (TRACKING SHARES)
# =========================================================================

from datetime import datetime, timedelta
from app.models.delivery_tracking import DeliveryTrackingShare
from app.schemas.delivery_tracking import DeliveryTrackingShareCreate, DeliveryTrackingShareResponse

@router.get(
    "/tracking-shares",
    response_model=List[DeliveryTrackingShareResponse],
    status_code=status.HTTP_200_OK,
    summary="Aktive Live-Tracking-Links der Disposition",
    description="Liefert alle erstellten Live-Tracking-Freigaben für Baustellen und Mobilkräne."
)
def list_tracking_shares(
    include_expired: bool = Query(False, description="Auch abgelaufene Links anzeigen"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(DeliveryTrackingShare)
    if not include_expired:
        query = query.filter(
            DeliveryTrackingShare.is_active == True,
            DeliveryTrackingShare.expires_at > datetime.utcnow()
        )
    
    shares = query.order_by(DeliveryTrackingShare.created_at.desc()).all()
    
    result = []
    for s in shares:
        author_name = s.created_by.full_name if s.created_by else "Disposition"
        result.append(DeliveryTrackingShareResponse(
            id=s.id,
            token=s.token,
            vehicle_id=s.vehicle_id,
            destination_name=s.destination_name,
            destination_lat=s.destination_lat,
            destination_lon=s.destination_lon,
            created_at=s.created_at,
            expires_at=s.expires_at,
            is_active=s.is_active,
            notes=s.notes,
            created_by_name=author_name,
            share_url=f"/track/{s.token}"
        ))
    return result

@router.post(
    "/tracking-shares",
    response_model=DeliveryTrackingShareResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Neuen Baustellen-Tracking-Link generieren",
    description="Erstellt einen zeitlich befristeten Sicherheits-Token zur Live-Lieferverfolgung für Bauleiter & Montageleiter."
)
def create_tracking_share(
    payload: DeliveryTrackingShareCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    expires_at = datetime.utcnow() + timedelta(hours=payload.duration_hours)
    
    new_share = DeliveryTrackingShare(
        vehicle_id=payload.vehicle_id,
        destination_name=payload.destination_name,
        destination_lat=payload.destination_lat,
        destination_lon=payload.destination_lon,
        expires_at=expires_at,
        is_active=True,
        notes=payload.notes,
        created_by_id=current_user.id
    )
    db.add(new_share)
    db.commit()
    db.refresh(new_share)

    return DeliveryTrackingShareResponse(
        id=new_share.id,
        token=new_share.token,
        vehicle_id=new_share.vehicle_id,
        destination_name=new_share.destination_name,
        destination_lat=new_share.destination_lat,
        destination_lon=new_share.destination_lon,
        created_at=new_share.created_at,
        expires_at=new_share.expires_at,
        is_active=new_share.is_active,
        notes=new_share.notes,
        created_by_name=current_user.full_name,
        share_url=f"/track/{new_share.token}"
    )

@router.delete(
    "/tracking-shares/{share_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Tracking-Link widerrufen / löschen"
)
def delete_tracking_share(
    share_id: int = Path(..., description="ID der Freigabe"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    share = db.query(DeliveryTrackingShare).filter(DeliveryTrackingShare.id == share_id).first()
    if not share:
        raise HTTPException(status_code=404, detail="Tracking-Freigabe nicht gefunden.")

    db.delete(share)
    db.commit()
    return None

# =========================================================================
# 6. VORAUSSCHAUENDE WARTUNG & WERKSTATT-SERVICES (MAINTENANCE)
# =========================================================================

@router.get(
    "/maintenance/alerts",
    response_model=List[Dict[str, Any]],
    status_code=status.HTTP_200_OK,
    summary="Dringende Wartungs-Warnungen (OVERDUE & DUE_SOON)",
    description="Liefert alle Fahrzeuge mit überfälligen oder innerhalb des Vorwarn-Schwellenwerts fälligen Wartungen."
)
def get_maintenance_alerts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return maintenance_service.get_maintenance_alerts(db)

@router.get(
    "/maintenance/intervals",
    response_model=List[Dict[str, Any]],
    status_code=status.HTTP_200_OK,
    summary="Liste aller definierten Wartungsintervalle",
    description="Liefert alle Wartungspläne mit aktuellem Kilometerstand, Restkilometern und Status."
)
def list_maintenance_intervals(
    status_filter: Optional[str] = Query(None, alias="status", description="Filter nach Status (OK, DUE_SOON, OVERDUE)"),
    vehicle_id: Optional[str] = Query(None, description="Filter nach Fahrzeug-ID"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return maintenance_service.get_enriched_intervals(db, status_filter=status_filter, vehicle_id=vehicle_id)

@router.post(
    "/maintenance/intervals",
    response_model=Dict[str, Any],
    status_code=status.HTTP_201_CREATED,
    summary="Neues Wartungsintervall anlegen",
    description="Erstellt ein neues Intervall für ein Fahrzeug (z. B. TÜV, UVV, Ölwechsel)."
)
def create_maintenance_interval(
    payload: MaintenanceIntervalCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    next_due_km = payload.next_due_mileage
    if next_due_km is None:
        next_due_km = payload.last_service_mileage + payload.interval_km

    interval = MaintenanceInterval(
        vehicle_id=str(payload.vehicle_id),
        plate=payload.plate,
        service_type=payload.service_type,
        interval_km=payload.interval_km,
        last_service_mileage=payload.last_service_mileage,
        last_service_date=payload.last_service_date,
        next_due_mileage=next_due_km,
        next_due_date=payload.next_due_date,
        warning_threshold_km=payload.warning_threshold_km,
        notes=payload.notes
    )
    db.add(interval)
    db.commit()
    db.refresh(interval)

    # Re-evaluate
    maintenance_service.evaluate_all_intervals(db)
    
    enriched = maintenance_service.get_enriched_intervals(db, vehicle_id=str(payload.vehicle_id))
    for item in enriched:
        if item["id"] == interval.id:
            return item
    return {"id": interval.id, "message": "Intervall erfolgreich erstellt"}

@router.put(
    "/maintenance/intervals/{interval_id}",
    response_model=Dict[str, Any],
    status_code=status.HTTP_200_OK,
    summary="Wartungsintervall bearbeiten"
)
def update_maintenance_interval(
    interval_id: int = Path(..., description="ID des Intervalls"),
    payload: MaintenanceIntervalUpdate = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    interval = db.query(MaintenanceInterval).filter_by(id=interval_id).first()
    if not interval:
        raise HTTPException(status_code=404, detail="Wartungsintervall nicht gefunden.")

    update_data = payload.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(interval, key, value)

    if "interval_km" in update_data or "last_service_mileage" in update_data:
        if not payload.next_due_mileage:
            interval.next_due_mileage = interval.last_service_mileage + interval.interval_km

    db.commit()
    db.refresh(interval)

    maintenance_service.evaluate_all_intervals(db)
    enriched = maintenance_service.get_enriched_intervals(db)
    for item in enriched:
        if item["id"] == interval.id:
            return item
    return {"id": interval.id, "message": "Intervall aktualisiert"}

@router.delete(
    "/maintenance/intervals/{interval_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Wartungsintervall löschen"
)
def delete_maintenance_interval(
    interval_id: int = Path(..., description="ID des Intervalls"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    interval = db.query(MaintenanceInterval).filter_by(id=interval_id).first()
    if not interval:
        raise HTTPException(status_code=404, detail="Wartungsintervall nicht gefunden.")

    db.delete(interval)
    db.commit()
    return None

@router.post(
    "/maintenance/log",
    response_model=MaintenanceLogResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Durchgeführte Wartung quittieren (Werkstatt-Log)",
    description="Erfasst eine durchgeführte Inspektion, rolliert das nächste Fälligkeitsziel und setzt den Status auf OK."
)
def log_maintenance_service(
    payload: MaintenanceLogCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return maintenance_service.log_service_completed(db, payload)

@router.get(
    "/maintenance/logs",
    response_model=List[MaintenanceLogResponse],
    status_code=status.HTTP_200_OK,
    summary="Werkstatt-Historie und Wartungsprotokolle",
    description="Liefert alle archivierten Wartungsquittierungen chronologisch sortiert."
)
def list_maintenance_logs(
    vehicle_id: Optional[str] = Query(None, description="Optional nach Fahrzeug filtern"),
    limit: int = Query(50, description="Maximale Anzahl"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(MaintenanceLog)
    if vehicle_id and vehicle_id.upper() != "ALL":
        query = query.filter(MaintenanceLog.vehicle_id == str(vehicle_id))
    
    return query.order_by(MaintenanceLog.service_date.desc(), MaintenanceLog.created_at.desc()).limit(limit).all()

@router.post(
    "/maintenance/evaluate",
    status_code=status.HTTP_200_OK,
    summary="Wartungsstatus manuell neu evaluieren"
)
def evaluate_maintenance(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    maintenance_service.evaluate_all_intervals(db)
    alerts = maintenance_service.get_maintenance_alerts(db)
    return {
        "status": "success",
        "message": "Wartungsintervalle erfolgreich gegen aktuelle Kilometerstände evaluiert.",
        "alerts_count": len(alerts)
    }

# =========================================================================
# 7. FAHRTABGLEICH & STANDGELDBERECHNUNG (TRIP RECONCILIATION & REPORTS)
# =========================================================================

@router.post(
    "/reports/trip-reconciliation",
    response_model=TripReconciliationResponse,
    status_code=status.HTTP_200_OK,
    summary="Fahrtabgleich & Standgeldberechnung durchführen",
    description="Ermittelt Werkausfahrt, Baustelleneintreffen, Stillstandszeit und berechnet das Standgeld bei Überschreitung der 60 Min. Freistandzeit mit GPS-Nachweisen."
)
def generate_trip_reconciliation(
    payload: TripReconciliationRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        return reconciliation_service.reconcile_trip(db=db, req=payload, user_id=current_user.id)
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        logger.error("Fehler beim Fahrtabgleich: %s", e, exc_info=True)
        raise HTTPException(status_code=500, detail=f"Interner Fehler beim Fahrtabgleich: {str(e)}")

@router.get(
    "/reports/waiting-times",
    response_model=MonthlyWaitingTimesSummaryResponse,
    status_code=status.HTTP_200_OK,
    summary="Monatsübersicht aller Entladezeit-Überschreitungen (>60 Min)",
    description="Liefert die Monatsauswertung aller Standzeiten über 60 Minuten sortiert und aggregiert nach Baustellen/Kunden."
)
def get_monthly_waiting_times_report(
    month: Optional[str] = Query(None, description="Monat im Format YYYY-MM (Standard: aktueller Monat)"),
    threshold_minutes: int = Query(60, ge=0, le=480, description="Schwellenwert für kostenlose Entladezeit in Minuten (Standard: 60)"),
    site_geofence_id: Optional[int] = Query(None, description="Optionaler Filter nach spezifischer Baustelle"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return reconciliation_service.get_monthly_waiting_times(
        db=db,
        month_str=month,
        threshold_minutes=threshold_minutes,
        site_geofence_id=site_geofence_id
    )

@router.get(
    "/reports/reconciliations",
    response_model=List[TripReconciliationResponse],
    status_code=status.HTTP_200_OK,
    summary="Liste aller archivierten Fahrtabgleiche & Standgeldberichte"
)
def list_reconciliations(
    limit: int = Query(50, ge=1, le=200),
    site_geofence_id: Optional[int] = Query(None),
    plate: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(TripReconciliation)
    if site_geofence_id:
        query = query.filter(TripReconciliation.site_geofence_id == site_geofence_id)
    if plate:
        query = query.filter(TripReconciliation.plate == plate)
    
    reconciliations = query.order_by(TripReconciliation.trip_date.desc(), TripReconciliation.created_at.desc()).limit(limit).all()
    
    result = []
    for r in reconciliations:
        site_name = r.site_geofence.name if r.site_geofence else f"Baustelle #{r.site_geofence_id}"
        factory_name = r.factory_geofence.name if r.factory_geofence else "Werk Altlandsberg"
        user_name = r.created_by.full_name if r.created_by else None
        result.append(TripReconciliationResponse(
            id=r.id,
            report_number=r.report_number,
            delivery_note_number=r.delivery_note_number,
            plate=r.plate,
            trip_date=r.trip_date,
            site_geofence_id=r.site_geofence_id,
            site_name=site_name,
            factory_geofence_id=r.factory_geofence_id,
            factory_name=factory_name,
            factory_departure_time=r.factory_departure_time,
            site_arrival_time=r.site_arrival_time,
            site_departure_time=r.site_departure_time,
            stay_duration_minutes=r.stay_duration_minutes,
            free_unloading_minutes=r.free_unloading_minutes,
            billable_delay_minutes=r.billable_delay_minutes,
            hourly_demurrage_rate=r.hourly_demurrage_rate,
            demurrage_total_netto=r.demurrage_total_netto,
            is_demurrage_applicable=r.is_demurrage_applicable,
            status=r.status,
            compliance_text=r.compliance_text,
            notes=r.notes,
            created_by_name=user_name,
            created_at=r.created_at,
            audit_trail=r.audit_trail or []
        ))
    return result

@router.get(
    "/reports/reconciliations/{report_id}",
    response_model=TripReconciliationResponse,
    status_code=status.HTTP_200_OK,
    summary="Einzelnen Fahrtabgleich / Standgeldbeleg abrufen"
)
def get_reconciliation_by_id(
    report_id: int = Path(..., description="ID des Standgeldberichts"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    r = db.query(TripReconciliation).filter(TripReconciliation.id == report_id).first()
    if not r:
        raise HTTPException(status_code=404, detail="Standgeldbericht nicht gefunden.")
    
    site_name = r.site_geofence.name if r.site_geofence else f"Baustelle #{r.site_geofence_id}"
    factory_name = r.factory_geofence.name if r.factory_geofence else "Werk Altlandsberg"
    user_name = r.created_by.full_name if r.created_by else None
    
    return TripReconciliationResponse(
        id=r.id,
        report_number=r.report_number,
        delivery_note_number=r.delivery_note_number,
        plate=r.plate,
        trip_date=r.trip_date,
        site_geofence_id=r.site_geofence_id,
        site_name=site_name,
        factory_geofence_id=r.factory_geofence_id,
        factory_name=factory_name,
        factory_departure_time=r.factory_departure_time,
        site_arrival_time=r.site_arrival_time,
        site_departure_time=r.site_departure_time,
        stay_duration_minutes=r.stay_duration_minutes,
        free_unloading_minutes=r.free_unloading_minutes,
        billable_delay_minutes=r.billable_delay_minutes,
        hourly_demurrage_rate=r.hourly_demurrage_rate,
        demurrage_total_netto=r.demurrage_total_netto,
        is_demurrage_applicable=r.is_demurrage_applicable,
        status=r.status,
        compliance_text=r.compliance_text,
        notes=r.notes,
        created_by_name=user_name,
        created_at=r.created_at,
        audit_trail=r.audit_trail or []
    )

# =========================================================================
# 6. DISPONENTEN-PORTAL & UMKREISSUCHE (NEAREST VEHICLE)
# =========================================================================

@router.post(
    "/dispatch/nearest-vehicle",
    response_model=NearestVehicleResponse,
    status_code=status.HTTP_200_OK,
    summary="Nächstgelegenes Fahrzeug finden (Umkreissuche)",
    description="Findet verfügbare oder sich auf dem Rückweg befindliche Lkw für eine PLZ, Adresse, Baustelle oder GPS-Koordinaten."
)
def find_nearest_vehicle_post(
    payload: NearestVehicleRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return dispatch_service.find_nearest_vehicles(db, payload)

@router.get(
    "/dispatch/nearest-vehicle",
    response_model=NearestVehicleResponse,
    status_code=status.HTTP_200_OK,
    summary="Nächstgelegenes Fahrzeug per GET-Parameter suchen"
)
def find_nearest_vehicle_get(
    query: Optional[str] = Query(None, description="PLZ, Ort oder Adresse"),
    latitude: Optional[float] = Query(None, description="Ziel-Breitengrad"),
    longitude: Optional[float] = Query(None, description="Ziel-Längengrad"),
    geofence_id: Optional[int] = Query(None, description="ID des Ziel-Geofences"),
    radius_km: Optional[float] = Query(150.0, description="Maximaler Suchradius in km"),
    limit: Optional[int] = Query(10, description="Maximale Anzahl Ergebnisse"),
    only_available: Optional[bool] = Query(True, description="Nur verfügbare / rückfahrende Lkw"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    req = NearestVehicleRequest(
        query=query,
        latitude=latitude,
        longitude=longitude,
        geofence_id=geofence_id,
        radius_km=radius_km,
        limit=limit,
        only_available=only_available
    )
    return dispatch_service.find_nearest_vehicles(db, req)


# =========================================================================
# 7. WERKSSCHUTZ & FLOTTENSICHERHEIT (SPEED & OFF-HOURS AUDIT)
# =========================================================================

@router.get(
    "/security/logs",
    response_model=FleetSecurityLogsResponse,
    status_code=status.HTTP_200_OK,
    summary="Abfrage der Sicherheits- und Geschwindigkeitsverstöße für den Fuhrparkleiter",
    description="Liefert protokollierte Geschwindigkeitsüberschreitungen auf dem Werksgelände sowie unbefugte Fahrten während der Ruhezeiten."
)
def get_security_logs(
    type: Optional[str] = Query("ALL", description="Filter nach Typ: ALL, FACTORY_SPEED_VIOLATION, OFF_HOURS_MOVEMENT"),
    plate: Optional[str] = Query(None, description="Filter nach Kfz-Kennzeichen"),
    is_acknowledged: Optional[bool] = Query(None, description="Filter nach Quittierungsstatus"),
    limit: int = Query(50, description="Maximale Anzahl Ergebnisse", ge=1, le=500),
    offset: int = Query(0, description="Offset für Pagination", ge=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Audit-Endpunkt: Liefert protokollierte Sicherheitsvorfälle für den Fuhrparkleiter / Werksschutz.
    """
    return security_service.get_security_logs(
        db=db,
        event_type=type,
        plate=plate,
        is_acknowledged=is_acknowledged,
        limit=limit,
        offset=offset
    )

@router.get(
    "/security/settings",
    response_model=FleetSecuritySettingResponse,
    status_code=status.HTTP_200_OK,
    summary="Liefert die aktuellen Flottensicherheit- und Werksschutz-Einstellungen"
)
def get_security_settings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return security_service.get_settings_response(db)

@router.put(
    "/security/settings",
    response_model=FleetSecuritySettingResponse,
    status_code=status.HTTP_200_OK,
    summary="Aktualisiert die Flottensicherheit- und Werksschutz-Einstellungen",
    description="Erlaubt dem Fuhrparkleiter oder Administrator die Konfiguration von Werkshof-Tempolimit, Ruhezeiten, Benachrichtigungskanälen und Webhooks."
)
def update_security_settings(
    payload: FleetSecuritySettingUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    security_service.update_settings(db, payload)
    return security_service.get_settings_response(db)

@router.patch(
    "/security/logs/{event_id}/acknowledge",
    response_model=FleetSecurityEventResponse,
    status_code=status.HTTP_200_OK,
    summary="Quittiert einen Sicherheitsvorfall",
    description="Markiert einen Verstoß als geprüft/quittiert inklusive Zeitstempel, Prüfer und optionaler Begründung."
)
def acknowledge_security_event(
    event_id: int = Path(..., description="ID des Sicherheitsereignisses"),
    payload: Optional[FleetSecurityAcknowledgeRequest] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    note = payload.note if payload else None
    try:
        return security_service.acknowledge_event(
            db=db,
            event_id=event_id,
            user_id=current_user.id,
            note=note
        )
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(ve))

@router.get(
    "/security/stats",
    response_model=FleetSecurityStatsResponse,
    status_code=status.HTTP_200_OK,
    summary="Statistische Übersicht für Werksschutz & Flottensicherheit"
)
def get_security_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return security_service.get_security_stats(db)

@router.post(
    "/security/evaluate",
    response_model=FleetSecurityEvaluateResponse,
    status_code=status.HTTP_200_OK,
    summary="Manuelle Prüfung der aktuellen Flottentelemetrie gegen alle Sicherheitsregeln"
)
def evaluate_security_now(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    telemetry = navkonzept_fleet_service.get_vehicles()
    vehicles = telemetry.get("vehicles", [])
    new_events = security_service.evaluate_security_rules(db, vehicles)
    
    event_responses = []
    for e in new_events:
        event_responses.append(FleetSecurityEventResponse(
            id=e.id,
            event_type=e.event_type,
            vehicle_id=e.vehicle_id,
            plate=e.plate,
            speed=e.speed,
            speed_limit=e.speed_limit,
            location=e.location,
            latitude=e.latitude,
            longitude=e.longitude,
            distance_moved_meters=e.distance_moved_meters or 0.0,
            geofence_id=e.geofence_id,
            geofence_name=e.geofence.name if e.geofence else None,
            timestamp=e.timestamp,
            details=e.details,
            is_acknowledged=e.is_acknowledged,
            acknowledged_at=e.acknowledged_at,
            acknowledged_by_id=e.acknowledged_by_id,
            acknowledged_by_name=None,
            acknowledgement_note=e.acknowledgement_note,
            action_taken=e.action_taken,
            created_at=e.created_at
        ))

    return FleetSecurityEvaluateResponse(
        success=True,
        message=f"{len(vehicles)} Fahrzeuge geprüft. {len(new_events)} neue Verstöße erfasst.",
        vehicles_checked=len(vehicles),
        new_violations_detected=len(new_events),
        detected_events=event_responses
    )




