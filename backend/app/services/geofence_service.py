import math
import logging
from datetime import datetime, date, timezone
from typing import List, Dict, Any, Optional, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.geofence import Geofence, GeofenceType, VehicleGeofenceEvent, GeofenceEventType, VehicleStay
from app.services.navkonzept_service import navkonzept_fleet_service

logger = logging.getLogger("geofence_service")

# Default corporate geofences for Tinglev Elementfabrik GmbH
DEFAULT_GEOFENCES = [
    {
        "name": "Werk Altlandsberg (Zentrale)",
        "type": GeofenceType.FACTORY,
        "latitude": 52.5584,
        "longitude": 13.7656,
        "radius_meters": 600,
        "is_active": True,
        "description": "Hauptwerk & Fertigung: Am Gewerbepark 8A, 15345 Altlandsberg-Bruchmühle"
    },
    {
        "name": "Großbaustelle Berlin Europacity / Hbf",
        "type": GeofenceType.CONSTRUCTION_SITE,
        "latitude": 52.5310,
        "longitude": 13.3680,
        "radius_meters": 500,
        "is_active": True,
        "description": "Kundenbaustelle: Abladestelle für Betonbinder und Wandelemente"
    },
    {
        "name": "Logistikzentrum Frankfurt (Oder)",
        "type": GeofenceType.SUPPLIER,
        "latitude": 52.4820,
        "longitude": 13.9120,
        "radius_meters": 600,
        "is_active": True,
        "description": "Umschlagplatz & Rohstoffzulieferung (Kies & Zement)"
    },
    {
        "name": "Parkplatz & Servicestation Schönefeld",
        "type": GeofenceType.PARKING,
        "latitude": 52.3680,
        "longitude": 13.5120,
        "radius_meters": 400,
        "is_active": True,
        "description": "LKW-Ruhezone & Montage-Stützpunkt Süd"
    }
]

