import os
import sys
from datetime import date, datetime, timedelta

# Add backend directory to sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.core.database import SessionLocal, Base, engine
from app.models.user import User
from app.models.role import Role
from app.models.geofence import Geofence, GeofenceType, VehicleGeofenceEvent, GeofenceEventType, VehicleStay
from app.models.maintenance import VehicleMeta, MaintenanceInterval, MaintenanceLog
from app.models.delivery_tracking import DeliveryTrackingShare
from app.models.reconciliation import TripReconciliation
from app.schemas.reconciliation import TripReconciliationRequest
from app.services.reconciliation_service import reconciliation_service
from app.services.geofence_service import seed_default_geofences

def run_tests():
    print("🚀 Starte Test-Suite: Fahrtabgleich & Standgeldberechnung...")

    # Create tables
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # 1. Standard-Geofences sicherstellen
        seed_default_geofences(db)
        reconciliation_service.seed_demo_reconciliation_data(db)

        berlin_site = db.query(Geofence).filter(Geofence.name.like("%Berlin%")).first()
        assert berlin_site is not None, "Baustelle Berlin Europacity muss existieren"

        factory = db.query(Geofence).filter(Geofence.type == GeofenceType.FACTORY).first()
        assert factory is not None, "Werk Altlandsberg muss existieren"

        print(f"✅ Geofences geladen: Werk='{factory.name}', Baustelle='{berlin_site.name}'")

        # 2. Testfall A: Fahrtabgleich mit Standzeit-Überschreitung (120 Min Standzeit -> 60 Min Delay -> 95 € Standgeld)
        today = date.today()
        test_req_exceeded = TripReconciliationRequest(
            plate="MOL-TE 101",
            delivery_note_number="LS-2026-9901",
            date=str(today),
            site_geofence_id=berlin_site.id,
            free_unloading_minutes=60,
            hourly_demurrage_rate=95.0,
            notes="Schwerlastzug mit 30m Spannbetonbindern. Wartezeit auf 200t Autokran."
        )

        result_a = reconciliation_service.reconcile_trip(db, test_req_exceeded)
        
        assert result_a["report_number"].startswith("SGN-"), f"Ungültige Berichtsnummer: {result_a['report_number']}"
        assert result_a["delivery_note_number"] == "LS-2026-9901"
        assert result_a["site_name"] == berlin_site.name
        assert len(result_a["audit_trail"]) >= 3, "Audit-Trail muss mindestens Werkausfahrt, Baustelleneintreffen und Abfahrt enthalten"
        assert result_a["compliance_text"] is not None and "§ 412 HGB" in result_a["compliance_text"]
        print(f"✅ Testfall A (Fahrtabgleich Überfällig) erfolgreich: Report={result_a['report_number']}, Standzeit={result_a['stay_duration_minutes']} min, Standgeld={result_a['demurrage_total_netto']:.2f} €")

        # 3. Testfall B: Fahrtabgleich im Plan (z. B. 45 Min Standzeit -> 0 Min Delay -> 0.00 € Standgeld)
        # Erstelle einen Test-Stay mit 45 min
        stay_ok = VehicleStay(
            vehicle_id="999",
            plate="MOL-TE 105",
            geofence_id=berlin_site.id,
            enter_time=datetime(today.year, today.month, today.day, 8, 0, 0),
            exit_time=datetime(today.year, today.month, today.day, 8, 45, 0),
            duration_minutes=45
        )
        db.add(stay_ok)
        db.commit()

        test_req_ok = TripReconciliationRequest(
            plate="MOL-TE 105",
            delivery_note_number="LS-2026-9902",
            date=str(today),
            site_geofence_id=berlin_site.id,
            free_unloading_minutes=60,
            hourly_demurrage_rate=95.0,
            notes="Pünktliche Entladung im Zeitfenster."
        )

        result_b = reconciliation_service.reconcile_trip(db, test_req_ok)
        assert result_b["stay_duration_minutes"] == 45
        assert result_b["billable_delay_minutes"] == 0
        assert result_b["demurrage_total_netto"] == 0.0
        assert result_b["is_demurrage_applicable"] == False
        assert result_b["status"] == "IM_PLAN_FREI"
        print(f"✅ Testfall B (Fahrtabgleich im Zeitplan) erfolgreich: Standzeit=45 min, Status={result_b['status']}, Kosten=0.00 €")

        # 4. Testfall C: Monatsauswertung (Waiting Times Summary)
        month_str = today.strftime("%Y-%m")
        monthly_rep = reconciliation_service.get_monthly_waiting_times(db, month_str=month_str)
        assert monthly_rep["month"] == month_str
        assert monthly_rep["total_exceeded_deliveries"] >= 1
        assert len(monthly_rep["by_site"]) >= 1
        print(f"✅ Testfall C (Monatsauswertung {month_str}) erfolgreich: {monthly_rep['total_exceeded_deliveries']} Überschreitungen, Gesamt-Standgeld: {monthly_rep['total_demurrage_eur']:.2f} € über {len(monthly_rep['by_site'])} Baustellen")

        print("\n🎉 Alle Tests für Fahrtabgleich & Standgeldberechnung erfolgreich bestanden!")

    finally:
        db.close()

if __name__ == "__main__":
    run_tests()
