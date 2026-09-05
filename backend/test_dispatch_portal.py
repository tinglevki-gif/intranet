"""
Automated Test Suite: Disponenten-Portal & Umkreissuche (Tinglev Intranet)
Tests:
1. Status Classification (LOADING_FACTORY, OUTBOUND_TRANSIT, UNLOADING_SITE, INBOUND_RETURN, STANDBY_IDLE)
2. Telemetry Enrichment & Dispatch Summary
3. Location Resolution (PLZ, City, Geofence, Coordinates)
4. Nearest Vehicle Search with Road Distance & Driving Time (ETA)
"""

import sys
import os
from datetime import datetime, timezone, timedelta

# Ensure backend root is in sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.core.database import SessionLocal
from app.models.role import Role
from app.models.user import User
from app.models.geofence import Geofence, VehicleGeofenceEvent, VehicleStay
from app.models.tracking_share import DeliveryTrackingShare
from app.models.maintenance import MaintenanceInterval, MaintenanceLog, VehicleMeta
from app.models.reconciliation import TripReconciliation
from app.services.dispatch_service import dispatch_service, DispatchClassificationService
from app.schemas.dispatch import NearestVehicleRequest, DispatchStatusType

def test_dispatch_classification():
    print("\n" + "=" * 70)
    print("TEST 1: Disponenten-Status-Klassifizierung")
    print("=" * 70)
    db = SessionLocal()
    try:
        # Get or create factory geofence (Werk Altlandsberg)
        factory = db.query(Geofence).filter(Geofence.type == 'FACTORY', Geofence.is_active == True).first()
        if not factory:
            factory = Geofence(
                name="Werk Altlandsberg (Zentrale)",
                type="FACTORY",
                latitude=52.5272,
                longitude=13.8052,
                radius_meters=600,
                is_active=True
            )
            db.add(factory)
            db.commit()
            db.refresh(factory)
        
        # Get or create site geofence (Baustelle Berlin Alexanderplatz)
        site = db.query(Geofence).filter(Geofence.type == 'CONSTRUCTION_SITE', Geofence.is_active == True).first()
        if not site:
            site = Geofence(
                name="Baustelle Berlin Alexanderplatz",
                type="CONSTRUCTION_SITE",
                latitude=52.5219,
                longitude=13.4132,
                radius_meters=500,
                is_active=True
            )
            db.add(site)
            db.commit()
            db.refresh(site)

        # 1. Test LOADING_FACTORY: At factory, speed == 0
        veh_loading = {
            "id": 901,
            "plate": "MOL-TE 101",
            "lat": factory.latitude,
            "lon": factory.longitude,
            "speed": 0,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        res_loading = dispatch_service.classify_vehicle(db, veh_loading)
        assert res_loading.status == DispatchStatusType.LOADING_FACTORY, f"Expected LOADING_FACTORY, got {res_loading.status}"
        assert res_loading.is_available_for_dispatch == True
        print(f"  [OK] LOADING_FACTORY: {res_loading.label} (avail={res_loading.is_available_for_dispatch})")

        # 2. Test UNLOADING_SITE: At site, speed == 0
        veh_unloading = {
            "id": 902,
            "plate": "MOL-TE 102",
            "lat": site.latitude,
            "lon": site.longitude,
            "speed": 0,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        res_unloading = dispatch_service.classify_vehicle(db, veh_unloading)
        assert res_unloading.status == DispatchStatusType.UNLOADING_SITE, f"Expected UNLOADING_SITE, got {res_unloading.status}"
        assert res_unloading.site_name == site.name
        assert res_unloading.is_available_for_dispatch == False
        print(f"  [OK] UNLOADING_SITE: {res_unloading.label} at '{res_unloading.site_name}' (avail={res_unloading.is_available_for_dispatch})")

        # 3. Test STANDBY_IDLE: Far away, speed == 0
        veh_idle = {
            "id": 903,
            "plate": "MOL-TE 103",
            "lat": 52.3500,
            "lon": 13.9000,
            "speed": 0,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        res_idle = dispatch_service.classify_vehicle(db, veh_idle)
        assert res_idle.status == DispatchStatusType.STANDBY_IDLE, f"Expected STANDBY_IDLE, got {res_idle.status}"
        assert res_idle.is_available_for_dispatch == True
        print(f"  [OK] STANDBY_IDLE: {res_idle.label} (avail={res_idle.is_available_for_dispatch})")

        # 4. Test OUTBOUND_TRANSIT / INBOUND_RETURN: In motion (speed > 0)
        # Create an exit event from factory for vehicle 904
        ev_exit_factory = VehicleGeofenceEvent(
            vehicle_id=904,
            plate="MOL-TE 104",
            geofence_id=factory.id,
            event_type="EXIT",
            timestamp=datetime.now(timezone.utc) - timedelta(minutes=45),
            latitude=factory.latitude,
            longitude=factory.longitude,
            speed=35
        )
        db.add(ev_exit_factory)
        db.commit()

        veh_outbound = {
            "id": 904,
            "plate": "MOL-TE 104",
            "lat": 52.5100,
            "lon": 13.5000,
            "speed": 62,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        res_outbound = dispatch_service.classify_vehicle(db, veh_outbound)
        assert res_outbound.status == DispatchStatusType.OUTBOUND_TRANSIT, f"Expected OUTBOUND_TRANSIT, got {res_outbound.status}"
        print(f"  [OK] OUTBOUND_TRANSIT: {res_outbound.label} (heading to customer)")

        # Create an exit event from site for vehicle 905 (now returning empty)
        ev_exit_site = VehicleGeofenceEvent(
            vehicle_id=905,
            plate="MOL-TE 105",
            geofence_id=site.id,
            event_type="EXIT",
            timestamp=datetime.now(timezone.utc) - timedelta(minutes=20),
            latitude=site.latitude,
            longitude=site.longitude,
            speed=40
        )
        db.add(ev_exit_site)
        db.commit()

        veh_inbound = {
            "id": 905,
            "plate": "MOL-TE 105",
            "lat": 52.5200,
            "lon": 13.6000,
            "speed": 68,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        res_inbound = dispatch_service.classify_vehicle(db, veh_inbound)
        assert res_inbound.status == DispatchStatusType.INBOUND_RETURN, f"Expected INBOUND_RETURN, got {res_inbound.status}"
        assert res_inbound.is_available_for_dispatch == True
        print(f"  [OK] INBOUND_RETURN: {res_inbound.label} (avail={res_inbound.is_available_for_dispatch})")

    finally:
        db.close()

def test_telemetry_enrichment_and_summary():
    print("\n" + "=" * 70)
    print("TEST 2: Telemetrie-Anreicherung & Dispatch-Summary")
    print("=" * 70)
    db = SessionLocal()
    try:
        sample_telemetry = {
            "is_live": True,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "total_vehicles": 3,
            "vehicles": [
                {"id": 801, "plate": "MOL-TE 801", "lat": 52.5272, "lon": 13.8052, "speed": 0, "brand": "MAN TGX 26.510"},
                {"id": 802, "plate": "MOL-TE 802", "lat": 52.3500, "lon": 13.9000, "speed": 0, "brand": "Mercedes Actros 1845"},
                {"id": 803, "plate": "MOL-TE 803", "lat": 52.5200, "lon": 13.6000, "speed": 60, "brand": "Volvo FH 500"}
            ]
        }
        enriched = dispatch_service.enrich_fleet_telemetry(db, sample_telemetry)
        assert "dispatch_summary" in enriched, "dispatch_summary missing in enriched payload"
        summary = enriched["dispatch_summary"]
        print(f"  [OK] Dispatch-Summary berechnet:")
        print(f"       Total: {summary['total']}")
        print(f"       Im Werk beladen: {summary['loading_factory']}")
        print(f"       Auf Anfahrt: {summary['outbound_transit']}")
        print(f"       Beim Entladen: {summary['unloading_site']}")
        print(f"       Auf Rückweg (Leer): {summary['inbound_return']}")
        print(f"       Standby / Pause: {summary['standby_idle']}")
        print(f"       Verfügbar für Neudisposition: {summary['available_count']}")
        assert summary["total"] == 3
        assert summary["available_count"] >= 1
    finally:
        db.close()

def test_nearest_vehicle_search():
    print("\n" + "=" * 70)
    print("TEST 3: Umkreissuche / Nächstgelegenes Fahrzeug (PLZ & Koordinaten)")
    print("=" * 70)
    db = SessionLocal()
    try:
        # Search by PLZ Berlin Mitte (10115)
        req_plz = NearestVehicleRequest(
            query="10115 Berlin",
            radius_km=150.0,
            limit=5,
            only_available=False
        )
        res_plz = dispatch_service.find_nearest_vehicles(db, req_plz)
        assert res_plz.query_location is not None, "Query location could not be resolved"
        print(f"  [OK] PLZ '10115 Berlin' aufgelöst: {res_plz.query_location.formatted_address} ({res_plz.query_location.latitude}, {res_plz.query_location.longitude})")
        print(f"       Gefundene Fahrzeuge im 150km-Radius: {res_plz.total_found}")
        
        for i, veh in enumerate(res_plz.vehicles[:3], 1):
            print(f"       #{i}: {veh.plate} ({veh.brand}) | Status: {veh.dispatch_status_label} | Distanz: {veh.road_distance_km} km Straßenstrecke | ETA: {veh.estimated_drive_minutes} Min.")
            assert veh.road_distance_km >= veh.distance_km, "Road distance should be >= straight line distance"
            assert veh.estimated_drive_minutes > 0, "ETA minutes should be > 0"

        # Search by Geofence
        factory = db.query(Geofence).filter(Geofence.type == 'FACTORY', Geofence.is_active == True).first()
        if factory:
            req_geo = NearestVehicleRequest(
                geofence_id=factory.id,
                radius_km=100.0,
                limit=3,
                only_available=True
            )
            res_geo = dispatch_service.find_nearest_vehicles(db, req_geo)
            print(f"  [OK] Geofence Suche '{factory.name}': {res_geo.total_found} verfügbare Lkw gefunden.")
    finally:
        db.close()

if __name__ == "__main__":
    print("\n" + "#" * 70)
    print("STARTE TESTSUITE: DISPONENTEN-PORTAL & UMKREISSUCHE (TINGLEV INTRANET)")
    print("#" * 70)
    try:
        test_dispatch_classification()
        test_telemetry_enrichment_and_summary()
        test_nearest_vehicle_search()
        print("\n" + "=" * 70)
        print(">>> ALLE DISPONENTEN-PORTAL TESTS ERFOLGREICH BESTANDEN! <<<")
        print("=" * 70 + "\n")
    except Exception as e:
        print(f"\n[FEHLER] Test fehlgeschlagen: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
