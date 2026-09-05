import datetime
import logging
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.models.maintenance import VehicleMeta, MaintenanceInterval, MaintenanceLog
from app.schemas.maintenance import MaintenanceIntervalCreate, MaintenanceIntervalUpdate, MaintenanceLogCreate

logger = logging.getLogger("maintenance_service")

SERVICE_TYPE_LABELS = {
    "TUEV_SP": "TÜV Hauptuntersuchung & Sicherheitsprüfung (SP)",
    "UVV": "UVV-Prüfung (Kranaufbau / Hebezeuge)",
    "OIL_SERVICE": "Motoröl- & Filterservice (30.000 km)",
    "TIRES": "Reifenkontrolle & Achsvermessung",
    "GENERAL_INSPECTION": "Große Fahrzeuginspektion",
    "BRAKES": "Bremsen- & Druckluftservice"
}

class MaintenanceService:
    """
    Service zur automatischen Überwachung der Flottenkilometerstände und Wartungsintervalle.
    """

    def sync_telemetry_mileage(self, db: Session, vehicles_data: List[Dict[str, Any]]) -> None:
        """
        Aktualisiert die Gesamtkilometerstände aller Fahrzeuge aus der Navkonzept-Telemetrie.
        """
        now = datetime.datetime.utcnow()
        for v in vehicles_data:
            veh_id = str(v.get("id"))
            plate = str(v.get("plate", "")).strip()
            brand = v.get("brand")
            mileage = v.get("mileage")

            if mileage is None:
                continue

            try:
                mileage_int = int(mileage)
            except (ValueError, TypeError):
                continue

            meta = db.query(VehicleMeta).filter_by(vehicle_id=veh_id).first()
            if not meta:
                # Versuch über Kennzeichen
                meta = db.query(VehicleMeta).filter_by(plate=plate).first()

            if meta:
                meta.current_mileage = mileage_int
                meta.last_telemetry_at = now
                if brand:
                    meta.brand = brand
                if plate:
                    meta.plate = plate
            else:
                meta = VehicleMeta(
                    vehicle_id=veh_id,
                    plate=plate or f"MOL-TE {veh_id}",
                    brand=brand,
                    current_mileage=mileage_int,
                    last_telemetry_at=now
                )
                db.add(meta)

        db.commit()
        # Nach dem Mileage-Sync alle Intervalle evaluieren
        self.evaluate_all_intervals(db)

    def evaluate_all_intervals(self, db: Session) -> List[MaintenanceInterval]:
        """
        Prüft alle Wartungsintervalle gegen den aktuellen Kilometerstand und errechnet den Status.
        """
        intervals = db.query(MaintenanceInterval).all()
        today = datetime.date.today()

        for interval in intervals:
            # Aktuellen Km-Stand des Fahrzeugs ermitteln
            meta = db.query(VehicleMeta).filter(
                (VehicleMeta.vehicle_id == interval.vehicle_id) | (VehicleMeta.plate == interval.plate)
            ).first()

            current_mileage = meta.current_mileage if meta else interval.last_service_mileage
            remaining_km = interval.next_due_mileage - current_mileage

            # Zeitbasierte Fälligkeit prüfen
            is_date_overdue = interval.next_due_date and interval.next_due_date <= today
            is_date_due_soon = interval.next_due_date and (interval.next_due_date - today).days <= 30

            # Statuslogik
            if remaining_km <= 0 or is_date_overdue:
                new_status = "OVERDUE"
            elif remaining_km <= interval.warning_threshold_km or is_date_due_soon:
                new_status = "DUE_SOON"
            else:
                new_status = "OK"

            if interval.status != new_status:
                interval.status = new_status

        db.commit()
        return intervals

    def get_enriched_intervals(self, db: Session, status_filter: Optional[str] = None, vehicle_id: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Gibt alle Intervalle mit berechneter Restlaufleistung und Fortschritt zurück.
        """
        query = db.query(MaintenanceInterval)
        if status_filter and status_filter.upper() != "ALL":
            query = query.filter(MaintenanceInterval.status == status_filter.upper())
        if vehicle_id and vehicle_id.upper() != "ALL":
            query = query.filter(MaintenanceInterval.vehicle_id == str(vehicle_id))

        intervals = query.order_by(
            # Sortiere OVERDUE zuerst, dann DUE_SOON, dann OK
            desc(MaintenanceInterval.status == "OVERDUE"),
            desc(MaintenanceInterval.status == "DUE_SOON"),
            MaintenanceInterval.plate
        ).all()

        enriched = []
        for item in intervals:
            meta = db.query(VehicleMeta).filter(
                (VehicleMeta.vehicle_id == item.vehicle_id) | (VehicleMeta.plate == item.plate)
            ).first()

            current_km = meta.current_mileage if meta else item.last_service_mileage
            remaining_km = item.next_due_mileage - current_km

            total_interval_span = max(1, item.interval_km)
            km_driven_since_service = max(0, current_km - item.last_service_mileage)
            progress = min(100.0, round((km_driven_since_service / total_interval_span) * 100.0, 1))

            enriched.append({
                "id": item.id,
                "vehicle_id": item.vehicle_id,
                "plate": item.plate,
                "service_type": item.service_type,
                "service_type_label": SERVICE_TYPE_LABELS.get(item.service_type, item.service_type),
                "interval_km": item.interval_km,
                "last_service_mileage": item.last_service_mileage,
                "last_service_date": item.last_service_date,
                "next_due_mileage": item.next_due_mileage,
                "next_due_date": item.next_due_date,
                "warning_threshold_km": item.warning_threshold_km,
                "status": item.status,
                "notes": item.notes,
                "current_mileage": current_km,
                "remaining_km": remaining_km,
                "progress_percentage": progress,
                "created_at": item.created_at,
                "updated_at": item.updated_at
            })

        return enriched

    def get_maintenance_alerts(self, db: Session) -> List[Dict[str, Any]]:
        """
        Liefert alle fälligen (OVERDUE) und bald fälligen (DUE_SOON) Wartungen.
        """
        all_intervals = self.get_enriched_intervals(db)
        return [item for item in all_intervals if item["status"] in ("OVERDUE", "DUE_SOON")]

    def log_service_completed(self, db: Session, log_data: MaintenanceLogCreate) -> MaintenanceLog:
        """
        Quittiert einen Werkstatt-Service, rolliert die nächste Fälligkeit und setzt Status auf OK.
        """
        # 1. Log anlegen
        service_date = log_data.service_date or datetime.date.today()
        new_log = MaintenanceLog(
            interval_id=log_data.interval_id,
            vehicle_id=str(log_data.vehicle_id),
            plate=log_data.plate,
            service_type=log_data.service_type,
            service_mileage=log_data.service_mileage,
            service_date=service_date,
            performed_by=log_data.performed_by or "Werkstatt Altlandsberg",
            workshop_name=log_data.workshop_name or "Tinglev Werkstatt Altlandsberg",
            invoice_number=log_data.invoice_number,
            cost_euros=log_data.cost_euros or 0.0,
            notes=log_data.notes
        )
        db.add(new_log)

        # 2. Zugehöriges Intervall ermitteln
        interval = None
        if log_data.interval_id:
            interval = db.query(MaintenanceInterval).filter_by(id=log_data.interval_id).first()
        if not interval:
            interval = db.query(MaintenanceInterval).filter(
                (MaintenanceInterval.vehicle_id == str(log_data.vehicle_id)) | (MaintenanceInterval.plate == log_data.plate),
                MaintenanceInterval.service_type == log_data.service_type
            ).first()

        if interval:
            interval.last_service_mileage = log_data.service_mileage
            interval.last_service_date = service_date
            interval.next_due_mileage = log_data.service_mileage + interval.interval_km
            
            # Falls zeitbasiert, nächstes Datum auf 1 Jahr vorverlegen
            if interval.next_due_date:
                interval.next_due_date = service_date + datetime.timedelta(days=365)
            
            interval.status = "OK"

        # 3. Fahrzeug-Meta aktualisieren falls der eingegebene Km-Stand höher ist
        meta = db.query(VehicleMeta).filter(
            (VehicleMeta.vehicle_id == str(log_data.vehicle_id)) | (VehicleMeta.plate == log_data.plate)
        ).first()
        if meta and log_data.service_mileage > meta.current_mileage:
            meta.current_mileage = log_data.service_mileage
            meta.updated_at = datetime.datetime.utcnow()

        db.commit()
        db.refresh(new_log)
        return new_log

    def seed_default_maintenance_data(self, db: Session) -> None:
        """
        Initialisiert realistische Standard-Wartungsintervalle für den Tinglev-Fuhrpark.
        """
        existing_count = db.query(MaintenanceInterval).count()
        if existing_count > 0:
            return

        logger.info("Seeding initial fleet maintenance intervals...")
        today = datetime.date.today()

        fleet_seed_config = [
            {
                "vehicle_id": "101",
                "plate": "MOL-TE 101",
                "brand": "MAN TGX 26.510 (Schwerlastzug)",
                "current_mileage": 184520,
                "intervals": [
                    {
                        "service_type": "OIL_SERVICE",
                        "interval_km": 30000,
                        "last_service_mileage": 155000,
                        "last_service_date": today - datetime.timedelta(days=120),
                        "warning_threshold_km": 1500,
                        "notes": "Motoröl 5W-30 Low-SAPS, Kraftstoff- & Luftfilterwechsel"
                    },
                    {
                        "service_type": "TUEV_SP",
                        "interval_km": 60000,
                        "last_service_mileage": 130000,
                        "last_service_date": today - datetime.timedelta(days=280),
                        "next_due_date": today + datetime.timedelta(days=45),
                        "warning_threshold_km": 2000,
                        "notes": "TÜV Hauptuntersuchung & Halbjährliche Sicherheitsprüfung (SP)"
                    },
                    {
                        "service_type": "TIRES",
                        "interval_km": 50000,
                        "last_service_mileage": 140000,
                        "last_service_date": today - datetime.timedelta(days=200),
                        "warning_threshold_km": 1500,
                        "notes": "Reifenprofiltiefe Antriebsachse & Lenkachse prüfen"
                    }
                ]
            },
            {
                "vehicle_id": "102",
                "plate": "MOL-TE 102",
                "brand": "Mercedes-Benz Actros 2548 (Innenlader)",
                "current_mileage": 142180,
                "intervals": [
                    {
                        "service_type": "OIL_SERVICE",
                        "interval_km": 30000,
                        "last_service_mileage": 115000,  # 115000 + 30000 = 145000 -> 142180 = 2820 km rest (OK)
                        "last_service_date": today - datetime.timedelta(days=110),
                        "warning_threshold_km": 1500,
                        "notes": "Wartungsintervall Service B"
                    },
                    {
                        "service_type": "UVV",
                        "interval_km": 40000,
                        "last_service_mileage": 105000,
                        "last_service_date": today - datetime.timedelta(days=320),
                        "next_due_date": today + datetime.timedelta(days=15),  # DUE_SOON by date
                        "warning_threshold_km": 1000,
                        "notes": "UVV-Prüfung der hydraulischen Innenlader-Spannsysteme"
                    }
                ]
            },
            {
                "vehicle_id": "103",
                "plate": "MOL-TE 103",
                "brand": "Volvo FH16 750 (Tieflader)",
                "current_mileage": 219800,
                "intervals": [
                    {
                        "service_type": "OIL_SERVICE",
                        "interval_km": 30000,
                        "last_service_mileage": 188000,  # 188000 + 30000 = 218000 -> 219800 is OVERDUE by 1800 km!
                        "last_service_date": today - datetime.timedelta(days=160),
                        "warning_threshold_km": 1500,
                        "notes": "Großer Ölservice & Getriebeölkontrolle für Schwerlast"
                    },
                    {
                        "service_type": "BRAKES",
                        "interval_km": 40000,
                        "last_service_mileage": 180000,
                        "last_service_date": today - datetime.timedelta(days=190),
                        "warning_threshold_km": 2000,
                        "notes": "Bremsbelag- und Scheibenverschleißmessung Tieflader-Achsen"
                    }
                ]
            },
            {
                "vehicle_id": "104",
                "plate": "MOL-TE 104",
                "brand": "Scania R500 (Pritschenzug mit Kran)",
                "current_mileage": 98640,
                "intervals": [
                    {
                        "service_type": "UVV",
                        "interval_km": 25000,
                        "last_service_mileage": 75000,
                        "last_service_date": today - datetime.timedelta(days=340),
                        "next_due_date": today - datetime.timedelta(days=5),  # OVERDUE by date!
                        "warning_threshold_km": 1000,
                        "notes": "Jährliche UVV-Prüfung Ladekran (DGUV Vorschrift 52 / 54)"
                    },
                    {
                        "service_type": "OIL_SERVICE",
                        "interval_km": 30000,
                        "last_service_mileage": 70000,
                        "last_service_date": today - datetime.timedelta(days=150),
                        "warning_threshold_km": 1500,
                        "notes": "Ölwechsel Scania DC13"
                    }
                ]
            },
            {
                "vehicle_id": "105",
                "plate": "MOL-TE 105",
                "brand": "DAF XG+ 530 (Betonfertigteile-Transporter)",
                "current_mileage": 112400,
                "intervals": [
                    {
                        "service_type": "OIL_SERVICE",
                        "interval_km": 30000,
                        "last_service_mileage": 83000,  # 83000 + 30000 = 113000 -> 600km left (DUE_SOON!)
                        "last_service_date": today - datetime.timedelta(days=95),
                        "warning_threshold_km": 1500,
                        "notes": "DAF Wartungsintervall M1"
                    },
                    {
                        "service_type": "GENERAL_INSPECTION",
                        "interval_km": 60000,
                        "last_service_mileage": 60000,
                        "last_service_date": today - datetime.timedelta(days=240),
                        "next_due_date": today + datetime.timedelta(days=120),
                        "warning_threshold_km": 2000,
                        "notes": "Gesamtprüfung Fahrwerk, Lenkung und Druckluftbehälter"
                    }
                ]
            },
            {
                "vehicle_id": "201",
                "plate": "MOL-TE 201",
                "brand": "Mercedes Sprinter (Montage- & Servicewagen)",
                "current_mileage": 67320,
                "intervals": [
                    {
                        "service_type": "OIL_SERVICE",
                        "interval_km": 20000,
                        "last_service_mileage": 50000,
                        "last_service_date": today - datetime.timedelta(days=80),
                        "warning_threshold_km": 1500,
                        "notes": "Ölwechsel Mercedes Sprinter 319 CDI"
                    },
                    {
                        "service_type": "TUEV_SP",
                        "interval_km": 40000,
                        "last_service_mileage": 40000,
                        "last_service_date": today - datetime.timedelta(days=300),
                        "next_due_date": today + datetime.timedelta(days=65),
                        "warning_threshold_km": 1000,
                        "notes": "TÜV Hauptuntersuchung Transporter"
                    }
                ]
            },
            {
                "vehicle_id": "202",
                "plate": "MOL-TE 202",
                "brand": "VW Crafter (Statik & Qualitätskontrolle)",
                "current_mileage": 51200,
                "intervals": [
                    {
                        "service_type": "OIL_SERVICE",
                        "interval_km": 20000,
                        "last_service_mileage": 35000,
                        "last_service_date": today - datetime.timedelta(days=140),
                        "warning_threshold_km": 1500,
                        "notes": "LongLife Service & Pollenfilter"
                    }
                ]
            }
        ]

        for truck in fleet_seed_config:
            # 1. VehicleMeta
            meta = VehicleMeta(
                vehicle_id=truck["vehicle_id"],
                plate=truck["plate"],
                brand=truck["brand"],
                current_mileage=truck["current_mileage"],
                last_telemetry_at=datetime.datetime.utcnow()
            )
            db.add(meta)

            # 2. Intervals
            for int_cfg in truck["intervals"]:
                next_due_km = int_cfg["last_service_mileage"] + int_cfg["interval_km"]
                interval = MaintenanceInterval(
                    vehicle_id=truck["vehicle_id"],
                    plate=truck["plate"],
                    service_type=int_cfg["service_type"],
                    interval_km=int_cfg["interval_km"],
                    last_service_mileage=int_cfg["last_service_mileage"],
                    last_service_date=int_cfg["last_service_date"],
                    next_due_mileage=next_due_km,
                    next_due_date=int_cfg.get("next_due_date"),
                    warning_threshold_km=int_cfg.get("warning_threshold_km", 1500),
                    notes=int_cfg.get("notes")
                )
                db.add(interval)

        db.commit()
        # Initial Status-Berechnung
        self.evaluate_all_intervals(db)
        logger.info("Fleet maintenance seed completed successfully.")

maintenance_service = MaintenanceService()
