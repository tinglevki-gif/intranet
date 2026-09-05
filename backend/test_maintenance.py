import datetime
from app.core.database import SessionLocal
from app.models.role import Role
from app.models.user import User
from app.models.geofence import Geofence, VehicleGeofenceEvent, VehicleStay
from app.models.delivery_tracking import DeliveryTrackingShare
from app.models.maintenance import VehicleMeta, MaintenanceInterval, MaintenanceLog
from app.services.maintenance_service import maintenance_service
from app.schemas.maintenance import MaintenanceLogCreate

def test_telemetry_sync():
    db = SessionLocal()
    try:
        sample_telemetry = [
            {
                "id": "101",
                "plate": "MOL-TE 101",
                "brand": "MAN TGX 26.510",
                "mileage": 185000
            },
            {
                "id": "102",
                "plate": "MOL-TE 102",
                "brand": "Mercedes Actros 2548",
                "mileage": 143000
            }
        ]

        maintenance_service.sync_telemetry_mileage(db, sample_telemetry)

        meta101 = db.query(VehicleMeta).filter_by(vehicle_id="101").first()
        assert meta101 is not None, "Expected VehicleMeta for 101 to exist"
        assert meta101.current_mileage == 185000, f"Expected 185000, got {meta101.current_mileage}"
        print(f"✅ VehicleMeta sync passed: {meta101.plate} - {meta101.current_mileage} km")
    finally:
        db.close()

def test_interval_evaluation():
    db = SessionLocal()
    try:
        # Create a test vehicle and intervals with different statuses
        test_plate = "TEST-MOL 999"
        db.query(MaintenanceLog).filter_by(plate=test_plate).delete()
        db.query(MaintenanceInterval).filter_by(plate=test_plate).delete()
        db.query(VehicleMeta).filter_by(plate=test_plate).delete()
        db.commit()

        meta = VehicleMeta(
            vehicle_id="999",
            plate=test_plate,
            brand="Test LKW",
            current_mileage=100000,
            last_telemetry_at=datetime.datetime.utcnow()
        )
        db.add(meta)

        # 1. OVERDUE interval: last service 60000, interval 30000 -> next due 90000 (< 100000)
        int_overdue = MaintenanceInterval(
            vehicle_id="999",
            plate=test_plate,
            service_type="OIL_SERVICE",
            interval_km=30000,
            last_service_mileage=60000,
            next_due_mileage=90000,
            warning_threshold_km=1500
        )
        db.add(int_overdue)

        # 2. DUE_SOON interval: last service 71000, interval 30000 -> next due 101000 (diff 1000 <= 1500)
        int_due_soon = MaintenanceInterval(
            vehicle_id="999",
            plate=test_plate,
            service_type="TIRES",
            interval_km=30000,
            last_service_mileage=71000,
            next_due_mileage=101000,
            warning_threshold_km=1500
        )
        db.add(int_due_soon)

        # 3. OK interval: last service 80000, interval 30000 -> next due 110000 (diff 10000 > 1500)
        int_ok = MaintenanceInterval(
            vehicle_id="999",
            plate=test_plate,
            service_type="GENERAL_INSPECTION",
            interval_km=30000,
            last_service_mileage=80000,
            next_due_mileage=110000,
            warning_threshold_km=1500
        )
        db.add(int_ok)
        db.commit()

        # Run evaluation
        maintenance_service.evaluate_all_intervals(db)

        db.refresh(int_overdue)
        db.refresh(int_due_soon)
        db.refresh(int_ok)

        assert int_overdue.status == "OVERDUE", f"Expected OVERDUE, got {int_overdue.status}"
        assert int_due_soon.status == "DUE_SOON", f"Expected DUE_SOON, got {int_due_soon.status}"
        assert int_ok.status == "OK", f"Expected OK, got {int_ok.status}"

        print(f"✅ Interval Status Evaluation passed: OVERDUE={int_overdue.status}, DUE_SOON={int_due_soon.status}, OK={int_ok.status}")
    finally:
        db.close()

def test_service_logging():
    db = SessionLocal()
    try:
        test_plate = "TEST-MOL 999"
        interval = db.query(MaintenanceInterval).filter_by(plate=test_plate, service_type="OIL_SERVICE").first()
        assert interval is not None

        # Log service performed at current km 100000
        log_data = MaintenanceLogCreate(
            interval_id=interval.id,
            vehicle_id="999",
            plate=test_plate,
            service_type="OIL_SERVICE",
            service_mileage=100000,
            service_date=datetime.date.today(),
            performed_by="Humbert (Meister)",
            workshop_name="Tinglev Werkstatt Altlandsberg",
            invoice_number="RE-TEST-001",
            cost_euros=450.0,
            notes="Ölwechsel 5W-30 und Filter erneuert."
        )

        log = maintenance_service.log_service_completed(db, log_data)
        assert log.id is not None
        assert log.cost_euros == 450.0

        db.refresh(interval)
        assert interval.last_service_mileage == 100000
        assert interval.next_due_mileage == 130000  # 100000 + 30000
        assert interval.status == "OK"

        print(f"✅ Service Quittierung passed: Log #{log.id} created, next due: {interval.next_due_mileage} km, new status: {interval.status}")

        # Cleanup test records
        db.query(MaintenanceLog).filter_by(plate=test_plate).delete()
        db.query(MaintenanceInterval).filter_by(plate=test_plate).delete()
        db.query(VehicleMeta).filter_by(plate=test_plate).delete()
        db.commit()
    finally:
        db.close()

if __name__ == "__main__":
    test_telemetry_sync()
    test_interval_evaluation()
    test_service_logging()
    print("\n🎉 All Predictive Maintenance & Telemetry Mileage tests passed successfully!")
