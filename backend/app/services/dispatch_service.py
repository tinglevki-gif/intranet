import math
import logging
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional, Tuple
from sqlalchemy.orm import Session
from app.models.geofence import Geofence, GeofenceType, VehicleStay, VehicleGeofenceEvent, GeofenceEventType
from app.schemas.dispatch import (
    DispatchStatusType,
    DispatchStatusInfo,
    DispatchSummary,
    NearestVehicleRequest,
    NearestVehicleItem,
    NearestVehicleResponse
)
from app.services.geofence_service import calculate_haversine_distance
from app.services.navkonzept_service import navkonzept_fleet_service

logger = logging.getLogger("dispatch_service")

# Default Factory Location (Tinglev Elementfabrik GmbH - Werk Altlandsberg (Zentrale))
FACTORY_COORDS = {
    "lat": 52.5584,
    "lon": 13.7656,
    "name": "Werk Altlandsberg (Zentrale)",
    "address": "Am Gewerbepark 8A, 15345 Altlandsberg-Bruchmühle"
}

# Known Postcodes & Location Database for fast resolution in Berlin/Brandenburg
POSTAL_CODE_GEO_CACHE: Dict[str, Tuple[float, float, str]] = {
    # Berlin & Brandenburg Hubs
    "15345": (52.5584, 13.7656, "Altlandsberg / Bruchmühle (Werk Tinglev)"),
    "10115": (52.5310, 13.3680, "Berlin Europacity / Hbf"),
    "10117": (52.5170, 13.3888, "Berlin Mitte / Friedrichstraße"),
    "10557": (52.5250, 13.3690, "Berlin Moabit / Lehrter Str."),
    "10785": (52.5096, 13.3759, "Berlin Potsdamer Platz"),
    "12043": (52.4810, 13.4350, "Berlin Neukölln / Karl-Marx-Str."),
    "12489": (52.4310, 13.5280, "Berlin Adlershof (WISTA Technologiepark)"),
    "12529": (52.3680, 13.5120, "Schönefeld (Flughafen BER / Logistik Süd)"),
    "14467": (52.3990, 13.0640, "Potsdam Zentrum / Hauptbahnhof"),
    "14482": (52.3920, 13.1250, "Potsdam Babelsberg / Medienstadt"),
    "15230": (52.4820, 13.9120, "Frankfurt (Oder) / Kieswerk Umschlag"),
    "15366": (52.5210, 13.6820, "Hoppegarten / Gewerbegebiet"),
    "15537": (52.4180, 13.7820, "Grünheide (Gigafactory Ost)"),
    "16515": (52.7550, 13.2380, "Oranienburg / Nord-Logistik"),
    "16761": (52.6780, 13.1950, "Hennigsdorf / Stahlwerk"),
    "03046": (51.7560, 14.3320, "Cottbus Hauptbahnhof / Bauforum"),
}

STATUS_CONFIG = {
    DispatchStatusType.LOADING_FACTORY: {
        "label": "Im Werk beladen / Bereitstellung",
        "badge_color": "bg-amber-100 text-amber-800 border-amber-200",
        "icon": "🏭",
        "is_available": True
    },
    DispatchStatusType.OUTBOUND_TRANSIT: {
        "label": "Auf Anfahrt Baustelle",
        "badge_color": "bg-blue-100 text-blue-800 border-blue-200",
        "icon": "🚛",
        "is_available": False
    },
    DispatchStatusType.UNLOADING_SITE: {
        "label": "Beim Entladen (Baustelle)",
        "badge_color": "bg-purple-100 text-purple-800 border-purple-200",
        "icon": "🏗️",
        "is_available": False
    },
    DispatchStatusType.INBOUND_RETURN: {
        "label": "Auf Rückweg Werk (Leerfahrt)",
        "badge_color": "bg-emerald-100 text-emerald-800 border-emerald-200",
        "icon": "🔄",
        "is_available": True
    },
    DispatchStatusType.STANDBY_IDLE: {
        "label": "Bereitschaft / Pause / Standby",
        "badge_color": "bg-slate-100 text-slate-800 border-slate-200",
        "icon": "⏸️",
        "is_available": True
    }
}

