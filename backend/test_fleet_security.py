import os
import sys
from datetime import datetime, timezone, timedelta
from zoneinfo import ZoneInfo

# Add backend directory to sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.core.database import SessionLocal, Base, engine
# Import all models to ensure mapper relationships are properly initialized
from app.models.role import Role
from app.models.user import User
from app.models.geofence import Geofence, GeofenceType, VehicleGeofenceEvent, VehicleStay
from app.models.delivery_tracking import DeliveryTrackingShare
from app.models.maintenance import VehicleMeta, MaintenanceInterval, MaintenanceLog
from app.models.reconciliation import TripReconciliation
from app.models.security import FleetSecurityEvent, FleetSecuritySetting, FleetSecurityEventType
from app.services.security_service import security_service, calculate_haversine_distance, BERLIN_TZ
from app.schemas.security import FleetSecuritySettingUpdate

def run_tests():
    print("================================================================================")
    print("🚦 TINGLEV INTRANET - FLEET SECURITY & YARD SPEED AUDIT SYSTEM TEST SUITE")
    print("================================================================================")

    # Ensure tables exist
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # 1. Test Settings Initialization
        print("\n[TEST 1] Initializing Security Settings...")
        settings_obj = security_service.get_or_create_settings(db)
        assert settings_obj is not None, "Settings object should exist"
        assert settings_obj.max_yard_speed == 20.0, f"Expected default max yard speed 20.0, got {settings_obj.max_yard_speed}"
        assert settings_obj.quiet_hours_start == "20:00", "Expected quiet hours start 20:00"
        assert settings_obj.quiet_hours_end == "05:00", "Expected quiet hours end 05:00"
        assert settings_obj.weekend_quiet_all_day == True, "Expected weekend quiet all day True"
        print(f"✅ Default Settings OK: Max Yard Speed = {settings_obj.max_yard_speed} km/h, Quiet Hours = {settings_obj.quiet_hours_start}-{settings_obj.quiet_hours_end}")

        # 2. Test Quiet Hours Time Logic
        print("\n[TEST 2] Testing Quiet Hours Calculation Logic...")
        # Friday 22:30 Berlin time (Quiet hours active)
        dt_friday_night = datetime(2026, 9, 4, 22, 30, tzinfo=BERLIN_TZ)
        is_q1, r1 = security_service.is_in_quiet_hours(dt_friday_night, settings_obj)
        assert is_q1 == True, f"Expected True for Friday 22:30, got {is_q1} ({r1})"
        print(f"✅ Friday 22:30 Berlin: is_quiet={is_q1} ({r1})")

        # Saturday 14:00 Berlin time (Weekend quiet all day)
        dt_saturday_day = datetime(2026, 9, 5, 14, 0, tzinfo=BERLIN_TZ)
        is_q2, r2 = security_service.is_in_quiet_hours(dt_saturday_day, settings_obj)
        assert is_q2 == True, f"Expected True for Saturday 14:00, got {is_q2} ({r2})"
        print(f"✅ Saturday 14:00 Berlin: is_quiet={is_q2} ({r2})")

        # Tuesday 14:00 Berlin time (Regular working hours)
        dt_tuesday_day = datetime(2026, 9, 1, 14, 0, tzinfo=BERLIN_TZ)
        is_q3, r3 = security_service.is_in_quiet_hours(dt_tuesday_day, settings_obj)
        assert is_q3 == False, f"Expected False for Tuesday 14:00, got {is_q3} ({r3})"
        print(f"✅ Tuesday 14:00 Berlin: is_quiet={is_q3} ({r3})")

        # Wednesday 03:30 Berlin time (Early morning quiet hours)
        dt_wed_early = datetime(2026, 9, 2, 3, 30, tzinfo=BERLIN_TZ)
        is_q4, r4 = security_service.is_in_quiet_hours(dt_wed_early, settings_obj)
        assert is_q4 == True, f"Expected True for Wednesday 03:30, got {is_q4} ({r4})"
        print(f"✅ Wednesday 03:30 Berlin: is_quiet={is_q4} ({r4})")

        # 3. Test Factory Speed Violation Detection
        print("\n[TEST 3] Testing Factory Speed Violation Detection (> 20 km/h in Factory Geofence)...")
        # Ensure Werk Altlandsberg geofence exists
        factory_geo = db.query(Geofence).filter(Geofence.type == GeofenceType.FACTORY).first()
        if not factory_geo:
            factory_geo = Geofence(
                name="Werk Altlandsberg (Zentrale)",
                type=GeofenceType.FACTORY,
                latitude=52.5584,
                longitude=13.7656,
                radius_meters=600,
                is_active=True
            )
            db.add(factory_geo)
            db.commit()
            db.refresh(factory_geo)

        # Vehicle speeding at 29.5 km/h inside factory geofence
        speeding_telemetry = [
            {
                "id": "999",
                "plate": "MOL-TE 999",
                "brand": "MAN TGX 26.510",
                "lat": 52.5273,
                "lon": 13.8053,
                "location": "Werk Altlandsberg (Hofbereich Zufahrt Tor 2)",
                "speed": 29.5, # > 20 km/h limit!
                "mileage": 150000,
                "timestamp": datetime.utcnow()
            }
        ]

        # Reset any previous test events for 999
        db.query(FleetSecurityEvent).filter(FleetSecurityEvent.vehicle_id == "999").delete()
        db.commit()

        events_speed = security_service.evaluate_security_rules(db, speeding_telemetry)
        assert len(events_speed) >= 1, "Expected at least 1 speed violation event"
        speed_evt = events_speed[0]
        assert speed_evt.event_type == FleetSecurityEventType.FACTORY_SPEED_VIOLATION
        assert speed_evt.vehicle_id == "999"
        assert speed_evt.plate == "MOL-TE 999"
        assert speed_evt.speed == 29.5
        assert speed_evt.speed_limit == 20.0
        assert speed_evt.is_acknowledged == False
        print(f"✅ Factory Speed Violation Detected: Event #{speed_evt.id} | {speed_evt.plate} with {speed_evt.speed} km/h (Limit: {speed_evt.speed_limit} km/h)")

        # Test Cooldown (Spam Protection): Immediate re-evaluation should not create duplicate event
        print("\n[TEST 4] Testing Cooldown Anti-Spam Debouncing...")
        events_speed_dup = security_service.evaluate_security_rules(db, speeding_telemetry)
        assert len(events_speed_dup) == 0, f"Expected 0 new events due to 15m cooldown, got {len(events_speed_dup)}"
        print("✅ Cooldown protection successfully prevented duplicate event.")

        # 5. Test Off-Hours Movement Alert
        print("\n[TEST 5] Testing Off-Hours Unauthorized Movement Detection...")
        # Vehicle moving at night / weekend with speed 18.0 km/h
        off_hours_telemetry = [
            {
                "id": "998",
                "plate": "MOL-TE 998",
                "brand": "Volvo FH16 750",
                "lat": 52.5310,
                "lon": 13.3680,
                "location": "Areal Berlin Europacity",
                "speed": 18.0, # Moving during quiet hours!
                "mileage": 120000,
                "timestamp": datetime(2026, 9, 5, 23, 15, tzinfo=timezone.utc) # Saturday night
            }
        ]

        # Clean old test events for 998
        db.query(FleetSecurityEvent).filter(FleetSecurityEvent.vehicle_id == "998").delete()
        db.commit()

        events_off_hours = security_service.evaluate_security_rules(db, off_hours_telemetry)
        assert len(events_off_hours) >= 1, "Expected at least 1 off-hours movement event"
        off_evt = events_off_hours[0]
        assert off_evt.event_type == FleetSecurityEventType.OFF_HOURS_MOVEMENT
        assert off_evt.vehicle_id == "998"
        assert off_evt.plate == "MOL-TE 998"
        assert off_evt.speed == 18.0
        print(f"✅ Off-Hours Movement Alert Detected: Event #{off_evt.id} | {off_evt.plate} at {off_evt.timestamp} ({off_evt.details.get('quiet_period_reason')})")

        # 6. Test Logs Query & Filters
        print("\n[TEST 6] Testing Security Logs Retrieval & Filters...")
        logs_all = security_service.get_security_logs(db, event_type="ALL", limit=50)
        assert logs_all.total >= 2, f"Expected total >= 2, got {logs_all.total}"
        assert logs_all.speed_violations_count >= 1, "Expected speed violations count >= 1"
        assert logs_all.off_hours_count >= 1, "Expected off-hours count >= 1"
        print(f"✅ Logs Query OK: Total={logs_all.total}, Unacknowledged={logs_all.unacknowledged_count}, Speed Violations={logs_all.speed_violations_count}, Off-Hours={logs_all.off_hours_count}")

        # Filter by plate
        logs_filtered = security_service.get_security_logs(db, plate="MOL-TE 999")
        assert logs_filtered.total >= 1
        assert logs_filtered.items[0].plate == "MOL-TE 999"
        print(f"✅ Plate Filter OK: Found {logs_filtered.total} events for MOL-TE 999")

        # 7. Test Acknowledgement (Quittierung)
        print("\n[TEST 7] Testing Event Acknowledgement...")
        ack_res = security_service.acknowledge_event(
            db=db,
            event_id=speed_evt.id,
            user_id=1,
            note="Fahrer wurde durch Werksschutz mündlich verwarnt (§ 6 DGUV Vorschrift 70)."
        )
        assert ack_res.is_acknowledged == True
        assert ack_res.acknowledgement_note is not None
        print(f"✅ Event #{speed_evt.id} Acknowledged: Note = '{ack_res.acknowledgement_note}'")

        # 8. Test Settings Update
        print("\n[TEST 8] Testing Settings Update...")
        upd = FleetSecuritySettingUpdate(
            max_yard_speed=25.0,
            webhook_url="https://webhook.site/mock-teams-alert"
        )
        updated_settings = security_service.update_settings(db, upd)
        assert updated_settings.max_yard_speed == 25.0
        assert updated_settings.webhook_url == "https://webhook.site/mock-teams-alert"
        
        # Reset back to 20.0 km/h
        security_service.update_settings(db, FleetSecuritySettingUpdate(max_yard_speed=20.0))
        print("✅ Settings update and restoration verified.")

        # 9. Test Stats
        print("\n[TEST 9] Testing Security Dashboard Stats...")
        stats = security_service.get_security_stats(db)
        assert stats.total_events >= 2
        assert stats.max_yard_speed == 20.0
        assert stats.is_active == True
        print(f"✅ Security Stats OK: Total Events = {stats.total_events}, Violations Today = {stats.violations_today}, Quiet Hours Label = '{stats.quiet_hours_label}'")

        print("\n================================================================================")
        print("🎉 ALL FLEET SECURITY BACKEND TESTS PASSED SUCCESSFULLY!")
        print("================================================================================")

    finally:
        db.close()

if __name__ == "__main__":
    run_tests()