def calculate_haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Berechnet die Großkreis-Distanz zwischen zwei GPS-Koordinaten in Metern via Haversine-Formel.
    """
    R = 6371000.0  # Erdradius in Metern
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = (math.sin(delta_phi / 2.0) ** 2) + \
        math.cos(phi1) * math.cos(phi2) * (math.sin(delta_lambda / 2.0) ** 2)
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))

    return round(R * c, 1)

def seed_default_geofences(db: Session) -> None:
    """
    Initialisiert oder aktualisiert Standard-Geofences der Tinglev Elementfabrik.
    """
    count = db.query(Geofence).count()
    if count == 0:
        logger.info("Initialisiere Standard-Geofences für Tinglev Elementfabrik GmbH...")
        for g_data in DEFAULT_GEOFENCES:
            new_g = Geofence(
                name=g_data["name"],
                type=g_data["type"],
                latitude=g_data["latitude"],
                longitude=g_data["longitude"],
                radius_meters=g_data["radius_meters"],
                is_active=g_data["is_active"],
                description=g_data["description"]
            )
            db.add(new_g)
        db.commit()
        logger.info("4 Standard-Geofences erfolgreich angelegt.")
    
    # Bestehende Factory Geofences auf die offizielle Bezeichnung und Adresse aktualisieren
    factory_geos = db.query(Geofence).filter(
        (Geofence.type == GeofenceType.FACTORY) | (Geofence.name.ilike("%Altlandsberg%"))
    ).all()
    for f_geo in factory_geos:
        f_geo.name = "Werk Altlandsberg (Zentrale)"
        f_geo.description = "Hauptwerk & Fertigung: Am Gewerbepark 8A, 15345 Altlandsberg-Bruchmühle"
        f_geo.latitude = 52.5584
        f_geo.longitude = 13.7656
    db.commit()

class GeofenceMonitorService:
    """
    Zentraler Überwachungsdienst für Geofence-Ereignisse (ENTER/EXIT) und Standzeiten (Dwell Time).
    """

    def evaluate_fleet(self, db: Session) -> Dict[str, Any]:
        """
        Prüft alle aktiven Fahrzeuge gegen alle aktiven Geofence-Zonen.
        Erzeugt automatisch 'ENTER' / 'EXIT'-Events und verwaltet 'vehicle_stays'.
        """
        active_geofences: List[Geofence] = db.query(Geofence).filter(Geofence.is_active == True).all()
        if not active_geofences:
            return {"status": "no_active_geofences", "evaluated_vehicles": 0, "events_generated": 0}

        # 1. Aktuelle Flottentelemetrie abrufen
        telemetry_result = navkonzept_fleet_service.get_vehicles()
        vehicles = telemetry_result.get("vehicles", [])
        if not vehicles:
            return {"status": "no_vehicles", "evaluated_vehicles": 0, "events_generated": 0}

        # 2. Alle aktuell offenen Aufenthalte laden (exit_time is NULL)
        open_stays: List[VehicleStay] = db.query(VehicleStay).filter(VehicleStay.exit_time == None).all()
        # Mapping: (str(vehicle_id), geofence_id) -> VehicleStay
        open_stays_map: Dict[Tuple[str, int], VehicleStay] = {
            (str(s.vehicle_id), s.geofence_id): s for s in open_stays
        }

        now = datetime.utcnow()
        events_created: List[Dict[str, Any]] = []

        # 3. Jedes Fahrzeug gegen jeden Geofence evaluieren
        for v in vehicles:
            v_id = str(v.get("id"))
            plate = str(v.get("plate", ""))
            try:
                v_lat = float(v.get("lat"))
                v_lon = float(v.get("lon"))
            except (ValueError, TypeError):
                continue

            v_speed = float(v.get("speed", 0.0) or 0.0)

            for g in active_geofences:
                distance = calculate_haversine_distance(v_lat, v_lon, g.latitude, g.longitude)
                is_inside = distance <= float(g.radius_meters)
                key = (v_id, g.id)
                current_stay = open_stays_map.get(key)

                # FALL A: Fahrzeug ist in der Zone
                if is_inside:
                    if not current_stay:
                        # Fahrzeug ist NEU eingetroffen -> ENTER Event & neuen Stay anlegen
                        logger.info("GEOFENCE ENTER: Fahrzeug %s (%s) hat '%s' betreten (Distanz: %.1fm).", plate, v_id, g.name, distance)
                        
                        enter_event = VehicleGeofenceEvent(
                            vehicle_id=v_id,
                            plate=plate,
                            geofence_id=g.id,
                            event_type=GeofenceEventType.ENTER,
                            timestamp=now,
                            speed=v_speed,
                            distance_meters=distance
                        )
                        db.add(enter_event)

                        new_stay = VehicleStay(
                            vehicle_id=v_id,
                            plate=plate,
                            geofence_id=g.id,
                            enter_time=now,
                            exit_time=None,
                            duration_minutes=None
                        )
                        db.add(new_stay)
                        db.flush()
                        
                        # In Mapping aufnehmen
                        open_stays_map[key] = new_stay
                        events_created.append({
                            "event": "ENTER",
                            "plate": plate,
                            "geofence": g.name,
                            "distance": distance
                        })

                # FALL B: Fahrzeug ist außerhalb der Zone
                else:
                    if current_stay:
                        # Fahrzeug hat die Zone VERLASSEN -> EXIT Event & Stay abschließen
                        dwell_seconds = max(1, (now - current_stay.enter_time).total_seconds())
                        dwell_minutes = max(1, int(round(dwell_seconds / 60.0)))
                        
                        logger.info("GEOFENCE EXIT: Fahrzeug %s (%s) hat '%s' verlassen (Standzeit: %d Min, Distanz: %.1fm).", plate, v_id, g.name, dwell_minutes, distance)

                        exit_event = VehicleGeofenceEvent(
                            vehicle_id=v_id,
                            plate=plate,
                            geofence_id=g.id,
                            event_type=GeofenceEventType.EXIT,
                            timestamp=now,
                            speed=v_speed,
                            distance_meters=distance
                        )
                        db.add(exit_event)

                        current_stay.exit_time = now
                        current_stay.duration_minutes = dwell_minutes
                        
                        # Aus Mapping entfernen
                        open_stays_map.pop(key, None)
                        events_created.append({
                            "event": "EXIT",
                            "plate": plate,
                            "geofence": g.name,
                            "duration_minutes": dwell_minutes,
                            "distance": distance
                        })

        db.commit()

        return {
            "status": "success",
            "evaluated_at": now.isoformat(),
            "active_geofences_count": len(active_geofences),
            "evaluated_vehicles": len(vehicles),
            "events_generated": len(events_created),
            "events": events_created
        }

    def get_geofences_with_stats(self, db: Session) -> List[Dict[str, Any]]:
        """
        Liefert alle Geofences mit der Anzahl aktuell anwesender Fahrzeuge.
        """
        geofences: List[Geofence] = db.query(Geofence).order_by(Geofence.id.asc()).all()
        
        # Offene Aufenthalte zählen pro Geofence
        active_counts = db.query(
            VehicleStay.geofence_id, 
            func.count(VehicleStay.id)
        ).filter(
            VehicleStay.exit_time == None
        ).group_by(VehicleStay.geofence_id).all()

        counts_map = {g_id: count for g_id, count in active_counts}

        result = []
        for g in geofences:
            result.append({
                "id": g.id,
                "name": g.name,
                "type": g.type,
                "latitude": g.latitude,
                "longitude": g.longitude,
                "radius_meters": g.radius_meters,
                "is_active": g.is_active,
                "description": g.description,
                "created_at": g.created_at,
                "updated_at": g.updated_at,
                "active_vehicles_count": counts_map.get(g.id, 0)
            })
        return result

    def get_stays_summary(
        self, 
        db: Session, 
        target_date: Optional[date] = None,
        geofence_id: Optional[int] = None,
        vehicle_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Liefert die Standzeiten-Auswertung pro Fahrzeug für ein bestimmtes Datum.
        """
        selected_date = target_date or date.today()
        start_of_day = datetime(selected_date.year, selected_date.month, selected_date.day, 0, 0, 0)
        end_of_day = datetime(selected_date.year, selected_date.month, selected_date.day, 23, 59, 59)

        query = db.query(VehicleStay).filter(
            VehicleStay.enter_time >= start_of_day,
            VehicleStay.enter_time <= end_of_day
        )

        if geofence_id:
            query = query.filter(VehicleStay.geofence_id == geofence_id)
        if vehicle_id:
            query = query.filter(VehicleStay.vehicle_id == str(vehicle_id))

        stays: List[VehicleStay] = query.order_by(VehicleStay.enter_time.desc()).all()

        formatted_stays = []
        total_dwell = 0
        active_count = 0
        completed_count = 0

        now = datetime.utcnow()

        for s in stays:
            is_active = s.exit_time is None
            if is_active:
                active_count += 1
                cur_dwell = max(1, int((now - s.enter_time).total_seconds() / 60))
            else:
                completed_count += 1
                cur_dwell = s.duration_minutes or 0

            total_dwell += cur_dwell

            formatted_stays.append({
                "id": s.id,
                "vehicle_id": s.vehicle_id,
                "plate": s.plate,
                "geofence_id": s.geofence_id,
                "geofence_name": s.geofence.name if s.geofence else "Unbekannte Zone",
                "geofence_type": s.geofence.type.value if s.geofence and s.geofence.type else None,
                "enter_time": s.enter_time,
                "exit_time": s.exit_time,
                "duration_minutes": cur_dwell if is_active else s.duration_minutes,
                "is_currently_inside": is_active,
                "created_at": s.created_at
            })

        total_stays = len(stays)
        avg_dwell = round(total_dwell / total_stays, 1) if total_stays > 0 else 0.0

        return {
            "date": selected_date.isoformat(),
            "total_stays": total_stays,
            "active_stays_count": active_count,
            "completed_stays_count": completed_count,
            "total_dwell_minutes": total_dwell,
            "avg_dwell_minutes": avg_dwell,
            "stays": formatted_stays
        }

    def get_events(
        self, 
        db: Session, 
        limit: int = 100, 
        geofence_id: Optional[int] = None, 
        vehicle_id: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Liefert das chronologische Ereignisprotokoll (Audit-Log).
        """
        query = db.query(VehicleGeofenceEvent)
        if geofence_id:
            query = query.filter(VehicleGeofenceEvent.geofence_id == geofence_id)
        if vehicle_id:
            query = query.filter(VehicleGeofenceEvent.vehicle_id == str(vehicle_id))

        events: List[VehicleGeofenceEvent] = query.order_by(VehicleGeofenceEvent.timestamp.desc()).limit(limit).all()

        return [
            {
                "id": e.id,
                "vehicle_id": e.vehicle_id,
                "plate": e.plate,
                "geofence_id": e.geofence_id,
                "geofence_name": e.geofence.name if e.geofence else None,
                "event_type": e.event_type,
                "timestamp": e.timestamp,
                "speed": e.speed,
                "distance_meters": e.distance_meters
            }
            for e in events
        ]

# Global Singleton Instance
geofence_service = GeofenceMonitorService()