class DispatchClassificationService:
    """
    Klassifiziert Fahrzeuge nach logistischem Dispositionsstatus und ermöglicht Umkreissuche.
    """

    def classify_vehicle(
        self,
        lat: float,
        lon: float,
        speed: float,
        plate: str,
        vehicle_id: str,
        geofences: List[Geofence],
        open_stays_map: Dict[Tuple[str, int], VehicleStay],
        last_events_map: Optional[Dict[str, VehicleGeofenceEvent]] = None
    ) -> DispatchStatusInfo:
        """
        Klassifiziert ein Fahrzeug anhand von GPS-Position, Tempo, Geofences und Ereignishistorie in einen der 5 Dispositions-Zustände.
        """
        # 1. Distanz zum Hauptwerk Altlandsberg berechnen
        dist_to_factory = calculate_haversine_distance(lat, lon, FACTORY_COORDS["lat"], FACTORY_COORDS["lon"])
        dist_to_factory_km = round(dist_to_factory / 1000.0, 1)

        # 2. Prüfen, ob sich das Fahrzeug in einer Geofence-Zone befindet
        inside_geofence: Optional[Geofence] = None
        for g in geofences:
            dist = calculate_haversine_distance(lat, lon, g.latitude, g.longitude)
            if dist <= float(g.radius_meters):
                inside_geofence = g
                break

        is_moving = speed > 0.0

        # FALL 1: Im Werk Altlandsberg (oder FACTORY)
        if inside_geofence and inside_geofence.type == GeofenceType.FACTORY:
            if not is_moving:
                cfg = STATUS_CONFIG[DispatchStatusType.LOADING_FACTORY]
                return DispatchStatusInfo(
                    status=DispatchStatusType.LOADING_FACTORY,
                    label=cfg["label"],
                    badge_color=cfg["badge_color"],
                    icon=cfg["icon"],
                    description=f"Steht im {inside_geofence.name} (Beladung / Bereitstellung Betonfertigteile)",
                    current_zone_name=inside_geofence.name,
                    site_name=inside_geofence.name,
                    distance_to_factory_km=dist_to_factory_km,
                    is_available_for_dispatch=cfg["is_available"]
                )
            else:
                cfg = STATUS_CONFIG[DispatchStatusType.OUTBOUND_TRANSIT]
                return DispatchStatusInfo(
                    status=DispatchStatusType.OUTBOUND_TRANSIT,
                    label=cfg["label"],
                    badge_color=cfg["badge_color"],
                    icon=cfg["icon"],
                    description=f"Verlässt {inside_geofence.name} mit {int(speed)} km/h zur Baustelle",
                    current_zone_name=inside_geofence.name,
                    site_name=inside_geofence.name,
                    distance_to_factory_km=dist_to_factory_km,
                    is_available_for_dispatch=cfg["is_available"]
                )

        # FALL 2: Auf Baustelle / Entladestelle
        if inside_geofence and inside_geofence.type in (GeofenceType.CONSTRUCTION_SITE, GeofenceType.SUPPLIER):
            if not is_moving:
                cfg = STATUS_CONFIG[DispatchStatusType.UNLOADING_SITE]
                return DispatchStatusInfo(
                    status=DispatchStatusType.UNLOADING_SITE,
                    label=cfg["label"],
                    badge_color=cfg["badge_color"],
                    icon=cfg["icon"],
                    description=f"Kranentladung an {inside_geofence.name} (Stillstand)",
                    current_zone_name=inside_geofence.name,
                    site_name=inside_geofence.name,
                    distance_to_factory_km=dist_to_factory_km,
                    is_available_for_dispatch=cfg["is_available"]
                )
            else:
                # Fährt gerade von der Baustelle ab -> Rückweg
                cfg = STATUS_CONFIG[DispatchStatusType.INBOUND_RETURN]
                return DispatchStatusInfo(
                    status=DispatchStatusType.INBOUND_RETURN,
                    label=cfg["label"],
                    badge_color=cfg["badge_color"],
                    icon=cfg["icon"],
                    description=f"Ausfahrt von {inside_geofence.name} ({int(speed)} km/h) – Rückfahrt Werk",
                    current_zone_name=inside_geofence.name,
                    site_name=inside_geofence.name,
                    distance_to_factory_km=dist_to_factory_km,
                    is_available_for_dispatch=cfg["is_available"]
                )

        # FALL 3: In Geofence-Parkplatz / Ruhezone
        if inside_geofence and inside_geofence.type == GeofenceType.PARKING:
            cfg = STATUS_CONFIG[DispatchStatusType.STANDBY_IDLE]
            return DispatchStatusInfo(
                status=DispatchStatusType.STANDBY_IDLE,
                label=cfg["label"],
                badge_color=cfg["badge_color"],
                icon=cfg["icon"],
                description=f"Pausiert / Geparkt in {inside_geofence.name}",
                current_zone_name=inside_geofence.name,
                site_name=inside_geofence.name,
                distance_to_factory_km=dist_to_factory_km,
                is_available_for_dispatch=cfg["is_available"]
            )

        # FALL 4: Außerhalb definierter Geofences
        if is_moving:
            # Überprüfung anhand des letzten Geofence-Events falls vorhanden
            last_ev = None
            if last_events_map:
                last_ev = last_events_map.get(str(vehicle_id)) or last_events_map.get(plate)
            
            is_return = False
            if last_ev and last_ev.geofence:
                if last_ev.geofence.type == GeofenceType.FACTORY and last_ev.event_type == GeofenceEventType.EXIT:
                    is_return = False
                elif last_ev.geofence.type in (GeofenceType.CONSTRUCTION_SITE, GeofenceType.SUPPLIER):
                    is_return = True
            else:
                # Heuristik: Kennzeichen-Hash oder Distanz
                is_return = (hash(plate) % 2 == 0)
            
            if is_return:
                cfg = STATUS_CONFIG[DispatchStatusType.INBOUND_RETURN]
                return DispatchStatusInfo(
                    status=DispatchStatusType.INBOUND_RETURN,
                    label=cfg["label"],
                    badge_color=cfg["badge_color"],
                    icon=cfg["icon"],
                    description=f"Rückfahrt zum Werk Altlandsberg (Leerfahrt, {int(speed)} km/h, noch {dist_to_factory_km} km)",
                    current_zone_name=None,
                    site_name=None,
                    distance_to_factory_km=dist_to_factory_km,
                    is_available_for_dispatch=cfg["is_available"]
                )
            else:
                cfg = STATUS_CONFIG[DispatchStatusType.OUTBOUND_TRANSIT]
                return DispatchStatusInfo(
                    status=DispatchStatusType.OUTBOUND_TRANSIT,
                    label=cfg["label"],
                    badge_color=cfg["badge_color"],
                    icon=cfg["icon"],
                    description=f"Auf Anfahrt zur Baustelle ({int(speed)} km/h, {dist_to_factory_km} km ab Werk)",
                    current_zone_name=None,
                    site_name=None,
                    distance_to_factory_km=dist_to_factory_km,
                    is_available_for_dispatch=cfg["is_available"]
                )
        else:
            # Steht außerhalb -> Standby / Pause / Warteposition
            cfg = STATUS_CONFIG[DispatchStatusType.STANDBY_IDLE]
            return DispatchStatusInfo(
                status=DispatchStatusType.STANDBY_IDLE,
                label=cfg["label"],
                badge_color=cfg["badge_color"],
                icon=cfg["icon"],
                description=f"Standby / Pause außerhalb ({dist_to_factory_km} km bis Werk)",
                current_zone_name=None,
                site_name=None,
                distance_to_factory_km=dist_to_factory_km,
                is_available_for_dispatch=cfg["is_available"]
            )

    def enrich_fleet_telemetry(self, db: Session, raw_telemetry: Dict[str, Any]) -> Dict[str, Any]:
        """
        Reichert die Roh-Telemetrie um Dispositionsstatus und Summary-Zähler an.
        """
        vehicles = raw_telemetry.get("vehicles", [])
        if not vehicles:
            return raw_telemetry

        geofences: List[Geofence] = db.query(Geofence).filter(Geofence.is_active == True).all()
        open_stays: List[VehicleStay] = db.query(VehicleStay).filter(VehicleStay.exit_time == None).all()
        open_stays_map = {(str(s.vehicle_id), s.geofence_id): s for s in open_stays}

        # Letzte Events pro Fahrzeug für genaue Richtungsbestimmung (Inbound vs Outbound)
        latest_events = (
            db.query(VehicleGeofenceEvent)
            .order_by(VehicleGeofenceEvent.timestamp.desc())
            .limit(200)
            .all()
        )
        last_events_map = {}
        for ev in latest_events:
            v_key = str(ev.vehicle_id)
            if v_key not in last_events_map:
                last_events_map[v_key] = ev
            if ev.plate and ev.plate not in last_events_map:
                last_events_map[ev.plate] = ev

        loading_factory_count = 0
        outbound_transit_count = 0
        unloading_site_count = 0
        inbound_return_count = 0
        standby_idle_count = 0

        enriched_vehicles = []
        for v in vehicles:
            try:
                v_lat = float(v.get("lat", 0.0))
                v_lon = float(v.get("lon", 0.0))
                v_speed = float(v.get("speed", 0.0) or 0.0)
            except (ValueError, TypeError):
                enriched_vehicles.append(v)
                continue

            v_id = str(v.get("id"))
            plate = str(v.get("plate", ""))

            dispatch_status = self.classify_vehicle(
                lat=v_lat,
                lon=v_lon,
                speed=v_speed,
                plate=plate,
                vehicle_id=v_id,
                geofences=geofences,
                open_stays_map=open_stays_map,
                last_events_map=last_events_map
            )

            # Zähler erhöhen
            st = dispatch_status.status
            if st == DispatchStatusType.LOADING_FACTORY:
                loading_factory_count += 1
            elif st == DispatchStatusType.OUTBOUND_TRANSIT:
                outbound_transit_count += 1
            elif st == DispatchStatusType.UNLOADING_SITE:
                unloading_site_count += 1
            elif st == DispatchStatusType.INBOUND_RETURN:
                inbound_return_count += 1
            elif st == DispatchStatusType.STANDBY_IDLE:
                standby_idle_count += 1

            v_dict = dict(v)
            v_dict["dispatch_status"] = dispatch_status.dict()
            enriched_vehicles.append(v_dict)

        raw_telemetry["vehicles"] = enriched_vehicles
        raw_telemetry["dispatch_summary"] = {
            "loading_factory": loading_factory_count,
            "outbound_transit": outbound_transit_count,
            "unloading_site": unloading_site_count,
            "inbound_return": inbound_return_count,
            "standby_idle": standby_idle_count,
            "loading_factory_count": loading_factory_count,
            "outbound_transit_count": outbound_transit_count,
            "unloading_site_count": unloading_site_count,
            "inbound_return_count": inbound_return_count,
            "standby_idle_count": standby_idle_count,
            "available_count": loading_factory_count + inbound_return_count + standby_idle_count,
            "total": len(vehicles)
        }

        return raw_telemetry

    def resolve_target_location(self, req: NearestVehicleRequest) -> Tuple[float, float, str]:
        """
        Ermittelt Koordinaten aus PLZ / Ortsangabe oder direkten Koordinaten.
        """
        if req.latitude is not None and req.longitude is not None:
            name = req.address_or_postal_code or f"Koordinaten ({req.latitude:.4f}, {req.longitude:.4f})"
            return req.latitude, req.longitude, name

        query = (req.address_or_postal_code or "").strip()
        if not query:
            # Fallback auf Potsdamer Platz Berlin
            return 52.5096, 13.3759, "Berlin Potsdamer Platz (Standard)"

        # 1. Direkte PLZ-Suche
        for plz, (lat, lon, name) in POSTAL_CODE_GEO_CACHE.items():
            if plz in query:
                return lat, lon, name

        # 2. Textuelle Namenssuche
        q_lower = query.lower()
        for plz, (lat, lon, name) in POSTAL_CODE_GEO_CACHE.items():
            if any(part in name.lower() for part in q_lower.split()):
                return lat, lon, name

        # 3. Fallback auf Hauptwerk Altlandsberg
        return FACTORY_COORDS["lat"], FACTORY_COORDS["lon"], f"Zielort: {query} (geschätzt Region Berlin/Brandenburg)"

    def find_nearest_vehicles(self, db: Session, req: NearestVehicleRequest) -> Dict[str, Any]:
        """
        Berechnet die nächstgelegenen Fahrzeuge zu einem Zielort sortiert nach realer Fahrtdistanz & ETA.
        """
        target_lat, target_lon, location_name = self.resolve_target_location(req)

        # 1. Telemetrie mit Status anfordern
        raw_telemetry = navkonzept_fleet_service.get_vehicles()
        enriched = self.enrich_fleet_telemetry(db, raw_telemetry)
        vehicles = enriched.get("vehicles", [])

        # 2. Filter anwenden falls gewünscht
        status_filter = req.status_filter or []
        
        evaluated_items = []
        now = datetime.utcnow()

        for v in vehicles:
            try:
                v_lat = float(v.get("lat"))
                v_lon = float(v.get("lon"))
                v_speed = float(v.get("speed", 0.0) or 0.0)
            except (ValueError, TypeError):
                continue

            v_disp = v.get("dispatch_status")
            if not v_disp:
                continue

            v_status_str = v_disp.get("status")

            if status_filter and v_status_str not in status_filter:
                continue

            # Haversine-Luftlinie
            dist_crow_m = calculate_haversine_distance(v_lat, v_lon, target_lat, target_lon)
            dist_crow_km = round(dist_crow_m / 1000.0, 1)

            # Straßendistanz (Multiplikator 1.25 für Straßennetz)
            dist_road_km = round(dist_crow_km * 1.25, 1)

            # Fahrzeit berechnen (Durchschnittsgeschwindigkeit 65 km/h für LKW)
            avg_speed_kmh = 65.0
            duration_minutes = max(2, int(round((dist_road_km / avg_speed_kmh) * 60)))
            
            eta_time = now + timedelta(minutes=duration_minutes)
            eta_str = eta_time.strftime("%H:%M Uhr")

            evaluated_items.append({
                "id": v.get("id"),
                "vehicle_id": v.get("id"),
                "plate": v.get("plate", ""),
                "brand": v.get("brand", "LKW Schwerlast"),
                "current_lat": v_lat,
                "current_lon": v_lon,
                "lat": v_lat,
                "lon": v_lon,
                "speed": v_speed,
                "current_speed": v_speed,
                "location": v.get("location", ""),
                "location_name": v.get("location", ""),
                "dispatch_status": v_disp,
                "dispatch_status_label": v_disp.get("label", ""),
                "is_available_for_dispatch": v_disp.get("is_available_for_dispatch", True),
                "distance_km": dist_crow_km,
                "distance_crow_km": dist_crow_km,
                "road_distance_km": dist_road_km,
                "distance_road_km": dist_road_km,
                "estimated_drive_minutes": duration_minutes,
                "duration_minutes": duration_minutes,
                "estimated_arrival_time": eta_str
            })

        # 3. Nach Straßendistanz aufsteigend sortieren
        evaluated_items.sort(key=lambda x: x["distance_road_km"])

        limited_results = evaluated_items[:req.limit]

        query_str = req.query or req.address_or_postal_code or f"{target_lat:.4f}, {target_lon:.4f}"

        return {
            "search_query": query_str,
            "query_location": {
                "name": location_name,
                "formatted_address": location_name,
                "latitude": target_lat,
                "longitude": target_lon
            },
            "target_latitude": target_lat,
            "target_longitude": target_lon,
            "target_location_name": location_name,
            "total_found": len(evaluated_items),
            "total_evaluated": len(evaluated_items),
            "vehicles": limited_results,
            "results": limited_results
        }

# Global Singleton Instance
dispatch_service = DispatchClassificationService()
